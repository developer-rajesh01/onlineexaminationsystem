import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FacultyDashboard from "../pages/faculty/Dashboard";
import Questions from "../pages/faculty/questions";
import Scoreboard from "../pages/faculty/scoreboard";


import {
    HiOutlineViewGrid,
    HiOutlineQuestionMarkCircle,
    HiOutlineClipboardList,
    HiOutlineUserCircle,
  } from "react-icons/hi";


function FacultySidebar() {
    return (
        <aside className="w-58 bg-indigo-200 p-4 min-h-screen flex flex-col">
            {/* Faculty Name and Divider */}
            <div>
                <h2 className="font-bold text-lg mb-2 text-indigo-900">xcv</h2>
                <hr className="border-indigo-300 mb-4" />
            </div>
            {/* Menu */}
            <nav>
                <ul className="flex flex-col gap-1">
                    <li>
                        <Link
                            to="/dashboard"
                            className="flex items-center text-indigo-700 hover:bg-indigo-400 rounded-lg px-2 py-2 transition"
                        >
                            <HiOutlineViewGrid size={20} className="mr-2" />
                            <span className="text-base">Dashboard</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/questions"
                            className="flex items-center text-indigo-700 hover:bg-indigo-400 rounded-lg px-2 py-2 transition"
                        >
                            <HiOutlineQuestionMarkCircle size={20} className="mr-2" />
                            <span className="text-base">Questions</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/scoreboard"
                            className="flex items-center text-indigo-700 hover:bg-indigo-400 rounded-lg px-2 py-2 transition"
                        >
                            <HiOutlineClipboardList size={20} className="mr-2" />
                            <span className="text-base">Scoreboard</span>
                        </Link>
                    </li>
                </ul>
            </nav>
            {/* Spacer pushes Profile link down */}
            <Routes>
                <Route path="/dashboard" element={<FacultyDashboard />}>
                    <Route path="questions" element={<Questions />} />
                    <Route path="scoreboard" element={<Scoreboard />} />
                </Route>
            </Routes>
            {/* Profile link at the bottom */}
            <Link
                to="/profile"
                className="flex items-center text-indigo-700 hover:bg-indigo-400 rounded-lg px-4 py-2 transition"
            >
                <HiOutlineUserCircle size={32} className="mr-3" />
                Profile
            </Link>
        </aside>


    );
}

function StudentHeader() {
    return (
        <header className="bg-white shadow p-4 flex justify-between items-center">
            <div className="font-bold text-xl">YourLogo</div>
            <nav>
                <ul className="flex gap-6">
                    <li><Link to="/profile" className="hover:text-indigo-700">Profile</Link></li>
                    <li><Link to="/dashboard" className="hover:text-indigo-700">Dashboard</Link></li>
                    {/* Add other student menu items */}
                </ul>
            </nav>
        </header>
    );
}

function AuthHeader() {
    // Header for login/register pages with Navbar component
    return (
        <header className="bg-white shadow p-4 flex justify-between mb-10 items-center">
            <Navbar />
        </header>
    );
}

function Layout({ children }) {
    const [role, setRole] = useState("");
    const location = useLocation();

    useEffect(() => {
        const userRole = localStorage.getItem("userRole");
        setRole(userRole || "");
    }, [location.pathname]);

    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

    if (isAuthPage) {
        return (
            <>
                <AuthHeader />
                <main className="p-10">{children}</main>
                <Footer />
            </>
        );
    }

    if (role === "faculty") {
        return (
            <div className="flex min-h-screen">
                <FacultySidebar />
                <main className="flex-1 p-10 bg-white overflow-auto">{children}</main>
            </div>
        );
    }

    if (role === "student") {
        return (
            <>
                <StudentHeader />
                <main className="p-10">{children}</main>
                <Footer />
            </>
        );
    }

    // Default fallback layout for guests or unknown roles
    return (
        <>
            <header className="bg-white shadow p-4 flex justify-between items-center">
                <div className="font-bold text-xl">YourLogo</div>
                <Navbar />
            </header>
            <main className="p-10">{children}</main>
            <Footer />
        </>
    );
}

export default Layout;
