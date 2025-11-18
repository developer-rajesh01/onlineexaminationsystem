// src/components/profile/SkillsTab.jsx
import React, { useState } from "react";
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function SkillsTab({ profile, onUpdated }) {
  const [skillInput, setSkillInput] = useState("");
  const skills = profile?.skills || [];

  async function addSkill() {
    if (!skillInput.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/users/skills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ skill: skillInput }),
      });
      if (!res.ok) throw new Error("Add failed");
      await res.json();
      setSkillInput("");
      onUpdated();
    } catch (err) {
      console.error(err);
      alert("Failed to add skill");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          placeholder="Add a skill (eg. React)"
          className="border px-3 py-2 rounded flex-1"
        />
        <button
          onClick={addSkill}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Add
        </button>
      </div>

      <div>
        {skills.length === 0 ? (
          <div className="text-gray-500 p-6 bg-gray-50 rounded">
            No skills yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded text-sm"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
