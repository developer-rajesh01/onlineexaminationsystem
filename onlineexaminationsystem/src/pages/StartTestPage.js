import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, PlayCircle, XCircle } from "lucide-react";

const SESSION_KEY = "currentTestAttempt";
const START_DISABLED_KEY = "testStartDisabled";

export default function StartTestPage() {
    const { id: testId } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState("");
    const [startDisabled, setStartDisabled] = useState(false);

    // -----------------------------------------------------------------
    // Load test meta (title, duration, marks, question count)
    // -----------------------------------------------------------------
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/tests/${testId}`);
                if (!res.ok) throw new Error("Failed to load test");
                const data = await res.json();
                const t = data.test || data;
                if (mounted) setTest(t);
            } catch (err) {
                setError(err.message || "Error loading test");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => (mounted = false);
    }, [testId]);

    // -----------------------------------------------------------------
    // Hide header + read disabled flag
    // -----------------------------------------------------------------
    useEffect(() => {
        document.body.classList.add("hide-header");
        const disabled = localStorage.getItem(START_DISABLED_KEY) === "true";
        setStartDisabled(disabled);
        return () => document.body.classList.remove("hide-header");
    }, []);

    // -----------------------------------------------------------------
    // Session helpers
    // -----------------------------------------------------------------
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

    // -----------------------------------------------------------------
    // START BUTTON – create attempt → navigate
    // -----------------------------------------------------------------
    const onStart = async () => {
        if (!agree) return setError("You must agree to the terms.");
        if (startDisabled) return;

        setError("");
        writeAttempt({ id: testId, startedAt: Date.now() });

        try {
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

            const payload = await res.json();
            const attemptId = payload.attemptId;

            // store attemptId for the secure page
            writeAttempt({ ...readAttempt(), attemptId });

            // navigate to secure test (header hide flag)
            navigate(`/secure-test/${attemptId}`, { state: { hideHeader: true } });
        } catch (err) {
            setError(err.message || "Could not start test");
        }
    };

    // -----------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-pulse space-y-4 w-full max-w-xl p-8">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="p-6 text-center text-red-600">
                {error || "Test not found"}
            </div>
        );
    }

    const totalQuestions = test.questions?.length || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">

                <h1 className="text-3xl font-bold text-gray-800 mb-2">{test.title}</h1>
                <p className="text-sm text-gray-500 mb-6">
                    The test will open in fullscreen mode automatically.
                </p>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
                    <div className="bg-sky-50 p-4 rounded-lg">
                        <strong className="block text-sky-700">Duration</strong>
                        <span>{test.duration} minutes</span>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                        <strong className="block text-indigo-700">Total Marks</strong>
                        <span>{test.totalMarks}</span>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg">
                        <strong className="block text-emerald-700">Questions</strong>
                        <span>{totalQuestions}</span>
                    </div>
                </div>

                {/* Warning */}
                <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        <strong>Stay in fullscreen.</strong> Leaving fullscreen, switching tabs,
                        or pressing <kbd>Esc</kbd> will <strong>terminate the test instantly</strong> and
                        <strong> disable starting any test</strong> in this browser.
                    </div>
                </div>

                {/* Agreement */}
                <div className="mb-6 p-5 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agree}
                            onChange={(e) => setAgree(e.target.checked)}
                            className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
                        />
                        <span className="text-sm">
                            I understand that <strong>any exit from fullscreen ends the test</strong>.
                        </span>
                    </label>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onStart}
                        disabled={!agree || startDisabled}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${agree && !startDisabled
                            ? "bg-sky-600 hover:bg-sky-700 text-white shadow-md"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        <PlayCircle className="w-5 h-5" />
                        {startDisabled ? "Start Disabled" : "Start Test"}
                    </button>

                    <button
                        onClick={() => navigate("/student/dashboard")}
                        className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                </div>

                {/* Disabled banner */}
                {startDisabled && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 text-red-700">
                        <Lock className="w-6 h-6" />
                        <div>
                            <strong>Test starting disabled.</strong><br />
                            You previously left fullscreen.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
