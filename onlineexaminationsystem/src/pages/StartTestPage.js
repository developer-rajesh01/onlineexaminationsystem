import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, PlayCircle, XCircle } from "lucide-react";

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

export default function StartTestPage() {
    const { id: testId } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState("");
    const [startDisabled, setStartDisabled] = useState(false);
    const [starting, setStarting] = useState(false);
    const [remainingLabel, setRemainingLabel] = useState(null);
    const [remainingMs, setRemainingMs] = useState(NaN);

    // Clear session and block flags on entering this page
    useEffect(() => {
        sessionStorage.removeItem(SESSION_KEY);
        const scopedKey = `${START_DISABLED_KEY}_${testId}`;
        localStorage.removeItem(scopedKey);
        setStartDisabled(false);
        setError("");
    }, [testId]);

    // Load test
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/tests/${testId}`);
                if (!res.ok) throw new Error("Failed to load test");
                const data = await res.json();
                if (mounted) setTest(data.test || data);
            } catch (err) {
                if (mounted) setError(err.message || "Error loading test");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => (mounted = false);
    }, [testId]);

    // Hide header & check disabled
    useEffect(() => {
        document.body.classList.add("hide-header");
        return () => document.body.classList.remove("hide-header");
    }, [testId]);

    // Timer logic
    useEffect(() => {
        if (!test) return;

        const update = () => {
            const now = Date.now();
            const { startMs, endMs } = parseTestTimes(test);
            let label = "N/A";
            let rem = NaN;

            if (isFinite(startMs) && isFinite(endMs)) {
                if (now < startMs) {
                    label = `Duration: ${formatCountdownMs(endMs - startMs)}`;
                    rem = endMs - startMs;
                } else {
                    rem = Math.max(0, endMs - now);
                    label = `Remaining: ${formatCountdownMs(rem)}`;
                }
            } else if (typeof test.duration === "number") {
                const dur = test.duration * 60000;
                label = `Duration: ${formatCountdownMs(dur)}`;
                rem = dur;
            }

            setRemainingLabel(label);
            setRemainingMs(rem);
        };

        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [test]);

    // Session helpers
    const readAttempt = () => {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };
    const writeAttempt = (obj) => {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
        } catch (e) {
            console.warn(e);
        }
    };

    const requestFullscreen = async () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) return elem.requestFullscreen();
        throw new Error("Fullscreen not supported");
    };

    const onStart = async () => {
        if (!agree) return setError("You must agree to the terms.");
        if (startDisabled) return;
        setError("");
        setStarting(true);

        try {
            await requestFullscreen();
            writeAttempt({ id: testId, startedAt: Date.now() });

            const studentEmail = localStorage.getItem("email");
            const res = await fetch(`http://localhost:5000/api/tests/${testId}/attempt`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ studentEmail }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to create attempt");
            }

            const { attemptId } = await res.json();
            writeAttempt({ ...readAttempt(), attemptId });
            navigate(`/secure-test/${attemptId}`, { state: { hideHeader: true } });
        } catch (err) {
            setError(err.message || "Could not start test");
            if (document.fullscreenElement) await document.exitFullscreen();
        } finally {
            setStarting(false);
        }
    };

    // Loading
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
                    <div className="space-y-4">
                        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-medium">{error || "Test not found"}</p>
                </div>
            </div>
        );
    }

    const totalQuestions = test.questions?.length || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                {/* Main Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/30">
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{test.title}</h1>
                    <p className="text-sm text-gray-600 mb-8">
                        The test will open in fullscreen mode when you start.
                    </p>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-5 rounded-xl border border-sky-100">
                            <p className="text-xs font-medium text-sky-700 uppercase tracking-wider">Duration</p>
                            <p className="text-lg font-bold text-sky-900">
                                {test.duration ? `${test.duration} min` : "—"}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                            <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider">Marks</p>
                            <p className="text-lg font-bold text-indigo-900">{test.totalMarks ?? "—"}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100">
                            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Questions</p>
                            <p className="text-lg font-bold text-emerald-900">{totalQuestions}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-xl border border-gray-200">
                            <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">Time</p>
                            <p className="text-lg font-bold text-gray-900">{remainingLabel ?? "—"}</p>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-700 flex-shrink-0" />
                        <p className="text-sm text-amber-900 leading-relaxed">
                            <strong>Stay in fullscreen.</strong> Exiting fullscreen, switching tabs, or pressing{" "}
                            <kbd className="px-2 py-1 bg-amber-200 text-amber-800 rounded text-xs font-mono">Esc</kbd>{" "}
                            will <strong>end the test immediately</strong> and <strong>block future attempts</strong>.
                        </p>
                    </div>

                    {/* Agreement */}
                    <div className="mb-6 p-5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                                className="w-5 h-5 text-sky-600 rounded focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                            />
                            <span className="text-sm font-medium text-gray-800">
                                I agree: <strong>any exit from fullscreen ends the test</strong>
                            </span>
                        </label>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                            <XCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onStart}
                            disabled={!agree || startDisabled || starting}
                            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all transform hover:scale-105 shadow-lg ${agree && !startDisabled && !starting
                                ? "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700"
                                : "bg-gray-400 cursor-not-allowed"
                                }`}
                        >
                            <PlayCircle className="w-5 h-5" />
                            {starting ? "Starting..." : startDisabled ? "Start Blocked" : "Start Test"}
                            {isFinite(remainingMs) && remainingLabel?.startsWith("Remaining") && (
                                <span className="ml-2 text-sm opacity-90">({formatCountdownMs(remainingMs)})</span>
                            )}
                        </button>

                        <button
                            onClick={() => navigate("/student/dashboard")}
                            className="px-6 py-3.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Disabled Banner */}
                    {startDisabled && (
                        <div className="mt-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border border-red-300 rounded-xl flex items-center gap-3 text-red-700">
                            <Lock className="w-6 h-6 flex-shrink-0" />
                            <div>
                                <strong className="font-bold">Start Disabled</strong>
                                <p className="text-sm mt-1">You previously exited fullscreen. Access blocked.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6 font-mono">
                    Data from <span className="bg-gray-200 px-1.5 py-0.5 rounded">localStorage</span> • Secure • No tracking
                </p>
            </div>
        </div>
    );
}
