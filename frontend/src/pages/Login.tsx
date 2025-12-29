import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, LogIn, Shield, User } from "lucide-react";
import toast from "react-hot-toast";

const Login: React.FC = () => {
  const {
    login,
    adminLogin,
    requestPasswordReset,
    confirmPasswordReset,
    sendResetOtp,
    confirmResetOtp,
  } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStage, setResetStage] = useState<"request" | "confirm" | "otp">(
    "request"
  );
  const [resetBusy, setResetBusy] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isAdmin) {
        await adminLogin(formData.username, formData.password);
        toast.success("Welcome back, Admin!");
      } else {
        await login(formData.email, formData.password);
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReset = () => {
    setShowReset(true);
    setResetIdentifier("");
    setResetToken("");
    setNewPassword("");
    setResetStage("request");
  };

  const handleSendToken = async () => {
    try {
      setResetBusy(true);
      const identifier = resetIdentifier.trim();
      if (!identifier) {
        toast.error("Please enter your " + (isAdmin ? "username" : "email"));
        return;
      }
      if (isAdmin) {
        const token = await requestPasswordReset(identifier, "admin");
        setResetStage("confirm");
        setResetToken(token || "");
        toast.success("Reset token generated.");
      } else {
        await sendResetOtp(identifier);
        setResetStage("otp");
        toast.success("OTP sent to your email");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResetBusy(false);
    }
  };

  const handleConfirmReset = async () => {
    try {
      setResetBusy(true);
      const identifier = resetIdentifier.trim();
      if (isAdmin) {
        if (!identifier || !resetToken || !newPassword) {
          toast.error("Fill all fields");
          return;
        }
        await confirmPasswordReset(
          identifier,
          "admin",
          resetToken.trim(),
          newPassword
        );
      } else {
        if (!identifier || !resetToken || !newPassword) {
          toast.error("Fill all fields");
          return;
        }
        await confirmResetOtp(identifier, resetToken.trim(), newPassword);
      }
      toast.success("Password reset successful. You can sign in now.");
      setShowReset(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in px-4">
      <div className="max-w-md w-full relative z-10">
        <div className="glass-panel rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="p-2.5 sm:p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                {isAdmin ? (
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400" />
                ) : (
                  <LogIn className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400" />
                )}
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {isAdmin ? "Admin Login" : "Welcome Back"}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">
              {isAdmin
                ? "Sign in to admin dashboard"
                : "Sign in to your account to continue"}
            </p>
          </div>

          {/* Login Type Toggle */}
          <div className="flex mb-6 sm:mb-8 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setIsAdmin(false)}
              className={`flex-1 flex items-center justify-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                !isAdmin
                  ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setIsAdmin(true)}
              className={`flex-1 flex items-center justify-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                isAdmin
                  ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {isAdmin ? (
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter admin username"
                />
              </div>
            ) : (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter your email"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {!isAdmin && (
              <div className="flex items-center justify-between -mt-2">
                <span className="text-xs text-transparent">.</span>
                <button
                  type="button"
                  onClick={handleOpenReset}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  {isAdmin ? (
                    <Shield className="h-5 w-5 mr-2" />
                  ) : (
                    <LogIn className="h-5 w-5 mr-2" />
                  )}
                  Sign In
                </>
              )}
            </button>
          </form>

          {!isAdmin && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          )}
        </div>

        {showReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {resetStage === "request"
                  ? "Reset your password"
                  : "Set new password"}
              </h3>
              {resetStage === "request" ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {isAdmin
                      ? "Enter your admin username to receive a reset token."
                      : "Enter your email to receive an OTP."}
                  </p>
                  <input
                    type="text"
                    className="input-field mb-4"
                    placeholder={isAdmin ? "Admin username" : "Email address"}
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => setShowReset(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary disabled:opacity-50"
                      disabled={resetBusy}
                      onClick={handleSendToken}
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : resetStage === "confirm" ? (
                <>
                  <input
                    type="text"
                    className="input-field mb-3"
                    placeholder="Paste reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />
                  <input
                    type="password"
                    className="input-field mb-4"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div className="flex justify-between">
                    <button
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      onClick={() => setResetStage("request")}
                    >
                      Back
                    </button>
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => setShowReset(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary disabled:opacity-50"
                        disabled={resetBusy}
                        onClick={handleConfirmReset}
                      >
                        Reset password
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    className="input-field mb-3"
                    placeholder="Enter OTP"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />
                  <input
                    type="password"
                    className="input-field mb-4"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div className="flex justify-between">
                    <button
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      onClick={() => setResetStage("request")}
                    >
                      Back
                    </button>
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => setShowReset(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary disabled:opacity-50"
                        disabled={resetBusy}
                        onClick={handleConfirmReset}
                      >
                        Reset password
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
