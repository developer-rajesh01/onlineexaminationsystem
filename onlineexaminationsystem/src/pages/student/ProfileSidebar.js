// src/components/profile/ProfileSidebar.jsx
import React from "react";

export default function ProfileSidebar({ user, loading, onEdit }) {
  if (loading)
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
      </div>
    );

  const fullName =
    user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 text-center border-b">
        <div className="mx-auto h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-100">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="avatar"
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="text-indigo-600 font-semibold text-xl">
              {fullName ? fullName[0] : "U"}
            </div>
          )}
        </div>
        <h3 className="mt-4 font-semibold text-gray-800">
          {fullName || "User"}
        </h3>
        <p className="text-sm text-gray-500">{user?.email}</p>

        <button
          onClick={onEdit}
          className="mt-4 inline-block px-3 py-2 text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 rounded"
        >
          Edit Profile
        </button>
      </div>

      <div className="p-4 space-y-3 text-sm text-gray-700">
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Degree</span>
          <span>{user?.degree || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Department</span>
          <span>{user?.department || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Roll Number</span>
          <span>{user?.rollNumber || "-"}</span>
        </div>

        <hr className="my-2" />

        <div className="text-xs text-gray-500">Email Details</div>
        <div className="flex justify-between">
          <span className="text-gray-600">Professional</span>
          <span>{user?.email || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Personal</span>
          <span>{user?.personalEmail || "-"}</span>
        </div>

        <hr className="my-2" />

        <div className="text-xs text-gray-500">Phone Number Details</div>
        <div className="flex justify-between">
          <span className="text-gray-600">Primary</span>
          <span>{user?.phone || "-"}</span>
        </div>
      </div>
    </div>
  );
}
