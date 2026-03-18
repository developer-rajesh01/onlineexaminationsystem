// src/pages/Register.jsx - MOBILE RESPONSIVE VERSION
import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import image from "../assets/login.jpg";
import API_BASE_URL from "../config/api";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineAcademicCap,
  HiOutlineOfficeBuilding,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineDeviceMobile,
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

const institutes = [
  "Poornima University",
  "Poornima Institute of Engineering & Technology",
  "Poornima College of Engineering",
  "No Institute",
];

const courses = [
  "MCA", "M.Tech", "MBA", "BBA", "BCA", "B.Sc", "B.Com",
  "BE/B.Tech", "PhD", "Diploma", "M.Sc", "ME"
];

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isInstituteSelected, setIsInstituteSelected] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    institute: "",
    branchBatch: "",
  });

  // Enhanced validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Success message from navigation
  const successMessage = location.state?.message;

  // Auto-clear success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate, location]);

  // Memoized handlers to prevent re-renders
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: "" }));
    setSubmitError("");
  }, []);

  const onInstituteInputChange = useCallback((e) => {
    const userInput = e.target.value;
    setFormData(prev => ({ ...prev, institute: userInput }));
    setIsInstituteSelected(false);
    setErrors(prev => ({ ...prev, institute: "" }));
    setTouched(prev => ({ ...prev, institute: true }));

    if (userInput.length > 0) {
      const filtered = institutes.filter((inst) =>
        inst.toLowerCase().includes(userInput.toLowerCase())
      );
      setFilteredInstitutes(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setFilteredInstitutes([]);
    }
  }, []);

  const onSuggestionClick = useCallback((suggestion) => {
    setFormData(prev => ({ ...prev, institute: suggestion }));
    setFilteredInstitutes([]);
    setShowSuggestions(false);
    setIsInstituteSelected(true);
    setErrors(prev => ({ ...prev, institute: "" }));
  }, []);

  const handleRoleChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      role: value,
      branchBatch: value === "student" ? prev.branchBatch : "",
    }));
    setErrors(prev => ({ ...prev, branchBatch: "" }));
  }, []);

  // Real-time field validation
  const validateField = useCallback((name, value) => {
    switch (name) {
      case "name":
        return !value.trim() ? "Name is required." : "";
      case "email":
        if (!value.trim()) return "Email is required.";
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Please enter a valid email." : "";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 6) return "Password must be at least 6 characters.";
        if (!/[A-Z]/.test(value)) return "Password must contain an uppercase letter.";
        if (!/[0-9]/.test(value)) return "Password must contain a number.";
        return "";
      case "institute":
        if (!value.trim()) return "Institute is required.";
        return !isInstituteSelected ? "Please select from the list." : "";
      case "branchBatch":
        return formData.role === "student" && !value ? "Course/Batch is required." : "";
      default:
        return "";
    }
  }, [formData.role, isInstituteSelected]);

  // Form validation on blur
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Full form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      newErrors[key] = validateField(key, formData[key]);
    });
    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  }, [formData, validateField]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      setSubmitError("Please fix the errors above.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        institute: formData.institute.trim(),
      };

      if (formData.role === "student") {
        payload.branchBatch = formData.branchBatch;
      }

      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      // Reset form and redirect
      setFormData({
        name: "", email: "", password: "", role: "", institute: "", branchBatch: ""
      });
      setTouched({});
      setErrors({});
      setIsInstituteSelected(false);

      setTimeout(() => {
        navigate("/login", {
          state: { message: res.data.message || "✅ Account created successfully!" }
        });
      }, 1500);

    } catch (error) {
      setSubmitError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, validateForm, navigate]);

  const batchOptions = Array.from({ length: 12 }, (_, i) => `Batch ${i + 1}`);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Wrapper for mobile */}
      <div className="w-full max-w-md sm:max-w-2xl lg:max-w-6xl mx-auto">

        {/* Animated background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-indigo-400/40 to-purple-400/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/40 to-indigo-400/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[550px] lg:min-h-[700px] h-auto">

            {/* LEFT - Enhanced Form */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center order-1 lg:order-2 bg-gradient-to-b from-white to-slate-50/50">
              <div className="max-w-md mx-auto w-full space-y-8">

                {/* Header */}
                <div className="text-center">
                  <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent tracking-tight mb-4">
                    Create Account
                  </h1>
                  <p className="text-xl text-slate-600 font-medium leading-relaxed">
                    Join ExamPortal - Professional assessment platform
                  </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-300 text-emerald-700 font-semibold text-center animate-in slide-in-from-top-4 duration-500">
                    {successMessage}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>

                  {/* Name Field */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <HiOutlineUser className="w-5 h-5 text-indigo-500" />
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-300 text-base font-medium backdrop-blur-sm
                        ${touched.name
                          ? errors.name
                            ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200/50"
                            : "border-emerald-300 bg-emerald-50/50 focus:border-emerald-400 focus:ring-emerald-200/50"
                          : "border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 hover:border-slate-300/80 focus:border-indigo-500 focus:ring-indigo-200/50"
                        }`}
                      placeholder="Enter your full name"
                    />
                    {touched.name && errors.name && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <HiOutlineMail className="w-5 h-5 text-indigo-500" />
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-300 text-base font-medium backdrop-blur-sm
                        ${touched.email
                          ? errors.email
                            ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200/50"
                            : "border-emerald-300 bg-emerald-50/50 focus:border-emerald-400 focus:ring-emerald-200/50"
                          : "border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 hover:border-slate-300/80 focus:border-indigo-500 focus:ring-indigo-200/50"
                        }`}
                      placeholder="your.email@domain.com"
                    />
                    {touched.email && errors.email && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0" /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label htmlFor="role" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <HiOutlineAcademicCap className="w-5 h-5 text-indigo-500" />
                      I am a
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/50 focus:outline-none transition-all duration-300 text-base font-medium"
                    >
                      <option value="" disabled>Select role</option>
                      <option value="faculty">👨‍🏫 Faculty</option>
                      <option value="student">👨‍🎓 Student</option>
                    </select>
                  </div>

                  {/* Institute Autocomplete */}
                  <div className="space-y-2">
                    <label htmlFor="institute" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <HiOutlineOfficeBuilding className="w-5 h-5 text-indigo-500" />
                      Institute
                    </label>
                    <div className="relative">
                      <input
                        id="institute"
                        name="institute"
                        type="text"
                        value={formData.institute}
                        onChange={onInstituteInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                        className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-300 text-base font-medium backdrop-blur-sm
                          ${touched.institute && errors.institute
                            ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200/50"
                            : "border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 hover:border-slate-300/80 focus:border-indigo-500 focus:ring-indigo-200/50"
                          }`}
                        placeholder="Search your institute..."
                        autoComplete="off"
                      />
                      <HiOutlineOfficeBuilding className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      {showSuggestions && filteredInstitutes.length > 0 && (
                        <ul className="absolute z-30 w-full mt-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-2xl max-h-48 overflow-auto divide-y divide-slate-100">
                          {filteredInstitutes.map((inst, idx) => (
                            <li
                              key={idx}
                              className="px-4 py-3 cursor-pointer hover:bg-indigo-50/50 text-slate-800 font-medium transition-all duration-200 flex items-center gap-3 hover:translate-x-2"
                              onClick={() => onSuggestionClick(inst)}
                            >
                              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                              {inst}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {touched.institute && errors.institute && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0" /> {errors.institute}
                      </p>
                    )}
                  </div>

                  {/* Student Course/Batch */}
                  {formData.role === "student" && (
                    <div className="space-y-2">
                      <label htmlFor="branchBatch" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <HiOutlineAcademicCap className="w-5 h-5 text-indigo-500" />
                        Course / Batch
                      </label>
                      <select
                        id="branchBatch"
                        name="branchBatch"
                        value={formData.branchBatch}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/50 focus:outline-none transition-all duration-300 text-base font-medium"
                      >
                        <option value="" disabled>Select course or batch</option>
                        <optgroup label="📚 Popular Courses">
                          {courses.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                        <optgroup label="📅 Batches">
                          {batchOptions.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </optgroup>
                      </select>
                      {touched.branchBatch && errors.branchBatch && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0" /> {errors.branchBatch}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <HiOutlineLockClosed className="w-5 h-5 text-indigo-500" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                        className={`w-full pl-12 pr-12 py-4 rounded-2xl border-2 transition-all duration-300 text-base font-medium backdrop-blur-sm
                          ${touched.password
                            ? errors.password
                              ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200/50"
                              : "border-emerald-300 bg-emerald-50/50 focus:border-emerald-400 focus:ring-emerald-200/50"
                            : "border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 hover:border-slate-300/80 focus:border-indigo-500 focus:ring-indigo-200/50"
                          }`}
                        placeholder="Create a strong password (6+ chars)"
                      />
                      <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? <HiOutlineEyeOff className="w-6 h-6" /> : <HiOutlineEye className="w-6 h-6" />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0" /> {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Submit Error */}
                  {submitError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-300 text-red-700 font-semibold text-sm">
                      <HiOutlineExclamationCircle className="inline w-5 h-5 mr-2" />
                      {submitError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-5 px-8 rounded-2xl font-bold text-xl text-white shadow-2xl
                      transition-all duration-300 flex items-center justify-center gap-3
                      relative overflow-hidden group
                      ${isSubmitting
                        ? "bg-indigo-500/80 cursor-not-allowed shadow-indigo-400/30"
                        : "bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-2xl hover:shadow-emerald-500/50 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <HiOutlineCheckCircle className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="text-center space-y-2 pt-6 border-t border-slate-200/50">
                  <p className="text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all duration-200">
                      Sign in →
                    </Link>
                  </p>
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                    🔒 Secure • Encrypted • Privacy Protected
                    <HiOutlineShieldCheck className="w-4 h-4" />
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT - Mobile Responsive Image Section */}
            {/* Hide image on mobile, show on md+ */}
            {/* RIGHT - FIXED Image Container - Perfect Sizing */}
            <div className="w-full lg:w-1/2 hidden md:block relative order-2 lg:order-1">
              {/* Fixed height container */}
              <div className="h-[550px] lg:h-full w-full bg-cover bg-center bg-no-repeat relative overflow-hidden rounded-bl-3xl lg:rounded-bl-none"
                style={{ backgroundImage: `url(${image})` }}>

                {/* Fixed overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent backdrop-blur-sm" />

                {/* Fixed decorative elements - contained */}
                <div className="absolute top-8 -right-8 w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-emerald-400/30 to-indigo-400/30 rounded-3xl blur-xl animate-pulse" />
                <div className="absolute bottom-8 left-8 w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-400/30 to-emerald-400/30 rounded-2xl blur-xl animate-pulse delay-1000" />

                {/* Fixed content area */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 lg:p-16 text-center text-white h-full w-full">
                  <div className="max-w-lg space-y-6 w-full h-full flex flex-col justify-center">
                    {/* All your existing content stays exactly the same */}
                    <div className="space-y-3">
                      <h2 className="text-4xl lg:text-5xl font-black drop-shadow-2xl bg-gradient-to-r from-white via-emerald-100 to-indigo-100 bg-clip-text text-transparent tracking-tight">
                        ExamPortal Pro
                      </h2>
                      <div className="flex items-center justify-center gap-2 text-indigo-100/90 text-lg font-semibold drop-shadow-lg">
                        <HiOutlineDeviceMobile className="w-6 h-6" />
                        <span>Anytime,</span>
                        <HiOutlineAcademicCap className="w-6 h-6" />
                        <span>Anywhere Access</span>
                      </div>
                    </div>

                    <p className="text-xl leading-relaxed drop-shadow-lg bg-white/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/20">
                      Advanced assessment platform with AI-powered evaluation, secure proctoring, and real-time analytics
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200">
                        <HiOutlineShieldCheck className="w-6 h-6 text-emerald-300 flex-shrink-0" />
                        <span className="text-sm font-semibold">Secure Proctoring</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200">
                        <HiOutlineAcademicCap className="w-6 h-6 text-emerald-300 flex-shrink-0" />
                        <span className="text-sm font-semibold">Auto-Grading</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* MOBILE GRADIENT FALLBACK */}
            
          </div>
        </div>
      </div>
    </div>
  );
}
