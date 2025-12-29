import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
  User,
  Building,
  Hash,
  Bed,
  Mail,
  Edit3,
  Save,
  X,
  History,
  Calendar,
  Trash2,
  Shield,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";

interface SwapHistoryItem {
  id: string;
  otherPerson: string;
  date: string;
  hostel: string;
  room: string;
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    hostel: user?.hostelName || "",
    bedType: user?.bedType || "",
    roomNumber: user?.roomNumber || "",
  });
  const [swapHistory, setSwapHistory] = useState<SwapHistoryItem[]>([]);

  // Verification state
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "none" | "pending" | "verified" | "rejected"
  >("none");
  const [uploadingId, setUploadingId] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);

  React.useEffect(() => {
    if (user) {
      fetchSwapHistory();
      fetchVerificationStatus();
    }
  }, [user]);

  const fetchVerificationStatus = async () => {
    if (!user) return;
    try {
      // Fetch from Firestore to get current status
      const studentDoc = await getDocs(
        query(collection(db, "students"), where("email", "==", user.email))
      );
      if (!studentDoc.empty) {
        const data = studentDoc.docs[0].data();
        if (data.isVerified) {
          setVerificationStatus("verified");
        } else if (data.verificationStatus) {
          setVerificationStatus(data.verificationStatus as any);
        }
        if (data.idCardUrl) {
          setIdCardPreview(data.idCardUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    }
  };

  const handleIdCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploadingId(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        setIdCardPreview(base64Image);

        // Upload to backend
        await api.post("/api/user/upload-id-card", {
          idCardImage: base64Image,
        });
        toast.success("ID card uploaded successfully!");
        setUploadingId(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        setUploadingId(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload ID card");
      setUploadingId(false);
    }
  };

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    try {
      await api.post("/api/user/request-verification");
      setVerificationStatus("pending");
      toast.success(
        "Verification request submitted! Please wait for admin approval."
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to submit verification request"
      );
    } finally {
      setRequestingVerification(false);
    }
  };

  const fetchSwapHistory = async () => {
    if (!user) return;
    try {
      // Query 1: User is requester
      const q1 = query(
        collection(db, "swapRequests"),
        where("requesterId", "==", user.id),
        where("status", "==", "accepted")
      );

      // Query 2: User is target
      const q2 = query(
        collection(db, "swapRequests"),
        where("targetStudentId", "==", user.id),
        where("status", "==", "accepted")
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const history: SwapHistoryItem[] = [];

      // Helper to fetch student details if missing
      const getStudentDetails = async (id: string) => {
        if (!id) return null;
        try {
          const docRef = collection(db, "students");
          const q = query(docRef, where("email", "==", id)); // Try email first since ID might be email
          const snap = await getDocs(q);

          if (!snap.empty) return snap.docs[0].data();

          // Try fetching by doc ID directly logic elsewhere uses IDs
          // For now, simpler fallback
          return null;
        } catch (e) {
          console.error("Error fetching student details", e);
          return null;
        }
      };

      // Process requests where user is REQUESTER (Target details needed)
      for (const doc of snap1.docs) {
        const data = doc.data();
        let name = data.targetName;
        let hostel = data.targetHostel;
        let room = data.targetRoom;

        // Fetch if missing
        if (!name || !hostel || !room) {
          // We need to fetch the target student's details
          // Note: In Students.tsx we see that creation uses email as targetStudentId
          // But let's be robust
          // Since we don't have a direct 'getDoc' by ID easily if IDs are emails,
          // let's rely on the fact that existing logic might have stored 'targetStudentId'
          // which is likely an email or UID.
          // Given the complexity of ID vs Email in this codebase, let's try a direct query if possible
          // or just show "Unknown" to avoid breaking if lookup fails.
          // Actually, let's try to fetch using the existing 'students' collection structure
          // The backend uses 'students' collection.
          // If targetStudentId is an email, we query by email.
        }

        history.push({
          id: doc.id,
          otherPerson: data.targetName || "Target Student",
          date: data.updatedAt
            ? new Date(
                data.updatedAt.toDate?.() || data.updatedAt
              ).toLocaleDateString()
            : "Unknown date",
          hostel: data.targetHostel || "Unknown Block",
          room: data.targetRoom || "Unknown Room",
        });
      }

      const processedIds = new Set<string>();

      const processDocs = async (docs: any[], isRequester: boolean) => {
        for (const doc of docs) {
          if (processedIds.has(doc.id)) continue;
          processedIds.add(doc.id);

          const data = doc.data();
          const otherId = isRequester ? data.targetStudentId : data.requesterId;
          let otherPerson = isRequester ? data.targetName : data.requesterName;
          let hostel = isRequester ? data.targetHostel : data.requesterHostel;
          let room = isRequester ? data.targetRoom : data.requesterRoom;

          // If details are missing, try to fetch them
          if (!otherPerson || !hostel || !room) {
            try {
              let studentData;
              if (otherId && otherId.includes("@")) {
                const q = query(
                  collection(db, "students"),
                  where("email", "==", otherId)
                );
                const qSnap = await getDocs(q);
                if (!qSnap.empty) studentData = qSnap.docs[0].data();
              }

              if (studentData) {
                if (!otherPerson) otherPerson = studentData.name;
                if (!hostel) hostel = studentData.hostel;
                if (!room) room = studentData.roomNumber;
              }
            } catch (e) {
              console.log("Fetch error", e);
            }
          }

          history.push({
            id: doc.id,
            otherPerson:
              otherPerson || (isRequester ? "Target Student" : "Student"),
            date: data.updatedAt
              ? new Date(
                  data.updatedAt.toDate?.() || data.updatedAt
                ).toLocaleDateString()
              : "Unknown date",
            hostel: hostel || "Unknown Block",
            room: room || "Unknown Room",
          });
        }
      };

      await processDocs(snap1.docs, true); // User is requester
      await processDocs(snap2.docs, false); // User is target

      // Sort by date descending (newest first)
      history.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setSwapHistory(history);
    } catch (error) {
      console.error("Error fetching swap history:", error);
    }
  };

  const hostelOptions = [
    "block1",
    "block2",
    "block3",
    "block4",
    "block5",
    "block6",
    "block7",
    "block8",
  ];

  const bedTypeOptions = ["4 bedded", "3 bedded", "2 bedded", "1 bedded"];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/api/user/profile", {
        ...formData,
        roomNumber: Number(formData.roomNumber),
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      hostel: user?.hostelName || "",
      bedType: user?.bedType || "",
      roomNumber: user?.roomNumber || "",
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone and will remove all your data."
      )
    ) {
      setLoading(true);
      try {
        await api.delete("/api/auth/delete");
        toast.success("Account deleted successfully");
        logout();
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to delete account"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12 px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold heading-gradient mb-2">My Profile</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Manage your personal information and track your swap history.
        </p>
      </div>

      {/* Header Card */}
      <div className="card p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4 sm:gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 text-center md:text-left">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <span className="text-3xl sm:text-4xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 p-1 sm:p-1.5 bg-green-500 rounded-full border-2 sm:border-4 border-white dark:border-gray-800"></div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user.name}
            </h2>
            <div className="flex items-center justify-center md:justify-start text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="truncate max-w-[200px] sm:max-w-none">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 md:flex-none btn-secondary flex items-center justify-center"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex-1 md:flex-none btn-secondary flex items-center justify-center"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 md:flex-none btn-primary flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </button>
            </>
          )}
          <button
            onClick={logout}
            className="flex-1 md:flex-none px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            Sign Out
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 md:flex-none px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Account
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Room Details Card */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Room Information
            </h3>

            {isEditing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Hostel Block
                  </label>
                  <select
                    name="hostel"
                    value={formData.hostel}
                    onChange={handleChange}
                    className="input-field w-full"
                  >
                    {hostelOptions.map((hostel) => (
                      <option key={hostel} value={hostel}>
                        {hostel.charAt(0).toUpperCase() + hostel.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Room Number
                  </label>
                  <input
                    type="number"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    className="input-field w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Bed Type
                  </label>
                  <select
                    name="bedType"
                    value={formData.bedType}
                    onChange={handleChange}
                    className="input-field w-full"
                  >
                    {bedTypeOptions.map((bedType) => (
                      <option key={bedType} value={bedType}>
                        {bedType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Hostel Block
                  </p>
                  <div className="flex items-center font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                    <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary-500 flex-shrink-0" />
                    <span className="truncate">{user.hostelName
                      ? user.hostelName.charAt(0).toUpperCase() +
                        user.hostelName.slice(1)
                      : "Not Assigned"}</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Room Number
                  </p>
                  <div className="flex items-center font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                    <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary-500 flex-shrink-0" />
                    {user.roomNumber || "N/A"}
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Bed Type
                  </p>
                  <div className="flex items-center font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                    <Bed className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary-500 flex-shrink-0" />
                    <span className="truncate">{user.bedType}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ID Verification Card */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                ID Verification
              </div>
              {/* Status Badge */}
              {verificationStatus === "verified" && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              )}
              {verificationStatus === "pending" && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Pending Review
                </span>
              )}
              {verificationStatus === "rejected" && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                  <XCircle className="w-4 h-4" />
                  Rejected
                </span>
              )}
              {verificationStatus === "none" && !user?.isVerified && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Not Verified
                </span>
              )}
            </h3>

            {verificationStatus === "verified" || user?.isVerified ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
                  Your account is verified!
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  You have full access to all features.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* ID Card Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Your Student ID Card
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                    {idCardPreview ? (
                      <div className="space-y-3">
                        <img
                          src={idCardPreview}
                          alt="ID Card Preview"
                          className="max-h-48 mx-auto rounded-lg shadow-md"
                        />
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          <Camera className="w-4 h-4" />
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleIdCardUpload}
                            disabled={uploadingId}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-8">
                        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                          {uploadingId
                            ? "Uploading..."
                            : "Click to upload your ID card"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG up to 2MB
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleIdCardUpload}
                          disabled={uploadingId}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Request Verification Button */}
                {verificationStatus === "none" && idCardPreview && (
                  <button
                    onClick={handleRequestVerification}
                    disabled={requestingVerification}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    {requestingVerification ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Request Verification
                      </>
                    )}
                  </button>
                )}

                {verificationStatus === "pending" && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-300">
                          Verification Pending
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                          Your ID card is being reviewed by an admin. This
                          usually takes 24-48 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {verificationStatus === "rejected" && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-300">
                          Verification Rejected
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                          Your verification was rejected. Please upload a clear,
                          valid ID card and try again.
                        </p>
                        <button
                          onClick={() => setVerificationStatus("none")}
                          className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Personal Info Card (Edit Only or additional details) */}
          {isEditing && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Personal Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-1">
          <div className="card p-4 sm:p-6 h-full">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <History className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Swap History
              </h3>
              <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full">
                {swapHistory.length}
              </span>
            </div>

            {swapHistory.length > 0 ? (
              <div className="max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3 pb-2">
                  {swapHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          Swapped with{" "}
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {item.otherPerson}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center font-medium">
                          <Calendar className="h-3 w-3 mr-1 opacity-70" />
                          {item.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                          {item.hostel}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          #{item.room}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <History className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No swap history found.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
