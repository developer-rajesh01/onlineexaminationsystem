import React, { useEffect, useState } from "react";

/**
 * AssessmentSessions.jsx
 * Tailwind-based page replicating the FacePrep-style sessions/cards view.
 *
 * Expects backend endpoints:
 *  GET /api/assessments?status=active|completed|all&search=... -> { items: [...] }
 *  Each item should include:
 *   {
 *     id,
 *     title,
 *     institute,
 *     status, // "Active" | "Completed"
 *     startsAt, // ISO string
 *     badgeColor // optional (e.g., "#10B981") or you can derive based on status
 *   }
 *
 * Replace API_BASE with your backend base URL (or use env var).
 */

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
}

function StatusPill({ status }) {
  const color =
    status === "Active"
      ? "bg-green-50 text-green-700"
      : "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}

function Card({ item, onView }) {
  const stripeStyle = {
    background:
      item.badgeColor || (item.status === "Active" ? "#10B981" : "#0ea5a4"),
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
      {/* colored stripe */}
      <div style={{ height: 6, ...stripeStyle }} />

      <div className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="text-md font-semibold text-slate-800 truncate">
              {item.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {item.institute || "Unknown Institute"}
            </p>
          </div>
          <div className="text-right space-y-2">
            <StatusPill status={item.status} />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Starts at</div>
            <div className="text-sm font-medium">
              {formatDate(item.startsAt)}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <button
              onClick={() => onView(item)}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-sm hover:bg-slate-200"
            >
              View Report
            </button>
            <div className="text-xs text-gray-400">
              {item.attempts ? `${item.attempts} attempts` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentSessions() {
  const [tab, setTab] = useState("Active"); // Active | Completed | All
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(6);
  const [page, setPage] = useState(1);

  const fetchList = async (status = tab, q = search) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status && status !== "All") qs.set("status", status.toLowerCase());
      if (q) qs.set("search", q);
      qs.set("limit", 1000); // fetch up to - pagination handled client-side here

      const token = localStorage.getItem("token"); // include auth if needed
      const res = await fetch(`${API_BASE}/api/assessments?${qs.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      // expect json.items = array
      setItems(json.items || []);
    } catch (err) {
      console.error("load error", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch whenever tab or search changes
    fetchList(tab, search);
    setPage(1);
  }, [tab, search]);

  // client pagination
  const start = (page - 1) * perPage;
  const paged = items.slice(start, start + perPage);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  const onView = (item) => {
    // navigate to report or open modal
    // example:
    window.location.href = `/reports/${item.id}`; // change to React router navigate if using
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Assessments</h1>

        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={6}>Show 6</option>
            <option value={9}>Show 9</option>
            <option value={12}>Show 12</option>
          </select>
        </div>
      </div>

      {/* tabs */}
      <div className="mb-6 border-b pb-3">
        <nav className="flex gap-4">
          {["Active", "Completed", "All"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md font-medium ${
                tab === t
                  ? "text-indigo-700 border-b-2 border-indigo-600"
                  : "text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* skeleton cards */}
          {Array.from({ length: perPage }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white rounded-lg h-44 shadow-sm"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500">
          No assessments available.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paged.map((it) => (
              <Card key={it.id} item={it} onView={onView} />
            ))}
          </div>

          {/* pager */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {start + 1}-{Math.min(start + perPage, items.length)} of{" "}
              {items.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-sm">
                Page {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
