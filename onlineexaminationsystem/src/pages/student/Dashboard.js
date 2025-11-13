import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 12;

// fetch that supports course+institute
async function fetchTestsFromApi({ email, course, institute, signal }) {
  const params = new URLSearchParams();
  if (email) params.append("email", email);
  if (course) params.append("course", course);
  if (institute) params.append("institute", institute);

  const url = `http://localhost:5000/api/tests?${params.toString()}`;
  console.log("[API] GET", url);

  const res = await fetch(url, { signal, credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text || ""}`);
  }
  const data = await res.json();

  if (Array.isArray(data)) {
    return data;
  }
  if (data?.tests && Array.isArray(data.tests)) return data.tests;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.test && Array.isArray(data.test)) return data.test;
  return [];
}

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

function humanTime(timeStr) {
  if (!timeStr) return "";
  try {
    const [h, m] = String(timeStr).split(":");
    if (isNaN(Number(h))) return timeStr;
    return `${h}:${m}`;
  } catch {
    return timeStr;
  }
}

function safe(v, fallback = "—") {
  return v == null || v === "" ? fallback : v;
}

const TAB_STYLES = {
  active: { btn: "bg-sky-100 text-sky-700", badge: "bg-sky-200 text-sky-800" },
  completed: { btn: "bg-green-100 text-green-700", badge: "bg-green-200 text-green-800" },
  all: { btn: "bg-indigo-100 text-indigo-700", badge: "bg-indigo-200 text-indigo-800" },
};

const ACTIVE_VARIANTS = new Set([
  "active",
  "ongoing",
  "in-progress",
  "started",
  "on-going",
  "on going",
  "upcoming",
  "scheduled",
  "pending",
  "not started",
  "not-started",
]);
const COMPLETED_VARIANTS = new Set(["completed", "done", "finished", "closed"]);
const IS_ONGOING_VARIANTS = new Set(["ongoing", "in-progress", "started", "on-going", "on going"]);

function deriveDateAndTimeFromIso(iso) {
  if (!iso) return { startDate: undefined, startTime: undefined };
  try {
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return { startDate: undefined, startTime: undefined };
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const min = pad(dt.getMinutes());
    return { startDate: `${yyyy}-${mm}-${dd}`, startTime: `${hh}:${min}` };
  } catch {
    return { startDate: undefined, startTime: undefined };
  }
}

const normalize = (t) => {
  const raw = (t?.liveStatus ?? t?.status ?? "").toString().trim();
  const status = raw.toLowerCase();
  const _id = t?._id || t?.id || "";
  const courseName = t.courseName || t.targetAudience || "";
  const institute = t.institute || t.instituteName || "";
  let startDate = t.startDate;
  let startTime = t.startTime;
  if ((!startDate || !startTime) && t.startTimestamp) {
    const d = deriveDateAndTimeFromIso(t.startTimestamp);
    if (!startDate) startDate = d.startDate;
    if (!startTime) startTime = d.startTime;
  }
  return { ...t, _id, status, rawStatus: raw, courseName, institute, startDate, startTime };
};

function parseTaskTimes(task) {
  let startMs = task.startTimestamp ? new Date(task.startTimestamp).getTime() : NaN;
  let endMs = task.endTimestamp ? new Date(task.endTimestamp).getTime() : NaN;

  if (isNaN(startMs) && task.startDate && task.startTime) {
    const isoLocal = `${task.startDate}T${task.startTime}:00`;
    const p = new Date(isoLocal).getTime();
    startMs = isNaN(p) ? NaN : p;
  }

  if (isNaN(endMs) && !isNaN(startMs) && typeof task.duration === "number") {
    endMs = startMs + task.duration * 60000;
  }

  return { startMs, endMs };
}

function formatCountdownMs(ms) {
  if (!isFinite(ms) || ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function computeStatusFromTimes(startMs, endMs, nowMs = Date.now()) {
  if (!isFinite(startMs) || !isFinite(endMs)) {
    if (isFinite(startMs)) {
      if (nowMs < startMs) return "upcoming";
      return "ongoing";
    }
    return "upcoming";
  }
  if (nowMs < startMs) return "upcoming";
  if (nowMs >= startMs && nowMs < endMs) return "ongoing";
  return "completed";
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const studentCourseName = localStorage.getItem("branch") || "";
  const studentInstituteName = localStorage.getItem("institute") || "";

  const [tab, setTab] = useState("active");
  const [allTasks, setAllTasks] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const socketRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // per-test disabled map e.g. { "testId1": true, "testId2": true }
  const [disabledTests, setDisabledTests] = useState(() => {
    try {
      const raw = localStorage.getItem("disabledTests");
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  });

  // tick for countdowns & auto-status updates
  const [, setTick] = useState(0);

  const persistDisabledTests = (obj) => {
    try {
      localStorage.setItem("disabledTests", JSON.stringify(obj || {}));
    } catch (e) {
      console.warn("Could not persist disabledTests", e);
    }
  };

  const loadAll = useCallback(
    async (signal) => {
      setLoading(true);
      setErrorMsg("");
      try {
        const data = await fetchTestsFromApi({
          course: studentCourseName || undefined,
          institute: studentInstituteName || undefined,
          signal,
        });
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map(normalize);
        setAllTasks((prev) => {
          const map = new Map();
          normalized.forEach((n) => map.set(n._id, n));
          prev.forEach((p) => {
            if (!map.has(p._id)) map.set(p._id, p);
          });
          return Array.from(map.values());
        });
        setPage(0);
      } catch (err) {
        if (err.name !== "AbortError") {
          setErrorMsg(`Failed to load tests${err?.message ? `: ${err.message}` : ""}`);
          setAllTasks([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [studentCourseName, studentInstituteName]
  );

  useEffect(() => {
    const ctl = new AbortController();
    loadAll(ctl.signal);
    return () => ctl.abort();
  }, [loadAll]);

  // periodic refresh every 60s
  useEffect(() => {
    const id = setInterval(() => {
      const ctl = new AbortController();
      loadAll(ctl.signal);
    }, 60000);
    return () => clearInterval(id);
  }, [loadAll]);

  // tick every second: update countdowns & auto-status
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);

      setAllTasks((prev) => {
        let changed = false;
        const now = Date.now();
        const updated = prev.map((task) => {
          const { startMs, endMs } = parseTaskTimes(task);
          const computed = computeStatusFromTimes(startMs, endMs, now);
          if (computed !== (task.status || "").toLowerCase()) {
            changed = true;
            return { ...task, status: computed };
          }
          return task;
        });
        if (changed) {
          updated.sort((a, b) => {
            const aO = IS_ONGOING_VARIANTS.has((a.status || "").toLowerCase()) ? 0 : 1;
            const bO = IS_ONGOING_VARIANTS.has((b.status || "").toLowerCase()) ? 0 : 1;
            if (aO !== bO) return aO - bO;
            const aStart = parseTaskTimes(a).startMs || 0;
            const bStart = parseTaskTimes(b).startMs || 0;
            return aStart - bStart;
          });
          return updated;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // socket connect & events
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

      const course = localStorage.getItem("branch");
      if (course) socket.emit("joinAudience", course);

      socket.on("testCreated", (payload) => {
        if (!payload) return;
        const t = normalize(payload);
        setAllTasks((prev) => {
          const exists = prev.find((x) => x._id === t._id);
          const next = exists ? prev.map((x) => (x._id === t._id ? { ...x, ...t } : x)) : [t, ...prev];
          next.sort((a, b) => {
            const aO = IS_ONGOING_VARIANTS.has((a.status || "").toLowerCase()) ? 0 : 1;
            const bO = IS_ONGOING_VARIANTS.has((b.status || "").toLowerCase()) ? 0 : 1;
            if (aO !== bO) return aO - bO;
            const aStart = parseTaskTimes(a).startMs || 0;
            const bStart = parseTaskTimes(b).startMs || 0;
            return aStart - bStart;
          });
          return next;
        });
      });

      socket.on("testUpdated", (payload) => {
        if (!payload) return;
        const t = normalize(payload);
        setAllTasks((prev) => {
          const next = prev.map((x) => (x._id === t._id ? { ...x, ...t } : x));
          next.sort((a, b) => {
            const aO = IS_ONGOING_VARIANTS.has((a.status || "").toLowerCase()) ? 0 : 1;
            const bO = IS_ONGOING_VARIANTS.has((b.status || "").toString().toLowerCase()) ? 0 : 1;
            if (aO !== bO) return aO - bO;
            const aStart = parseTaskTimes(a).startMs || 0;
            const bStart = parseTaskTimes(b).startMs || 0;
            return aStart - bStart;
          });
          return next;
        });
      });

      socket.on("testDeleted", (payload) => {
        const id = payload._id || payload.id || payload;
        setAllTasks((prev) => prev.filter((x) => x._id !== id));
      });

      return () => {
        try {
          socket.close();
        } catch (e) {
          /* ignore */
        }
      };
    } catch (e) {
      /* ignore */
    }
  }, []);

  function matchesStudentTest(test) {
    if (!test.institute || !test.courseName) return false;
    const instituteMatch = String(test.institute).toLowerCase() === studentInstituteName.toLowerCase();
    const audiences = String(test.courseName)
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);
    const courseMatch = audiences.includes(studentCourseName.toLowerCase());
    return instituteMatch && courseMatch;
  }

  // MODIFIED: Start button only enabled when test has started (now >= startMs)
  function startButtonState(task) {
    const { startMs, endMs } = parseTaskTimes(task);
    const now = Date.now();

    if (!isFinite(startMs)) {
      return { enabled: false, label: "Start Test", remainingMs: NaN, isOngoing: false };
    }

    // Test has started: now >= startMs
    if (now >= startMs) {
      const remaining = isFinite(endMs) ? Math.max(0, endMs - now) : 0;
      return {
        enabled: true,
        label: `Start Test · ${formatCountdownMs(remaining)}`,
        remainingMs: remaining,
        isOngoing: true,
      };
    }

    // Test has not started yet
    const msUntilStart = startMs - now;
    return {
      enabled: false,
      label: `Starts in ${formatCountdownMs(msUntilStart)}`,
      remainingMs: msUntilStart,
      isOngoing: false,
    };
  }

  const sortedTasksForCurrentTab = () => {
    const filtered = allTasks
      .filter((t) => matchesStudentTest(t))
      .filter((t) => {
        const s = (t.status || "").toString().toLowerCase();
        if (tab === "active") return ACTIVE_VARIANTS.has(s);
        if (tab === "completed") return COMPLETED_VARIANTS.has(s);
        return true;
      });

    const ongoing = filtered.filter((t) => IS_ONGOING_VARIANTS.has((t.status || "").toLowerCase()));
    const others = filtered.filter((t) => !IS_ONGOING_VARIANTS.has((t.status || "").toLowerCase()));

    ongoing.sort((a, b) => (parseTaskTimes(a).startMs || 0) - (parseTaskTimes(b).startMs || 0));
    others.sort((a, b) => (parseTaskTimes(a).startMs || 0) - (parseTaskTimes(b).startMs || 0));

    return [...ongoing, ...others];
  };

  const totalPages = Math.max(1, Math.ceil(sortedTasksForCurrentTab().length / PAGE_SIZE));
  const pageTasks = sortedTasksForCurrentTab().slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const badgeCountActive = () =>
    allTasks.filter((t) => matchesStudentTest(t) && ACTIVE_VARIANTS.has((t.status || "").toLowerCase())).length;
  const badgeCountCompleted = () =>
    allTasks.filter((t) => matchesStudentTest(t) && COMPLETED_VARIANTS.has((t.status || "").toLowerCase())).length;

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

  // helper to check if a test is disabled
  const isTestDisabled = (id) => !!(disabledTests && disabledTests[id]);

  // When user clicks Start: set session attempt state, try request fullscreen, hide header, then navigate
  const handleStartClick = async (id) => {
    // Per-test disable
    if (isTestDisabled(id)) {
      alert("Starting this test has been disabled for your account due to repeated fullscreen exits for this test.");
      return;
    }

    // initialize attempt state in sessionStorage
    const attempt = { id, exitCount: 0, startedAt: Date.now() };
    try {
      sessionStorage.setItem("currentTestAttempt", JSON.stringify(attempt));
    } catch (e) {
      console.warn("Could not write sessionStorage", e);
    }

    // hide header immediately
    setIsFullscreen(true);

    // request fullscreen (best-effort)
    let enteredFs = false;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        const p = document.documentElement.requestFullscreen();
        await Promise.race([p || Promise.resolve(), new Promise((res) => setTimeout(res, 300))]);
        enteredFs = !!document.fullscreenElement;
      }
    } catch (err) {
      console.warn("Fullscreen request failed or blocked:", err);
      enteredFs = false;
    }

    if (!enteredFs) {
      alert(
        "Your browser blocked automatic fullscreen. When the test page opens, click the 'Enter Fullscreen' button there. " +
        "Exiting fullscreen during the test will show warnings and after 3 exits the test will be closed and that test will be disabled."
      );
    }

    navigate(`/startTest/${id}`, { state: { hideHeader: true } });
  };

  // handle fullscreenchange globally
  useEffect(() => {
    function onFullscreenChange() {
      const fsElement = document.fullscreenElement;
      setIsFullscreen(!!fsElement);

      try {
        const raw = sessionStorage.getItem("currentTestAttempt");
        if (!raw) return;
        const attempt = JSON.parse(raw);
        if (!attempt || !attempt.id) return;

        if (!fsElement) {
          attempt.exitCount = (attempt.exitCount || 0) + 1;
          sessionStorage.setItem("currentTestAttempt", JSON.stringify(attempt));

          if (attempt.exitCount >= 3) {
            setDisabledTests((prev) => {
              const next = { ...(prev || {}), [attempt.id]: true };
              persistDisabledTests(next);
              return next;
            });

            sessionStorage.removeItem("currentTestAttempt");
            setIsFullscreen(false);
            alert("You have exited fullscreen 3 times. This test has been closed and it has been disabled for your account.");
            navigate("/");
          } else {
            alert(`You exited fullscreen. Attempt ${attempt.exitCount} of 3. Do not exit fullscreen during the test.`);
            try {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => { });
              }
            } catch (e) {
              /* ignore */
            }
          }
        }
      } catch (e) {
        console.warn("Error handling fullscreenchange:", e);
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [navigate]);

  // sync disabledTests if localStorage changes in other tabs/windows
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== "disabledTests") return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : {};
        setDisabledTests(parsed || {});
      } catch {
        // ignore parse error
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // periodic poll to pick up external changes
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const raw = localStorage.getItem("disabledTests");
        const parsed = raw ? JSON.parse(raw) : {};
        const a = JSON.stringify(parsed || {});
        const b = JSON.stringify(disabledTests || {});
        if (a !== b) setDisabledTests(parsed || {});
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(id);
  }, [disabledTests]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 flex flex-col">
        {!isFullscreen && (
          <header className="w-full bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800">Assessments</h1>
          </header>
        )}
        <section className="flex-1 p-6">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
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
                    {count !== null && <span className={badgeClass(key, active)}>{count}</span>}
                    {active && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-current" />}
                  </button>
                );
              })}
            </nav>

            {loading && (
              <div className="flex justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-sky-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            )}
            {errorMsg && <div className="px-6 py-4 text-red-600">{errorMsg}</div>}

            <div className="p-6">
              {pageTasks.length === 0 && !loading ? (
                <div className="text-center py-20 text-gray-400">
                  <DocumentTextIcon className="mx-auto h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg">No tests available for your course and institute.</p>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pageTasks.map((task) => {
                    const id = task._id;
                    const normalized = (task.status || "").toString().toLowerCase();
                    const isCompleted = COMPLETED_VARIANTS.has(normalized);
                    const isOngoing = IS_ONGOING_VARIANTS.has(normalized);

                    const formattedDate = humanDate(task.startDate);
                    const formattedTime = humanTime(task.startTime);

                    const cardTopBorder = isCompleted
                      ? { borderTop: "4px solid #31CD63" }
                      : isOngoing
                        ? { borderTop: "4px solid #2563eb" }
                        : {};

                    const btnState = startButtonState(task);
                    const disabledForThisTest = isTestDisabled(id);
                    const enabledGlobally = btnState.enabled && !disabledForThisTest;

                    const btnClass = enabledGlobally
                      ? "flex-1 flex items-center justify-center gap-2 py-3 text-base font-medium text-white bg-sky-600 hover:bg-sky-700"
                      : "flex-1 flex items-center justify-center gap-2 py-3 text-base font-medium text-gray-400 bg-gray-200 cursor-not-allowed";

                    const { startMs, endMs } = parseTaskTimes(task);
                    const now = Date.now();
                    const remainingForLive = isFinite(endMs) ? Math.max(0, endMs - now) : null;

                    return (
                      <article
                        key={id}
                        className="relative bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between overflow-hidden group"
                        style={cardTopBorder}
                      >
                        {isOngoing && (
                          <div className="absolute top-3 right-3 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold z-10">
                            Live
                          </div>
                        )}

                        <div className="p-5 pb-2 flex flex-col min-h-[140px] justify-between">
                          <h3
                            className="text-lg font-semibold text-gray-900 truncate mb-0.5"
                            title={safe(task.title, "Untitled")}
                          >
                            {safe(task.title, "Untitled")}
                          </h3>
                          <div className="text-sm text-gray-500">{safe(task.institute)}</div>
                          <div className="text-sm text-gray-500">{safe(task.courseName || task.targetAudience)}</div>

                          {isCompleted ? (
                            <div className="mt-3 text-green-600 text-base font-semibold">Completed</div>
                          ) : isOngoing ? (
                            <div className="mt-3 text-blue-600 text-base font-semibold">Ongoing</div>
                          ) : (
                            <div className="mt-3 text-sky-600 text-base font-semibold">Upcoming</div>
                          )}

                          <div className="mt-1 text-sm font-bold text-gray-900">
                            Starts at:
                            <span className="font-normal ml-1 text-gray-700">
                              {formattedDate}
                              {formattedTime ? ` ${formattedTime}` : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex border-t bg-gray-100">
                          {isCompleted ? (
                            <NavLink
                              to={`/viewReport/${id}`}
                              className="flex-1 flex items-center justify-center py-3 text-base font-medium text-sky-600"
                              style={{
                                background: "#EFF6FF",
                                color: "#2C6CD6",
                                borderBottomLeftRadius: "1rem",
                                borderBottomRightRadius: "1rem",
                              }}
                            >
                              View Report
                            </NavLink>
                          ) : (
                            <button
                              className={btnClass}
                              onClick={() => {
                                if (!enabledGlobally) {
                                  if (disabledForThisTest) {
                                    alert("Starting this test is disabled for your account due to repeated fullscreen exits for this test.");
                                  }
                                  return;
                                }
                                handleStartClick(id);
                              }}
                              disabled={!enabledGlobally}
                              style={{
                                borderBottomLeftRadius: "1rem",
                                borderBottomRightRadius: "1rem",
                              }}
                            >
                              <span>{enabledGlobally ? "Start Test" : btnState.label}</span>

                              {isOngoing && remainingForLive !== null && remainingForLive > 0 && (
                                <span className="ml-2 text-sm opacity-90">{formatCountdownMs(remainingForLive)}</span>
                              )}

                              {!isOngoing && !btnState.enabled && btnState.remainingMs > 0 && (
                                <span className="ml-2 text-sm opacity-90">{formatCountdownMs(btnState.remainingMs)}</span>
                              )}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

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
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${pageNum === page ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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