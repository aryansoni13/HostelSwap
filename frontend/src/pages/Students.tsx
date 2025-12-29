import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  Search,
  Users,
  Building,
  Hash,
  Bed,
  Mail,
  RefreshCw,
  Filter,
} from "lucide-react";
import { Student } from "../types";
import toast from "react-hot-toast";

import { useAuth } from "../contexts/AuthContext";

const Students: React.FC = () => {
  const { user } = useAuth(); // Get current user
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    hostel: "",
    bedType: "",
  });

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

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error("Request timeout. Please check your connection.")),
          10000
        )
      );

      // Fetch all students from Firestore
      const studentsRef = collection(db, "students");
      const fetchPromise = getDocs(query(studentsRef, orderBy("name")));

      const studentsSnapshot = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as any;

      const studentsList: Student[] = [];
      studentsSnapshot.forEach((doc: any) => {
        const data = doc.data();
        studentsList.push({
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          hostel: data.hostel || "",
          bedType: data.bedType || "",
          roomNumber: data.roomNumber || 0,
          isVerified: data.isVerified || false,
        });
      });

      setStudents(studentsList);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      if (
        error.message?.includes("PERMISSION_DENIED") ||
        error.code === "permission-denied"
      ) {
        toast.error(
          "Firestore API not enabled. Please enable it in Firebase Console."
        );
      } else if (error.message?.includes("timeout")) {
        toast.error("Request timed out. Please check your connection.");
      } else {
        toast.error(error.message || "Failed to fetch students");
      }
      // Set empty array so page doesn't break
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Hostel filter
    if (filters.hostel) {
      filtered = filtered.filter(
        (student) => student.hostel === filters.hostel
      );
    }

    // Bed type filter
    if (filters.bedType) {
      filtered = filtered.filter(
        (student) => student.bedType === filters.bedType
      );
    }

    setFilteredStudents(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({ hostel: "", bedType: "" });
    setSearchTerm("");
  };

  const sendSwapRequest = async (student: Student) => {
    // Frontend Check for Bed Type
    if (
      user &&
      user.bedType &&
      student.bedType &&
      user.bedType !== student.bedType
    ) {
      toast.error(
        `You can only swap with students having the same bed type. Your room is ${user.bedType}, but this student is in a ${student.bedType} room.`,
        { duration: 5000 }
      );
      return;
    }

    try {
      // Use email as it's more reliable for lookup
      await api.post("/api/swap/request", { targetStudentId: student.email });
      toast.success(`Swap request sent to ${student.name}!`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to send swap request"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold heading-gradient mb-2">
          Find Students
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Browse and connect with other students for room swapping.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="space-y-3 sm:space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 sm:pl-10 bg-white dark:bg-gray-800 text-sm sm:text-base"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
            <div className="flex items-center w-full sm:w-auto">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by:
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1 sm:flex-none">
              <select
                value={filters.hostel}
                onChange={(e) => handleFilterChange("hostel", e.target.value)}
                className="input-field w-full sm:min-w-[150px] text-sm sm:text-base"
              >
                <option value="">All Hostels</option>
                {hostelOptions.map((hostel) => (
                  <option key={hostel} value={hostel}>
                    {hostel.charAt(0).toUpperCase() + hostel.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={filters.bedType}
                onChange={(e) => handleFilterChange("bedType", e.target.value)}
                className="input-field w-full sm:min-w-[150px] text-sm sm:text-base"
              >
                <option value="">All Bed Types</option>
                {bedTypeOptions.map((bedType) => (
                  <option key={bedType} value={bedType}>
                    {bedType}
                  </option>
                ))}
              </select>

              <button 
                onClick={clearFilters} 
                className="btn-secondary w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">
            No students found
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="card p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/30 dark:to-indigo-900/30 rounded-full mr-3 sm:mr-4 shadow-sm flex-shrink-0">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                      {student.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                      {student.email}
                    </p>
                  </div>
                </div>
                {student.isVerified && (
                  <span className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex-shrink-0">
                    Verified
                  </span>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="font-medium">Hostel:</span>
                  <span className="ml-1 truncate">
                    {student.hostel.charAt(0).toUpperCase() +
                      student.hostel.slice(1)}
                  </span>
                </div>

                <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="font-medium">Room:</span>
                  <span className="ml-1">{student.roomNumber}</span>
                </div>

                <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <Bed className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="font-medium">Bed Type:</span>
                  <span className="ml-1 truncate">{student.bedType}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => sendSwapRequest(student)}
                  className="flex-1 btn-primary flex items-center justify-center text-xs sm:text-sm sm:text-base py-2 sm:py-2.5"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Request Swap</span>
                  <span className="sm:hidden">Swap</span>
                </button>
                <a
                  href={`mailto:${student.email}`}
                  className="btn-secondary flex items-center justify-center px-3 sm:px-5 py-2 sm:py-2.5 flex-shrink-0"
                  aria-label="Send email"
                >
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Students;
