import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import image from "../assets/login.jpg";
import axios from "axios";
import API_BASE_URL from "../config/api";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
} from "react-icons/hi";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDevicePopup, setShowDevicePopup] = useState(false);
  const [forceLogin, setForceLogin] = useState(false);

  const handleSubmit = async (e) => {
    if (loading) return;
    if (e) e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password, forceLogin },
        { timeout: 5000 }
      );

      if (res.data.token) {
        setShowDevicePopup(false);
        setForceLogin(false);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.user.role);
        localStorage.setItem("name", res.data.user.name);
        localStorage.setItem("email", res.data.user.email);
        localStorage.setItem("institute", res.data.user.institute);
        localStorage.setItem("branch", res.data.user.branchBatch);

        setMessage("✅ Login successful!");

        setTimeout(() => {
          setLoading(false);
          if (res.data.user.role === "faculty") {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/student/dashboard", { replace: true });
          }
        }, 800);
      }
    } catch (err) {
      setLoading(false);

      if (err.response?.status === 409) {
        setShowDevicePopup(true);
        setMessage("⚠️ Already logged in on another device.");
      } else {
        setMessage(
          err.response?.data?.message ||
          err.message ||
          "❌ Something went wrong. Please try again."
        );
      }
    }
  };

  useEffect(() => {
    window.history.replaceState(null, "", window.location.href);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-indigo-400/40 to-purple-400/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/40 to-indigo-400/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-6xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-[600px] lg:h-[700px]">

          {/* LEFT - Enhanced Form Section */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center order-2 lg:order-1 bg-gradient-to-b from-white to-slate-50/50">
            <div className="max-w-md mx-auto w-full space-y-8">

              {/* Header */}
              <div className="text-center">
                
                <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent tracking-tight mb-4">
                  Welcome Back
                </h1>
                <p className="text-xl text-slate-600 font-medium leading-relaxed">
                  Sign in to your professional assessment account
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <HiOutlineMail className="w-5 h-5 text-indigo-500" />
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/50 focus:outline-none transition-all duration-300 text-slate-900 placeholder-slate-400 hover:border-slate-300/80 text-base font-medium"
                      placeholder="Enter your email"
                    />
                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <HiOutlineLockClosed className="w-5 h-5 text-indigo-500" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/50 focus:outline-none transition-all duration-300 text-slate-900 placeholder-slate-400 hover:border-slate-300/80 text-base font-medium"
                      placeholder="Enter your password"
                    />
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-2xl backdrop-blur-sm border-2 transition-all duration-200 text-center font-semibold text-lg ${message.includes("✅")
                      ? "bg-emerald-500/10 border-emerald-300 text-emerald-700"
                      : "bg-red-500/10 border-red-300 text-red-700"
                    }`}>
                    {message}
                  </div>
                )}

                {/* Submit Button - FIXED */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-5 px-8 rounded-2xl font-bold text-xl text-white shadow-2xl
                    transition-all duration-300 flex items-center justify-center gap-3
                    relative overflow-hidden group
                    ${loading
                      ? "bg-indigo-500/80 cursor-not-allowed shadow-indigo-400/30"
                      : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 hover:shadow-2xl hover:shadow-indigo-500/50 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-6 w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Footer Links */}
              <div className="text-center space-y-2 pt-6 border-t border-slate-200/50">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all duration-200"
                  >
                    Create Account →
                  </Link>
                </p>
                <p className="text-xs text-slate-500">
                  Secure • Encrypted • Privacy Protected
                  <HiOutlineShieldCheck className="inline ml-1 w-4 h-4 text-emerald-500" />
                </p>
              </div>
            </div>
          </div>

         {/* RIGHT - Mobile Responsive Section */}
<div className="w-full lg:w-1/2 relative order-1 lg:order-2 hidden md:block">
  {/* Hide image completely on mobile, show on md+ screens */}
  <div
    className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-purple-900/5 to-slate-900/10 bg-cover bg-center bg-no-repeat h-full"
    style={{ backgroundImage: `url(${image})` }}
  >
    {/* Existing overlay and content */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent backdrop-blur-sm" />
    
    {/* Reduced decorative elements - smaller and contained */}
    <div className="absolute top-8 -right-8 w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-3xl blur-xl animate-pulse" />
    <div className="absolute bottom-8 left-8 w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-emerald-400/30 to-blue-400/30 rounded-2xl blur-xl animate-pulse delay-1000" />

    {/* Existing content */}
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 lg:p-16 text-center text-white">
      {/* Your existing content stays the same */}
    </div>
  </div>
</div>

{/* MOBILE PLACEHOLDER - Replace image with gradient on phones */}
<div className="w-full md:hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 h-48 lg:hidden relative order-1">
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
  <div className="absolute inset-0 flex items-center justify-center text-white">
    <h2 className="text-2xl font-black drop-shadow-2xl">ExamPortal Pro</h2>
  </div>
</div>

        </div>
      </div>

      {/* Enhanced Device Conflict Modal - FIXED */}
      {showDevicePopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full mx-4 p-8 lg:p-10 transform transition-all duration-300 scale-100 border border-white/50">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/40">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                Active Session Detected
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed max-w-md mx-auto">
                Your account is active on another device. Choose an action below.
              </p>
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-red-50/50 to-rose-50/50 rounded-2xl border-2 border-red-200/50 mb-8 backdrop-blur-sm">
              <input
                type="checkbox"
                id="force-login"
                checked={forceLogin}
                onChange={(e) => setForceLogin(e.target.checked)}
                className="w-6 h-6 text-indigo-600 border-2 border-red-300/50 rounded-xl focus:ring-indigo-500 mt-0.5 flex-shrink-0"
              />
              <label htmlFor="force-login" className="text-lg font-semibold text-slate-800 leading-relaxed cursor-pointer select-none">
                Force logout from all other devices and continue here
                <span className="text-sm font-normal text-slate-600 block mt-1">(This will end sessions on phones, tablets, other browsers)</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setShowDevicePopup(false);
                  setForceLogin(false);
                }}
                className="flex-1 py-4 px-8 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 font-bold rounded-2xl hover:from-slate-200 hover:to-slate-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 border border-slate-300"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`flex-1 py-4 px-8 font-bold rounded-2xl text-white shadow-2xl transition-all duration-200 flex items-center justify-center gap-3
                  ${loading
                    ? "bg-indigo-500/80 cursor-not-allowed shadow-indigo-400/30"
                    : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 hover:shadow-2xl hover:shadow-indigo-500/50 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Continue Login"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
