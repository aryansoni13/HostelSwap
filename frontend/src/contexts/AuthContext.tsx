import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  adminRegister: (
    username: string,
    password: string,
    adminKey: string
  ) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  requestPasswordReset: (
    identifier: string,
    role: "student" | "admin"
  ) => Promise<string>;
  confirmPasswordReset: (
    identifier: string,
    role: "student" | "admin",
    token: string,
    newPassword: string
  ) => Promise<void>;
  sendResetOtp: (email: string) => Promise<string>;
  confirmResetOtp: (
    email: string,
    otp: string,
    newPassword: string
  ) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  hostel: string;
  bedType: string;
  roomNumber: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper to convert Firebase user to app User (optimized)
const convertFirebaseUserToAppUser = async (
  firebaseUser: FirebaseUser
): Promise<User | null> => {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore timeout")), 5000)
    );

    // 1. Check if user is an admin
    // We wrap this in its own try-catch because if the user is NOT an admin,
    // Firestore rules might throw "permission-denied" when trying to read the admins collection.
    let adminData: any = null;
    try {
      const adminDocRef = doc(db, "admins", firebaseUser.uid);
      const adminSnapshot = (await Promise.race([
        getDoc(adminDocRef),
        timeoutPromise,
      ])) as any;

      if (adminSnapshot.exists()) {
        adminData = adminSnapshot.data() as any;
      }
    } catch (error) {
      // Permission denied or other error -> likely not an admin
      console.log("Admin check failed (expected for students):", error);
    }

    if (adminData) {
      const d = adminData as any;
      return {
        id: firebaseUser.uid,
        name: d.username || firebaseUser.displayName || "",
        email: d.email || firebaseUser.email || "",
        hostelName: "",
        roomNumber: "",
        isAdmin: true,
      };
    }

    // 2. If not admin (or check failed), check student profile
    let studentData: any = null;
    try {
      const studentDocRef = doc(db, "students", firebaseUser.uid);
      const studentSnapshot = (await Promise.race([
        getDoc(studentDocRef),
        timeoutPromise,
      ])) as any;

      if (studentSnapshot.exists()) {
        studentData = studentSnapshot.data() as any;
      }
    } catch (error) {
      console.error("Error fetching student profile:", error);
    }

    if (studentData) {
      const d = studentData as any;
      return {
        id: firebaseUser.uid,
        name: d.name || firebaseUser.displayName || "",
        email: d.email || firebaseUser.email || "",
        hostelName: d.hostel || "",
        roomNumber: d.roomNumber || "",
        isAdmin: false,
      };
    }

    // Fallback to basic user info (no Firestore data yet)
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || "",
      email: firebaseUser.email || "",
      hostelName: "", // Still empty string as fallback
      roomNumber: "",
      isAdmin: false,
    };
  } catch (error) {
    console.error("Error converting Firebase user:", error);
    // Return basic info even on error
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || "",
      email: firebaseUser.email || "",
      hostelName: "",
      roomNumber: "",
      isAdmin: false,
    };
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await convertFirebaseUserToAppUser(firebaseUser);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for user profile updates
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    if (user && !user.isAdmin) {
      const userDocRef = doc(db, "students", user.id);
      unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const newData = docSnapshot.data();
            // Update user state with new data if it changed
            setUser((prevUser) => {
              if (!prevUser) return null;

              // Only update if data actually changed to avoid infinite loops
              if (
                prevUser.hostelName !== (newData.hostel || "") ||
                prevUser.roomNumber !== (newData.roomNumber || "") ||
                prevUser.bedType !== newData.bedType
              ) {
                return {
                  ...prevUser,
                  hostelName: newData.hostel || "",
                  roomNumber: newData.roomNumber || "",
                  bedType: newData.bedType,
                };
              }
              return prevUser;
            });
          }
        },
        (error) => {
          console.error("Error in real-time listener:", error);
        }
      );
    }

    return () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [user?.id, user?.isAdmin]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Optimized: Get user data in parallel
      const appUser = await convertFirebaseUserToAppUser(userCredential.user);
      setUser(appUser);
    } catch (error: any) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        throw new Error("Invalid email or password");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("Too many failed attempts. Please try again later.");
      }
      throw new Error(error.message || "Login failed");
    }
  };

  const adminLogin = async (username: string, password: string) => {
    try {
      // Admin email format: username@admin.hostelswap
      const adminEmail = `${username}@admin.hostelswap`;
      const userCredential = await signInWithEmailAndPassword(
        auth,
        adminEmail,
        password
      );
      // Optimized: Get user data in parallel
      const appUser = await convertFirebaseUserToAppUser(userCredential.user);
      setUser(appUser);
    } catch (error: any) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        throw new Error("Invalid username or password");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("Too many failed attempts. Please try again later.");
      }
      throw new Error(error.message || "Admin login failed");
    }
  };

  const adminRegister = async (
    username: string,
    password: string,
    adminKey: string
  ) => {
    try {
      // This should be done via backend API to verify admin key
      // For now, we'll create the user and let backend handle admin key verification
      const adminEmail = `${username}@admin.hostelswap`;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminEmail,
        password
      );

      // Update display name
      await updateProfile(userCredential.user, { displayName: username });

      // Note: Admin role and Firestore document should be created by backend
      // This is a simplified version
      throw new Error("Admin registration must be done through backend API");
    } catch (error: any) {
      throw new Error(error.message || "Admin registration failed");
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Parallelize profile update and Firestore write for faster registration
      const studentData = {
        uid: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        hostel: userData.hostel,
        bedType: userData.bedType,
        roomNumber: userData.roomNumber,
        phone: null,
        age: null,
        nationality: null,
        travelPreferences: [],
        travelStyle: null,
        bio: null,
        isVerified: false,
        idDocument: null,
        socialLinks: {
          google: null,
          facebook: null,
        },
        resetToken: null,
        resetTokenExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Do both operations in parallel - they don't depend on each other
      await Promise.all([
        updateProfile(userCredential.user, { displayName: userData.name }),
        setDoc(doc(db, "students", userCredential.user.uid), studentData),
      ]);

      // Create app user directly from the data we just created (no need to read from Firestore)
      const appUser: User = {
        id: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        hostelName: userData.hostel,
        roomNumber: userData.roomNumber,
        isAdmin: false,
      };

      setUser(appUser);
    } catch (error: any) {
      // Provide more specific error messages
      if (error.code === "auth/email-already-in-use") {
        throw new Error(
          "This email is already registered. Please use a different email or sign in."
        );
      } else if (error.code === "auth/weak-password") {
        throw new Error(
          "Password is too weak. Please use a stronger password."
        );
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address. Please check your email.");
      } else if (error.code === "permission-denied") {
        throw new Error(
          "Permission denied. Please check Firestore security rules."
        );
      } else if (error.code === "unavailable") {
        throw new Error(
          "Firebase service is temporarily unavailable. Please try again."
        );
      }
      throw new Error(
        error.message ||
          "Registration failed. Please check your connection and try again."
      );
    }
  };

  const requestPasswordReset = async (
    identifier: string,
    role: "student" | "admin"
  ) => {
    try {
      let email = identifier;
      if (role === "admin") {
        email = `${identifier}@admin.hostelswap`;
      }
      await sendPasswordResetEmail(auth, email);
      return "Password reset email sent";
    } catch (error: any) {
      throw new Error(error.message || "Reset request failed");
    }
  };

  const confirmPasswordReset = async (
    identifier: string,
    role: "student" | "admin",
    token: string,
    newPassword: string
  ) => {
    // This is typically handled by Firebase Auth on the frontend
    // The token (oobCode) is used in the password reset link
    throw new Error(
      "Password reset confirmation should be handled via Firebase Auth reset link"
    );
  };

  const sendResetOtp = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return "Password reset email sent";
    } catch (error: any) {
      throw new Error(error.message || "OTP send failed");
    }
  };

  const confirmResetOtp = async (
    email: string,
    otp: string,
    newPassword: string
  ) => {
    // OTP-based reset would need custom implementation
    throw new Error("OTP confirmation requires custom implementation");
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      throw new Error(error.message || "Logout failed");
    }
  };

  const value = {
    user,
    login,
    adminLogin,
    adminRegister,
    register,
    logout,
    loading,
    requestPasswordReset,
    confirmPasswordReset,
    sendResetOtp,
    confirmResetOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
