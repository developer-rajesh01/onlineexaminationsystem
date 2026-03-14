// src/pages/faculty/TestReport.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Trophy, TrendingDown, Users, CheckCircle, AlertTriangle,
    Search, X, Download, BarChart2
} from 'lucide-react';

const TestReport = () => {
    const { testId } = useParams();

    const [attempts, setAttempts] = useState([]);
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' });
    const [exportFormat, setExportFormat] = useState('csv');

    useEffect(() => {
        fetchReport();
    }, [testId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null);

            const testRes = await fetch(`http://localhost:5000/api/tests/${testId}`);
            if (!testRes.ok) throw new Error(`Test fetch failed (${testRes.status})`);
            const testData = await testRes.json();
            setTest(testData.test || testData);

            const attemptsRes = await fetch(`http://localhost:5000/api/attempts/test/${testId}`);
            if (!attemptsRes.ok) throw new Error(`Attempts fetch failed (${attemptsRes.status})`);
            const attemptsData = await attemptsRes.json();
            setAttempts(attemptsData.attempts || []);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    // ─── Native Date Formatting (No date-fns) ──────────────────────────
    const getFormattedDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        return {
            full: date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }),
            relative: diffDays === 0 ? 'Today' :
                diffDays === 1 ? 'Yesterday' :
                    `${diffDays} days ago`
        };
    };

    // ─── Search & Filter ────────────────────────────────────────────────
    const filteredAttempts = useMemo(() => {
        if (!searchQuery.trim()) return attempts;
        const query = searchQuery.toLowerCase().trim();
        return attempts.filter(attempt => {
            const name = (attempt.studentEmail || '').toLowerCase();
            const emailName = attempt.studentEmail?.split('@')[0]?.toLowerCase() || '';
            return name.includes(query) || emailName.includes(query);
        });
    }, [attempts, searchQuery]);

    // ─── Sorting ────────────────────────────────────────────────────────
    const sortedAttempts = useMemo(() => {
        let sortable = [...filteredAttempts];
        if (!sortConfig.key) return sortable;

        sortable.sort((a, b) => {
            let aValue, bValue;
            switch (sortConfig.key) {
                case 'student':
                    aValue = getDisplayName(a).toLowerCase();
                    bValue = getDisplayName(b).toLowerCase();
                    break;
                case 'percentage':
                    aValue = test?.totalMarks ? (a.score / test.totalMarks) * 100 : 0;
                    bValue = test?.totalMarks ? (b.score / test.totalMarks) * 100 : 0;
                    break;
                case 'status':
                    aValue = getStatusBadge(a).label;
                    bValue = getStatusBadge(b).label;
                    break;
                case 'submitted':
                    aValue = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                    bValue = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sortable;
    }, [filteredAttempts, sortConfig, test]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    // ─── Export Functions ───────────────────────────────────────────────
    const exportToCSV = useCallback(() => {
        if (!sortedAttempts.length) return;
        const headers = ['Student', 'Email', 'Score', 'Percentage', 'Status', 'Submitted'];
        const rows = sortedAttempts.map(a => {
            const pct = test?.totalMarks ? Math.round((a.score / test.totalMarks) * 100) : '';
            return [
                getDisplayName(a),
                a.studentEmail || '',
                a.score ?? '',
                pct,
                getStatusBadge(a).label,
                a.submittedAt ? new Date(a.submittedAt).toLocaleString('en-IN') : ''
            ];
        });

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${test?.title || 'test'}_report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [sortedAttempts, test]);

    const exportToPDF = useCallback(() => {
        const printWindow = window.open('', '_blank');
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${test?.title || 'Test Report'}</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 40px; color: #111; }
          h1 { color: #1e40af; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
          th { background: #f1f5f9; }
          .passed { background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 999px; }
          .failed { background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 999px; }
        </style>
      </head>
      <body>
        <h1>${test?.title || 'Test Report'}</h1>
        <p style="text-align:center;color:#666;">${test?.courseName || ''} • ${new Date().toLocaleDateString('en-IN')}</p>
        <table>
          <thead>
            <tr>
              <th>Student</th><th>Email</th><th>Score</th><th>%</th><th>Result</th><th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            ${sortedAttempts.map(a => {
            const pct = test?.totalMarks ? Math.round((a.score / test.totalMarks) * 100) : 0;
            const badge = getStatusBadge(a);
            const cls = badge.label === 'PASSED' ? 'passed' : 'failed';
            return `
                <tr>
                  <td>${getDisplayName(a)}</td>
                  <td>${a.studentEmail || '—'}</td>
                  <td>${a.score ?? '?'}</td>
                  <td>${pct}%</td>
                  <td><span class="${cls}">${badge.label}</span></td>
                  <td>${a.submittedAt ? new Date(a.submittedAt).toLocaleString('en-IN') : '—'}</td>
                </tr>`;
        }).join('')}
          </tbody>
        </table>
      </body>
      </html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }, [sortedAttempts, test]);

    const handleExport = () => {
        if (exportFormat === 'csv') exportToCSV();
        else exportToPDF();
    };

    // ─── Stats ──────────────────────────────────────────────────────────
    const completedAttempts = useMemo(() =>
        attempts.filter(a => a.submittedAt || ['submitted', 'completed', 'finished'].includes((a.status || '').toLowerCase())).length
        , [attempts]);

    const totalAttempts = attempts.length;
    const hasAttempts = totalAttempts > 0;
    const filteredCount = sortedAttempts.length;

    const avgPercentage = hasAttempts && test?.totalMarks
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts / test.totalMarks * 100)
        : 0;

    const completionRate = totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0;

    const { top: top3, bottom: bottom3 } = useMemo(() => {
        const completed = attempts
            .filter(a => a.submittedAt)
            .map(a => ({ ...a, percentage: test?.totalMarks ? (a.score / test.totalMarks) * 100 : 0 }));

        if (!completed.length) return { top: [], bottom: [] };

        completed.sort((a, b) => b.score - a.score || a.studentEmail.localeCompare(b.studentEmail));
        const top = completed.slice(0, 3);

        const bottomSorted = [...completed].sort((a, b) => a.score - b.score || a.studentEmail.localeCompare(b.studentEmail));
        const bottom = bottomSorted.slice(0, 3);

        return { top, bottom };
    }, [attempts, test]);

    // ─── Helpers ────────────────────────────────────────────────────────
    const getDisplayName = useCallback((attempt) => {
        const name = attempt.studentEmail?.split('@')[0] || 'Student';
        const count = attempts.filter(a => (a.studentEmail?.split('@')[0] || '').toLowerCase() === name.toLowerCase()).length;
        return count > 1 ? `${name} (${attempt.studentEmail})` : name;
    }, [attempts]);

    const getStatusBadge = (attempt) => {
        const submitted = !!attempt.submittedAt;
        const status = (attempt.status || '').toLowerCase();
        const isDone = submitted || ['submitted', 'completed', 'finished'].includes(status);
        const passed = test?.passMarks ? (attempt.score || 0) >= test.passMarks : false;

        if (!isDone) {
            return status === 'in-progress'
                ? { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' }
                : { label: 'Not Started', color: 'bg-gray-100 text-gray-700 border-gray-200' };
        }
        return passed
            ? { label: 'PASSED', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold' }
            : { label: 'FAILED', color: 'bg-red-100 text-red-800 border-red-200 font-semibold' };
    };

    const getScoreStyle = (pct) => {
        if (pct >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        if (pct >= 70) return 'bg-teal-100 text-teal-800 border-teal-300';
        if (pct >= 55) return 'bg-amber-100 text-amber-800 border-amber-300';
        if (pct >= 40) return 'bg-orange-100 text-orange-800 border-orange-300';
        return 'bg-red-100 text-red-800 border-red-300';
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-slate-600 font-medium">Loading report...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Error</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <button onClick={fetchReport} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700">
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pb-12 pt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8">

                {/* ─── Header ──────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                            {test?.title || 'Test Report'}
                        </h1>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-slate-600 font-medium">
                            <span>{test?.courseName || test?.targetAudience || '—'}</span>
                            {test?.institute && <span>• {test.institute}</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                        <div>
                            <div className="text-3xl font-bold text-emerald-600">{completedAttempts}</div>
                            <div className="text-sm text-slate-600">Attempted</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-blue-600">{completionRate}%</div>
                            <div className="text-sm text-slate-600">Completion</div>
                        </div>
                    </div>
                </div>

                {/* ─── Performance Cards ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                    {/* Top 3 */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Trophy className="h-6 w-6" />
                            <h3 className="font-bold text-lg">Top Performers</h3>
                        </div>
                        <div className="space-y-3">
                            {top3.length > 0 ? top3.map((a, i) => {
                                const rankIcons = ['🥇', '🥈', '🥉'];
                                return (
                                    <div key={a._id || i} className="flex justify-between items-center bg-white/15 rounded-xl p-3">
                                        <span className="font-semibold truncate max-w-[180px]">
                                            {rankIcons[i] || `${i + 1}.`} {getDisplayName(a)}
                                        </span>
                                        <span className="bg-white/30 px-3 py-1 rounded-full text-sm font-bold">
                                            {Math.round(a.percentage)}%
                                        </span>
                                    </div>
                                );
                            }) : <p className="text-center text-emerald-100/80 py-4">No data</p>}
                        </div>
                    </div>

                    {/* Bottom 3 */}
                    <div className="bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingDown className="h-6 w-6" />
                            <h3 className="font-bold text-lg">Needs Improvement</h3>
                        </div>
                        <div className="space-y-3">
                            {bottom3.length > 0 ? bottom3.map((a, i) => (
                                <div key={a._id || i} className="flex justify-between items-center bg-white/15 rounded-xl p-3">
                                    <span className="font-semibold truncate max-w-[180px]">{i + 1}. {getDisplayName(a)}</span>
                                    <span className="bg-white/30 px-3 py-1 rounded-full text-sm font-bold">
                                        {Math.round(a.percentage)}%
                                    </span>
                                </div>
                            )) : <p className="text-center text-rose-100/80 py-4">No data</p>}
                        </div>
                    </div>

                    {/* Average */}
                    <div className="bg-white rounded-2xl shadow-lg border p-6 flex flex-col items-center justify-center text-center">
                        <div className="text-4xl font-black text-indigo-600 mb-1">{avgPercentage}%</div>
                        <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">Average Score</div>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-white rounded-2xl shadow-lg border p-6 flex flex-col items-center justify-center text-center">
                        <div className="text-4xl font-black text-emerald-600 mb-1">{completionRate}%</div>
                        <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">Completion</div>
                    </div>
                </div>

                {/* ─── Score Distribution ──────────────────────────── */}
                {hasAttempts && (
                    <div className="bg-white rounded-2xl shadow-lg border p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-indigo-600" />
                            Score Distribution
                        </h3>
                        <div className="h-56 bg-slate-50 rounded-xl p-4 flex items-end gap-1">
                            {Array.from({ length: 10 }).map((_, i) => {
                                const min = i * 10;
                                const count = attempts.filter(a => {
                                    const pct = test?.totalMarks ? (a.score / test.totalMarks) * 100 : 0;
                                    return pct >= min && pct < min + 10;
                                }).length;
                                const height = totalAttempts ? (count / totalAttempts) * 100 : 0;
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-all relative group cursor-pointer"
                                        style={{ height: `${Math.max(height, 3)}%` }}
                                        title={`${min}-${min + 10}%: ${count} students`}
                                    >
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                            {count} students
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-2 px-2">
                            <span>0%</span><span>100%</span>
                        </div>
                    </div>
                )}

                {/* ─── Search + Export ─────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-lg border p-5 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <select
                            value={exportFormat}
                            onChange={e => setExportFormat(e.target.value)}
                            className="py-3.5 px-4 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                        >
                            <option value="csv">📊 CSV</option>
                            <option value="pdf">📄 PDF</option>
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={!sortedAttempts.length}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>

                {/* ─── Student Table ───────────────────────────────── */}
                {hasAttempts ? (
                    <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
                        <div className="px-6 py-5 border-b bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <Users className="h-6 w-6 text-indigo-600" />
                                Student Performance
                                <span className="text-slate-500 font-normal text-base ml-2">
                                    ({filteredCount} {searchQuery ? `of ${totalAttempts}` : 'total'})
                                </span>
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:text-indigo-700 transition" onClick={() => requestSort('student')}>
                                            Student {getSortIndicator('student')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:text-indigo-700 transition" onClick={() => requestSort('percentage')}>
                                            Score {getSortIndicator('percentage')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:text-indigo-700 transition" onClick={() => requestSort('status')}>
                                            Result {getSortIndicator('status')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:text-indigo-700 transition" onClick={() => requestSort('submitted')}>
                                            Submitted {getSortIndicator('submitted')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedAttempts.map((attempt, idx) => {
                                        const pct = test?.totalMarks ? Math.round((attempt.score / test.totalMarks) * 100) : 0;
                                        const badge = getStatusBadge(attempt);
                                        const submitted = getFormattedDate(attempt.submittedAt);

                                        return (
                                            <tr key={attempt._id || idx} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                                                            {attempt.studentEmail?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-slate-900 truncate">{getDisplayName(attempt)}</div>
                                                            <div className="text-sm text-slate-500 truncate">{attempt.studentEmail || '—'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className={`inline-flex px-4 py-2 rounded-xl text-base font-bold border-2 shadow-sm ${getScoreStyle(pct)}`}>
                                                        {pct}% <span className="ml-2 opacity-75 text-sm">({attempt.score ?? '?'}/{test?.totalMarks ?? '?'})</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className={`inline-flex px-5 py-2 rounded-xl text-base font-bold border-2 shadow-sm ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-slate-700">
                                                    {submitted ? (
                                                        <div>
                                                            <div className="font-medium">{submitted.full}</div>
                                                            <div className="text-sm text-slate-500">{submitted.relative}</div>
                                                        </div>
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg border p-12 text-center">
                        <Users className="h-16 w-16 text-slate-300 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-slate-700 mb-3">No attempts yet</h3>
                        <p className="text-slate-600 max-w-md mx-auto">
                            Student results will appear here once they start or complete the test.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default TestReport;
