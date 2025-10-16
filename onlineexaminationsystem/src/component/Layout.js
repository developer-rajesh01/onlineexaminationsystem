import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation, Outlet } from "react-router-dom";
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
    const userName = localStorage.getItem("name") || "Guest";

    const handleLogout = () => {
        // Clear stored user data during logout
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("name");

        // Redirect to login page
        navigate("/login", { replace: true });
    };
    return (
        <aside className="w-76 bg-indigo-900 p-2 min-h-screen flex flex-col">
            <div>
                <h2 className="font-bold text-xl mb-2 text-gray-100">{userName}</h2>
                <hr className="border-blue-300 mb-4" />
            </div>
            <nav className="flex-1">
                <ul className="flex flex-col gap-2">
                    <li>
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                `flex items-center rounded-lg px-3 py-2 transition-all duration-200 group ${isActive
                                    ? "bg-teal-400 text-white shadow-md"
                                    : "text-gray-100 hover:bg-blue-400 hover:text-white hover:shadow-lg transform hover:scale-105"
                                }`
                            }
                        >
                            <HiOutlineViewGrid
                                size={20}
                                className="mr-3 group-hover:scale-110 transition-transform"
                            />
                            <span className="text-base">Dashboard</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/createTest"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 rounded-md transition-all duration-200 group ${isActive
                                    ? "bg-teal-500 text-white shadow-md"
                                    : "text-gray-300 hover:bg-blue-500 hover:text-white hover:shadow-lg transform hover:scale-105"
                                }`
                            }
                        >
                            <HiOutlineClipboardList
                                size={20}
                                className="mr-3 group-hover:scale-125 transition-transform"
                            />
                            <span className="text-base">Create Test</span>
                        </NavLink>
                    </li>
                    <li> 
                        <NavLink
                            to="/questions"
                            className={({ isActive }) =>
                                `flex items-center rounded-lg px-3 py-2 transition-all duration-200 group ${isActive
                                    ? "bg-teal-400 text-white shadow-md"
                                    : "text-gray-100 hover:bg-blue-400 hover:text-white hover:shadow-lg transform hover:scale-105"
                                }`
                            }
                        >
                            <HiOutlineQuestionMarkCircle
                                size={20}
                                className="mr-3 group-hover:scale-110 transition-transform"
                            />
                            <span className="text-base">Questions</span>
                        </NavLink>
                    </li>
                  
                    <li>
                        <NavLink
                            to="/scoreboard"
                            className={({ isActive }) =>
                                `flex items-center rounded-lg px-3 py-2 transition-all duration-200 group ${isActive
                                    ? "bg-teal-400 text-white shadow-md"
                                    : "text-gray-100 hover:bg-blue-400 hover:text-white hover:shadow-lg transform hover:scale-105"
                                }`
                            }
                        >
                            <HiOutlineClipboardList
                                size={20}
                                className="mr-3 group-hover:scale-110 transition-transform"
                            />
                            <span className="text-base">Scoreboard</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>
            <div className="mt-auto">
                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        `flex items-center rounded-lg px-4 py-2 transition-all duration-200 group ${isActive
                            ? "bg-teal-400 text-white shadow-md"
                            : "text-gray-100 hover:bg-blue-400 hover:text-white hover:shadow-lg transform hover:scale-105"
                        }`
                    }
                >
                    <HiOutlineUserCircle
                        size={30}
                        className="mr-3 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-base">Profile</span>
                </NavLink>
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-red-400 hover:bg-red-500 hover:text-white rounded-lg px-4 py-2 transition-all duration-200 mt-2 group hover:shadow-lg transform hover:scale-105"
                >
                    <HiLogout
                        size={30}
                        className="mr-3 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-base">Logout</span>
                </button>
            </div>
        </aside>
    );
}

function StudentHeader() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear stored user data during logout
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("name");

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
        const userRole = localStorage.getItem("role");
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
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar with independent scrolling */}
                <aside className="w-56 bg-indigo-900 p-4 overflow-y-auto min-h-full">
                    <FacultySidebar />
                </aside>
                {/* Main content with independent scrolling */}
                <main className="flex-1 p-10 bg-white overflow-y-auto min-h-full">
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
