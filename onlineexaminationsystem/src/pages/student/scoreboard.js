import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend
);

function seededShuffle(array, seed) {
  const arr = [...array];
  let m = arr.length, t, i;

  const s = String(seed ?? "");
  let h = 0;
  for (let j = 0; j < s.length; j++) {
    h = (h * 31 + s.charCodeAt(j)) & 0xffffffff;
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

// Simple row for attempt list
function ScoreRow({ attempt, onClick }) {
  const percentage = attempt.score && attempt.totalMarks
    ? Math.round((attempt.score / attempt.totalMarks) * 100)
    : 0;
  const status = percentage >= 60 ? 'Pass' : 'Fail';

  return (
    <div
      className="group relative border border-gray-200/80 rounded-2xl p-6 mb-5 bg-white shadow-sm hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => onClick(attempt)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-1">
            {attempt.testTitle || `Attempt #${attempt._id?.slice(-6)?.toUpperCase() || 'N/A'}`}
          </h4>
          <p className="text-sm text-gray-500">
            {new Date(attempt.submittedAt).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">{percentage}%</div>
            <div className="text-sm text-gray-600">{attempt.score || 0}/{attempt.totalMarks || 0}</div>
          </div>
          <span className={`px-5 py-1.5 rounded-full text-sm font-semibold shadow-sm ${status === 'Pass'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
            {status}
          </span>
          {attempt.exitCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium border border-amber-200">
              Tab switches: {attempt.exitCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// New Detailed Attempt Modal with Question-wise review
function AttemptDetailModal({ attempt, onClose }) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [openQuestionId, setOpenQuestionId] = useState(null);

  useEffect(() => {
    if (!attempt?.testId) return;

    const fetchTestDetails = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const token = localStorage.getItem("token");

        const res = await fetch(
          `http://localhost:5000/api/tests/${attempt.testId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!res.ok) throw new Error("Failed to fetch test");

        const data = await res.json();
        const test = data.test;
        let allQuestions = [];

        if (Array.isArray(test.questions) && test.questions.length > 0) {
          allQuestions = test.questions;
        } else if (Array.isArray(test.sections)) {
          allQuestions = test.sections.flatMap(section =>
            Array.isArray(section.questions) ? section.questions : []
          );
        }

        const questionsData = allQuestions.map((q, index) => {
          const studentAnswer = (attempt.answers || []).find(
            a => String(a.questionId) === String(q._id)
          );

          const selectedOptionId = studentAnswer?.selectedOptionId || null;

          const correctIdx = (q.options || []).findIndex(
            opt => String(opt._id) === String(q.correctOptionId)
          );

          const selectedIdx = (q.options || []).findIndex(
            opt => String(opt._id) === String(selectedOptionId)
          );

          const isCorrect =
            selectedOptionId &&
            String(selectedOptionId) === String(q.correctOptionId);

          return {
            id: index + 1,
            questionText: q.questionText || "Question",
            options: (q.options || []).map(o => o.text || ""),
            selectedIdx: selectedIdx >= 0 ? selectedIdx : null,
            correctIdx: correctIdx >= 0 ? correctIdx : null,
            isCorrect: !!isCorrect
          };
        });

        setQuestions(questionsData);
         

      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();

  }, [attempt]);


  const correctCount = (questions || []).filter(q => q.isCorrect).length;
  const wrongCount = (questions || []).length - correctCount;
  const pieData = {
    labels: ['Correct', 'Wrong'],
    datasets: [{
      data: [correctCount, wrongCount],
      backgroundColor: ['#10B981', '#EF4444'],
      borderWidth: 0,
      hoverOffset: 12,
    }]
  };

  if (!attempt) return null;

  const percentage = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-gray-100">

        {/* Header */}
        <div className="px-8 py-6 bg-white border-b border-gray-100 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
              {attempt.testTitle || 'Attempt Review'}
            </h2>
            <p className="text-gray-600 mt-1">
              {new Date(attempt.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              <span className="mx-2 text-gray-300">•</span>
              <span className="font-semibold text-gray-900">{percentage}%</span>
              <span className="mx-2 text-gray-300">•</span>
              {attempt.score}/{attempt.totalMarks}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-500 border-b-4 border-indigo-200 mb-6"></div>
              <p className="text-gray-600 font-medium">Loading your performance details...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-600 font-medium">{errorMsg}</p>
            </div>
          ) : (
            <>
              {/* Summary Chart */}
              <div className="mb-10 bg-gray-50 rounded-2xl p-6 shadow-inner">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Performance overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="h-64 md:h-72">
                    <Doughnut
                      data={pieData}
                      options={{
                        cutout: '65%',
                        plugins: {
                          legend: { position: 'bottom', labels: { font: { size: 14 }, padding: 20 } },
                          tooltip: { enabled: true }
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                      <span className="text-lg font-medium text-gray-700">Correct Answers</span>
                      <span className="text-2xl font-bold text-emerald-600">{correctCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                      <span className="text-lg font-medium text-gray-700">Wrong Answers</span>
                      <span className="text-2xl font-bold text-red-600">{wrongCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                      <span className="text-lg font-medium text-gray-700">Score</span>
                      <span className="text-2xl font-bold text-indigo-600">{attempt.score}/{attempt.totalMarks} ({percentage}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question List */}
              <h3 className="text-xl font-bold text-gray-800 mb-5">
                Question review
              </h3>
              <div className="space-y-4">
                    {(questions || []).map((q) => (
                  <div
                    key={q.id}
                    className={`p-5 rounded-xl border transition-all duration-200 ${q.isCorrect
                      ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                      : 'bg-red-50 border-red-200 hover:border-red-400'
                      }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenQuestionId((prev) => (prev === q.id ? null : q.id))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenQuestionId((prev) => (prev === q.id ? null : q.id));
                      }
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">
                          Q{q.id}. {q.questionText}
                        </div>
                        <div className="text-sm mt-2">
                          {q.selectedIdx === null ? (
                            <span className="text-gray-700 font-medium">Not Answered</span>
                          ) : q.isCorrect ? (
                            <span className="text-emerald-700 font-medium">Correct</span>
                          ) : (
                            <span className="text-red-700 font-medium">Wrong</span>
                          )}
                          <span className="ml-3 text-xs text-gray-600">
                            {openQuestionId === q.id ? "Click to hide options" : "Click to view options"}
                          </span>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${q.isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                        {q.isCorrect ? '✓' : '✗'}
                      </div>
                    </div>

                    {/* Options with student answer + correct answer highlighting */}
                    {openQuestionId === q.id && (
                      <div className="mt-4 space-y-2">
                        {(q.options || []).map((optText, i) => {
                          const isSelected = q.selectedIdx === i;
                          const isCorrectOpt = q.correctIdx === i;
                          const isWrongSelected = isSelected && !isCorrectOpt;

                          const cls = isCorrectOpt
                            ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                            : isWrongSelected
                              ? "border-red-300 bg-red-100 text-red-900"
                              : "border-gray-200 bg-white text-gray-800";

                          return (
                            <div
                              key={i}
                              className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${cls}`}
                            >
                              <div className="flex-1">
                                <div className="font-medium">
                                  {String.fromCharCode(65 + i)}. {optText || `Option ${i + 1}`}
                                </div>
                                <div className="text-xs mt-1 space-x-2">
                                  {isCorrectOpt && (
                                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-semibold">
                                      Correct Answer
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className={`inline-block px-2 py-0.5 rounded font-semibold ${isCorrectOpt ? "bg-emerald-200 text-emerald-900" : "bg-red-200 text-red-900"}`}>
                                      Your Answer
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-bold">
                                {isCorrectOpt ? "✓" : isWrongSelected ? "✗" : ""}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Scoreboard() {

  const location = useLocation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [assignedTests, setAssignedTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [testsError, setTestsError] = useState("");
  const submittedAttempts = exams.filter(a => a.status === 'submitted');

  useEffect(() => {
    fetchAttempts(false);
  }, []);

  // If coming from dashboard "View report", auto-open that attempt
  useEffect(() => {
    const openAttemptId = location?.state?.openAttemptId;
    if (!openAttemptId) return;
    const match = exams.find((a) => String(a._id) === String(openAttemptId));
    if (match) setSelectedAttempt(match);
  }, [location?.state?.openAttemptId, exams]);

  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      try {
        setTestsLoading(true);
        setTestsError("");

        const token = localStorage.getItem("token");
        const course = localStorage.getItem("branch") || "";
        const institute = localStorage.getItem("institute") || "";

        const params = new URLSearchParams();
        if (course) params.append("course", course);
        if (institute) params.append("institute", institute);

        const res = await fetch(`http://localhost:5000/api/tests?${params.toString()}`, {
          signal: ctl.signal,
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json().catch(() => ({}));

        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.tests)
            ? data.tests
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const normalized = arr
          .map((t) => ({ ...t, _id: t?._id || t?.id }))
          .filter((t) => t && t._id);

        setAssignedTests(normalized);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setAssignedTests([]);
          setTestsError(err?.message || "Failed to load tests");
        }
      } finally {
        setTestsLoading(false);
      }
    })();

    return () => ctl.abort();
  }, []);

  const fetchAttempts = async (force = false) => {
    try {
      setLoading(true);
      setError('');
      const studentEmail = localStorage.getItem("email");
      const token = localStorage.getItem("token");
      if (!studentEmail || !token) throw new Error('Please login first');

      if (!force) {
        const cached = getAttemptsFromLocalStorage(studentEmail);
        const safeCached = Array.isArray(cached) ? cached.filter(a => a && a._id) : [];
        if (safeCached.length > 0) {
          setExams(safeCached);
          setLoading(false);
          return;
        }
      }
      const res = await fetch(`http://localhost:5000/api/attempts?email=${encodeURIComponent(studentEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: "include"
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const studentAttempts = data.attempts || [];

      const formatted = studentAttempts.map(a => ({
        _id: a._id,
        score: a.score || 0,
        totalMarks: a.totalMarks || 0,
        exitCount: a.exitCount || 0,
        submittedAt: a.submittedAt,
        startedAt: a.startedAt,
        durationMinutes: a.durationMinutes,
        status: a.status || "submitted",
        testId: String(a.testId?._id || a.testId),
        testIdRaw: a.testId,
        testTitle: a.testId?.title || a.testTitle || 'Practice Test',
        results: a.results || [],           // 🔥 ADD THIS LINE
        answers: a.answers || []            // 🔥 ADD THIS LINE
      }));



      cacheAttemptsToLocalStorage(studentEmail, formatted);
      setExams(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAttemptsFromLocalStorage = (email) => {
    try {
      const key = `attempts_${email}`;
      const cached = localStorage.getItem(key);
      if (!cached) return [];
      const { attempts, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 10 * 60 * 1000)  return attempts || [];
      return [];
    } catch {
      return [];
    }
  };

  const cacheAttemptsToLocalStorage = (email, attempts) => {
    try {
      const key = `attempts_${email}`;
      localStorage.setItem(key, JSON.stringify({ attempts, timestamp: Date.now() }));
    } catch { }
  };

  // const attemptedTestIds = new Set(exams.map((a) => a.testId).filter(Boolean).map((id) => String(id)));
  // const assignedCount = assignedTests.length;
  // const studentCourse = localStorage.getItem("course") || "";
  const studentBranch = localStorage.getItem("branch") || "";
  const studentInstitute = localStorage.getItem("institute") || "";
  // const attemptedAssignedCount = assignedTests.filter((t) => attemptedTestIds.has(String(t._id))).length;
  // const notAttemptedAssignedCount = Math.max(0, assignedCount - attemptedAssignedCount);

  // 2) Filter: only tests where targetAudience matches student's course
  const myCourseTests = assignedTests.filter((t) => {
    const testTarget = t.targetAudience || "";  // <-- your field in DB
    return testTarget === studentBranch;
  });

  // 3) Optional: further filter by branch/institute if needed
  const myBranchTests = myCourseTests.filter((t) => {
    // const tBranch = t.branch || "";
    const tInstitute = t.institute || "";

    // (!studentBranch || tBranch === studentBranch) &&
    return (!studentInstitute || tInstitute === studentInstitute);

  });

  // 4) Total tests for this student's course (and branch/institute)
  const assignedCount = myBranchTests.length;

  // 5) Set of testIds the student has attempted
  const attemptedTestIds = new Set(
    exams
      .filter(a => a.status === "submitted")
      .map((a) => String(a.testId))
      .filter(Boolean)
  );

  // 6) Count how many of these tests are attempted
  const attemptedAssignedCount = myBranchTests.filter((t) =>
    attemptedTestIds.has(String(t._id))
  ).length;

  // 7) Not attempted = total − attempted
  const notAttemptedAssignedCount = Math.max(0, assignedCount - attemptedAssignedCount);


  const safePct = (a) => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0;
  const avgPct = submittedAttempts.length
    ? safePct({
      score: submittedAttempts.reduce((sum, a) => sum + (a.score || 0), 0),
      totalMarks: submittedAttempts.reduce((sum, a) => sum + (a.totalMarks || 0), 0),
    })
    : 0;
  const bestPct = submittedAttempts.length ? Math.max(...submittedAttempts.map(safePct)) : 0;

  const getPerformanceChartData = () => {
    const recent = [...submittedAttempts]
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .slice(-12);

    const scoreSeries = recent.map(safePct).map(v => Math.round(v));
    const avgSeries = scoreSeries.map((_, i) => {
      const slice = scoreSeries.slice(0, i + 1);
      const avg = slice.reduce((sum, x) => sum + x, 0) / slice.length;
      return Math.round(avg);
    });

    return {
      labels: recent.map(a => new Date(a.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
      datasets: [
        {
          label: 'Score %',
          data: scoreSeries,
          borderColor: '#8B5CF6',
          backgroundColor: '#8B5CF630',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Average %',
          data: avgSeries,
          borderColor: '#10B981',
          backgroundColor: '#10B98110',
          tension: 0.3,
          fill: false,
        },
      ],
    };
  };

  const performanceChartData = getPerformanceChartData();

  const attemptStatusPie = {
    labels: ['Attempted', 'Not attempted'],
    datasets: [{
      data: [attemptedAssignedCount, notAttemptedAssignedCount],
      backgroundColor: ['#10B981', '#E5E7EB'],
      borderWidth: 0,
      hoverOffset: 10,
    }]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-700">Loading your results...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
            Results
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Review your performance and open any attempt for a detailed question review.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/60">
            <div className="text-sm text-gray-500">Attempts (submitted)</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{submittedAttempts.length}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/60">
            <div className="text-sm text-gray-500">Average score</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{Math.round(avgPct)}%</div>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/60">
            <div className="text-sm text-gray-500">Best score</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{Math.round(bestPct)}%</div>
          </div>
        </div>

        {/* Performance Chart */}
        {(submittedAttempts.length > 0 || assignedCount > 0) && (
          <div className="mb-14 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-3xl p-6 lg:p-8 shadow-xl border border-white/60 hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Performance
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Score percentage per attempt with your running average (higher is better).
              </p>
              {submittedAttempts.length > 0 ? (
                <div className="h-72 lg:h-96">
                  <Line
                    data={performanceChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top' } },
                      scales: { y: { beginAtZero: true, max: 100 } }
                    }}
                  />
                </div>
              ) : (
                <div className="h-72 lg:h-96 flex items-center justify-center text-gray-600">
                  No submitted attempts yet.
                </div>
              )}
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 lg:p-8 shadow-xl border border-white/60 hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Attempts status
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Tests assigned: {assignedCount || "—"}
              </p>

              {testsLoading ? (
                <div className="h-64 flex items-center justify-center text-gray-600">
                  Loading tests...
                </div>
              ) : testsError ? (
                <div className="h-64 flex items-center justify-center text-red-600 text-sm text-center">
                  {testsError}
                </div>
              ) : assignedCount === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-600 text-sm text-center">
                  No assigned tests found.
                </div>
              ) : (
                <div className="h-64">
                  <Doughnut
                    data={attemptStatusPie}
                    options={{
                      cutout: '70%',
                      plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 13 }, padding: 16 } },
                        tooltip: { enabled: true }
                      }
                    }}
                  />
                </div>
              )}

              {!testsLoading && !testsError && assignedCount > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <div className="text-gray-600">Attempted</div>
                    <div className="text-lg font-bold text-emerald-700">{attemptedAssignedCount}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="text-gray-600">Not attempted</div>
                    <div className="text-lg font-bold text-gray-800">{notAttemptedAssignedCount}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attempts List */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Attempts ({submittedAttempts.length})
              </h2>
              <p className="text-gray-600 mt-2">
                Click an attempt to see question-by-question review.
              </p>
            </div>
            <button
              onClick={() => fetchAttempts(true)}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-md"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-800 mb-8">
              {error}
            </div>
          )}

          {submittedAttempts.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-700 mb-3">No submitted attempts yet</h3>
              <p className="text-gray-600">Submit a test to see results and detailed review here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {submittedAttempts.map(attempt => (
                <ScoreRow
                  key={attempt._id}
                  attempt={attempt}
                  onClick={setSelectedAttempt}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Attempt Modal */}
      {selectedAttempt && (
        <AttemptDetailModal
          attempt={selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </div>
  );
}

export default Scoreboard;