import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
  User,
  Building,
  Hash,
  RefreshCw,
  Send,
  Users,
  Bed,
  Clock,
  Check,
  X,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { SwapRequest } from "../types";
import toast from "react-hot-toast";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [swapRequest, setSwapRequest] = useState({
    targetStudentId: "",
    message: "",
  });
  const [recentRequests, setRecentRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setRequestsLoading(true);

    // Create queries for both sent and received requests
    // Note: We sort in memory to avoid Firestore index requirements
    const sentQuery = query(
      collection(db, "swapRequests"),
      where("requesterId", "==", user.id)
    );

    const receivedQuery = query(
      collection(db, "swapRequests"),
      where("targetStudentId", "==", user.id)
    );

    // Helper to process snapshots
    const processSnapshot = (doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        requesterId: data.requesterId,
        requesterName: data.requesterName || "Unknown Student",
        requesterEmail: data.requesterEmail || "No Email",
        requesterHostel: data.requesterHostel || "Unknown",
        requesterRoom: data.requesterRoom || "Unknown",
        requesterBedType: data.requesterBedType || "Unknown",
        targetStudentId: data.targetStudentId,
        targetName: data.targetName || "Unknown Target",
        targetEmail: data.targetEmail || "No Email",
        targetHostel: data.targetHostel || "Unknown",
        targetRoom: data.targetRoom || "Unknown",
        targetBedType: data.targetBedType || "Unknown",
        message: data.message || "",
        status: data.status,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ||
          (data.createdAt as any)?.toDate?.()?.toISOString() ||
          data.createdAt ||
          new Date().toISOString(),
        type: data.requesterId === user.id ? "sent" : "received",
      } as SwapRequest;
    };

    // Listen to sent requests
    const unsubscribeSent = onSnapshot(
      sentQuery,
      (snapshot) => {
        const sentData = snapshot.docs.map(processSnapshot);

        setRecentRequests((prev) => {
          const currentReceived = prev.filter((r) => r.type === "received");
          const combined = [...currentReceived, ...sentData];
          const unique = Array.from(
            new Map(combined.map((item) => [item.id, item])).values()
          );
          // Sort by date desc (newest first)
          return unique.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setRequestsLoading(false);
      },
      (error) => {
        console.error("Error listening to sent requests:", error);
        setRequestsLoading(false);
      }
    );

    // Listen to received requests
    const unsubscribeReceived = onSnapshot(
      receivedQuery,
      (snapshot) => {
        const receivedData = snapshot.docs.map(processSnapshot);

        setRecentRequests((prev) => {
          const currentSent = prev.filter((r) => r.type === "sent");
          const combined = [...currentSent, ...receivedData];
          const unique = Array.from(
            new Map(combined.map((item) => [item.id, item])).values()
          );
          return unique.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setRequestsLoading(false);
      },
      (error) => {
        console.error("Error listening to received requests:", error);
        setRequestsLoading(false);
      }
    );

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [user]);

  const handleSwapRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/swap/request", swapRequest);
      toast.success("Swap request sent successfully!");
      setSwapRequest({ targetStudentId: "", message: "" });
      // No need to manually fetch - Firestore listener will update automatically
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to send swap request"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSwapRequest({
      ...swapRequest,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "accepted":
        return <Check className="h-3 w-3" />;
      case "rejected":
        return <X className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold heading-gradient mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Manage your hostel room and swap requests from your dashboard.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Current Room Info */}
        <div className="lg:col-span-1">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/30 dark:to-indigo-900/30 rounded-xl mr-3 sm:mr-4 shadow-sm">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Your Current Room
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="group flex items-center p-3 sm:p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl mr-3 sm:mr-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Building className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-0.5">
                    Hostel Block
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                    {user.hostelName
                      ? user.hostelName.charAt(0).toUpperCase() +
                        user.hostelName.slice(1)
                      : "Not Assigned"}
                  </p>
                </div>
              </div>

              <div className="group flex items-center p-3 sm:p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all duration-300">
                <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg sm:rounded-xl mr-3 sm:mr-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Hash className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">
                    Room Number
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    {user.roomNumber || "Not Assigned"}
                  </p>
                </div>
              </div>

              {user.bedType && (
                <div className="group flex items-center p-3 sm:p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl hover:shadow-lg hover:border-rose-500/50 dark:hover:border-rose-400/50 transition-all duration-300">
                  <div className="p-2 sm:p-3 bg-rose-100 dark:bg-rose-900/30 rounded-lg sm:rounded-xl mr-3 sm:mr-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <Bed className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-0.5">
                      Bed Type
                    </p>
                    <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                      {user.bedType}
                    </p>
                  </div>
                </div>
              )}

              <div className="group flex items-center p-3 sm:p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl hover:shadow-lg hover:border-emerald-500/50 dark:hover:border-emerald-400/50 transition-all duration-300">
                <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg sm:rounded-xl mr-3 sm:mr-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
                    Email Address
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 sm:mt-6 card p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <a
                href="/swap-requests"
                className="flex items-center p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
              >
                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg mr-2 sm:mr-3 group-hover:scale-110 transition-transform flex-shrink-0">
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100">
                    View All Requests
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Manage pending requests
                  </p>
                </div>
              </a>

              <a
                href="/students"
                className="flex items-center p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-all group border border-transparent hover:border-green-200 dark:hover:border-green-800"
              >
                <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/40 rounded-lg mr-2 sm:mr-3 group-hover:scale-110 transition-transform flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-medium text-green-900 dark:text-green-100">
                    Find Students
                  </h4>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Browse available rooms
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Request Swap & Recent Activity */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Request Swap */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg sm:rounded-xl mr-3 sm:mr-4 shadow-sm flex-shrink-0">
                <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Request a Swap
              </h2>
            </div>

            <form
              onSubmit={handleSwapRequest}
              className="space-y-3 sm:space-y-4"
            >
              <div>
                <label
                  htmlFor="targetStudentId"
                  className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2"
                >
                  Target Student Email or ID
                </label>
                <input
                  type="text"
                  id="targetStudentId"
                  name="targetStudentId"
                  value={swapRequest.targetStudentId}
                  onChange={handleChange}
                  required
                  className="input-field text-sm sm:text-base"
                  placeholder="Enter the student's email or ID"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2"
                >
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={swapRequest.message}
                  onChange={handleChange}
                  rows={3}
                  className="input-field resize-none text-sm sm:text-base"
                  placeholder="Add a personal message to your swap request..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2 sm:py-2.5"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="hidden sm:inline">Send Swap Request</span>
                    <span className="sm:hidden">Send Request</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recent Swap Requests */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <a
                href="/swap-requests"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs sm:text-sm font-medium"
              >
                View All
              </a>
            </div>

            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No swap requests yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Start by sending a swap request above
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentRequests.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl hover:shadow-md transition-all duration-300 gap-3"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div
                        className={`p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0 ${
                          request.status === "accepted"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : request.status === "rejected"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-yellow-100 dark:bg-yellow-900/30"
                        }`}
                      >
                        <RefreshCw
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
                            request.status === "accepted"
                              ? "text-green-600 dark:text-green-400"
                              : request.status === "rejected"
                              ? "text-red-600 dark:text-red-400"
                              : "text-yellow-600 dark:text-yellow-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                          Swap with Student
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          {request.targetStudentId || request.requesterId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-0">
                      <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1 sm:ml-1.5 capitalize">
                          {request.status}
                        </span>
                      </span>
                    </div>
                    <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 pl-11">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
