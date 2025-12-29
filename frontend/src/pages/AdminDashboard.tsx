import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Shield,
  Building,
  Plus,
  Minus,
  Hash,
  Bed,
  Users,
  BarChart3,
  Check,
  X,
  Search,
  FileText,
  ArrowRight,
  TrendingUp,
  Clock,
  Activity,
  RefreshCw,
  UserCheck,
  Home,
  ArrowLeftRight,
  Eye,
  Image,
} from "lucide-react";
import { Hostel } from "../types";
import toast from "react-hot-toast";

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "listings" | "requests"
  >("overview");

  // -- Listings State --
  const [roomAction, setRoomAction] = useState({
    hostel: "",
    count: 1,
    bedType: "4 bedded",
  });
  const [hostels, setHostels] = useState<any[]>([]);

  // -- Users State --
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // -- Requests State --
  const [requests, setRequests] = useState<any[]>([]);
  const [requestSearch, setRequestSearch] = useState("");

  // -- ID Card Modal State --
  const [idCardModal, setIdCardModal] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    userName: string;
  }>({
    isOpen: false,
    imageUrl: null,
    userName: "",
  });

  const [loading, setLoading] = useState(false);

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
  const bedTypeOptions = [
    "8 bedded",
    "6 bedded",
    "4 bedded",
    "3 bedded",
    "2 bedded",
    "1 bedded",
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    fetchHostelStats();
    fetchUsers();
    fetchRequests();
  };

  const fetchHostelStats = async () => {
    try {
      const res = await api.get("/api/admin/stats");
      setHostels(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch stats", error);
      setHostels([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/admin/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch users", error);
      setUsers([]);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get("/api/admin/swaps");
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch requests", error);
      setRequests([]);
    }
  };

  // --- Handlers ---

  const handleVerifyUser = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/api/admin/verify-user/${userId}`, {
        isVerified: !currentStatus,
      });
      toast.success(currentStatus ? "User Unverified" : "User Verified");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update verification");
    }
  };

  const handleSwapStatus = async (requestId: string, status: string) => {
    try {
      await api.put(`/api/admin/swap-status/${requestId}`, { status });
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRoomAction({
      ...roomAction,
      [name]: name === "count" ? parseInt(value) || 1 : value,
    });
  };

  const handleIncreaseRooms = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/admin/increase-rooms", roomAction);
      toast.success(`Added ${roomAction.count} room(s)`);
      setRoomAction({ hostel: "", count: 1, bedType: "4 bedded" });
      fetchHostelStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDecreaseRooms = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/admin/decrease-rooms", { ...roomAction });
      toast.success(`Removed ${roomAction.count} room(s)`);
      setRoomAction({ hostel: "", count: 1, bedType: "4 bedded" });
      fetchHostelStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---

  // --- Render Helpers ---

  const filteredUsers = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRequests = requests.filter(
    (r) =>
      (r.requesterName || "")
        .toLowerCase()
        .includes(requestSearch.toLowerCase()) ||
      (r.targetName || "").toLowerCase().includes(requestSearch.toLowerCase())
  );

  return (
    <>
      <div className="max-w-7xl mx-auto animate-fade-in pb-10 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-full mr-3 sm:mr-4 flex-shrink-0">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                System Overview & Management
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 sm:mb-8 overflow-x-auto">
          {[
            { id: "overview", icon: BarChart3, label: "Overview" },
            { id: "users", icon: Users, label: "Manage Users" },
            { id: "listings", icon: Building, label: "Listings" },
            { id: "requests", icon: FileText, label: "Swap Requests" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700/50"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Users */}
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-800/80 p-3 sm:p-5 group hover:border-blue-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-1">
                        Total Students
                      </p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                        {users.length}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {users.filter((u) => u.isVerified).length} verified
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg sm:rounded-xl border border-blue-500/20 flex-shrink-0 ml-2">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Hostel Blocks */}
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-800/80 p-3 sm:p-5 group hover:border-emerald-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">
                        Hostel Blocks
                      </p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                        {hostelOptions.length}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        Active buildings
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500/20 to-green-600/10 rounded-lg sm:rounded-xl border border-emerald-500/20 flex-shrink-0 ml-2">
                      <Building className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Total Rooms */}
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-800/80 p-3 sm:p-5 group hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-purple-400 text-xs font-semibold uppercase tracking-wide mb-1">
                        Total Rooms
                      </p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                        {hostels.reduce(
                          (acc, h) => acc + (h.totalRooms || 0),
                          0
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        Across all blocks
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500/20 to-violet-600/10 rounded-lg sm:rounded-xl border border-purple-500/20 flex-shrink-0 ml-2">
                      <Home className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                    </div>
                  </div>
                </div>

                {/* Pending Swaps */}
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-800/80 p-3 sm:p-5 group hover:border-amber-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1">
                        Pending Swaps
                      </p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                        {requests.filter((r) => r.status === "pending").length}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        Awaiting approval
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-lg sm:rounded-xl border border-amber-500/20 flex-shrink-0 ml-2">
                      <ArrowLeftRight className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Quick Actions */}
                <div className="card p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                      Quick Actions
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("users")}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          Verify Students
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                    </button>
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          Manage Rooms
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                    </button>
                    <button
                      onClick={() => setActiveTab("requests")}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <ArrowLeftRight className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          Review Swaps
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                    </button>
                    <button
                      onClick={() => fetchInitialData()}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          Refresh Data
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Recent Students */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        Recent Students
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("users")}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {users.slice(0, 4).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                          {(user.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {user.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.hostel
                              ? user.hostel.replace("block", "Block ")
                              : "No hostel"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.isVerified
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {user.isVerified ? "Verified" : "Pending"}
                        </span>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <p className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        No students registered yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent Swap Requests */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        Recent Requests
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("requests")}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {requests.slice(0, 4).map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              req.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : req.status === "accepted"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                          >
                            {req.status}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {req.createdAt?.seconds
                              ? new Date(
                                  req.createdAt.seconds * 1000
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-200 truncate">
                            {req.requesterName || "Unknown"}
                          </span>
                          <ArrowLeftRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-700 dark:text-gray-200 truncate">
                            {req.targetName || "Unknown"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {requests.length === 0 && (
                      <p className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        No swap requests yet
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Hostel Blocks Overview */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Hostel Blocks Overview
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {hostelOptions.map((hostel) => {
                    const data = hostels.find((h) => h.name === hostel);
                    const roomCount = data?.totalRooms || 0;
                    return (
                      <div
                        key={hostel}
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer"
                        onClick={() => setActiveTab("listings")}
                      >
                        <div
                          className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                            roomCount > 0
                              ? "bg-primary-100 dark:bg-primary-900/30"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          <Building
                            className={`w-5 h-5 ${
                              roomCount > 0
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-gray-400"
                            }`}
                          />
                        </div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                          {hostel.replace("block", "Block ")}
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            roomCount > 0
                              ? "text-primary-600 dark:text-primary-400"
                              : "text-gray-400"
                          }`}
                        >
                          {roomCount}
                        </p>
                        <p className="text-xs text-gray-500">rooms</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    User Management
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {filteredUsers.length} student
                    {filteredUsers.length !== 1 ? "s" : ""} registered
                  </p>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="input-field pl-10 w-full sm:w-72"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-300">
                        Student
                      </th>
                      <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-300">
                        Room Details
                      </th>
                      <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-300 text-center">
                        Status
                      </th>
                      <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-300 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`group transition-colors ${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-900/20"
                            : "bg-gray-50/50 dark:bg-gray-800/20"
                        } hover:bg-primary-50/50 dark:hover:bg-primary-900/10`}
                      >
                        {/* Student Info with Avatar */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {(user.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {user.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Room Details */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-700 dark:text-gray-200 capitalize">
                                {user.hostel
                                  ? user.hostel.replace("block", "Block ")
                                  : "Not Assigned"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              {user.roomNumber && (
                                <span className="flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  Room {user.roomNumber}
                                </span>
                              )}
                              {user.bedType && (
                                <span className="flex items-center gap-1">
                                  <Bed className="w-3 h-3" />
                                  {user.bedType}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              user.isVerified
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {user.isVerified ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                            {user.isVerified
                              ? "Verified"
                              : user.verificationStatus === "pending"
                              ? "Pending Review"
                              : "Not Verified"}
                          </span>
                          {/* Show ID card indicator if available and pending */}
                          {user.idCardUrl &&
                            user.verificationStatus === "pending" && (
                              <span className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                                <Image className="w-3 h-3" />
                                ID uploaded
                              </span>
                            )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* View ID Button - only show if user has uploaded ID */}
                            {user.idCardUrl && (
                              <button
                                onClick={() =>
                                  setIdCardModal({
                                    isOpen: true,
                                    imageUrl: user.idCardUrl,
                                    userName: user.name || "Student",
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View ID
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleVerifyUser(user.id, user.isVerified)
                              }
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-sm ${
                                user.isVerified
                                  ? "bg-red-500 text-white hover:bg-red-600 hover:shadow-md"
                                  : "bg-green-500 text-white hover:bg-green-600 hover:shadow-md"
                              }`}
                            >
                              {user.isVerified ? (
                                <>
                                  <X className="w-3.5 h-3.5" />
                                  Revoke
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Verify
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No users found
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {userSearch
                        ? "Try a different search term"
                        : "No students have registered yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LISTINGS TAB */}
          {activeTab === "listings" && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Add Rooms Card */}
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/80 p-6">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-800">
                    <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-500/20">
                      <Plus className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        Add New Rooms
                      </h3>
                      <p className="text-sm text-gray-400">
                        Increase room capacity in hostel blocks
                      </p>
                    </div>
                  </div>
                  <form
                    onSubmit={handleIncreaseRooms}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Hostel Block
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <select
                          name="hostel"
                          value={roomAction.hostel}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pl-10 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                          required
                        >
                          <option value="">Select Block</option>
                          {hostelOptions.map((h) => (
                            <option key={h} value={h}>
                              {h.replace("block", "Block ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Bed Type
                      </label>
                      <div className="relative">
                        <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <select
                          name="bedType"
                          value={roomAction.bedType}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pl-10 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                          required
                        >
                          {bedTypeOptions.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Quantity
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          name="count"
                          value={roomAction.count}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pl-10 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                          min="1"
                          placeholder="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 text-sm inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        Add Rooms
                      </button>
                    </div>
                  </form>
                </div>

                {/* Remove Rooms Card */}
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/80 p-6">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-800">
                    <div className="p-3 bg-gradient-to-br from-rose-500/20 to-red-500/20 rounded-xl border border-rose-500/20">
                      <Minus className="h-6 w-6 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        Remove Rooms
                      </h3>
                      <p className="text-sm text-gray-400">
                        Decrease room capacity in hostel blocks
                      </p>
                    </div>
                  </div>
                  <form
                    onSubmit={handleDecreaseRooms}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Hostel Block
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <select
                          name="hostel"
                          value={roomAction.hostel}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pl-10 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all"
                          required
                        >
                          <option value="">Select Block</option>
                          {hostelOptions.map((h) => (
                            <option key={h} value={h}>
                              {h.replace("block", "Block ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Bed Type
                      </label>
                      <div className="relative">
                        <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <select
                          name="bedType"
                          value={roomAction.bedType}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pl-10 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all"
                          required
                        >
                          {bedTypeOptions.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Quantity
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          name="count"
                          value={roomAction.count}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pl-10 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all"
                          min="1"
                          placeholder="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 text-sm inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Stats Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/80 p-6 sticky top-4">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-800">
                    <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/20">
                      <BarChart3 className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        Live Statistics
                      </h3>
                      <p className="text-sm text-gray-400">
                        <span className="text-indigo-400 font-semibold">
                          {hostels.reduce(
                            (acc, h) => acc + (h.totalRooms || 0),
                            0
                          )}
                        </span>{" "}
                        total rooms
                      </p>
                    </div>
                  </div>

                  {/* Blocks List */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {hostelOptions.map((hostel) => {
                      const data = hostels.find((h) => h.name === hostel);
                      const roomCount = data?.totalRooms || 0;
                      const maxRooms = Math.max(
                        ...hostels.map((h) => h.totalRooms || 0),
                        1
                      );
                      const percentage = (roomCount / maxRooms) * 100;

                      // Calculate room type breakdown
                      const roomsByType: Record<string, number> = {};
                      if (data?.rooms && Array.isArray(data.rooms)) {
                        data.rooms.forEach((room: any) => {
                          const bedType = room.bedType || "Unknown";
                          roomsByType[bedType] =
                            (roomsByType[bedType] || 0) + 1;
                        });
                      }
                      const hasRoomTypes = Object.keys(roomsByType).length > 0;

                      // Color scheme for bed types - simpler with dots
                      const bedTypeColors: Record<string, string> = {
                        "8 bedded": "bg-pink-400",
                        "6 bedded": "bg-rose-400",
                        "4 bedded": "bg-violet-400",
                        "3 bedded": "bg-blue-400",
                        "2 bedded": "bg-emerald-400",
                        "1 bedded": "bg-amber-400",
                      };

                      return (
                        <div
                          key={hostel}
                          className="group bg-gray-800/40 hover:bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
                        >
                          {/* Block Header */}
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                  roomCount > 0 ? "bg-green-400" : "bg-gray-600"
                                }`}
                              />
                              <span className="font-semibold text-white">
                                {hostel.replace("block", "Block ")}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-400">
                              <span className="text-white font-bold">
                                {roomCount}
                              </span>{" "}
                              rooms
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-3">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          {/* Room Type Tags */}
                          {hasRoomTypes && (
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                "8 bedded",
                                "6 bedded",
                                "4 bedded",
                                "3 bedded",
                                "2 bedded",
                                "1 bedded",
                              ].map((type) => {
                                const count = roomsByType[type] || 0;
                                if (count === 0) return null;
                                const dotColor =
                                  bedTypeColors[type] || "bg-gray-400";
                                return (
                                  <div
                                    key={type}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-700/50 hover:bg-gray-700 rounded-md text-xs transition-colors"
                                  >
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                                    />
                                    <span className="text-gray-400">
                                      {type.split(" ")[0]}B
                                    </span>
                                    <span className="text-white font-medium">
                                      {count}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ArrowLeftRight className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    Swap Requests
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span className="text-gray-500">
                        {requests.filter((r) => r.status === "pending").length}{" "}
                        Pending
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-gray-500">
                        {requests.filter((r) => r.status === "accepted").length}{" "}
                        Accepted
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-gray-500">
                        {requests.filter((r) => r.status === "rejected").length}{" "}
                        Rejected
                      </span>
                    </span>
                  </div>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    className="input-field pl-10 w-full sm:w-72"
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border-2 transition-all duration-200 ${
                      req.status === "pending"
                        ? "border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/50 dark:bg-yellow-900/10"
                        : req.status === "accepted"
                        ? "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      {/* Left Side - Status & Time */}
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            req.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30"
                              : req.status === "accepted"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          <ArrowLeftRight
                            className={`w-6 h-6 ${
                              req.status === "pending"
                                ? "text-yellow-600 dark:text-yellow-400"
                                : req.status === "accepted"
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                req.status === "pending"
                                  ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400"
                                  : req.status === "accepted"
                                  ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                                  : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400"
                              }`}
                            >
                              {req.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {req.createdAt?.seconds
                                ? new Date(
                                    req.createdAt.seconds * 1000
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Invalid Date"}
                            </span>
                          </div>

                          {/* Swap Details */}
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Requester */}
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                {(req.requesterName || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {req.requesterName || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {req.requesterHostel
                                    ? req.requesterHostel.replace(
                                        "block",
                                        "Block "
                                      )
                                    : "N/A"}
                                  {req.requesterRoom
                                    ? ` #${req.requesterRoom}`
                                    : ""}
                                </p>
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center gap-1 text-gray-400">
                              <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                              <ArrowLeftRight className="w-4 h-4" />
                              <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            </div>

                            {/* Target */}
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                {(req.targetName || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {req.targetName || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {req.targetHostel
                                    ? req.targetHostel.replace(
                                        "block",
                                        "Block "
                                      )
                                    : "N/A"}
                                  {req.targetRoom ? ` #${req.targetRoom}` : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      {req.status === "pending" && (
                        <div className="flex items-center gap-3 lg:self-center">
                          <button
                            onClick={() => handleSwapStatus(req.id, "rejected")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleSwapStatus(req.id, "accepted")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                        </div>
                      )}

                      {req.status !== "pending" && (
                        <div className="flex items-center lg:self-center">
                          <span
                            className={`text-sm font-medium ${
                              req.status === "accepted"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {req.status === "accepted"
                              ? "✓ Approved"
                              : "✕ Rejected"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredRequests.length === 0 && (
                  <div className="text-center py-16">
                    <ArrowLeftRight className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                      No swap requests found
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {requestSearch
                        ? "Try a different search term"
                        : "No students have requested swaps yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ID Card Preview Modal */}
      {idCardModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() =>
            setIdCardModal({ isOpen: false, imageUrl: null, userName: "" })
          }
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-600" />
                ID Card - {idCardModal.userName}
              </h3>
              <button
                onClick={() =>
                  setIdCardModal({
                    isOpen: false,
                    imageUrl: null,
                    userName: "",
                  })
                }
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {idCardModal.imageUrl ? (
                <img
                  src={idCardModal.imageUrl}
                  alt={`ID Card for ${idCardModal.userName}`}
                  className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No ID card image available</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() =>
                  setIdCardModal({
                    isOpen: false,
                    imageUrl: null,
                    userName: "",
                  })
                }
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
