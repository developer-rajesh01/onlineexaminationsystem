// src/pages/student/tabs/EducationTab.jsx
import React, { useState } from "react";

export default function EducationTab({ profile, onChange }) {
  const [items, setItems] = useState(profile?.education || []);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [form, setForm] = useState({ degree: "", institute: "", year: "" });

  function handleAdd() {
    setForm({ degree: "", institute: "", year: "" });
    setEditingIndex(-1);
    setOpen(true);
  }
  function handleEdit(i) {
    setEditingIndex(i);
    setForm(items[i]);
    setOpen(true);
  }
  async function save() {
    const newItems = [...items];
    if (editingIndex >= 0) newItems[editingIndex] = form;
    else newItems.push(form);
    setItems(newItems);
    setOpen(false);
    if (onChange) await onChange({ education: newItems });
  }
  async function remove(i) {
    // use window.confirm to avoid ESLint 'no-restricted-globals' error
    if (!window.confirm("Remove this education item?")) return;
    const newItems = items.filter((_, idx) => idx !== i);
    setItems(newItems);
    if (onChange) await onChange({ education: newItems });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Your educational qualifications
        </div>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-3 py-2 rounded text-sm"
        >
          + Add Education
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-gray-500 p-6 border rounded text-center">
            No education added yet
          </div>
        ) : (
          items.map((it, i) => (
            <div
              key={i}
              className="p-4 border rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{it.degree}</div>
                <div className="text-sm text-gray-600">{it.institute}</div>
                <div className="text-xs text-gray-400 mt-1">{it.year}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(i)}
                  className="text-indigo-600 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(i)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded w-full max-w-md">
            <h3 className="font-semibold mb-3">
              {editingIndex >= 0 ? "Edit" : "Add"} Education
            </h3>
            <div className="space-y-2">
              <input
                className="w-full border px-3 py-2 rounded"
                placeholder="Degree"
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
              />
              <input
                className="w-full border px-3 py-2 rounded"
                placeholder="Institute"
                value={form.institute}
                onChange={(e) =>
                  setForm({ ...form, institute: e.target.value })
                }
              />
              <input
                className="w-full border px-3 py-2 rounded"
                placeholder="Year"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-4 py-2 rounded bg-indigo-600 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
