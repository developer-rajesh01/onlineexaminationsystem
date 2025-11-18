// src/components/profile/LinksTab.jsx
import React, { useState } from "react";
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function LinksTab({ profile, onUpdated }) {
  const [links, setLinks] = useState(profile?.links || []);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  async function addLink() {
    if (!url) return alert("Enter URL");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/users/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, label }),
      });
      if (!res.ok) throw new Error("Add failed");
      await res.json();
      setUrl("");
      setLabel("");
      onUpdated();
    } catch (err) {
      console.error(err);
      alert("Add failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (eg. GitHub)"
          className="border px-3 py-2 rounded"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL"
          className="border px-3 py-2 rounded col-span-2"
        />
        <div className="md:col-span-3 text-right">
          <button
            onClick={addLink}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
          >
            Add Link
          </button>
        </div>
      </div>

      <div>
        {links.length === 0 ? (
          <div className="p-6 text-gray-500 bg-gray-50 rounded">
            No links added yet.
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((l) => (
              <div
                key={l._id || l.url}
                className="flex justify-between items-center p-3 border rounded"
              >
                <div>
                  <div className="font-medium">{l.label || l.url}</div>
                  <a
                    className="text-sm text-indigo-600"
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
