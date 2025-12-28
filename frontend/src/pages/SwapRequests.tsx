import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
  RefreshCw,
  Check,
  X,
  Clock,
  User,
  Building,
  Hash,
  MessageSquare,
  Bed,
  Filter,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { SwapRequest } from "../types";
import toast from "react-hot-toast";

const SwapRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "accepted" | "rejected"
  >("pending");

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Create queries for both sent and received requests
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

        // Merge with current received data (we need to access the LATEST state)
        setRequests((prev) => {
          const currentReceived = prev.filter((r) => r.type === "received");
          // Combine and dedup based on ID just in case
          const combined = [...currentReceived, ...sentData];
          // Remove duplicates if any (though types shouldn't overlap)
          const unique = Array.from(
            new Map(combined.map((item) => [item.id, item])).values()
          );
          // Sort by date desc
          return unique.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to sent requests:", error);
        toast.error("Failed to sync sent requests");
        setLoading(false);
      }
    );

    // Listen to received requests
    const unsubscribeReceived = onSnapshot(
      receivedQuery,
      (snapshot) => {
        const receivedData = snapshot.docs.map(processSnapshot);

        setRequests((prev) => {
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
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to received requests:", error);
        toast.error("Failed to sync received requests");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [user]);

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        // Optimistic update
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: "accepted" } : r
          )
        );

        await api.post("/api/swap/accept", {
          requesterId: request.requesterId,
        });
        toast.success("Swap request accepted!");
        // Fetch is automatic via listener
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to accept request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      // Optimistic update
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r))
      );

      // This would be an API call to reject the request
      toast.success("Swap request rejected!");
      // Fetch is automatic via listener
    } catch (error: any) {
      toast.error("Failed to reject request");
    } finally {
      setActionLoading(null);
    }
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
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <Check className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredRequests = requests.filter((request) => {
    const typeMatch = filter === "all" || request.type === filter;
    const statusMatch =
      statusFilter === "all" || request.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const sentRequests = filteredRequests.filter((req) => req.type === "sent");
  const receivedRequests = filteredRequests.filter(
    (req) => req.type === "received"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold heading-gradient mb-2">
          Swap Requests
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your sent and received room swap requests.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
              Filter by:
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("sent")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === "sent"
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setFilter("received")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === "received"
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              Received
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("accepted")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "accepted"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {filter === "all" ? (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Received Requests */}
          <div className="card p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl mr-4 shadow-sm">
                <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Received Requests ({receivedRequests.length})
              </h2>
            </div>

            {receivedRequests.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No received requests yet
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {receivedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    actionLoading={actionLoading}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="card p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl mr-4 shadow-sm">
                <RefreshCw className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Sent Requests ({sentRequests.length})
              </h2>
            </div>

            {sentRequests.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No sent requests yet
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sentRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    actionLoading={actionLoading}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    isSent={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-3">
              <RefreshCw className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {filter === "sent" ? "Sent" : "Received"} Requests (
              {filteredRequests.length})
            </h2>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No {filter} requests{" "}
                {statusFilter !== "all" ? `with ${statusFilter} status` : ""}{" "}
                found
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  actionLoading={actionLoading}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  isSent={request.type === "sent"}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { doc, getDoc } from "firebase/firestore";

interface RequestCardProps {
  request: SwapRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  isSent?: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onReject,
  actionLoading,
  getStatusColor,
  getStatusIcon,
  isSent = false,
}) => {
  const [enrichedData, setEnrichedData] = useState<{
    displayName: string;
    displayEmail: string;
    displayHostel: string;
    displayRoom: string | number;
    displayBedType: string;
  } | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      // Determine which ID to fetch
      const studentId = isSent ? request.targetStudentId : request.requesterId;

      // Check if we need to fetch (e.g. if email is missing)
      const currentEmail = isSent
        ? request.targetEmail
        : request.requesterEmail;

      // We fetch if email is missing or placeholder
      if (!currentEmail || currentEmail === "No Email") {
        try {
          // Try to look up by ID first (assuming it is a UID)
          // Note: our system sometimes used email as ID, sometimes UID.
          // Best effort lookup.
          let studentDoc = await getDoc(doc(db, "students", studentId));

          if (studentDoc.exists()) {
            const data = studentDoc.data();
            setEnrichedData({
              displayName:
                data.name ||
                (isSent ? request.targetName : request.requesterName),
              displayEmail: data.email || "No Email",
              displayHostel:
                data.hostel ||
                (isSent ? request.targetHostel : request.requesterHostel),
              displayRoom:
                data.roomNumber ||
                (isSent ? request.targetRoom : request.requesterRoom),
              displayBedType:
                data.bedType ||
                (isSent ? request.targetBedType : request.requesterBedType),
            });
          }
        } catch (err) {
          console.error("Failed to enrich card data", err);
        }
      }
    };

    fetchStudentData();
  }, [request, isSent]);

  const displayName =
    enrichedData?.displayName ||
    (isSent ? request.targetName : request.requesterName);
  const displayEmail =
    enrichedData?.displayEmail ||
    (isSent ? request.targetEmail : request.requesterEmail);
  const displayHostel =
    enrichedData?.displayHostel ||
    (isSent ? request.targetHostel : request.requesterHostel);
  const displayRoom =
    enrichedData?.displayRoom ||
    (isSent ? request.targetRoom : request.requesterRoom);
  const displayBedType =
    enrichedData?.displayBedType ||
    (isSent ? request.targetBedType : request.requesterBedType);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <User className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {displayName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {displayEmail}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            request.status
          )}`}
        >
          {getStatusIcon(request.status)}
          <span className="ml-1 capitalize">{request.status}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Building className="h-4 w-4 mr-1" />
          {displayHostel}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Hash className="h-4 w-4 mr-1" />
          Room {displayRoom}
        </div>
      </div>

      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
        <Bed className="h-4 w-4 mr-1" />
        {displayBedType}
      </div>

      {request.message && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-start">
            <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {request.message}
            </p>
          </div>
        </div>
      )}

      {!isSent && request.status === "pending" && (
        <div className="flex space-x-2">
          <button
            onClick={() => onAccept(request.id)}
            disabled={actionLoading === request.id}
            className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50"
          >
            {actionLoading === request.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Accept
              </>
            )}
          </button>
          <button
            onClick={() => onReject(request.id)}
            disabled={actionLoading === request.id}
            className="flex-1 btn-secondary flex items-center justify-center"
          >
            <X className="h-4 w-4 mr-1" />
            Decline
          </button>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
        {new Date(request.createdAt).toLocaleDateString()} at{" "}
        {new Date(request.createdAt).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SwapRequests;
