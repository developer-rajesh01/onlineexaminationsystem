import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Clock, CheckCircle, Circle } from "lucide-react";

const SESSION_KEY = "currentTestAttempt";
const START_DISABLED_KEY = "startDisabled";

// const [showSections, setShowSections] = useState(true);
// const [termsAgreed, setTermsAgreed] = useState(false);

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
    const [headerPermanentlyHidden, setHeaderPermanentlyHidden] = useState(false);
    const [completedSections, setCompletedSections] = useState({});
    const sections = useMemo(() => {
        return (test?.questions || []).reduce((acc, q, qIndex) => {
            const s = q.section || "Default";
            if (!acc[s]) acc[s] = [];
            acc[s].push(qIndex);
            return acc;
        }, {});
    }, [test])
    const tickRef = useRef(null);
    const submittingRef = useRef(false);
    const mountedRef = useRef(true);
    const fullscreenEnteredRef = useRef(false);
    const hideHeaderTimeout = useRef(null);
    // 🟢 SESSION LOADER - TOP LEVEL (BEFORE ALL IFs)

    useEffect(() => {

        const blockKeys = (e) => {

            const key = e.key.toLowerCase();

            if (
                e.key === "F12" ||
                (e.ctrlKey && ["u", "s", "p", "t", "n", "w"].includes(key)) ||
                (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key))
            ) {
                e.preventDefault();
                e.stopPropagation();
                console.log("Shortcut blocked:", e.key);
            }

        };

        document.addEventListener("keydown", blockKeys, true);

        return () => {
            document.removeEventListener("keydown", blockKeys, true);
        };

    }, []);
    useEffect(() => {
        // 🟢 LOAD COMPLETED SECTIONS FROM LOCALSTORAGE
        try {
            const completedKey = `attempt_${attemptId}_completed_sections`;
            const saved = localStorage.getItem(completedKey);
            if (saved) {
                setCompletedSections(JSON.parse(saved));
            }
        } catch (e) { }

        // 🟢 EXISTING SESSION LOADER
        const pendingKey = `attempt_${attemptId}_pending_session`;
        const pendingData = localStorage.getItem(pendingKey);
        if (pendingData) {
            try {
                const sessionData = JSON.parse(pendingData);
                if (sessionData.attemptId === attemptId) {
                    const loadedAnswers = {};
                    sessionData.answers.forEach(ans => loadedAnswers[ans.qIndex] = ans.selectedIdx);
                    setLocalAnswers(prev => ({ ...prev, ...loadedAnswers }));
                }
            } catch (e) { }
        }
    }, [attemptId]);

    const immediateForfeit = useCallback(async (reason) => {
        if (submittingRef.current || !attempt || !test) return;  // ✅ ADDED CHECKS
        submittingRef.current = true;
        setBlocked(true);
        setHeaderPermanentlyHidden(true);

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
    }, [attemptId, localAnswers, navigate, attempt, test]);  // ✅ FIXED DEPS

    const handleManualSubmit = useCallback(async (auto = false) => {
        if (blocked || !attempt || submittingRef.current) return;
        submittingRef.current = true;
        // 🟢 SECTION SCREEN = SAVE ONLY CURRENT SECTION
        if (currentSection && !auto) {
            const sectionQuestions = sections[currentSection] || [];
            const sectionAnswers = {};

            // Filter answers for THIS SECTION ONLY
            sectionQuestions.forEach(qIdx => {
                if (localAnswers[qIdx] !== undefined) {
                    sectionAnswers[qIdx] = localAnswers[qIdx];
                }
            });

            // Save THIS SECTION to localStorage
            const sectionKey = `attempt_${attemptId}_section_${currentSection}`;
            localStorage.setItem(sectionKey, JSON.stringify({
                section: currentSection,
                questions: sectionQuestions,
                answers: sectionAnswers,
                timestamp: new Date().toISOString()
            }));

            alert(`✅ ${currentSection} saved! (${Object.keys(sectionAnswers).length}/${sectionQuestions.length} answered)`);
            return;
        }

        // 🟢 QUESTIONS SCREEN = FINAL SUBMIT ALL SECTIONS
        if (!auto && !window.confirm("Submit ALL sections?")) return;

        submittingRef.current = true;
        try {
            // COMBINE ALL sections from localStorage + current answers
            const allAnswers = { ...localAnswers };
            Object.keys(sections).forEach(sectionName => {
                const sectionKey = `attempt_${attemptId}_section_${sectionName}`;
                const sectionData = localStorage.getItem(sectionKey);

                if (sectionData) {
                    try {
                        const section = JSON.parse(sectionData);
                        Object.assign(allAnswers, section.answers);
                    } catch (e) { }
                }
            });

            setLocalAnswers(allAnswers);
            // FINAL SERVER SUBMIT
            localStorage.removeItem(`attempt_${attemptId}_pending_session`);
            Object.keys(localStorage).forEach(key => {
                if (key.includes(`attempt_${attemptId}_section_`)) {
                    localStorage.removeItem(key);
                }
            });

            const res = await fetch(`http://localhost:5000/api/attempts/${attemptId}/submit`, {
                method: "PUT", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers: Object.entries(allAnswers).map(([qIndexStr, selectedIdx]) => ({
                        qIndex: Number(qIndexStr), selectedIdx
                    })),
                    forfeit: false, reason: auto ? "time_up" : "manual_submit"
                })
            });

            const body = await res.json().catch(() => ({}));
        } catch (err) {
            alert("❌ Submit failed");
        } finally {
            await exitFullscreen().catch(() => { });

            sessionStorage.removeItem(SESSION_KEY);

            // Force redirect to dashboard
            setTimeout(() => {
                navigate("/student/dashboard", { replace: true });
                window.history.replaceState(null, "", "/student/dashboard");
            }, 500);
        }
    }, [attemptId, attempt, blocked, localAnswers, navigate, currentSection, test, sections]);
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
    // ✅ FIRST - Fullscreen exit (keep as is)
    useEffect(() => {
        const onFullscreenChange = async () => {
            if (!getFullscreenElement()) {

                if (!submittingRef.current) {
                    await handleManualSubmit(true);
                }

            } else {
                fullscreenEnteredRef.current = true;
                setFullscreenWarning(false);
            }
        };
        const events = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];
        events.forEach(ev => document.addEventListener(ev, onFullscreenChange));
        return () => events.forEach(ev => document.removeEventListener(ev, onFullscreenChange));

    }, [handleManualSubmit]);

    useEffect(() => {

        const escListener = async (e) => {

            if (e.key === "Escape") {

                console.log("ESC pressed");
                if (!submittingRef.current) {
                    await handleManualSubmit(true);
                }

            }

        };

        document.addEventListener("keydown", escListener);

        return () => {
            document.removeEventListener("keydown", escListener);
        };

    }, [handleManualSubmit]);
    useEffect(() => {

        const prevent = (e) => e.preventDefault();

        document.addEventListener("copy", prevent);
        document.addEventListener("paste", prevent);
        document.addEventListener("cut", prevent);
        document.addEventListener("contextmenu", prevent);

        return () => {
            document.removeEventListener("copy", prevent);
            document.removeEventListener("paste", prevent);
            document.removeEventListener("cut", prevent);
            document.removeEventListener("contextmenu", prevent);
        };

    }, []);
    // ✅ SECOND - Header hiding (NEW SEPARATE useEffect)
    useEffect(() => {
        document.body.classList.add("permanent-hide-header");
        return () => document.body.classList.remove("permanent-hide-header");
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



    // === BACK BUTTON TRAP: single press → auto-submit and exit ===
    useEffect(() => {
        let isLeaving = false;

        const handlePopState = async (e) => {
            if (isLeaving || blocked || !attempt || !test) return;
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
        window.addEventListener("beforeunload", async (e) => {
            if (!submittingRef.current) {
                await handleManualSubmit(true);
            }
        });
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
    useEffect(() => {
        let cancelled = false;  // ✅ ADD THIS

        async function load() {
            try {
                console.log("🔍 LOADING attemptId:", attemptId);

                // 1. GET attempt
                const res = await fetch(`http://localhost:5000/api/attempts/${attemptId}`, {
                    credentials: "include"
                });
                console.log("🔍 ATTEMPT STATUS:", res.status);

                if (!res.ok) {
                    const err = await res.text();
                    throw new Error(`HTTP ${res.status}: ${err}`);
                }

                // 2. PARSE response
                const body = await res.json();
                const a = body.attempt || body;
                console.log("🔍 FULL RESPONSE:", body);
                console.log("🔍 ATTEMPT:", a);

                // 3. EXTRACT testId
                const testId = a.testId?._id || a.testId || a.test?.id || a.test?._id;
                console.log("🔍 EXTRACTED testId:", testId);

                if (!testId) {
                    console.error("❌ NO testId FOUND:", {
                        direct: a.testId,
                        populated: a.testId?._id,
                        testField: a.test,
                        fullAttempt: a
                    });

                    alert("Invalid attempt - no testId. Go back to dashboard.");
                    navigate("/student/dashboard");
                    return;
                }

                if (cancelled) return;  // ✅ ADD THIS

                // 4. SET attempt state
                setAttempt({ ...a, testId });
                setBlocked(!!a.blocked);
                setExitCount(a.exitCount || 0);

                // 5. GET test
                console.log("🔍 FETCHING test:", testId);
                const tRes = await fetch(`http://localhost:5000/api/tests/${testId}`);
                if (!tRes.ok) throw new Error("Test not found");

                const tb = await tRes.json();
                const t = tb.test || tb;
                console.log("🔍 TEST LOADED:", t);

                if (cancelled) return;  // ✅ ADD THIS

                // 6. Shuffle questions
                const shuffledQuestions = [];
                if (Array.isArray(t.sections)) {
                    t.sections.forEach((section, sectionIndex) => {
                        const shuffledSectionQuestions = seededShuffle(section.questions, `${attemptId}_${sectionIndex}`);
                        shuffledSectionQuestions.forEach((q, qIndex) => {
                            shuffledQuestions.push({
                                ...q,
                                section: section.name,
                                originalSectionIndex: sectionIndex
                            });
                        });
                    });
                } else if (Array.isArray(t.questions)) {
                    shuffledQuestions.push(...seededShuffle(t.questions, attemptId));
                }

                // 7. Load answers FIRST ✅ MOVED BEFORE setLoading
                const serverAnswers = {};
                (a.answers || []).forEach((ans) => {
                    if (typeof ans.selectedIdx === "number") serverAnswers[ans.qIndex] = ans.selectedIdx;
                });
                const local = readAnswersLocally();
                setLocalAnswers({ ...serverAnswers, ...local });

                setTest({ ...t, questions: shuffledQuestions });

                const { startMs, endMs, durationMs } = computeStartEndDuration(a, t);
                computeAndSetTimeLabels(startMs, endMs, durationMs);

                if (cancelled) return;  // ✅ FINAL CHECK

                setLoading(false);  // ✅ LAST - after everything loads

                console.log("✅ LOAD COMPLETE:", { test: t.title, questions: shuffledQuestions.length });
            } catch (err) {
                if (!cancelled) {
                    console.error("❌ LOAD FAILED:", err);
                    navigate("/student/dashboard");
                }
            } finally {
                if (mountedRef.current && !cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; mountedRef.current = false; };
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
                    console.log("⏰ Time up - auto submitting test");
                    await handleManualSubmit(true);
                }
            }
        };

        tick();
        tickRef.current = setInterval(tick, 1000);

        return () => clearInterval(tickRef.current);

    }, [attempt, test, blocked, handleManualSubmit]);

    useEffect(() => {

        const detectFocusLoss = () => {

            console.log("Window focus lost");

            if (!submittingRef.current) {
                handleManualSubmit(true);
            }

        };

        window.addEventListener("blur", detectFocusLoss);

        return () => {
            window.removeEventListener("blur", detectFocusLoss);
        };

    }, [handleManualSubmit]);

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
        const list = sections[currentSection] || [];
        const pos = list.indexOf(currentQIndex);

        if (pos !== -1 && pos > 0) {
            setCurrentQIndex(list[pos - 1]);
        }
    };

    const handleNext = () => {
        const list = sections[currentSection] || [];
        const pos = list.indexOf(currentQIndex);
        if (pos !== -1 && pos < list.length - 1) {
            setCurrentQIndex(list[pos + 1]);
        }
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
        } catch (err) {
            saveAnswersLocally(localAnswers);
        }
    };


    if (loading) return <div>Loading...</div>;
    if (blocked) return <div>Test Blocked</div>;
    if (!test || !attempt) return <div>Test not found</div>;
    // 🟢 ADD HEADER HERE - WORKS FOR BOTH SCREENS



    if (!currentSection) {
        const allSections = sections;
        return (
            <div className="min-h-screen bg-gray-50/50 py-12 px-5 sm:px-6 lg:px-8">
                {/* 🟢 TEST INFO BAR - PASTE HERE */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl mb-8 p-4 rounded-xl max-w-5xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-bold text-xl">{test?.title || "Online Test"}</span>
                            <span>•</span>
                            <span className="hidden sm:inline">{test?.institute}</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1 font-mono text-lg font-bold">
                                <Clock className="w-5 h-5" />
                                {timeLabel}
                            </div>
                            <div className="text-sm bg-white/20 px-4 py-2 rounded-lg">
                                {Object.keys(localAnswers || {}).length}/{test?.questions?.length || 0}
                            </div>


                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
                            {test.title || "Online Assessment"}
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Please select a section to begin. You can switch between sections later if allowed.
                        </p>
                    </div>
                    {Object.entries(sections).map(([sectionName, questionIndices], index) => {
                        const sectionColors = [
                            { accent: 'bg-indigo-600', text: 'text-indigo-700', light: 'bg-indigo-50' },
                            { accent: 'bg-blue-600', text: 'text-blue-700', light: 'bg-blue-50' },
                            { accent: 'bg-purple-600', text: 'text-purple-700', light: 'bg-purple-50' },
                            { accent: 'bg-teal-600', text: 'text-teal-700', light: 'bg-teal-50' },
                        ];
                        const color = sectionColors[index % sectionColors.length];

                        // 🟢 PROGRESS INSIDE MAP = NO ESLint ERROR
                        const answeredInSection = questionIndices.filter(idx => localAnswers[idx] !== undefined).length;
                        const progress = questionIndices.length
                            ? ((answeredInSection / questionIndices.length) * 100).toFixed(0)
                            : 0;
                        return (
                            <div key={sectionName} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden">
                                <div className="flex flex-col sm:flex-row items-stretch">
                                    <div className={`sm:w-24 flex-shrink-0 ${color.accent} flex items-center justify-center py-6 sm:py-0`}>
                                        <div className="text-white font-semibold text-xl sm:text-2xl tracking-wide">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                    </div>
                                    <div className="flex-1 px-6 py-7 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div>
                                            <h3 className={`text-2xl sm:text-3xl font-semibold ${color.text} mb-2`}>{sectionName}</h3>
                                            <div className="flex items-center gap-4 text-gray-600">
                                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${answeredInSection === questionIndices.length ? 'bg-green-100 text-green-800' :
                                                    answeredInSection > questionIndices.length / 2 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {answeredInSection}/{questionIndices.length} ({progress}%)
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (questionIndices.length > 0) {
                                                    setCurrentSection(sectionName);
                                                    setCurrentQIndex(questionIndices[0]);
                                                }
                                            }}
                                            className={`px-8 py-3.5 rounded-lg font-medium text-base transition-all duration-200 flex items-center gap-2 min-w-[160px] ${answeredInSection === questionIndices.length
                                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                                                : 'bg-gray-800 text-white hover:bg-gray-900'
                                                }`}
                                        >
                                            {answeredInSection === questionIndices.length ? '✅ Completed' : 'Start Section'}
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}


                    {/* Footer note */}
                    <div className="mt-12 text-center text-gray-500 text-sm">
                        All sections must be completed before final submission.<br />
                        You may review and change answers within each section.

                    </div>
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => handleManualSubmit(false)}
                            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-md"
                        >
                            Submit Test
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    const allQuestions = test?.questions || [];
    const totalQuestions = allQuestions.length;
    // 🟢 SECTIONS - INLINE (no function)

    // const sections = getSections();
    const answeredCount = Object.keys(localAnswers).length;
    const progress = totalQuestions ? ((answeredCount / totalQuestions) * 100).toFixed(0) : '0';


    // const sections = getSections();  
    // 🟢 CURRENT QUESTION OBJECT
    // 🟢 SECTION-SPECIFIC VARIABLES (only if in question view)
    let sectionQuestionIndices = [];
    let sectionQuestions = [];
    let qIndexInSection = 0;
    let currentQuestion = null;
    if (currentSection) {
        sectionQuestionIndices = sections[currentSection] || [];
        sectionQuestions = sectionQuestionIndices.map(idx => allQuestions[idx]);
        qIndexInSection = sectionQuestionIndices.indexOf(currentQIndex);
        if (qIndexInSection >= 0) {
            currentQuestion = sectionQuestions[qIndexInSection];
        }
    }


    // const answeredCount = Object.keys(localAnswers).length;
    // const progress = ((answeredCount / totalQuestions) * 100).toFixed(0);

    // 🟢 ADD THIS IMMEDIATELY AFTER const progress line

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
            <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl border-b-4 border-indigo-400 sticky top-0 z-[999]">
                <div className="max-w-6xl mx-auto px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                        {/* Test Info */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-bold text-lg truncate max-w-[200px]">
                                {test?.title || "Online Test"}
                            </span>
                            <span>•</span>
                            <span className="hidden sm:inline">{test?.institute || "Institute"}</span>
                            <span>•</span>
                            <span>{test?.courseName || test?.targetAudience || "Course"}</span>
                        </div>

                        {/* Live Stats */}
                        <div className="flex items-center gap-6 flex-wrap justify-center">
                            <div className="flex items-center gap-1 font-mono text-lg font-bold">
                                <Clock className="w-4 h-4" />
                                {timeLabel}
                            </div>
                            <div className="flex items-center gap-2 text-xs bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                                🚪 {exitCount} • 💻 {tabSwitchCount}
                            </div>
                            <div className="text-xs">
                                {Object.keys(localAnswers || {}).length}/{test?.questions?.length || 0}
                                ({((Object.keys(localAnswers || {}).length / (test?.questions?.length || 1)) * 100).toFixed(0)}%)
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => handleManualSubmit(false)}
                                disabled={!attempt || blocked}
                                className="px-6 py-2 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Test
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

                <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-100`}>
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800">Question Palette</h3>
                        <div className="text-sm text-gray-600 mt-2">Answered: {answeredCount}/{totalQuestions} ({progress}%)</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="grid grid-cols-5 gap-3">
                            {(sections[currentSection] || []).map((idx) => {
                                const isAnswered = localAnswers[idx] !== undefined;
                                const isCurrent = currentSection === allQuestions[idx]?.section && idx === currentQIndex;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            const sectionName = allQuestions[idx]?.section;
                                            if (sectionName) {
                                                setCurrentSection(sectionName);
                                                setCurrentQIndex(idx);
                                                setSidebarOpen(false);
                                            }
                                        }}
                                        className={`w-12 h-12 rounded-lg font-bold text-sm flex items-center justify-center transition-all duration-200 shadow-md border-2 ${isAnswered
                                            ? 'bg-green-500 text-white border-green-600 shadow-green-200 hover:shadow-green-300'  // ✅ GREEN - Attempted
                                            : isCurrent
                                                ? 'bg-yellow-500 text-white border-yellow-600 shadow-yellow-200 hover:shadow-yellow-300'  // 🟡 YELLOW - Current
                                                : 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300 hover:border-gray-400 shadow-gray-100'  // ⚪ GRAY - Not visited
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}

                        </div>
                    </div>

                    <div className="p-5 border-t border-gray-100 space-y-2 bg-gray-50">
                        <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 bg-green-500 rounded"></div><span>Answered</span></div>
                        <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 bg-yellow-500 rounded"></div><span>Current</span></div>
                        <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 bg-gray-100 rounded border"></div><span>Not Answered</span></div>
                    </div>
                </aside>

                <main className="flex-1 p-6 overflow-y-auto">
                    {/* 🟢 TEST INFO BAR - PASTE HERE (replaces sm:hidden div) */}
                    <div className="mb-8 p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 max-w-4xl">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-bold text-xl truncate max-w-[250px]">{test?.title}</span>
                                <span>•</span>
                                <span className="hidden lg:inline">{test?.institute}</span>
                            </div>
                            <div className="flex items-center gap-6 flex-wrap">
                                <div className="flex items-center gap-2 font-mono text-xl font-bold">
                                    <Clock className="w-5 h-5" />
                                    {timeLabel}
                                </div>
                                <div className="flex items-center gap-3 text-sm bg-white/20 px-4 py-2 rounded-xl">
                                    <span>🚪 {exitCount}</span>
                                    <span>💻 {tabSwitchCount}</span>
                                </div>
                                <div className="text-sm bg-white/10 px-4 py-2 rounded-xl">
                                    {Object.keys(localAnswers || {}).length}/{test?.questions?.length || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-2">
                            {answeredCount}/{totalQuestions} ({progress}%)
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sections</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(sections).map((s) => {
                                const isCompleted =
                                    completedSections[s] ||
                                    sections[s].every(q => localAnswers[q] !== undefined); return (
                                        <button
                                            key={s}
                                            onClick={() => setCurrentSection(s)}
                                            disabled={isCompleted}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${currentSection === s
                                                ? "bg-indigo-600 text-white"
                                                : isCompleted
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                                }`}
                                        >
                                            {isCompleted ? `✅ ${s}` : s}
                                        </button>
                                    );
                            })}

                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-sm text-gray-500">Question {qIndexInSection + 1} of {sectionQuestions.length} ({currentSection})</span>
                                <h3 className="text-xl font-semibold text-gray-800 mt-1">{currentQuestion?.questionText || "No question text"}</h3>
                            </div>
                            {currentQuestion?.marks && <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded">{currentQuestion.marks} mark{currentQuestion.marks > 1 ? "s" : ""}</span>}
                        </div>

                        <div className="space-y-4 mt-6">
                            {Array.isArray(currentQuestion?.options) && currentQuestion.options.length > 0 ? (
                                currentQuestion.options.map((opt, i) => (
                                    <label key={i} className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${localAnswers[currentQIndex] === i ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                                        <input
                                            type="radio"
                                            name={`q${currentQIndex}`}
                                            checked={localAnswers[currentQIndex] === i}
                                            onChange={() => selectAnswer(currentQIndex, i)}
                                            className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="ml-3 text-gray-800">{opt.text ?? opt}</span>
                                    </label>
                                ))) : (
                                <p className="text-gray-500 italic">No options available.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex gap-4">
                            <button onClick={handlePrev} disabled={qIndexInSection <= 0}
                                className="px-6 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">
                                Previous
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={qIndexInSection >= sectionQuestions.length - 1}
                                className="px-6 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                            >
                                Next
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={async () => {
                                    await saveAnswersToServer();

                                    // 🟢 SAVE TO LOCALSTORAGE + STATE
                                    const completedKey = `attempt_${attemptId}_completed_sections`;
                                    const newCompleted = { ...completedSections, [currentSection]: true };
                                    setCompletedSections(newCompleted);
                                    localStorage.setItem(completedKey, JSON.stringify(newCompleted));

                                    setCurrentSection(null);
                                }}

                                className="px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                            >
                                submit section
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-around items-center shadow-lg z-40">
                <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center text-xs text-gray-600"><Circle className="w-5 h-5" /><span>Palette</span></button>
                <button onClick={handlePrev} disabled={qIndexInSection === 0}
                    className="flex flex-col items-center text-xs text-gray-600 disabled:opacity-50">Prev</button>
                <button onClick={handleNext} disabled={qIndexInSection === sectionQuestions.length - 1}
                    className="flex flex-col items-center text-xs text-gray-600 disabled:opacity-50">Next</button>
                <button onClick={() => handleManualSubmit(false)} className="flex flex-col items-center text-xs font-medium text-indigo-600"><CheckCircle className="w-5 h-5" /><span>Submit</span></button>
            </div>
        </div>
    );
}
