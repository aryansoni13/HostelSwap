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

  React.useEffect(() => {
    if (user) {
      fetchSwapHistory();
    }
  }, [user]);

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
      // This would be an API call to update user profile
      await api.put("/api/user/profile", {
        ...formData,
        roomNumber: Number(formData.roomNumber),
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);

      // Update local storage with new user data
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
        hostelName: formData.hostel,
        bedType: formData.bedType,
        roomNumber: formData.roomNumber,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
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
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold heading-gradient mb-2">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your personal information and track your swap history.
        </p>
      </div>

      {/* Header Card */}
      <div className="card p-6 mb-8 flex flex-col md:flex-row items-center md:items-start md:justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <span className="text-4xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user.name}
            </h2>
            <div className="flex items-center justify-center md:justify-start text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
              <Mail className="h-4 w-4 mr-2" />
              {user.email}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Details Card */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Building className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
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
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Hostel Block
                  </p>
                  <div className="flex items-center font-semibold text-gray-900 dark:text-white">
                    <Building className="h-4 w-4 mr-2 text-primary-500" />
                    {user.hostelName
                      ? user.hostelName.charAt(0).toUpperCase() +
                        user.hostelName.slice(1)
                      : "Not Assigned"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Room Number
                  </p>
                  <div className="flex items-center font-semibold text-gray-900 dark:text-white">
                    <Hash className="h-4 w-4 mr-2 text-primary-500" />
                    {user.roomNumber || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Bed Type
                  </p>
                  <div className="flex items-center font-semibold text-gray-900 dark:text-white">
                    <Bed className="h-4 w-4 mr-2 text-primary-500" />
                    {user.bedType}
                  </div>
                </div>
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
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <History className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Swap History
              </h3>
              <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full">
                {swapHistory.length}
              </span>
            </div>

            {swapHistory.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-3 space-y-6">
                {swapHistory.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 bg-white dark:bg-gray-800 border-2 border-indigo-500 w-4 h-4 rounded-full"></div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {item.date}
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        Swapped with {item.otherPerson}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg inline-block">
                        {item.hostel}, Room {item.room}
                      </p>
                    </div>
                  </div>
                ))}
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
