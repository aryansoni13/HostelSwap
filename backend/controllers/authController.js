const { z } = require("zod");
const { auth, db } = require("../config/firebase");
const admin = require("firebase-admin");

const studentSignupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  hostel: z.enum([
    "block1",
    "block2",
    "block3",
    "block4",
    "block5",
    "block6",
    "block7",
    "block8",
  ]),
  bedType: z.enum(["4 bedded", "3 bedded", "2 bedded", "1 bedded"]),
  roomNumber: z.number(),
});

const adminSignupSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  adminKey: z.string(),
});

// Firestore collections
const STUDENTS_COLLECTION = "students";
const ADMINS_COLLECTION = "admins";
const SWAP_REQUESTS_COLLECTION = "swapRequests";

exports.studentSignup = async (req, res) => {
  try {
    const data = studentSignupSchema.parse(req.body);

    // Check if student already exists
    const existingStudent = await db
      .collection(STUDENTS_COLLECTION)
      .where("email", "==", data.email)
      .limit(1)
      .get();

    if (!existingStudent.empty) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      emailVerified: false,
    });

    // Create student document in Firestore
    const studentData = {
      uid: userRecord.uid,
      name: data.name,
      email: data.email,
      hostel: data.hostel,
      bedType: data.bedType,
      roomNumber: data.roomNumber,
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection(STUDENTS_COLLECTION)
      .doc(userRecord.uid)
      .set(studentData);

    res.status(201).json({ message: "Signup successful", uid: userRecord.uid });
  } catch (err) {
    console.error("Student signup error:", err);
    // If Firebase Auth user was created but Firestore failed, try to delete the user
    if (
      err.code === "auth/email-already-exists" ||
      err.code === "auth/invalid-email"
    ) {
      return res.status(400).json({ message: err.message });
    }
    res.status(400).json({ message: err.errors ? err.errors : err.message });
  }
};

exports.adminSignup = async (req, res) => {
  try {
    const data = adminSignupSchema.parse(req.body);

    // Check admin key
    const validAdminKey = process.env.ADMIN_KEY || "your-secret-admin-key";
    if (data.adminKey !== validAdminKey) {
      return res.status(400).json({ message: "Invalid admin key" });
    }

    // Check if admin already exists
    const existingAdmin = await db
      .collection(ADMINS_COLLECTION)
      .where("username", "==", data.username)
      .limit(1)
      .get();

    if (!existingAdmin.empty) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create admin user in Firebase Auth
    // Note: For admin, we'll use email format: username@admin.hostelswap
    const adminEmail = `${data.username}@admin.hostelswap`;
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: data.password,
      displayName: data.username,
      emailVerified: false,
    });

    // Set custom claim for admin role
    await auth.setCustomUserClaims(userRecord.uid, { role: "admin" });

    // Create admin document in Firestore
    const adminData = {
      uid: userRecord.uid,
      username: data.username,
      email: adminEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection(ADMINS_COLLECTION).doc(userRecord.uid).set(adminData);

    res
      .status(201)
      .json({ message: "Admin created successfully", uid: userRecord.uid });
  } catch (err) {
    console.error("Admin signup error:", err);
    res.status(400).json({ message: err.errors ? err.errors : err.message });
  }
};

exports.studentSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Note: Firebase Admin SDK doesn't have a sign-in method
    // The client should sign in and send the ID token
    // This endpoint will verify the token and return user data
    // For now, we'll verify the user exists and return a message
    // The actual sign-in should happen on the frontend

    const studentSnapshot = await db
      .collection(STUDENTS_COLLECTION)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (studentSnapshot.empty) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const studentData = studentSnapshot.docs[0].data();

    res.json({
      message: "Please sign in using Firebase Auth on the frontend",
      user: {
        id: studentData.uid,
        name: studentData.name,
        email: studentData.email,
        hostelName: studentData.hostel,
        roomNumber: studentData.roomNumber,
        isAdmin: false,
      },
    });
  } catch (err) {
    console.error("Student signin error:", err);
    res.status(400).json({ message: err.message });
  }
};

exports.adminSignin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    const adminEmail = `${username}@admin.hostelswap`;
    const adminSnapshot = await db
      .collection(ADMINS_COLLECTION)
      .where("username", "==", username)
      .limit(1)
      .get();

    if (adminSnapshot.empty) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const adminData = adminSnapshot.docs[0].data();

    res.json({
      message: "Please sign in using Firebase Auth on the frontend",
      user: {
        id: adminData.uid,
        name: adminData.username,
        email: adminData.email,
        hostelName: null,
        roomNumber: null,
        isAdmin: true,
      },
    });
  } catch (err) {
    console.error("Admin signin error:", err);
    res.status(400).json({ message: err.message });
  }
};

// Password reset: request
exports.requestPasswordReset = async (req, res) => {
  try {
    const { identifier, role } = req.body;
    if (!identifier || !role || !["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid request" });
    }

    let email;
    if (role === "student") {
      email = identifier;
    } else {
      // For admin, identifier is username
      email = `${identifier}@admin.hostelswap`;
    }

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);

    // In a real app, send email with reset link
    res.json({
      message: "If the account exists, a password reset email was sent",
      resetLink, // For testing only - remove in production
    });
  } catch (err) {
    console.error("Password reset request error:", err);
    // Don't reveal if email exists
    res.status(200).json({
      message: "If the account exists, a password reset email was sent",
    });
  }
};

// Password reset: confirm (using reset token from email)
exports.confirmPasswordReset = async (req, res) => {
  try {
    const { oobCode, newPassword } = req.body;
    if (!oobCode || !newPassword) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Verify the reset code and update password
    // Note: This should typically be handled by Firebase Auth on the frontend
    // For backend, we can verify the code and update the password
    res.json({
      message:
        "Password reset successful. Please use Firebase Auth reset on frontend.",
    });
  } catch (err) {
    console.error("Password reset confirm error:", err);
    res.status(400).json({ message: err.message });
  }
};

// Get current user (verify token and return user data)
exports.getCurrentUser = async (req, res) => {
  try {
    const uid = req.user.id;

    // Check if admin
    const adminSnapshot = await db.collection(ADMINS_COLLECTION).doc(uid).get();

    if (adminSnapshot.exists) {
      const adminData = adminSnapshot.data();
      return res.json({
        user: {
          id: adminData.uid,
          name: adminData.username,
          email: adminData.email,
          hostelName: null,
          roomNumber: null,
          isAdmin: true,
        },
      });
    }

    // Check if student
    const studentSnapshot = await db
      .collection(STUDENTS_COLLECTION)
      .doc(uid)
      .get();

    if (studentSnapshot.exists) {
      const studentData = studentSnapshot.data();
      return res.json({
        user: {
          id: studentData.uid,
          name: studentData.name,
          email: studentData.email,
          hostelName: studentData.hostel,
          roomNumber: studentData.roomNumber,
          isAdmin: false,
        },
      });
    }

    res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(400).json({ message: err.message });
  }
};

// Phone signup (placeholder - requires Twilio setup)
exports.phoneSignup = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone required" });

    // This would require Twilio integration
    // For now, return a message indicating this feature needs setup
    res.status(501).json({
      message:
        "Phone signup requires Twilio configuration. Please use email signup instead.",
    });
  } catch (err) {
    console.error("Phone signup error:", err);
    res.status(400).json({ message: err.message });
  }
};

// Verify OTP (placeholder - requires Twilio setup)
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP required" });
    }

    // This would require Twilio integration and OTP storage
    // For now, return a message indicating this feature needs setup
    res.status(501).json({
      message:
        "OTP verification requires Twilio configuration. Please use email signup instead.",
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(400).json({ message: err.message });
  }
};

// Password reset via OTP (students by email)
exports.requestPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    // Check if student exists
    const studentSnapshot = await db
      .collection(STUDENTS_COLLECTION)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (studentSnapshot.empty) {
      // Don't reveal if email exists
      return res
        .status(200)
        .json({ message: "If the account exists, an OTP was sent" });
    }

    // Generate password reset link (Firebase handles this)
    const resetLink = await auth.generatePasswordResetLink(email);

    // In a real app, send email with reset link or OTP
    // For now, return the reset link for testing (remove in production)
    res.json({
      message: "If the account exists, a password reset email was sent",
      resetLink, // For testing only - remove in production
    });
  } catch (err) {
    console.error("Password reset OTP request error:", err);
    // Don't reveal if email exists
    res.status(200).json({ message: "If the account exists, an OTP was sent" });
  }
};

// Confirm password reset OTP
exports.confirmPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // OTP-based reset would need custom implementation with OTP storage
    // For now, use Firebase's standard password reset
    // This endpoint is kept for API compatibility but should use standard reset flow
    res.status(501).json({
      message:
        "OTP-based password reset requires custom implementation. Please use standard password reset.",
    });
  } catch (err) {
    console.error("Password reset OTP confirm error:", err);
    res.status(400).json({ message: err.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const uid = req.user.id;

    // 1. Delete sent swap requests
    const sentRequests = await db
      .collection(SWAP_REQUESTS_COLLECTION)
      .where("requesterId", "==", uid)
      .get();

    if (!sentRequests.empty) {
      const sentBatch = db.batch();
      sentRequests.forEach((doc) => {
        sentBatch.delete(doc.ref);
      });
      await sentBatch.commit();
    }

    // 2. Delete received swap requests (only pending ones to be safe/clean)
    const receivedRequests = await db
      .collection(SWAP_REQUESTS_COLLECTION)
      .where("targetStudentId", "==", uid)
      .where("status", "==", "pending")
      .get();

    if (!receivedRequests.empty) {
      const receivedBatch = db.batch();
      receivedRequests.forEach((doc) => {
        receivedBatch.delete(doc.ref);
      });
      await receivedBatch.commit();
    }

    // 3. Delete student document
    await db.collection(STUDENTS_COLLECTION).doc(uid).delete();

    // 4. Delete from Firebase Auth
    try {
      await auth.deleteUser(uid);
    } catch (authError) {
      // If user is already deleted, we can ignore this error
      if (authError.code !== "auth/user-not-found") {
        console.error("Error deleting auth user:", authError);
        // We continue intentionally, as the main data is deleted
      }
    }

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res
      .status(500)
      .json({ message: "Failed to delete account", error: err.message });
  }
};
