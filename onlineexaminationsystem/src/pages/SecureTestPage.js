import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Menu, AlertCircle, Clock, LogOut, CheckCircle, Circle } from "lucide-react";

const SESSION_KEY = "currentTestAttempt";
const START_DISABLED_KEY = "startDisabled";

function pad(n) {
    return String(n).padStart(2, "0");
}

function formatCountdownMs(ms) {
    if (!isFinite(ms) || ms <= 0) return "00:00";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function parseTestTimes(t) {
    let startMs = NaN;
    let endMs = NaN;

    if (t?.startTimestamp) {
        const s = new Date(t.startTimestamp).getTime();
        if (!Number.isNaN(s)) startMs = s;
    }

    if (t?.endTimestamp) {
        const e = new Date(t.endTimestamp).getTime();
        if (!Number.isNaN(e)) endMs = e;
    }

    if (!isFinite(startMs) && t?.startDate && t?.startTime) {
        const isoLocal = `${t.startDate}T${t.startTime}:00`;
        const s = new Date(isoLocal).getTime();
        if (!Number.isNaN(s)) startMs = s;
    }

    if (!isFinite(endMs) && isFinite(startMs) && typeof t.duration === "number") {
        endMs = startMs + t.duration * 60000;
    }

    if (!isFinite(startMs) && isFinite(endMs) && typeof t.duration === "number") {
        startMs = endMs - t.duration * 60000;
    }

    return { startMs: isFinite(startMs) ? startMs : NaN, endMs: isFinite(endMs) ? endMs : NaN };
}

function readSessionAttempt() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function computeStartEndDuration(attemptObj, testObj) {
    const { startMs: fixedStartMs, endMs: fixedEndMs } = parseTestTimes(testObj);

    let userStartMs = NaN;
    if (attemptObj && attemptObj.startedAt) {
        const s = new Date(attemptObj.startedAt).getTime();
        if (!Number.isNaN(s)) userStartMs = s;
    } else {
        const sessionAttempt = readSessionAttempt();
        if (sessionAttempt?.startedAt) {
            const s = new Date(sessionAttempt.startedAt).getTime();
            if (!Number.isNaN(s)) userStartMs = s;
        }
    }

    let durationMs = NaN;
    if (attemptObj && typeof attemptObj.durationMinutes === "number") {
        durationMs = attemptObj.durationMinutes * 60000;
    } else if (testObj && typeof testObj.duration === "number") {
        durationMs = testObj.duration * 60000;
    }

    let effectiveStartMs = NaN;
    let effectiveEndMs = NaN;

    if (isFinite(fixedStartMs) || isFinite(fixedEndMs)) {
        effectiveStartMs = fixedStartMs;
        effectiveEndMs = fixedEndMs;
        if (!isFinite(effectiveEndMs) && isFinite(effectiveStartMs) && isFinite(durationMs)) {
            effectiveEndMs = effectiveStartMs + durationMs;
        }
    } else if (isFinite(userStartMs) && isFinite(durationMs)) {
        effectiveStartMs = userStartMs;
        effectiveEndMs = userStartMs + durationMs;
    }

    return { startMs: effectiveStartMs, endMs: effectiveEndMs, durationMs };
}

function seededShuffle(array, seed) {
    const arr = [...array];
    let m = arr.length, t, i;

    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
    }
    let rng = (h >>> 0) / 0xffffffff;

    while (m) {
        i = Math.floor(rng * m--);
        rng = (rng * 1664525 + 1013904223) & 0xffffffff;
        rng = (rng >>> 0) / 0xffffffff;
        t = arr[m];
        arr[m] = arr[i];
        arr[i] = t;
    }
    return arr;
}

const getFullscreenElement = () =>
    document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;

const requestFullscreenOnElement = async (el) => {
    if (!el) return Promise.reject(new Error("No element"));
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.msRequestFullscreen) return el.msRequestFullscreen();
    return Promise.reject(new Error("Fullscreen not supported"));
};

const exitFullscreen = async () => {
    if (getFullscreenElement()) {
        if (document.exitFullscreen) return document.exitFullscreen();
        if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
        if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
        if (document.msExitFullscreen) return document.msExitFullscreen();
    }
    return Promise.resolve();
};

export default function SecureTestPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();

    const [attempt, setAttempt] = useState(null);
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSection, setCurrentSection] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [localAnswers, setLocalAnswers] = useState({});
    const [blocked, setBlocked] = useState(false);
    const [timeLabel, setTimeLabel] = useState("N/A");
    const [timeSubLabel, setTimeSubLabel] = useState(null);
    const [timeRemainingMs, setTimeRemainingMs] = useState(NaN);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [fullscreenWarning, setFullscreenWarning] = useState(false);
    const [exitCount, setExitCount] = useState(0);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [backPressCount, setBackPressCount] = useState(0);
    const [headerPermanentlyHidden, setHeaderPermanentlyHidden] = useState(false);

    const tickRef = useRef(null);
    const submittingRef = useRef(false);
    const mountedRef = useRef(true);
    const fullscreenEnteredRef = useRef(false);
    const hideHeaderTimeout = useRef(null);

    // === FORCE FULLSCREEN ON MOUNT ===
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (!getFullscreenElement()) {
                    await requestFullscreenOnElement(document.documentElement);
                    fullscreenEnteredRef.current = true;
                    setFullscreenWarning(false);
                }
            } catch (err) {
                setFullscreenWarning(true);
            }
        };
        enterFullscreen();
    }, []);

    // === EXIT FULLSCREEN → FORFEIT ===
    useEffect(() => {
        const onFullscreenChange = () => {
            if (!getFullscreenElement()) {
                immediateForfeit("fullscreen_exit");
            } else {
                fullscreenEnteredRef.current = true;
                setFullscreenWarning(false);
            }
        };

        const events = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];
        events.forEach(ev => document.addEventListener(ev, onFullscreenChange));

        return () => events.forEach(ev => document.removeEventListener(ev, onFullscreenChange));
    }, []);

    // === IMMERSIVE HEADER: Hide after 3s inactivity ===
    useEffect(() => {
        if (blocked || loading || headerPermanentlyHidden) return;

        const showHeader = () => {
            if (headerPermanentlyHidden) return;
            setHeaderVisible(true);
            if (hideHeaderTimeout.current) clearTimeout(hideHeaderTimeout.current);
            hideHeaderTimeout.current = setTimeout(() => {
                if (!headerPermanentlyHidden) setHeaderVisible(false);
            }, 3000);
        };

        const handleActivity = () => showHeader();

        showHeader();
        document.addEventListener("mousemove", handleActivity);
        document.addEventListener("touchstart", handleActivity);

        return () => {
            document.removeEventListener("mousemove", handleActivity);
            document.removeEventListener("touchstart", handleActivity);
            if (hideHeaderTimeout.current) clearTimeout(hideHeaderTimeout.current);
        };
    }, [blocked, loading, headerPermanentlyHidden]);

    
    const handleManualSubmit = useCallback(
        async (auto = false) => {
            if (blocked || !attempt || submittingRef.current) return;
            if (!auto && !window.confirm("Submit now?")) return;

            submittingRef.current = true;
            try {
                const answersArr = Object.entries(localAnswers).map(([qIndexStr, selectedIdx]) => ({
                    qIndex: Number(qIndexStr),
                    selectedIdx,
                }));
                const res = await fetch(`http://localhost:5000/api/attempts/${attemptId}/submit`, {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers: answersArr, forfeit: false, reason: auto ? "time_up" : "manual_submit" }),
                });
                const body = await res.json().catch(() => ({}));
                alert(`Submitted! Score: ${body.score ?? "N/A"}`);
            } catch (err) {
                localStorage.setItem(
                    `attempt_${attemptId}_pending_submit`,
                    JSON.stringify({
                        attemptId,
                        answers: localAnswers,
                        forfeit: false,
                        reason: "manual_submit",
                        ts: new Date().toISOString(),
                    })
                );
                alert("Submit failed. Saved locally.");
            } finally {
                await exitFullscreen().catch(() => { });
                localStorage.removeItem(`attempt_${attemptId}_answers`);
                sessionStorage.removeItem(SESSION_KEY);
                navigate("/student/dashboard");
            }
        },
        [attempt, blocked, localAnswers, attemptId, navigate]
    );

    // === BACK BUTTON TRAP: single press → auto-submit and exit ===
    useEffect(() => {
        let isLeaving = false;

        const handlePopState = async (e) => {
            if (isLeaving || blocked) return;
            e.preventDefault();

            isLeaving = true;
            setHeaderPermanentlyHidden(true);

            await handleManualSubmit(true); // auto submit test with auto=true
        };

        const handleBeforeUnload = (e) => {
            if (isLeaving) return;
            e.preventDefault();
            e.returnValue = "Test in progress. Leave anyway?";
        };

        window.history.pushState(null, "", window.location.href);

        window.addEventListener("popstate", handlePopState);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            isLeaving = true;
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [blocked, handleManualSubmit]);

    // === SESSION & LOCAL STORAGE ===
    const readAttemptFromSession = () => {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const writeAttemptToSession = (obj) => {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
        } catch (e) {
            console.warn(e);
        }
    };

    const saveAnswersLocally = (answers) => {
        try {
            const key = `attempt_${attemptId}_answers`;
            localStorage.setItem(key, JSON.stringify(answers));
        } catch (e) {
            console.warn("Failed to save answers locally", e);
        }
    };

    const readAnswersLocally = () => {
        try {
            const key = `attempt_${attemptId}_answers`;
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };

    // === LOAD ATTEMPT & TEST ===
    useEffect(() => {
        mountedRef.current = true;
        async function load() {
            try {
                const res = await fetch(`http://localhost:5000/api/attempts/${attemptId}`, { credentials: "include" });
                if (!res.ok) throw new Error("Attempt not found");
                const a = await res.json();
                if (!mountedRef.current) return;
                setAttempt(a);
                setBlocked(!!a.blocked);
                setExitCount(a.exitCount || 0);

                const tRes = await fetch(`http://localhost:5000/api/tests/${a.testId}`);
                const tb = await tRes.json();
                const t = tb.test || tb;
                if (!mountedRef.current) return;

                const originalQuestions = Array.isArray(t.questions) ? t.questions : [];
                const shuffledQuestions = seededShuffle(originalQuestions, attemptId);

                setTest({ ...t, questions: shuffledQuestions });

                const serverAnswers = {};
                (a.answers || []).forEach((ans) => {
                    if (typeof ans.selectedIdx === "number") serverAnswers[ans.qIndex] = ans.selectedIdx;
                });
                const local = readAnswersLocally();
                setLocalAnswers({ ...serverAnswers, ...local });

                const sections = shuffledQuestions.reduce((acc, q, idx) => {
                    const s = q.section || "Default";
                    if (!acc[s]) acc[s] = [];
                    acc[s].push(idx);
                    return acc;
                }, {});
                const first = Object.keys(sections)[0] || null;
                setCurrentSection(first);
                setCurrentQIndex((sections[first]?.[0]) ?? 0);

                const { startMs, endMs, durationMs } = computeStartEndDuration(a, t);
                computeAndSetTimeLabels(startMs, endMs, durationMs);
            } catch (err) {
                console.warn("Attempt fetch failed", err);
                navigate("/student/dashboard");
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        }
        load();
        return () => (mountedRef.current = false);
    }, [attemptId, navigate]);

    // === TIME LABELS ===
    const computeAndSetTimeLabels = (startMs, endMs, durationMs) => {
        const now = Date.now();
        if (!Number.isFinite(startMs) && !Number.isFinite(endMs) && !Number.isFinite(durationMs)) {
            setTimeLabel("N/A");
            setTimeSubLabel(null);
            setTimeRemainingMs(NaN);
            return;
        }

        if (Number.isFinite(startMs) && Number.isFinite(endMs)) {
            if (now < startMs) {
                const untilStart = Math.max(0, startMs - now);
                setTimeLabel(`Starts in: ${formatCountdownMs(untilStart)}`);
                setTimeSubLabel(`Duration: ${formatCountdownMs(Math.max(0, endMs - startMs))}`);
                setTimeRemainingMs(Math.max(0, endMs - startMs));
            } else {
                const remaining = Math.max(0, endMs - now);
                setTimeLabel(`Remaining: ${formatCountdownMs(remaining)}`);
                setTimeSubLabel(null);
                setTimeRemainingMs(remaining);
            }
            return;
        }

        if (Number.isFinite(endMs)) {
            const remaining = Math.max(0, endMs - now);
            setTimeLabel(`Remaining: ${formatCountdownMs(remaining)}`);
            setTimeSubLabel(null);
            setTimeRemainingMs(remaining);
            return;
        }

        if (Number.isFinite(startMs) && Number.isFinite(durationMs)) {
            const end = startMs + durationMs;
            if (now < startMs) {
                const untilStart = Math.max(0, startMs - now);
                setTimeLabel(`Starts in: ${formatCountdownMs(untilStart)}`);
                setTimeSubLabel(`Duration: ${formatCountdownMs(durationMs)}`);
                setTimeRemainingMs(durationMs);
            } else {
                const remaining = Math.max(0, end - now);
                setTimeLabel(`Remaining: ${formatCountdownMs(remaining)}`);
                setTimeSubLabel(null);
                setTimeRemainingMs(remaining);
            }
            return;
        }

        if (Number.isFinite(durationMs)) {
            setTimeLabel(`Duration: ${formatCountdownMs(durationMs)}`);
            setTimeSubLabel(null);
            setTimeRemainingMs(durationMs);
            return;
        }

        setTimeLabel("N/A");
        setTimeSubLabel(null);
        setTimeRemainingMs(NaN);
    };

    // === TICK: TIME + AUTO-SUBMIT ===
    useEffect(() => {
        if (!attempt || !test || blocked) return;

        const tick = async () => {
            const { startMs, endMs, durationMs } = computeStartEndDuration(attempt, test);
            computeAndSetTimeLabels(startMs, endMs, durationMs);

            if (Number.isFinite(endMs)) {
                const remain = Math.max(0, endMs - Date.now());
                if (remain <= 0 && !submittingRef.current) {
                    submittingRef.current = true;
                    await handleManualSubmit(true);
                }
            }
        };

        tick();
        tickRef.current = setInterval(tick, 1000);
        return () => clearInterval(tickRef.current);
    }, [attempt, test, localAnswers, blocked, attemptId, navigate]);

    // === FORFEIT & AUTO-SUBMIT ===
    const immediateForfeit = async (reason) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setBlocked(true);
        setHeaderPermanentlyHidden(true);

        try {
            const scopedKey = `${START_DISABLED_KEY}_${attempt?.testId || test?._id || test?.id || ""}`;
            localStorage.setItem(scopedKey, "true");
        } catch (e) { }

        try {
            const answersArr = Object.entries(localAnswers).map(([qIndexStr, selectedIdx]) => ({
                qIndex: Number(qIndexStr),
                selectedIdx,
            }));
            await fetch(`http://localhost:5000/api/attempts/${attemptId}/submit`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: answersArr, forfeit: true, reason }),
            }).catch(() => { });
        } catch (err) {
            console.error("Forfeit failed", err);
        } finally {
            await exitFullscreen().catch(() => { });
            localStorage.removeItem(`attempt_${attemptId}_answers`);
            sessionStorage.removeItem(SESSION_KEY);
            setTimeout(() => navigate("/student/dashboard"), 300);
        }
    };

    // === TAB SWITCH / BLUR ===
    useEffect(() => {
        if (!attempt || blocked) return;

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                setTabSwitchCount(p => p + 1);
                immediateForfeit("tab_switch");
            }
        };

        const onBlur = () => {
            setTabSwitchCount(p => p + 1);
            immediateForfeit("blur");
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("blur", onBlur);

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("blur", onBlur);
        };
    }, [attempt, blocked, localAnswers]);

    // === ANSWER HANDLING ===
    const selectAnswer = (qIdx, idx) => {
        setLocalAnswers(prev => {
            const updated = { ...prev, [qIdx]: idx };
            saveAnswersLocally(updated);
            try {
                const s = readAttemptFromSession() || {};
                s.answers = Object.entries(updated).map(([qIndexStr, selectedIdx]) => ({
                    qIndex: Number(qIndexStr),
                    selectedIdx,
                }));
                writeAttemptToSession(s);
            } catch (e) { }
            return updated;
        });
    };

    const handlePrev = () => {
        const sections = getSections();
        const list = sections[currentSection] || [];
        const pos = list.indexOf(currentQIndex);
        if (pos > 0) setCurrentQIndex(list[pos - 1]);
    };

    const handleNext = () => {
        const sections = getSections();
        const list = sections[currentSection] || [];
        const pos = list.indexOf(currentQIndex);
        if (pos < list.length - 1) setCurrentQIndex(list[pos + 1]);
    };

    const getSections = () => {
        const questions = test?.questions || [];
        return questions.reduce((acc, q, idx) => {
            const s = q.section || "Default";
            if (!acc[s]) acc[s] = [];
            acc[s].push(idx);
            return acc;
        }, {});
    };

    const saveAnswersToServer = async () => {
        try {
            const payload = {
                answers: Object.entries(localAnswers).map(([qIndexStr, selectedIdx]) => ({
                    qIndex: Number(qIndexStr),
                    selectedIdx,
                })),
            };
            await fetch(`http://localhost:5000/api/attempts/${attemptId}/save`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            saveAnswersLocally(localAnswers);
            alert("Progress saved.");
        } catch (err) {
            saveAnswersLocally(localAnswers);
            alert("Saved locally.");
        }
    };

  

    // === RENDER ===
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center w-full max-w-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading secure test...</p>
                </div>
            </div>
        );
    }

    if (blocked) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full border border-red-100">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-700 mb-2">Test Blocked</h2>
                    <p className="text-gray-600 mb-6">Attempt forfeited due to security violation.</p>
                    <button onClick={() => navigate("/student/dashboard")} className="px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-sky-700 hover:to-indigo-700 transition shadow-md">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!test || !attempt) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-medium text-lg">Test not available.</p>
                </div>
            </div>
        );
    }

    const questions = test.questions || [];
    const sections = getSections();
    const currentSectionQuestions = sections[currentSection] || [];
    const qIndex = currentQIndex;
    const q = questions[qIndex] || {};
    const totalQuestions = questions.length;
    const questionStatuses = questions.map((_, idx) => {
        if (localAnswers[idx] !== undefined) return 1;
        if (idx === currentQIndex) return 2;
        return 0;
    });
    const answeredCount = Object.keys(localAnswers).length;
    const progress = ((answeredCount / totalQuestions) * 100).toFixed(0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col overflow-hidden">

            {/* Fullscreen Warning */}
            {fullscreenWarning && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-md">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-700 mb-3">Fullscreen Required</h2>
                        <p className="text-gray-600 mb-6">You must be in fullscreen to take this test.</p>
                        <button
                            onClick={async () => {
                                try {
                                    await requestFullscreenOnElement(document.documentElement);
                                    setFullscreenWarning(false);
                                } catch {
                                    alert("Please enable fullscreen in your browser.");
                                }
                            }}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold"
                        >
                            Enter Fullscreen
                        </button>
                    </div>
                </div>
            )}

            {/* Header - Hidden permanently after back press */}
            {!headerPermanentlyHidden && (
                <header className={`bg-white/90 backdrop-blur-md shadow-md border-b border-gray-100/50 px-6 py-4 flex items-center justify-between sticky top-0 z-40 transition-opacity duration-500 ${headerVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition">
                            <Menu className="w-5 h-5 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{test.title}</h1>
                            <p className="text-sm text-gray-500 mt-1">{test.institute} • {test.courseName || test.targetAudience}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="text-right hidden sm:block">
                            <div className="flex items-center gap-2 text-red-600 font-mono text-lg">
                                <Clock className="w-5 h-5" />
                                <div>
                                    <div className="font-semibold">{timeLabel}</div>
                                    {timeSubLabel && <div className="text-xs text-gray-500 mt-0.5">{timeSubLabel}</div>}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                <LogOut className="w-4 h-4" />
                                Exits: {exitCount} • Tabs: {tabSwitchCount}
                            </div>
                        </div>
                        <button onClick={() => handleManualSubmit(false)} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-blue-700 transition shadow-sm">
                            Submit Test
                        </button>
                    </div>
                </header>
            )}

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

                <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-100`}>
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800">Question Palette</h3>
                        <div className="text-sm text-gray-600 mt-2">Answered: {answeredCount}/{totalQuestions} ({progress}%)</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((_, idx) => {
                                const status = questionStatuses[idx];
                                return (
                                    <button key={idx} onClick={() => { setCurrentQIndex(idx); setSidebarOpen(false); }} className={`w-10 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${status === 1 ? "bg-green-500 text-white hover:bg-green-600" : status === 2 ? "bg-red-500 text-white ring-2 ring-red-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-5 border-t border-gray-100 space-y-2 bg-gray-50">
                        <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 bg-green-500 rounded"></div><span>Answered</span></div>
                        <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 bg-red-500 rounded"></div><span>Current</span></div>
                        <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 bg-gray-100 rounded border"></div><span>Not Visited</span></div>
                    </div>
                </aside>

                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="sm:hidden flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow">
                        <div className="flex items-center gap-2 text-red-600 font-mono text-base"><Clock className="w-5 h-5" />{timeLabel}</div>
                        <div className="text-xs text-gray-500">Exits: {exitCount}</div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sections</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(sections).map((s) => (
                                <button key={s} onClick={() => setCurrentSection(s)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${currentSection === s ? "bg-indigo-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-sm text-gray-500">Question {qIndex + 1} of {totalQuestions}</span>
                                <h3 className="text-xl font-semibold text-gray-800 mt-1">{q?.questionText || "No question text"}</h3>
                            </div>
                            {q.marks && <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>}
                        </div>

                        <div className="space-y-4 mt-6">
                            {Array.isArray(q.options) && q.options.length > 0 ? (
                                q.options.map((opt, i) => (
                                    <label key={i} className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${localAnswers[qIndex] === i ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                                        <input type="radio" name={`q${qIndex}`} checked={localAnswers[qIndex] === i} onChange={() => selectAnswer(qIndex, i)} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500" />
                                        <span className="ml-3 text-gray-800">{opt.text ?? opt}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No options available.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex gap-4">
                            <button onClick={handlePrev} disabled={currentSectionQuestions.indexOf(currentQIndex) === 0} className="px-6 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">
                                Previous
                            </button>
                            <button onClick={handleNext} disabled={currentSectionQuestions.indexOf(currentQIndex) === currentSectionQuestions.length - 1} className="px-6 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">
                                Next
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={saveAnswersToServer} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                                Save Progress
                            </button>
                            <button onClick={() => handleManualSubmit(false)} className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                                Submit Test
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-around items-center shadow-lg z-40">
                <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center text-xs text-gray-600"><Circle className="w-5 h-5" /><span>Palette</span></button>
                <button onClick={handlePrev} disabled={currentSectionQuestions.indexOf(currentQIndex) === 0} className="flex flex-col items-center text-xs text-gray-600 disabled:opacity-50">Prev</button>
                <button onClick={handleNext} disabled={currentSectionQuestions.indexOf(currentQIndex) === currentSectionQuestions.length - 1} className="flex flex-col items-center text-xs text-gray-600 disabled:opacity-50">Next</button>
                <button onClick={() => handleManualSubmit(false)} className="flex flex-col items-center text-xs font-medium text-indigo-600"><CheckCircle className="w-5 h-5" /><span>Submit</span></button>
            </div>
        </div>
    );
}
