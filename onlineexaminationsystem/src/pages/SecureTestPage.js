import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Menu, X, AlertCircle, Clock, LogOut, CheckCircle, Circle } from "lucide-react";

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

export default function SecureTestPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();

    const [attempt, setAttempt] = useState(null);
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSection, setCurrentSection] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [localAnswers, setLocalAnswers] = useState({});
    const [exitCount, setExitCount] = useState(0);
    const [blocked, setBlocked] = useState(false);
    const [timeRemainingMs, setTimeRemainingMs] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const tickRef = useRef(null);
    const incInProgressRef = useRef(false);
    const fullscreenEnteredRef = useRef(false);

    // Load attempt & test
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const res = await fetch(`http://localhost:5000/api/attempts/${attemptId}`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Attempt not found");
                const a = await res.json();

                if (!mounted) return;

                setAttempt(a);
                setExitCount(a.exitCount || 0);
                setBlocked(!!a.blocked);

                const tRes = await fetch(`http://localhost:5000/api/tests/${a.testId}`);
                const tb = await tRes.json();
                const t = tb.test || tb;
                if (!mounted) return;

                setTest(t);

                const answersMap = {};
                (a.answers || []).forEach((ans) => {
                    if (typeof ans.selectedIdx === "number") answersMap[ans.qIndex] = ans.selectedIdx;
                });
                setLocalAnswers(answersMap);

                const questions = Array.isArray(t.questions) ? t.questions : [];
                const sections = questions.reduce((acc, q, idx) => {
                    const s = q.section || "Default";
                    if (!acc[s]) acc[s] = [];
                    acc[s].push(idx);
                    return acc;
                }, {});

                const firstSection = Object.keys(sections)[0] || null;
                setCurrentSection(firstSection);
                setCurrentQIndex((sections[firstSection]?.[0]) ?? 0);

                const startedAt = new Date(a.startedAt).getTime();
                const durationMs = (a.durationMinutes || t.duration || 0) * 60000;
                const endAt = startedAt + durationMs;
                setTimeRemainingMs(Math.max(0, endAt - Date.now()));
            } catch (err) {
                console.error(err);
                alert("Unable to load attempt/test: " + (err.message || ""));
                navigate(-1);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => (mounted = false);
    }, [attemptId, navigate]);

    // Enter fullscreen on test load
    useEffect(() => {
        if (!test || !attempt) return;
        const attemptFullscreen = async () => {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                try {
                    await document.documentElement.requestFullscreen();
                    fullscreenEnteredRef.current = true;
                } catch (err) {
                    console.warn("Fullscreen failed", err);
                }
            }
        };
        attemptFullscreen();
    }, [test, attempt]);

    // Server call to increment exit count
    const incExitOnServer = async () => {
        if (incInProgressRef.current) return null;
        incInProgressRef.current = true;
        try {
            const r = await fetch(`http://localhost:5000/api/attempts/${attemptId}/inc-exit`, {
                method: "PUT",
                credentials: "include",
            });
            const body = await r.json().catch(() => ({}));
            incInProgressRef.current = false;
            return body;
        } catch (err) {
            incInProgressRef.current = false;
            console.error("inc-exit failed", err);
            return null;
        }
    };

    // Handle fullscreen/tab exit detection
    const handleDetectedExit = async () => {
        if (!fullscreenEnteredRef.current || blocked) return;
        const body = await incExitOnServer();
        if (!body) return;

        setExitCount(body.exitCount || 0);

        if (body.status === "forfeited" || body.blocked) {
            setBlocked(true);
            try { localStorage.setItem("startDisabled", "true"); } catch (e) { }
            alert("You exited fullscreen too many times. This attempt is forfeited.");
            setTimeout(() => navigate("/student/dashboard"), 1500);
            return;
        }

        alert(`Warning: You left fullscreen. Attempt ${body.exitCount || 0} of 3. Stay in fullscreen!`);
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch { }
    };

    // Monitor fullscreen & tab switching
    useEffect(() => {
        if (!attempt || blocked) return;
        let lastBlurTs = 0;

        const onFullscreenChange = () => {
            if (!document.fullscreenElement) {
                handleDetectedExit();
            } else {
                fullscreenEnteredRef.current = true;
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                handleDetectedExit();
            }
        };

        const onBlur = () => {
            const now = Date.now();
            if (now - lastBlurTs < 500) return;
            lastBlurTs = now;
            handleDetectedExit();
        };

        document.addEventListener("fullscreenchange", onFullscreenChange);
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("blur", onBlur);

        return () => {
            document.removeEventListener("fullscreenchange", onFullscreenChange);
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("blur", onBlur);
        };
    }, [attempt, attemptId, blocked]);

    // Timer tick
    useEffect(() => {
        if (!attempt || !test || blocked) return;

        tickRef.current = setInterval(() => {
            const startedAt = new Date(attempt.startedAt).getTime();
            const durationMs = (attempt.durationMinutes || test.duration || 0) * 60000;
            const endAt = startedAt + durationMs;
            const remain = Math.max(0, endAt - Date.now());
            setTimeRemainingMs(remain);

            if (remain <= 0) {
                clearInterval(tickRef.current);
                handleSubmit(true); // auto-submit
            }
        }, 1000);

        return () => clearInterval(tickRef.current);
    }, [attempt, test, localAnswers, blocked]);

    // Navigation handlers
    const selectAnswer = (qIdx, idx) => setLocalAnswers((prev) => ({ ...prev, [qIdx]: idx }));

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
        } catch (err) {
            console.warn("Auto-save failed", err);
        }
    };

    const handleSubmit = async (auto = false) => {
        if (blocked || !attempt) return;

        const confirmMsg = auto
            ? "Time's up! Submitting automatically..."
            : "Are you sure you want to submit? This action cannot be undone.";

        if (!auto && !window.confirm(confirmMsg)) return;

        try {
            const answersArr = Object.entries(localAnswers).map(([qIndexStr, selectedIdx]) => ({
                qIndex: Number(qIndexStr),
                selectedIdx,
            }));

            const res = await fetch(`http://localhost:5000/api/attempts/${attemptId}/submit`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: answersArr, forfeit: false }),
            });

            const body = await res.json();
            if (!res.ok) throw new Error(body.message || "Submit failed");

            alert(`Submitted! Score: ${body.score ?? "N/A"} / ${body.totalMarks ?? "N/A"}`);
            if (document.fullscreenElement) await document.exitFullscreen().catch(() => { });
            navigate("/student/dashboard");
        } catch (err) {
            console.error("Submit error", err);
            alert("Submit failed: " + (err.message || "Network error"));
        }
    };

    // Loading & blocked states
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading secure test...</p>
                </div>
            </div>
        );
    }

    if (blocked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-700">Test Blocked</h2>
                    <p className="text-gray-600 mt-2">You exited fullscreen too many times. This attempt has been forfeited.</p>
                    <button
                        onClick={() => navigate("/student/dashboard")}
                        className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!test || !attempt) {
        return <div className="p-6 text-red-600">Test data not available.</div>;
    }

    // Prepare data
    const questions = Array.isArray(test.questions) ? test.questions : [];
    const sections = getSections();
    const currentSectionQuestions = sections[currentSection] || [];
    const qIndex = currentQIndex;
    const q = questions[qIndex] || {};
    const totalQuestions = questions.length;

    const questionStatuses = questions.map((_, idx) => {
        if (localAnswers[idx] !== undefined) return 1; // answered
        if (idx === currentQIndex) return 2; // current
        return 0; // not visited
    });

    const answeredCount = Object.keys(localAnswers).length;
    const progress = ((answeredCount / totalQuestions) * 100).toFixed(0);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">{test.title}</h1>
                        <p className="text-xs text-gray-500">{test.institute} • {test.courseName || test.targetAudience}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1 text-red-600 font-mono text-lg">
                            <Clock className="w-5 h-5" />
                            {formatCountdownMs(timeRemainingMs)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <LogOut className="w-3 h-3" />
                            Exits: {exitCount}/3
                        </div>
                    </div>
                    <button
                        onClick={() => handleSubmit(false)}
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition"
                    >
                        Submit
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row">
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar - Responsive */}
                <aside
                    className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out flex flex-col`}
                >
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-gray-700">Question Palette</h3>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-1 rounded hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-xs text-gray-600">
                            Answered: {answeredCount}/{totalQuestions} ({progress}%)
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((_, idx) => {
                                const status = questionStatuses[idx];
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setCurrentQIndex(idx);
                                            setSidebarOpen(false);
                                        }}
                                        className={`w-9 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center ${status === 1
                                                ? "bg-green-500 text-white"
                                                : status === 2
                                                    ? "bg-red-500 text-white ring-2 ring-offset-2 ring-red-500"
                                                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 border-t space-y-3">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span>Answered</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>Current</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <span>Not Visited</span>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    {/* Mobile Timer */}
                    <div className="sm:hidden flex justify-between items-center mb-4 p-3 bg-white rounded-lg shadow">
                        <div className="flex items-center gap-1 text-red-600 font-mono">
                            <Clock className="w-5 h-5" />
                            {formatCountdownMs(timeRemainingMs)}
                        </div>
                        <div className="text-xs text-gray-500">
                            Exits: {exitCount}/3
                        </div>
                    </div>

                    {/* Sections */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sections</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(sections).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setCurrentSection(s)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentSection === s
                                            ? "bg-sky-600 text-white"
                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-white rounded-xl shadow-md p-5 lg:p-6 mb-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-sm text-gray-500">Question {qIndex + 1} of {totalQuestions}</span>
                                <h3 className="text-lg lg:text-xl font-semibold text-gray-800 mt-1">
                                    {q?.questionText || "No question text"}
                                </h3>
                            </div>
                            {q.marks && (
                                <span className="text-sm font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded">
                                    {q.marks} mark{q.marks > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 mt-5">
                            {Array.isArray(q.options) && q.options.length > 0 ? (
                                q.options.map((opt, i) => (
                                    <label
                                        key={i}
                                        className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${localAnswers[qIndex] === i
                                                ? "border-sky-600 bg-sky-50"
                                                : "border-gray-200 hover:border-gray-300 bg-white"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q${qIndex}`}
                                            checked={localAnswers[qIndex] === i}
                                            onChange={() => selectAnswer(qIndex, i)}
                                            className="w-5 h-5 text-sky-600 focus:ring-sky-500"
                                        />
                                        <span className="ml-3 text-gray-800">{opt.text ?? opt}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No options available.</p>
                            )}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex flex-wrap gap-3 justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrev}
                                disabled={currentSectionQuestions.indexOf(currentQIndex) === 0}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ← Previous
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentSectionQuestions.indexOf(currentQIndex) === currentSectionQuestions.length - 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={saveAnswersToServer}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                            >
                                Save Progress
                            </button>
                            <button
                                onClick={() => handleSubmit(false)}
                                className="px-6 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition"
                            >
                                Submit Test
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-around items-center shadow-lg">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex flex-col items-center text-xs text-gray-600"
                >
                    <Circle className="w-5 h-5" />
                    <span>Palette</span>
                </button>
                <button
                    onClick={handlePrev}
                    className="flex flex-col items-center text-xs text-gray-600"
                >
                    ← Prev
                </button>
                <button
                    onClick={handleNext}
                    className="flex flex-col items-center text-xs text-gray-600"
                >
                    Next →
                </button>
                <button
                    onClick={() => handleSubmit(false)}
                    className="flex flex-col items-center text-xs font-medium text-sky-600"
                >
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit</span>
                </button>
            </div>
        </div>
    );
}