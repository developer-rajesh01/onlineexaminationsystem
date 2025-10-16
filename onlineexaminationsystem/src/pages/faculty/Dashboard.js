import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { FaTasks } from "react-icons/fa";
import scoreboard from "./scoreboard";

// Sample data with >10 records
const sampleData = {
  upcoming: [
    ...Array.from({ length: 12 }, (_, idx) => ({
      id: idx + 1,
      name: `Active Assessment #${idx + 1}`,
      org: "Face Prep",
      status: "Active",
      start: `Oct ${20 + idx}, 2025 10:00 AM`,
      link: "#",
    })),
  ],
  completed: [
    ...Array.from({ length: 15 }, (_, idx) => ({
      id: 100 + idx,
      name: `Completed Assessment #${idx + 1}`,
      org: "Face Prep",
      status: "Completed",
      start: `Mar ${10 + idx}, 2025 10:15 PM`,
      link: "#",
    })),
  ],
};

const PAGE_SIZE = 12;

// Simulate DELETE request for demonstration.
// Replace with your actual API call (e.g., axios.delete or fetch)
async function deleteTestFromDb(testId) {
  // await fetch(`/api/your-endpoint/${testId}`, { method: 'DELETE' });
  return new Promise(res => setTimeout(res, 300)); // mock async
}

function Dashboard() {
  const [tab, setTab] = useState("upcoming");
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const userName = "Faculty Name";

  useEffect(() => {
    setPage(0); // Reset page when tab changes
    setTasks(sampleData[tab]);
  }, [tab]);

  const pageTasks = tasks.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);

  // Delete handler for active tests
  const handleDelete = async (testId) => {
    // Optional: Show loading or confirmation here
    await deleteTestFromDb(testId);
    setTasks(tasks => tasks.filter(task => task.id !== testId));
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Row 1: Heading */}
        <div className="w-full px-10 py-6 bg-white border-b">
          <span className="text-lg font-semibold text-gray-700">Assessments</span>
        </div>

        {/* Row 2: All other content */}
        <div className="flex-1 p-8">
          <div className="bg-white w-full max-w-5xl rounded shadow-md mx-auto">
            {/* Tabs */}
            <div className="flex border-b items-center mb-8">
              <button
                className={`px-5 py-2 font-semibold border-b-2 transition-all ${tab === "upcoming"
                  ? "border-sky-500 text-sky-700"
                  : "border-transparent text-gray-500"
                  }`}
                onClick={() => setTab("upcoming")}
              >

                Active Tests
                <span className="inline-block ml-2 bg-yellow-100 text-yellow-700 font-bold rounded-full w-7 h-7 text-center text-xs">
                  {sampleData.upcoming.length}
                </span>
              </button>
              <button
                className={`px-5 py-2 font-semibold border-b-2 transition-all ${tab === "completed"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500"
                  } ml-2`}
                onClick={() => setTab("completed")}
              >
                Completed Tests
                <span className="inline-block ml-2 bg-yellow-100 text-yellow-700 font-bold rounded-full w-7 h-7 text-center text-xs">
                  {sampleData.completed.length}
                </span>
              </button>
            </div>
            {/* Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6 px-4 pb-6">
              {pageTasks.length === 0 ? (
                <div className="text-gray-400 text-lg text-center mt-6 col-span-3">
                  No data to display
                </div>
              ) : (
                  // ...inside your Dashboard component render()
                    pageTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white border border-gray-300 rounded-xl shadow hover:shadow-lg p-6 flex flex-col relative"
                      >
                        <div className="font-semibold text-gray-900 truncate">{task.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{task.org}</div>
                        <div
                          className={`mt-3 text-sm font-semibold ${task.status === "Completed" ? "text-green-600" : "text-blue-600"}`}
                        >
                          {task.status}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Starts at: <span className="font-medium text-gray-700">{task.start}</span>
                        </div>

                        {/* Different buttons depending on the tab */}
                        {tab === "completed" ? (
                          <NavLink
                            // to={`/createTest/${task.id}`}
                            className="mt-4 text-center py-2 bg-green-50 text-green-700 font-medium rounded shadow hover:bg-green-100 transition"
                          >
                            View Report
                          </NavLink>
                        ) : (
                          <NavLink
                            to={`/createTest`} // Change to your route, e.g., /edit-test or /start-test
                            className="mt-4 text-center py-2 bg-sky-50 text-sky-600 font-medium rounded shadow hover:bg-sky-100 transition"
                          >
                            Edit Test
                          </NavLink>
                        )}

                        {/* Delete Btn for Active Tests Only */}
                        {tab === "upcoming" && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="absolute top-4 right-4 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                            title="Delete Test"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))
                 )}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pb-4 space-x-2 my-8">
                <button
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(p - 1, 0))}
                  disabled={page === 0}
                >
                  Prev
                </button>
                <span className="px-4 py-2 inline-block">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                  onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
                  disabled={page + 1 === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
