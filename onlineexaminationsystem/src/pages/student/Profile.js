import React, { useState } from "react";

// Simulated profile image/avatar
const avatar =
  "https://mdbootstrap.com/img/Photos/Avatars/img (31).jpg";

function Profile() {
  // Example: get these from localStorage or props/api
  const name = localStorage.getItem("name") || "John Smith";
  const email = localStorage.getItem("email") || "example@example.com";
  const [editMode, setEditMode] = useState(false);

  // State for only editable fields
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

  // Handlers for input changes
  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleProgressChange = (idx, newValue) => {
    setProgressList((prev) =>
      prev.map((prog, i) =>
        i === idx ? { ...prog, value: Number(newValue) } : prog
      )
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md flex flex-col items-center py-8 px-4 w-full md:w-1/3 min-w-[300px]">
            <img
              src={avatar}
              alt="avatar"
              className="rounded-full w-32 h-32 mb-4 border-4 border-indigo-200 object-cover"
            />
            <h2 className="text-xl font-semibold text-gray-800 mb-1">{name}</h2>
            <p className="text-gray-500 mb-1">Full Stack Developer</p>
            <p className="text-gray-400 mb-4">{profile.address}</p>
            <button
              className={`px-4 py-2 rounded bg-${editMode ? "green" : "blue"
                }-600 text-white font-bold w-32`}
              onClick={() => setEditMode((m) => !m)}
            >
              {editMode ? "Save" : "Edit"}
            </button>
          </div>
          {/* Info Table & Project Status */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-indigo-800">User Details</h3>
              <div className="divide-y">
                <div className="flex py-2">
                  <div className="w-40 text-gray-600">Full Name</div>
                  <div className="flex-1">{name}</div>
                </div>
                <div className="flex py-2">
                  <div className="w-40 text-gray-600">Email</div>
                  <div className="flex-1">{email}</div>
                </div>
                <div className="flex py-2 items-center">
                  <div className="w-40 text-gray-600">Phone</div>
                  <div className="flex-1">
                    {editMode ? (
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) =>
                          handleProfileChange("phone", e.target.value)
                        }
                        className="bg-gray-50 border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      profile.phone
                    )}
                  </div>
                </div>
                <div className="flex py-2 items-center">
                  <div className="w-40 text-gray-600">Mobile</div>
                  <div className="flex-1">
                    {editMode ? (
                      <input
                        type="text"
                        value={profile.mobile}
                        onChange={(e) =>
                          handleProfileChange("mobile", e.target.value)
                        }
                        className="bg-gray-50 border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      profile.mobile
                    )}
                  </div>
                </div>
                <div className="flex py-2 items-center">
                  <div className="w-40 text-gray-600">Address</div>
                  <div className="flex-1">
                    {editMode ? (
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) =>
                          handleProfileChange("address", e.target.value)
                        }
                        className="bg-gray-50 border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      profile.address
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Project Status */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-indigo-700 font-semibold italic mb-4">
                <span className="font-bold not-italic">assignment</span> Project Status
              </h3>
              <div className="space-y-6">
                {progressList.map((prog, idx) => (
                  <div key={prog.label}>
                    <div className="flex justify-between mb-2 items-center">
                      <span className="text-gray-600 text-sm font-semibold">{prog.label}</span>
                      <span className="text-sm text-gray-500">{prog.value}%</span>
                    </div>
                    {editMode ? (
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={prog.value}
                        onChange={(e) => handleProgressChange(idx, e.target.value)}
                        className="w-full accent-blue-600"
                      />
                    ) : (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${prog.value}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
