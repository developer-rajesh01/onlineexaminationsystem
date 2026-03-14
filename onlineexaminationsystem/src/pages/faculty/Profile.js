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

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    institute: "",
    branch: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileFromLocalStorage();
  }, []);

  const fetchProfileFromLocalStorage = () => {
    try {
      setLoading(true);

      // ✅ Using EXACTLY your localStorage keys from login
      const storedName = localStorage.getItem("name") || "";
      const storedEmail = localStorage.getItem("email") || "";
      const storedRole = localStorage.getItem("role") || "";
      const storedInstitute = localStorage.getItem("institute") || "";
      const storedBranch = localStorage.getItem("branch") || "";

      setProfile({
        name: storedName,
        email: storedEmail,
        role: storedRole,
        institute: storedInstitute,
        branch: storedBranch,
      });
    } catch (err) {
      console.error('LocalStorage read error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show message if not logged in
  if (!profile.name) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Profile Found</h2>
          <p className="text-gray-600 mb-6">Please login to view your faculty profile.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-gradient-to-r from-emerald-500 to-indigo-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-full mb-6 shadow-xl border-4 border-white/50">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 mb-2">
            {profile.name}
          </h1>
          <p className="text-xl font-semibold text-gray-700 bg-white/60 px-6 py-2 rounded-full inline-block shadow-md">
            {profile.role?.toUpperCase()} • {profile.institute}
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-10 border border-white/20 transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-10 bg-gradient-to-b from-emerald-500 to-indigo-600 rounded-full"></div>
            <h3 className="text-2xl font-bold text-gray-800">Faculty Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <DetailRow label="Full Name" value={profile.name} />
            <DetailRow label="Email" value={profile.email} />
            <DetailRow label="Role" value={profile.role?.toUpperCase()} />
            <DetailRow label="Institute" value={profile.institute} />
            {/* <DetailRow label="Branch/Batch" value={profile.branch} /> */}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
      `}</style>
    </div>
  );
}

export default Profile;
