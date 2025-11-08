import React, { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarIcon,
  ClockIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

/**
 * @typedef {Object} Test
 * @property {string} [title]
 * @property {string} [institute]
 * @property {string} [startDate]
 * @property {string} [startTime]
 * @property {string} [status]
 * @property {string} [_id]
 * @property {string} [id]
 */

const PAGE_SIZE = 12;

/* ------------------------------------------------------------------ */
/*  API helpers                                                       */
/* ------------------------------------------------------------------ */
async function fetchTestsFromApi({ status, email, signal }) {
  const params = new URLSearchParams();
  if (email) params.append("email", email);
  if (status) params.append("status", status);
  const url = `http://localhost:5000/api/tests?${params.toString()}`;
  const res = await fetch(url, { signal, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.tests && Array.isArray(data.tests)) return data.tests;
  return [];
}

async function deleteTestFromApi(id) {
  const res = await fetch(`http://localhost:5000/api/tests/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  UI helpers                                                        */
/* ------------------------------------------------------------------ */
function humanDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function humanDateTime(dateStr, timeStr) {
  if (!dateStr && !timeStr) return "-";
  if (!dateStr) return timeStr || "-";
  try {
    const combined = timeStr ? `${dateStr}T${timeStr}` : dateStr;
    return new Date(combined).toLocaleString();
  } catch {
    return `${dateStr} ${timeStr || ""}`.trim();
  }
}

function safe(v, fallback = "-") {
  return v == null || v === "" ? fallback : v;
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                    */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const userEmail = localStorage.getItem("email") || "";

  /** @type {"upcoming" | "completed" | "all"} */
  const [tab, setTab] = useState("upcoming");

  /** @type {Test[]} */
  const [tasks, setTasks] = useState([]);

  /** @type {Test[]} */
  const [allTasks, setAllTasks] = useState([]);

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ---------- Load all tasks for badge counts ---------- */
  useEffect(() => {
    const ctl = new AbortController();
    if (userEmail) {
      fetchTestsFromApi({ email: userEmail, signal: ctl.signal })
        .then((data) => setAllTasks(Array.isArray(data) ? data : []))
        .catch(() => setAllTasks([]));
    }
    return () => ctl.abort();
  }, [userEmail]);

  /* ---------- Load tasks for current tab ---------- */
  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setErrorMsg("");
      try {
        const status =
          tab === "upcoming"
            ? "Active"
            : tab === "completed"
              ? "Completed"
              : null;
        const data = await fetchTestsFromApi({
          status,
          email: userEmail,
          signal,
        });
        setTasks(Array.isArray(data) ? data : []);
        setPage(0);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch tests failed:", err);
          setErrorMsg("Failed to load tests");
          setTasks([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [tab, userEmail]
  );

  useEffect(() => {
    const ctl = new AbortController();
    if (userEmail) load(ctl.signal);
    else {
      setTasks([]);
      setErrorMsg("Not logged in (email missing).");
    }
    return () => ctl.abort();
  }, [load, userEmail]);

  /* ---------- Delete handler ---------- */
  const handleDelete = async (id) => {
    if (!id || !window.confirm("Delete this test? This cannot be undone.")) return;
    const prev = tasks;
    setTasks((t) => t.filter((x) => (x._id || x.id) !== id));
    try {
      await deleteTestFromApi(id);
      setAllTasks((t) => t.filter((x) => (x._id || x.id) !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      setTasks(prev);
      alert("Delete failed (see console).");
    }
  };

  /* ---------- Filter & pagination ---------- */
  const filtered = tasks.filter((t) => {
    const s = (t.status || "").toLowerCase();
    if (tab === "upcoming") return s === "active";
    if (tab === "completed") return s === "completed";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageTasks = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* ---------- Badge count helper ---------- */
  const badge = (status) =>
    allTasks.filter((t) => (t.status || "").toLowerCase() === status).length;

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="w-full bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Assessments</h1>
        </header>

        {/* Body */}
        <section className="flex-1 p-6">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Tabs */}
            <nav className="flex items-center gap-1 px-6 pt-5 border-b">
              {[
                { key: "upcoming", label: "Active", color: "sky", status: "active" },
                { key: "completed", label: "Completed", color: "green", status: "completed" },
                { key: "all", label: "All", color: "indigo", status: null },
              ].map(({ key, label, color, status }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${tab === key
                      ? `bg-${color}-100 text-${color}-700`
                      : "text-gray-600 hover:text-gray-800"
                    }`}
                  aria-current={tab === key ? "page" : undefined}
                >
                  {label}
                  {status && (
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                        ${tab === key ? `bg-${color}-200 text-${color}-800` : "bg-gray-200 text-gray-700"}`}
                    >
                      {badge(status)}
                    </span>
                  )}
                  {tab === key && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-current" />
                  )}
                </button>
              ))}
            </nav>

            {/* Loading / Error */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <svg
                  className="animate-spin h-8 w-8 text-sky-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            )}

            {errorMsg && <div className="px-6 py-4 text-red-600">{errorMsg}</div>}

            {/* Cards */}
            <div className="p-6">
              {pageTasks.length === 0 && !loading ? (
                <div className="text-center py-20 text-gray-400">
                  <DocumentTextIcon className="mx-auto h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg">No tests to display.</p>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pageTasks.map((task) => {
                    const id = task._id || task.id || "";
                    const status = (task.status || "").toLowerCase();
                    const isActive = status === "active";
                    const isCompleted = status === "completed";

                    return (
                      <article
                        key={id}
                        className={`relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border
    ${isActive ? "border-sky-300" : isCompleted ? "border-green-300" : "border-gray-200"}
    flex flex-col justify-between min-h-[240px] overflow-hidden group`}
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5
      ${isActive ? "bg-sky-500" : isCompleted ? "bg-green-500" : "bg-gray-400"}`}
                        />

                        <div className="p-5 pb-3">
                          <h3
                            className="text-lg font-semibold text-gray-900 truncate"
                            title={safe(task.title, "Untitled")}
                          >
                            {safe(task.title, "Untitled")}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{safe(task.institute, "—")}</p>

                          <div className="mt-4 space-y-1 text-sm">
                            <div className="flex items-center text-gray-700">
                              <CalendarIcon className="w-4 h-4 mr-1.5" />
                              <span>{humanDate(task.startDate)}</span>
                            </div>
                            {task.startTime && (
                              <div className="flex items-center text-gray-700">
                                <ClockIcon className="w-4 h-4 mr-1.5" />
                                <span>{task.startTime}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
        ${isActive
                                  ? "bg-sky-100 text-sky-800"
                                  : isCompleted
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {task.status || "Unknown"}
                            </span>
                          </div>
                        </div>

                        <div className="flex border-t bg-gray-50">
                          {isActive ? (
                            <NavLink
                              to={`/createTest/${id}`}
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-sky-600 hover:bg-sky-100 transition"
                            >
                              <DocumentTextIcon className="w-4 h-4" />
                              Edit Test
                            </NavLink>
                          ) : isCompleted ? (
                            <NavLink
                              to={`/report/${id}`}  // Adjust to your report link
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-green-600 hover:bg-green-100 transition"
                            >
                              <DocumentTextIcon className="w-4 h-4" />
                              View Report
                            </NavLink>
                          ) : null}

                          {isActive && (
                            <button
                              onClick={() => handleDelete(id)}
                              className="flex items-center justify-center px-4 text-red-600 hover:bg-red-100 transition"
                              aria-label="Delete test"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </article>

                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <nav className="flex items-center justify-center gap-2 px-6 py-4 border-t" aria-label="Pagination">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Prev
                </button>

                {(() => {
                  const pages = [];
                  const start = Math.max(0, page - 2);
                  const end = Math.min(totalPages, start + 5);
                  for (let i = start; i < end; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition
                          ${i === page ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                      >
                        {i + 1}
                      </button>
                    );
                  }
                  return pages;
                })()}

                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                  disabled={page + 1 === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </nav>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}