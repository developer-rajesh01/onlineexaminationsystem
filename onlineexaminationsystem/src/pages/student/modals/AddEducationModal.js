// src/components/profile/modals/AddEducationModal.jsx
import React, { useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function AddEducationModal({ onClose, onSaved }) {
  const [degree, setDegree] = useState("");
  const [institute, setInstitute] = useState("");
  const [year, setYear] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!degree.trim() || !institute.trim()) return alert("Complete fields");
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/users/education`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ degree, institute, year }),
      });
      if (!res.ok) throw new Error("Save failed");
      await res.json();
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Add Education</h3>
        <div className="space-y-3">
          <input
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="Degree (eg. MCA)"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            value={institute}
            onChange={(e) => setInstitute(e.target.value)}
            placeholder="Institute"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year (optional)"
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-2 rounded border">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
