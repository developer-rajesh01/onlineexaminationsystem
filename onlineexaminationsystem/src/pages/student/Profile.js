import React, { useEffect, useState } from "react";

function DetailRow({ label, value }) {
  return (
    <div className="group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-gray-100 last:border-0 transition-all duration-200 hover:bg-indigo-50/50 rounded-lg -mx-2 px-2">
        <label className="text-sm font-semibold text-indigo-700 w-36 shrink-0 tracking-wide">
          {label}
        </label>
        <div className="flex-1">
          <p className="text-gray-900 font-medium text-base break-words">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Enhanced Profile Component
 * - Removed Address field
 * - Modern UI with glassmorphism, subtle shadows, hover effects
 * - Better spacing, typography, and visual flow
 * - Fully responsive
 */
export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    institute: "",
    branchBatch: "",
  });

  useEffect(() => {
    const storedName = localStorage.getItem("name") || "";
    const storedEmail = localStorage.getItem("email") || "";
    const storedInstitute = localStorage.getItem("institute") || "";
    const storedBranch = localStorage.getItem("branch") || "";

    setProfile({
      name: storedName,
      email: storedEmail,
      institute: storedInstitute,
      branchBatch: storedBranch,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            {profile.name}
          </h1>
          {/* <p className="text-gray-600 mt-3 text-sm md:text-base max-w-md mx-auto">
            Your secure, locally stored profile — no server, no tracking.
          </p> */}
        </div>

        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-10 border border-white/20 transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-800">
              Personal Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <DetailRow label="Full Name" value={profile.name} />
            <DetailRow label="Email" value={profile.email} />
            <DetailRow label="Branch & Batch" value={profile.branchBatch} />
            <DetailRow label="Institute" value={profile.institute} />
          </div>
        </div>

        {/* Footer Note */}
        {/* <p className="text-xs text-gray-500 text-center mt-6 italic">
          Data loaded from your browser’s <code className="font-mono bg-gray-100 px-1 rounded">localStorage</code> • No API • No internet required
        </p> */}
      </div>

      {/* Optional: Add subtle CSS for animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}