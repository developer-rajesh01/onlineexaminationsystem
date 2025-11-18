import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export default function FacultyScoreboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [filter, setFilter] = useState({ testId: "", from: "", to: "" });
  const [exporting, setExporting] = useState(false);

  async function fetchSummary() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const qs = new URLSearchParams();
      if (filter.testId) qs.set("testId", filter.testId);
      if (filter.from) qs.set("from", filter.from);
      if (filter.to) qs.set("to", filter.to);

      const res = await fetch(
        `${API}/api/faculty/scoreboard/summary?${qs.toString()}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = await res.json();
      setSummary(data.summary || []);
      setTests(
        (data.summary || []).map((s) => ({ id: s.testId, title: s.title }))
      );
    } catch (err) {
      console.error("fetchSummary error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTop() {
    try {
      const token = localStorage.getItem("token");
      const qs = new URLSearchParams();
      if (filter.testId) qs.set("testId", filter.testId);
      if (filter.from) qs.set("from", filter.from);
      if (filter.to) qs.set("to", filter.to);
      qs.set("limit", "5");

      const res = await fetch(
        `${API}/api/faculty/scoreboard/top?${qs.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const json = await res.json();
      setTopStudents(json.top || []);
    } catch (err) {
      console.error("fetchTop error:", err);
    }
  }

  useEffect(() => {
    fetchSummary();
    fetchTop();
    // eslint-disable-next-line
  }, [filter.testId, filter.from, filter.to]);

  const downloadCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const qs = new URLSearchParams();
      if (filter.testId) qs.set("testId", filter.testId);
      if (filter.from) qs.set("from", filter.from);
      if (filter.to) qs.set("to", filter.to);

      const res = await fetch(
        `${API}/api/faculty/scoreboard/export?${qs.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await res.json();
      const rows = data.rows || [];

      if (rows.length === 0) {
        alert("No rows to export for the selected filters.");
        setExporting(false);
        return;
      }

      const header = Object.keys(rows[0]);
      const csv = [
        header.join(","),
        ...rows.map((r) =>
          header
            .map((h) => {
              const cell = r[h] == null ? "" : r[h];
              if (typeof cell === "string" && cell.includes(",")) {
                return `"${cell.replace(/"/g, '""')}"`;
              }
              return cell;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `scoreboard_export_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("downloadCSV error:", err);
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-lg font-medium text-gray-700">Loading...</div>
      </div>
    );

  const barData =
    summary.length > 0 && summary[0].histogram
      ? summary[0].histogram.map((b) => ({
          name: typeof b._id === "number" ? `${b._id}` : String(b._id),
          count: b.count,
        }))
      : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">
        Faculty Scoreboard
      </h1>

      {/* filters */}
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div className="flex flex-col">
          <label className="text-sm text-slate-600 mb-1">Test</label>
          <select
            value={filter.testId}
            onChange={(e) => setFilter({ ...filter, testId: e.target.value })}
            className="px-3 py-2 border rounded-md bg-white text-sm"
          >
            <option value="">All tests</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-slate-600 mb-1">From</label>
          <input
            type="date"
            value={filter.from}
            onChange={(e) => setFilter({ ...filter, from: e.target.value })}
            className="px-3 py-2 border rounded-md bg-white text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-slate-600 mb-1">To</label>
          <input
            type="date"
            value={filter.to}
            onChange={(e) => setFilter({ ...filter, to: e.target.value })}
            className="px-3 py-2 border rounded-md bg-white text-sm"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setFilter({ testId: "", from: "", to: "" })}
            className="px-3 py-2 bg-slate-100 border rounded-md text-sm"
          >
            Reset
          </button>

          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm shadow"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* summary + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3 text-slate-800">Tests summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="pb-2">Test</th>
                  <th className="pb-2">Attempts</th>
                  <th className="pb-2">Avg</th>
                  <th className="pb-2">High</th>
                  <th className="pb-2">Low</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.testId} className="border-t">
                    <td className="py-2">{s.title}</td>
                    <td className="py-2">{s.totalAttempts}</td>
                    <td className="py-2">{s.avgScore}</td>
                    <td className="py-2">{s.highest}</td>
                    <td className="py-2">{s.lowest}</td>
                    <td className="py-2">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3 text-slate-800">
            Attempts distribution
          </h2>
          {barData.length === 0 ? (
            <div className="text-sm text-slate-600">No data</div>
          ) : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count">
                    {barData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* top students */}
      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <h2 className="text-lg font-semibold mb-3 text-slate-800">
          Top Students
        </h2>
        {topStudents.length === 0 ? (
          <div className="text-sm text-slate-600">No top student data</div>
        ) : (
          <ol className="space-y-3 list-decimal pl-5">
            {topStudents.map((t, idx) => (
              <li
                key={t._id || idx}
                className="flex justify-between items-start"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {t.studentName}
                  </div>
                  <div className="text-sm text-slate-500">{t.studentEmail}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-900">
                    Max: <span className="font-bold">{t.maxScore}</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    Avg: {Number(t.avgScore).toFixed(2)} • Attempts:{" "}
                    {t.attempts}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
