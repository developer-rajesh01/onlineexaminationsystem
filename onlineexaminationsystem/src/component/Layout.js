import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

import {
    HiOutlineViewGrid,
    HiOutlineQuestionMarkCircle,
    HiOutlineClipboardList,
    HiOutlineUserCircle,
    HiOutlineLogout,
    HiOutlineHome,
    HiOutlineChartBar,
    HiOutlineCog,
} from "react-icons/hi";

// === Faculty Sidebar ===
function FacultySidebar({ selectedSection, onSelect }) {
    const navigate = useNavigate();
    const userName = localStorage.getItem("name") || "Faculty";
    const userEmail = localStorage.getItem("email") || "";

    const menuItems = [
        { label: "Dashboard", to: "/dashboard", icon: HiOutlineViewGrid },
        { label: "Create Test", to: "/createTest", icon: HiOutlineClipboardList },
        { label: "Questions", to: "/questions", icon: HiOutlineQuestionMarkCircle },
        { label: "Scoreboard", to: "/scoreboard", icon: HiOutlineChartBar },
    ];

    return (
        <aside className="w-72 bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white flex flex-col h-full shadow-2xl">
            {/* User Info */}
            <div className="p-6 border-b border-indigo-700">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{userName}</h3>
                        <p className="text-xs text-indigo-200">{userEmail}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = selectedSection === item.label;

                        return (
                            <li key={item.label}>
                                <button
                                    onClick={() => {
                                        navigate(item.to, { replace: true });
                                        onSelect(item.label);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group
                    ${isActive
                                            ? "bg-teal-500 text-white shadow-lg scale-105"
                                            : "text-indigo-100 hover:bg-white/10 hover:text-white hover:shadow-md hover:scale-105"
                                        }`}
                                >
                                    <Icon
                                        size={22}
                                        className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-125"
                                            }`}
                                    />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer Badge */}
            <div className="p-4 border-t border-indigo-700">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold py-2 px-4 rounded-full text-center shadow-md">
                    Faculty Portal
                </div>
            </div>
        </aside>
    );
}

// === Student Header ===
function StudentHeader() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login", { replace: true });
    };

    return (
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg text-white">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-bold text-xl">L</span>
                    </div>
                    <span className="text-2xl font-bold">ExamPortal</span>
                </Link>

                <nav>
                    <ul className="flex items-center gap-8 text-sm font-medium">
                        <li>
                            <NavLink
                                to="/student/dashboard"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 transition-all ${isActive ? "text-yellow-300" : "hover:text-yellow-200"}`
                                }
                            >
                                <HiOutlineHome size={20} /> Dashboard
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/student/scoreboard"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 transition-all ${isActive ? "text-yellow-300" : "hover:text-yellow-200"}`
                                }
                            >
                                <HiOutlineChartBar size={20} /> Scoreboard
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/student/profile"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 transition-all ${isActive ? "text-yellow-300" : "hover:text-yellow-200"}`
                                }
                            >
                                <HiOutlineUserCircle size={20} /> Profile
                            </NavLink>
                        </li>
                        <li>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 hover:text-red-300 transition-all"
                            >
                                <HiOutlineLogout size={20} /> Logout
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}

// === Auth Header (Login/Register) ===
function AuthHeader() {
    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        L
                    </div>
                    <span className="text-2xl font-bold text-gray-800">ExamPortal</span>
                </Link>
                <Navbar />
            </div>
        </header>
    );
}

// === MAIN LAYOUT ===
function Layout() {
    const [role, setRole] = useState("");
    const [selectedSection, setSelectedSection] = useState("Dashboard");
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const userRole = localStorage.getItem("role");
        setRole(userRole || "");

        // Auto-set section based on path
        const path = location.pathname;
        if (path.includes("dashboard")) setSelectedSection("Dashboard");
        else if (path.includes("createTest")) setSelectedSection("Create Test");
        else if (path.includes("questions")) setSelectedSection("Questions");
        else if (path.includes("scoreboard")) setSelectedSection("Scoreboard");
    }, [location.pathname]);

    const isAuthPage = ["/login", "/register"].includes(location.pathname);

    // === Guest / Unknown Role ===
    if (!role || isAuthPage) {
        return (
            <>
                <AuthHeader />
                <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="max-w-7xl mx-auto p-6">
                        <Outlet />
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    // === Faculty Layout ===
    if (role === "faculty") {
        const handleLogout = () => {
            localStorage.clear();
            navigate("/login", { replace: true });
        };

        return (
            <div className="flex h-screen bg-gray-100 overflow-hidden">
                {/* Sidebar */}
                <FacultySidebar selectedSection={selectedSection} onSelect={setSelectedSection} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Bar */}
                    <header className="bg-white shadow-sm border-b border-gray-200 z-10">
                        <div className="px-6 py-4 flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{selectedSection}</h1>
                                <p className="text-sm text-gray-500 mt-1">Manage your assessments efficiently</p>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Profile Link */}
                                <NavLink
                                    to="/profile"
                                    className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                    <HiOutlineUserCircle size={22} />
                                    <span className="font-medium">Profile</span>
                                </NavLink>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200"
                                >
                                    <HiOutlineLogout size={20} />
                                    <span className="font-medium">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                        <div className="max-w-7xl mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // === Student Layout ===
    // === Student Layout ===
    if (role === "student") {
        const hideHeader = !!(location.state && location.state.hideHeader);

        return (
            <>
                {!hideHeader && <StudentHeader />}
                <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </>
        );
    }


    // === Fallback ===
    return null;
}

export default Layout;