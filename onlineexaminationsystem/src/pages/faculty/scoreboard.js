// src/components/TeacherScoreboard.jsx  (or wherever you keep it)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from "../../config/api";

const TeacherScoreboard = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const email = user.email || user.facultyEmail || 'rk1357652@gmail.com';
    fetchTests(email);
  }, []);

  const fetchTests = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/tests?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Sort: newest first (by createdAt)
      const sortedTests = (data.tests || []).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setTests(sortedTests);
    } catch (err) {
      console.error(err);
      setError('Unable to load your tests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'completed') return { bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-600', label: 'Completed' };
    if (s === 'ongoing') return { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Ongoing' };
    if (s === 'upcoming') return { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Upcoming' };
    return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', label: status || 'Unknown' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/60">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-gray-600 font-medium">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/60 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchTests(JSON.parse(localStorage.getItem('user') || '{}').email || 'rk1357652@gmail.com')}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/40 py-0 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-5xl md:text-6xl font-bold text-indigo-600 mb-2">
            {tests.length}
          </div>
          <div className="text-xl font-semibold text-gray-800">Total Assessments</div>
        </div>

        {tests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">No assessments yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start creating tests for your students.
            </p>
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition">
              Create New Assessment
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => {
              const status = getStatusConfig(test.status);
              const qCount = test.questions?.length || 0;
              const isCompleted = (test.status || '').toLowerCase() === 'completed';

              return (
                <div
                  key={test._id}
                  className={`
                    bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
                    hover:shadow-md hover:border-gray-300 transition-all duration-200
                    ${status.bg}
                  `}
                >
                  <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                        {test.title || 'Untitled Assessment'}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.text} ${status.bg}`}>
                        <span className={`size-2.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-600">
                      {test.courseName || test.targetAudience || '—'} • {test.institute || '—'}
                    </p>
                  </div>

                  <div className="px-6 py-6 grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <dt className="text-gray-500">Questions</dt>
                      <dd className="font-medium text-gray-900 mt-1">{qCount}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Marks (Total / Pass)</dt>
                      <dd className="font-medium text-gray-900 mt-1">
                        {test.totalMarks ?? '—'} / {test.passMarks ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Duration</dt>
                      <dd className="font-medium text-gray-900 mt-1">{test.duration} min</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Created</dt>
                      <dd className="font-medium text-gray-900 mt-1">
                        {new Date(test.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </dd>
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    {isCompleted ? (
                      <button
                        onClick={() => navigate(`/test-report/${test._id}`)}
                        className="
                          w-full py-3 px-5 bg-indigo-600 text-white rounded-lg font-medium
                          hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                          transition-colors text-sm
                        "
                      >
                        View Results & Analytics
                      </button>
                    ) : (
                      <button
                        disabled
                        className="
                          w-full py-3 px-5 bg-gray-300 text-gray-700 rounded-lg font-medium
                          cursor-not-allowed text-sm
                        "
                      >
                        View Results & Analytics
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherScoreboard;