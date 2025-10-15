import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

import {
    HiOutlineViewGrid,
    HiOutlineQuestionMarkCircle,
    HiOutlineClipboardList,
    HiOutlineUserCircle,
    HiLogout,
    HiOutlineHome,
    HiOutlineLogout,
    HiOutlineChartBar
} from "react-icons/hi";

// Faculty Sidebar component
function FacultySidebar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear stored user data during logout
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        // Redirect to login page
        navigate("/login", { replace: true });
    };
    return (
        <aside className="w-56 bg-indigo-200 p-4 min-h-screen flex flex-col">
            <div>
                <h2 className="font-bold text-lg mb-2 text-indigo-900">xcv</h2>
                <hr className="border-indigo-300 mb-4" />
            </div>
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
            <div className="flex-1"></div>
            <Link
                to="/profile"
                className="flex items-center text-indigo-700 hover:bg-indigo-400 rounded-lg px-4 py-2 transition"
            >
                <HiOutlineUserCircle size={32} className="mr-3" />
                Profile
            </Link>
            <button
                onClick={handleLogout}
                className="flex items-center text-indigo-700 hover:bg-indigo-400 rounded-lg px-4 py-2 transition"
            >
                <HiLogout size={32} className="mr-3" />
                Logout
            </button>
        </aside>
    );
}

function StudentHeader() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear stored user data during logout
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        // Redirect to login page
        navigate("/login", { replace: true });
    };
    return (
        <header className="bg-indigo-600 shadow-md p-4 flex justify-between items-center text-white">
            {/* Logo */}
            <div className="flex items-center space-x-2">
                <div className="font-bold text-2xl">YourLogo</div>
            </div>

            {/* Menu Items */}
            <nav>
                <ul className="flex gap-8 items-center">
                  
                    {/* Dashboard */}
                    <li>
                        <Link
                            to="/student/dashboard"
                            className="flex items-center hover:text-indigo-200 transition duration-200"
                        >
                            <HiOutlineHome className="mr-1" size={20} />
                            Dashboard
                        </Link>
                    </li>
                    {/* Scoreboard - If needed */}
                    <li>
                        <Link
                            to="/student/scoreboard"
                            className="flex items-center hover:text-indigo-200 transition duration-200"
                        >
                            <HiOutlineChartBar className="mr-1" size={20} />
                            Scoreboard
                        </Link>
                    </li>
                    {/* Profile */}
                    <li>
                        <Link
                            to="/student/profile"
                            className="flex items-center hover:text-indigo-200 transition duration-200"
                        >
                            <HiOutlineUserCircle className="mr-1" size={20} />
                            Profile
                        </Link>
                    </li>
                    {/* Logout */}

                    <li>
                        <button
                            onClick={handleLogout}
                            className="flex items-center hover:text-red-400 transition duration-200"
                        >
                            <HiOutlineLogout className="mr-1" size={20} />
                            Logout
                        </button>
                    </li>
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

function Layout() {
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
                <main className="p-10">
                    <Outlet />
                </main>
                <Footer />
            </>
        );
    }

    if (role === "faculty") {
        return (
            <div className="flex min-h-screen">
                <FacultySidebar />
                <main className="flex-1 p-10 bg-white overflow-auto">
                    <Outlet />
                </main>
            </div>
        );
    }

    if (role === "student") {
        return (
            <>
                <StudentHeader />
                <main className="p-10">
                    <Outlet />
                </main>
                
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
            <main className="p-10">
                <Outlet />
            </main>
            <Footer />
        </>
    );
}

export default Layout;
