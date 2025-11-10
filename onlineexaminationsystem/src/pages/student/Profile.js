import React, { useState } from "react";

const avatar = "https://mdbootstrap.com/img/Photos/Avatars/img (32).jpg";

/* ------------------------------------------------- */
/*               Reusable Detail Row                 */
/* ------------------------------------------------- */
function DetailRow({ label, value, editMode = false, onChange, fullWidth = false }) {
  return (
    <div className={`${fullWidth ? "md:col-span-2" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0">
        <label className="text-sm font-medium text-gray-600 w-32 shrink-0">
          {label}
        </label>
        <div className="flex-1">
          {editMode ? (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          ) : (
            <p className="text-gray-800 font-medium">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------- */
/*                     Main Component                */
/* ------------------------------------------------- */
export default function Profile() {
  const name = localStorage.getItem("name") || "John Smith";
  const email = localStorage.getItem("email") || "example@example.com";

  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    phone: "(097) 234-5678",
    mobile: "(098) 765-4321",
    address: "Bay Area, San Francisco, CA",
  });

  const [progressList, setProgressList] = useState([
    { label: "Web Design", value: 70 },
    { label: "Website Markup", value: 80 },
    { label: "One Page", value: 90 },
    { label: "Mobile Template", value: 35 },
    { label: "Backend API", value: 60 },
  ]);

  /* ---------- Profile edit ---------- */
  const handleProfileChange = (field, value) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  /* ---------- Progress modal ---------- */
  const [progressModal, setProgressModal] = useState(false);
  const [tempProgress, setTempProgress] = useState(progressList);

  const openProgressModal = () => {
    setTempProgress([...progressList]);
    setProgressModal(true);
  };

  const closeProgressModal = () => setProgressModal(false);

  const saveProgress = () => {
    setProgressList(tempProgress);
    closeProgressModal();
  };

  const updateTemp = (idx, value) => {
    const num = Math.max(0, Math.min(100, parseInt(value) || 0));
    setTempProgress((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, value: num } : p))
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your personal information and project progress
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT – Avatar Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center transform transition hover:scale-[1.02]">
                <div className="relative inline-block">
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-indigo-200 shadow-md"
                  />
                  {editMode && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <button className="text-white text-xs font-medium bg-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-700">
                        Change
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="mt-5 text-2xl font-bold text-gray-800">{name}</h2>
                <p className="text-indigo-600 font-medium">Full Stack Developer</p>
                <p className="text-gray-500 text-sm mt-1">{profile.address}</p>

                <div className="mt-6 flex gap-2 justify-center">
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-md"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition shadow-md"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-5 py-2.5 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition shadow-md"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT – Info + Progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-7">
                <h3 className="text-xl font-bold text-indigo-800 mb-5 flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
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
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailRow label="Full Name" value={name} />
                  <DetailRow label="Email" value={email} />

                  <DetailRow
                    label="Phone"
                    value={profile.phone}
                    editMode={editMode}
                    onChange={(v) => handleProfileChange("phone", v)}
                  />
                  <DetailRow
                    label="Mobile"
                    value={profile.mobile}
                    editMode={editMode}
                    onChange={(v) => handleProfileChange("mobile", v)}
                  />

                  <div className="md:col-span-2">
                    <DetailRow
                      label="Address"
                      value={profile.address}
                      editMode={editMode}
                      onChange={(v) => handleProfileChange("address", v)}
                      fullWidth
                    />
                  </div>
                </div>
              </div>

              {/* Project Progress */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-7">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Project Progress
                  </h3>

                  <button
                    onClick={openProgressModal}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition shadow-sm"
                  >
                    Edit Progress
                  </button>
                </div>

                <div className="space-y-5">
                  {progressList.map((prog, idx) => (
                    <div key={prog.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">{prog.label}</span>
                        <span className="text-sm font-semibold text-indigo-600">
                          {prog.value}%
                        </span>
                      </div>

                      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${prog.value}%` }}
                        />
                        <div className="absolute inset-0 bg-white opacity-20 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Progress Edit Modal ---------- */}
      {progressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Update Project Progress
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {tempProgress.map((prog, idx) => (
                <div key={prog.label} className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium text-gray-700">
                    {prog.label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={prog.value}
                    onChange={(e) => updateTemp(idx, e.target.value)}
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeProgressModal}
                className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveProgress}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}