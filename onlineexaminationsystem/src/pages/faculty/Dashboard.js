// Dashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavLink } from "react-router-dom";
import { io } from "socket.io-client";
import {
  CalendarIcon,
  ClockIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 12;

// API: Fetch all tests
async function fetchTestsFromApi({ email, signal }) {
  const params = new URLSearchParams();
  if (email) params.append("email", email);
  const url = `http://localhost:5000/api/tests?${params.toString()}`;
  const res = await fetch(url, { signal, credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text || ""}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.tests && Array.isArray(data.tests)) return data.tests;
  return [];
}

// API: Delete test
async function deleteTestFromApi(id) {
  const res = await fetch(`http://localhost:5000/api/tests/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to delete: ${res.status} ${txt}`);
  }
  return res.json();
}

// Format date (kept for fallback)
function humanDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function humanDateFromTimestamp(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function humanTimeFromTimestamp(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function safe(v, fallback = "—") {
  return v == null || v === "" ? fallback : v;
}

function titleCase(s) {
  if (!s) return s;
  return s
    .toString()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

const TAB_STYLES = {
  active: { btn: "bg-sky-100 text-sky-700", badge: "bg-sky-200 text-sky-800" },
  completed: { btn: "bg-green-100 text-green-700", badge: "bg-green-200 text-green-800" },
  all: { btn: "bg-indigo-100 text-indigo-700", badge: "bg-indigo-200 text-indigo-800" },
};

const ACTIVE_VARIANTS = new Set([
  "active", "ongoing", "in-progress", "started", "on-going", "on going",
  "upcoming", "scheduled", "pending", "not started", "not-started"
]);

const COMPLETED_VARIANTS = new Set(["completed", "done", "finished", "closed"]);
const IS_ONGOING_VARIANTS = new Set(["ongoing", "in-progress", "started", "on-going", "on going"]);

const normalize = (t) => {
  const raw = (t?.status ?? "").toString().trim();
  const status = raw.toLowerCase();
  const _id = t?._id || t?.id || "";
  return { ...t, status, rawStatus: raw, _id };
};

export default function Dashboard() {
  const storedEmail = localStorage.getItem("email");
  const userEmail = storedEmail ? String(storedEmail) : "";

  const [tab, setTab] = useState("active");
  const [allTasks, setAllTasks] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const socketRef = useRef(null);

  const loadAll = useCallback(
    async (signal) => {
      setLoading(true);
      setErrorMsg("");
      try {
        const data = await fetchTestsFromApi({ email: userEmail || undefined, signal });
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map(normalize);
        setAllTasks(normalized);
        setPage(0);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to load tests:", err);
          setErrorMsg(`Failed to load tests${err?.message ? `: ${err.message}` : ""}`);
          setAllTasks([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [userEmail]
  );

  useEffect(() => {
    const ctl = new AbortController();
    loadAll(ctl.signal);
    return () => ctl.abort();
  }, [loadAll]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const ctl = new AbortController();
      loadAll(ctl.signal);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [loadAll]);

  useEffect(() => {
    const serverUrl = "http://localhost:5000";
    try {
      const socket = io(serverUrl, {
        path: "/socket.io",
        transports: ["websocket"],
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on("testCreated", (payload) => {
        if (!payload) return;
        const t = normalize(payload);
        setAllTasks((prev) =>
          prev.find((x) => x._id === t._id)
            ? prev.map((x) => (x._id === t._id ? { ...x, ...t } : x))
            : [t, ...prev]
        );
      });

      socket.on("testUpdated", (payload) => {
        if (!payload) return;
        const t = normalize(payload);
        setAllTasks((prev) =>
          prev.map((x) => (x._id === t._id ? { ...x, ...t } : x))
        );
      });

      socket.on("testDeleted", (payload) => {
        const id = payload._id || payload.id || payload;
        setAllTasks((prev) => prev.filter((x) => x._id !== id));
      });

      socket.on("examStarted", (payload) => {
        const id = payload?.examId || payload?._id || payload?.id;
        if (!id) return;
        setAllTasks((prev) =>
          prev.map((x) =>
            x._id === id
              ? {
                ...x,
                status: "ongoing",
                rawStatus: "Ongoing",
                startDate: payload.startDate || x.startDate,
                startTime: payload.startTime || x.startTime,
                startTimestamp: payload.startTimestamp || x.startTimestamp || x.startTimestamp,
              }
              : x
          )
        );
      });

      socket.on("examEnded", (payload) => {
        const id = payload?.examId || payload?._id || payload?.id;
        if (!id) return;
        setAllTasks((prev) =>
          prev.map((x) =>
            x._id === id
              ? { ...x, status: "completed", rawStatus: "Completed" }
              : x
          )
        );
      });

      return () => {
        socket.off("testCreated");
        socket.off("testUpdated");
        socket.off("testDeleted");
        socket.off("examStarted");
        socket.off("examEnded");
        socket.close();
      };
    } catch (e) {
      console.warn("Socket init failed:", e);
    }
  }, [userEmail]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAllTasks((tasks) =>
        tasks.map((task) => {
          if (!IS_ONGOING_VARIANTS.has((task.status || "").toString().toLowerCase())) return task;

          const startTs = task.startTimestamp || task.startDate || null;
          const startDate = startTs ? new Date(startTs) : null;
          const duration = parseInt(task.duration) || 0;
          if (!startDate || duration === 0) return task;

          const startedAt = startDate.getTime();
          const endsAt = startedAt + duration * 60 * 1000;
          const now = Date.now();

          if (now >= endsAt) {
            return { ...task, status: "completed", rawStatus: "Completed" };
          }
          return task;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sortedTasksForCurrentTab = () => {
    const filtered = allTasks.filter((t) => {
      const s = (t.status || "").toString().toLowerCase();
      if (tab === "active") return ACTIVE_VARIANTS.has(s);
      if (tab === "completed") return COMPLETED_VARIANTS.has(s);
      return true;
    });

    const ongoing = filtered.filter((t) => IS_ONGOING_VARIANTS.has((t.status || "").toString().toLowerCase()));
    const others = filtered.filter((t) => !IS_ONGOING_VARIANTS.has((t.status || "").toString().toLowerCase()));
    return [...ongoing, ...others];
  };

  const totalPages = Math.max(1, Math.ceil(sortedTasksForCurrentTab().length / PAGE_SIZE));
  const pageTasks = sortedTasksForCurrentTab().slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const badgeCountActive = () =>
    allTasks.filter((t) => ACTIVE_VARIANTS.has((t.status || "").toString().toLowerCase())).length;
  const badgeCountCompleted = () =>
    allTasks.filter((t) => COMPLETED_VARIANTS.has((t.status || "").toString().toLowerCase())).length;

  const handleDelete = async (id) => {
    if (!id) return;
    const task = allTasks.find((x) => x._id === id);
    const status = (task?.status || "").toString().toLowerCase();
    if (IS_ONGOING_VARIANTS.has(status)) {
      alert("Cannot delete an ongoing test.");
      return;
    }
    if (COMPLETED_VARIANTS.has(status)) {
      alert("Cannot delete a completed test.");
      return;
    }
    if (!window.confirm("Delete this test? This action cannot be undone.")) return;

    const prev = allTasks;
    setAllTasks((t) => t.filter((x) => x._id !== id));
    try {
      await deleteTestFromApi(id);
    } catch (err) {
      console.error("Delete failed:", err);
      setAllTasks(prev);
      alert("Failed to delete. See console.");
    }
  };

  function tabButtonClass(key, active) {
    const base = "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all";
    const style = TAB_STYLES[key] || { btn: "bg-gray-100 text-gray-700" };
    return active ? `${base} ${style.btn}` : `${base} text-gray-600 hover:text-gray-800`;
  }

  function badgeClass(key, active) {
    const style = TAB_STYLES[key] || { badge: "bg-gray-200 text-gray-700" };
    return active
      ? `${style.badge} w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center`
      : "bg-gray-200 text-gray-700 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center";
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 flex flex-col">
        <header className="w-full bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Assessments</h1>
        </header>

        <section className="flex-1 p-6">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Tabs */}
            <nav className="flex items-center gap-1 px-6 pt-5 border-b">
              {[
                { key: "active", label: "Active" },
                { key: "completed", label: "Completed" },
                { key: "all", label: "All" },
              ].map(({ key, label }) => {
                const active = tab === key;
                const count = key === "active" ? badgeCountActive() : key === "completed" ? badgeCountCompleted() : null;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setTab(key);
                      setPage(0);
                    }}
                    className={tabButtonClass(key, active)}
                  >
                    {label}
                    {count !== null && (
                      <span className={badgeClass(key, active)}>{count}</span>
                    )}
                    {active && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-current" />}
                  </button>
                );
              })}
            </nav>

            {/* Loading / Error */}
            {loading && (
              <div className="flex justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-sky-600" viewBox="0 0 24 24">
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
                    const id = task._id;
                    const normalized = (task.status || "").toString().toLowerCase();
                    const isActive = ACTIVE_VARIANTS.has(normalized);
                    const isCompleted = COMPLETED_VARIANTS.has(normalized);
                    const isOngoing = IS_ONGOING_VARIANTS.has(normalized);

                    const ts = task.startTimestamp || task.startDate || null;
                    const formattedDate = humanDateFromTimestamp(ts) || (task.startDate ? humanDate(task.startDate) : "");
                    const formattedTime = humanTimeFromTimestamp(ts) || (task.startTime ? String(task.startTime) : "");
                    const hasDateOrTime = !!(formattedDate || formattedTime);

                    const startDateObj = ts ? new Date(ts) : task.startDate ? new Date(task.startDate) : null;
                    const durationMins = parseInt(task.duration) || 0;
                    let timeLeft = null;
                    let isLive = false;

                    if (isOngoing && startDateObj && durationMins > 0) {
                      const startedAt = startDateObj.getTime();
                      const endsAt = startedAt + durationMins * 60 * 1000;
                      const now = Date.now();
                      if (now >= startedAt && now < endsAt) {
                        isLive = true;
                        const diff = Math.max(0, endsAt - now);
                        const mins = Math.floor(diff / 60000);
                        const secs = Math.floor((diff % 60000) / 1000);
                        timeLeft = `${mins}m ${secs}s left`;
                      }
                    }

                    const borderClass = isOngoing
                      ? "border-sky-500 ring-2 ring-sky-300 ring-offset-2"
                      : isActive
                        ? "border-sky-300"
                        : isCompleted
                          ? "border-green-300"
                          : "border-gray-200";

                    const leftBarClass = isOngoing
                      ? "bg-sky-500 animate-pulse"
                      : isActive
                        ? "bg-sky-500"
                        : isCompleted
                          ? "bg-green-500"
                          : "bg-gray-400";

                    return (
                      <article
                        key={id}
                        className={`relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border ${borderClass} flex flex-col justify-between min-h-[260px] overflow-hidden group`}
                      >
                        {/* LIVE Badge */}
                        {isLive && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse z-10">
                            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                            LIVE
                          </div>
                        )}

                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${leftBarClass}`} />

                        <div className="p-5 pb-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate" title={safe(task.title)}>
                            {safe(task.title, "Untitled")}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{safe(task.institute)}</p>

                          {/* Date & Time - render ONLY if data contains startTimestamp/startDate/startTime */}
                          {hasDateOrTime && (
                            <div className="mt-3 space-y-1 text-sm text-gray-700">
                              {formattedDate && (
                                <div className="flex items-center gap-1.5">
                                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{formattedDate}</span>
                                </div>
                              )}

                              {formattedTime && (
                                <div className="flex items-center gap-1.5">
                                  <ClockIcon className="w-4 h-4 text-gray-400" />
                                  <span>
                                    {formattedTime}
                                    {durationMins > 0 && ` • ${durationMins} min`}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Live Timer */}
                          {isLive && timeLeft && (
                            <div className="mt-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md inline-block">
                              {timeLeft}
                            </div>
                          )}

                          {/* Status */}
                          <div className="mt-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${isOngoing
                                ? "bg-sky-100 text-sky-800"
                                : isCompleted
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-700"
                                }`}
                            >
                              {titleCase(task.rawStatus || task.status)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex border-t bg-gray-50">
                          {isCompleted ? (
                            // Completed: View Report (no delete)
                            <NavLink
                              to={`/viewReport/${id}`}
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-green-600 hover:bg-green-100 transition"
                            >
                              <DocumentTextIcon className="w-4 h-4" />
                              View Report
                            </NavLink>
                          ) : isOngoing ? (
                            // Ongoing: Edit locked (no delete)
                            <button
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-gray-400 cursor-not-allowed"
                              disabled
                              title="Editing locked during live exam"
                            >
                              <DocumentTextIcon className="w-4 h-4" />
                              Edit (locked)
                            </button>
                          ) : (
                            // Upcoming / Other: Edit Test - pass state so CreateTest pre-fills
                            <NavLink
                              to={`/createTest/${id}`}
                              state={{ task }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-sky-600 hover:bg-sky-100 transition"
                            >
                              <DocumentTextIcon className="w-4 h-4" />
                              Edit Test
                            </NavLink>
                          )}

                          {/* Delete button only for tests that are NOT ongoing and NOT completed */}
                          {!isOngoing && !isCompleted ? (
                            <button
                              onClick={() => handleDelete(id)}
                              className="flex items-center justify-center px-4 text-sm transition text-red-600 hover:bg-red-100"
                              title="Delete test"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          ) : (
                            // Keep spacing consistent when delete is not rendered
                            <div className="w-12" />
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {sortedTasksForCurrentTab().length > PAGE_SIZE && (
              <nav className="flex items-center justify-center gap-2 px-6 py-4 border-t">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Prev
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(0, page - 2) + i;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${pageNum === page
                        ? "bg-sky-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}

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
