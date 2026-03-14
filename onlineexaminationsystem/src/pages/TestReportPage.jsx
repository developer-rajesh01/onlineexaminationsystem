// src/pages/TestReportPage.jsx
// not working it just a concept of my mind remaining on work
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";

function seededShuffle(array, seed) {
    // ... same as before ...
}

function TestReportPage() {
    const { attemptId } = useParams();
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        if (!attemptId) return;

        let cancelled = false;
        setLoading(true);
        setErrorMsg("");

        (async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Please login again");

                const aRes = await fetch(`http://localhost:5000/api/attempts/${attemptId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!aRes.ok) throw new Error("Failed to load attempt details");
                const aBody = await aRes.json().catch(() => ({}));
                const fullAttempt = aBody.attempt || aBody.data || aBody;
                if (cancelled) return;

                setAttempt(fullAttempt);

                const testId =
                    fullAttempt.testId?._id ||
                    fullAttempt.testId?.id ||
                    fullAttempt.testId ||
                    fullAttempt.testIdRaw;

                if (!testId) throw new Error("Test not found for this attempt");

                const tRes = await fetch(`http://localhost:5000/api/tests/${testId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!tRes.ok) throw new Error("Failed to load test questions");
                const tBody = await tRes.json().catch(() => ({}));
                const test = tBody.test || tBody.data || tBody;

                const testQuestionsRaw = Array.isArray(test.questions) ? test.questions : [];
                const testQuestions = seededShuffle(testQuestionsRaw, fullAttempt._id);

                if (testQuestions.length === 0) {
                    throw new Error("No questions found for this test");
                }

                const answersArr = Array.isArray(fullAttempt.answers) ? fullAttempt.answers : [];
                const byIndex = {};
                answersArr.forEach((ans) => {
                    if (typeof ans.qIndex === "number") {
                        byIndex[ans.qIndex] = ans;
                    }
                });

                const built = testQuestions.map((q, idx) => {
                    const ans = byIndex[idx];
                    const correctIdx =
                        typeof q.correctIdx === "number"
                            ? q.correctIdx
                            : typeof q.correctOptionIndex === "number"
                                ? q.correctOptionIndex
                                : 0;
                    const selectedIdx =
                        ans && typeof ans.selectedIdx === "number" ? ans.selectedIdx : null;
                    const isCorrect =
                        selectedIdx !== null && selectedIdx === correctIdx;

                    const optionsRaw = Array.isArray(q.options) ? q.options : [];
                    const options = optionsRaw
                        .map((opt) => (opt?.text ?? opt ?? ""))
                        .map((s) => String(s));

                    return {
                        id: idx + 1,
                        questionText:
                            q.questionText || q.question || q.text || `Question ${idx + 1}`,
                        options,
                        selectedIdx,
                        correctIdx,
                        isCorrect,
                        marks: isCorrect ? 1 : 0,
                        totalMarks: 1,
                    };
                });

                setQuestions(built);
            } catch (err) {
                setErrorMsg(err.message || "Failed to load attempt details");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [attemptId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p>Loading report...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-red-600">{errorMsg}</p>
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p>Attempt not found.</p>
            </div>
        );
    }

    // ✅ Full guard for `questions`:
    const safeQuestions = Array.isArray(questions) ? questions : [];
    const correctCount = safeQuestions.filter((q) => q.isCorrect).length;
    const wrongCount = safeQuestions.length - correctCount;
    const percentage = attempt.totalMarks > 0
        ? Math.round((attempt.score / attempt.totalMarks) * 100)
        : 0;

    const pieData = {
        labels: ["Correct", "Wrong"],
        datasets: [
            {
                data: [correctCount, wrongCount],
                backgroundColor: ["#10B981", "#EF4444"],
                borderWidth: 0,
                hoverOffset: 12,
            },
        ],
    };

    // 🐞 Optional: print if `questions` is not array-like (remove in prod)
    if (!Array.isArray(questions)) {
        console.warn("questions is not an array:", questions);
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {attempt.testTitle || "Test Report"}
                </h1>
                <p className="text-gray-600 mb-6">
                    Score: {attempt.score}/{attempt.totalMarks} ({percentage}%)
                </p>

                <div className="h-64 mb-8">
                    <Doughnut data={pieData} />
                </div>

                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Question review
                </h2>
                <div className="space-y-4">
                    {safeQuestions.map((q) => (
                        <div
                            key={q.id}
                            className={`p-4 rounded-lg border ${q.isCorrect
                                    ? "bg-emerald-50 border-emerald-200"
                                    : "bg-red-50 border-red-200"
                                }`}
                        >
                            <div className="font-medium text-gray-900">
                                Q{q.id}. {q.questionText}
                            </div>
                            <div className="text-gray-700 text-sm mt-2">
                                {q.selectedIdx === null ? (
                                    "Not Answered"
                                ) : q.isCorrect ? (
                                    <span className="text-emerald-700">Correct</span>
                                ) : (
                                    <span className="text-red-700">Wrong</span>
                                )}
                            </div>
                            <div className="mt-3 space-y-2">
                                {(Array.isArray(q.options) ? q.options : []).map((opt, i) => {
                                    const isSelected = q.selectedIdx === i;
                                    const isCorrectOpt = q.correctIdx === i;
                                    const bgColor =
                                        isCorrectOpt
                                            ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                                            : isSelected
                                                ? "bg-red-100 border-red-300 text-red-900"
                                                : "bg-gray-50 border-gray-200 text-gray-800";

                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-3 p-2 border rounded ${bgColor}`}
                                        >
                                            <span className="text-sm font-medium">
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TestReportPage;
