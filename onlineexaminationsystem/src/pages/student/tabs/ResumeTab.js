// src/components/profile/ResumeTab.jsx
import React, { useRef, useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ResumeTab({ profile, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("resume", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/users/uploadResume`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      await res.json();
      onUpdated();
      alert("Resume uploaded");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <h3 className="text-lg font-medium">Resume</h3>
      <div className="mt-4 bg-gray-50 border rounded p-8 text-center">
        {profile?.resumeUrl ? (
          <div>
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-indigo-600 hover:underline"
            >
              View uploaded resume
            </a>
            <div className="mt-3 text-sm text-gray-600">Replace resume</div>
          </div>
        ) : (
          <div className="text-gray-500">No resume uploaded yet</div>
        )}

        <div className="mt-4">
          <input
            type="file"
            ref={fileRef}
            onChange={handleUpload}
            accept=".pdf,.doc,.docx"
            className="hidden"
            id="resumeInput"
          />
          <label
            htmlFor="resumeInput"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded cursor-pointer"
          >
            Upload Resume
          </label>
        </div>
        {uploading && (
          <div className="mt-2 text-sm text-gray-600">Uploading...</div>
        )}
      </div>
    </>
  );
}
