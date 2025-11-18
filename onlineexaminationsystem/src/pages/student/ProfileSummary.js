// src/pages/Profile/ProfileSummary.jsx
import React, { useState } from "react";
import { uploadFile } from "../../api/profileApi";

export default function ProfileSummary({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(profile || {});
  const token = localStorage.getItem("token");
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => setLocal(profile || {}), [profile]);

  const save = async () => {
    try {
      await onUpdate(local);
      setEditing(false);
      alert("Profile updated");
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleAvatar = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const res = await uploadFile(f, "avatars", token);
      // adapt to your uploads response (res.data.url or res.url)
      const url = res.data?.url || res.url || res.data?.filename || null;
      if (url) {
        setLocal((s) => ({ ...s, avatarUrl: url }));
        await onUpdate({ avatarUrl: url });
      }
    } catch (err) {
      console.error("Avatar upload:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
          {local?.avatarUrl ? (
            <img
              src={local.avatarUrl}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-xl font-bold text-indigo-600">
              {local?.name ? local.name[0].toUpperCase() : "U"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold">{local?.name || "—"}</div>
          <div className="text-sm text-gray-600">
            {local?.institute || local?.email}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {!editing ? (
          <>
            <dl className="text-sm text-gray-700 space-y-2">
              <div>
                <dt className="text-xs text-gray-500">Degree</dt>
                <dd>{local?.degree || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Department</dt>
                <dd>{local?.department || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Roll Number</dt>
                <dd>{local?.rollNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Email (professional)</dt>
                <dd>{local?.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Phone</dt>
                <dd>{local?.phonePrimary || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">DOB / Gender</dt>
                <dd>
                  {local?.dob || "—"} • {local?.gender || "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2">
              <label className="bg-gray-100 px-3 py-2 rounded cursor-pointer text-sm">
                {uploading ? "Uploading..." : "Upload Avatar"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatar}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setEditing(true)}
                className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded text-sm"
              >
                Edit Profile
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <input
                value={local?.name || ""}
                onChange={(e) => setLocal({ ...local, name: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                placeholder="Full name"
              />
              <input
                value={local?.degree || ""}
                onChange={(e) => setLocal({ ...local, degree: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                placeholder="Degree"
              />
              <input
                value={local?.department || ""}
                onChange={(e) =>
                  setLocal({ ...local, department: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
                placeholder="Department"
              />
              <input
                value={local?.rollNumber || ""}
                onChange={(e) =>
                  setLocal({ ...local, rollNumber: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
                placeholder="Roll number"
              />
              <input
                value={local?.phonePrimary || ""}
                onChange={(e) =>
                  setLocal({ ...local, phonePrimary: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
                placeholder="Phone"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={save}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setLocal(profile);
                }}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
