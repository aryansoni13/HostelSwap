import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
// import Home from './pages/Home'
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SwapRequests from "./pages/SwapRequests";
import Students from "./pages/Students";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  user.isAdmin ? (
                    <Navigate to="/admin" />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  user.isAdmin ? (
                    <Navigate to="/admin" />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/register"
              element={
                user ? (
                  user.isAdmin ? (
                    <Navigate to="/admin" />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                ) : (
                  <Register />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/swap-requests"
              element={
                <ProtectedRoute>
                  <SwapRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="mt-auto py-6 border-t border-gray-800/50">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-gray-400">
              Created and maintained by{" "}
              <a
                href="https://www.linkedin.com/in/aryan-soni-26794924a/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Aryan Soni
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
