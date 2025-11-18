// src/pages/student/StudentProfile.jsx
import React, { useEffect, useState } from "react";
import EducationTab from "./tabs/EducationTab";
import ResumeTab from "./tabs/ResumeTab";
import LinksTab   from "./tabs/LinksTab";
import SkillsTab  from "./tabs/SkillsTab";
import ProfileSidebar from "../student/ProfileSidebar"; // or adjust path


const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function StudentProfile() {
  const [activeTab, setActiveTab] = useState("education");
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoadingUser(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/users/me`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setUser(data.user || data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoadingUser(false);
    }
  }

  // provide refresh handler to children
  const refreshProfile = () => fetchProfile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* main content (left) */}
        <div className="lg:col-span-8 space-y-6">
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">
            Student Profile
          </h1>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* tabs header */}
            <div className="border-b">
              <nav className="flex space-x-4 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("education")}
                  className={`py-4 px-3 -mb-px text-sm font-medium ${
                    activeTab === "education"
                      ? "border-b-2 border-indigo-600 text-indigo-700"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Educational Qualifications
                </button>
                <button
                  onClick={() => setActiveTab("resume")}
                  className={`py-4 px-3 -mb-px text-sm font-medium ${
                    activeTab === "resume"
                      ? "border-b-2 border-indigo-600 text-indigo-700"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Resume
                </button>
                <button
                  onClick={() => setActiveTab("links")}
                  className={`py-4 px-3 -mb-px text-sm font-medium ${
                    activeTab === "links"
                      ? "border-b-2 border-indigo-600 text-indigo-700"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Links
                </button>
                <button
                  onClick={() => setActiveTab("skills")}
                  className={`py-4 px-3 -mb-px text-sm font-medium ${
                    activeTab === "skills"
                      ? "border-b-2 border-indigo-600 text-indigo-700"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Skills
                </button>

                <div className="ml-auto p-3">
                  <button
                    onClick={refreshProfile}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded shadow hover:bg-indigo-700"
                  >
                    Refresh
                  </button>
                </div>
              </nav>
            </div>

            {/* tabs content */}
            <div className="p-6">
              {loadingUser ? (
                <div className="text-center py-12 text-gray-500">
                  Loading...
                </div>
              ) : (
                <>
                  {activeTab === "education" && (
                    <EducationTab profile={user} onUpdated={refreshProfile} />
                  )}
                  {activeTab === "resume" && (
                    <ResumeTab profile={user} onUpdated={refreshProfile} />
                  )}
                  {activeTab === "links" && (
                    <LinksTab profile={user} onUpdated={refreshProfile} />
                  )}
                  {activeTab === "skills" && (
                    <SkillsTab profile={user} onUpdated={refreshProfile} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* sidebar (right) */}
        <aside className="lg:col-span-4">
          <ProfileSidebar
            user={user}
            loading={loadingUser}
            onEdit={refreshProfile}
          />
        </aside>
      </div>
    </div>
  );
}
