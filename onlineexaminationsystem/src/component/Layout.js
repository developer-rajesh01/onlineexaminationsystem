import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation, Outlet } from "react-router-dom";
import Footer from "./Footer";
import API_BASE_URL from "../config/api";

import {
    HiOutlineViewGrid,
    HiOutlineQuestionMarkCircle,
    HiOutlineClipboardList,
    HiOutlineUserCircle,
    HiOutlineLogout,
    HiOutlineChartBar,
    HiOutlineMenu,
    HiOutlineX,
} from "react-icons/hi";

// ──────────────────────────────────────────────
// FIXED FACULTY SIDEBAR - Faculty Portal at Bottom
// ──────────────────────────────────────────────
function FacultySidebar({ selectedSection, onSelect, isMobileOpen, onMobileToggle }) {
    const navigate = useNavigate();
    const userName = localStorage.getItem("name") || "Faculty";
    const userEmail = localStorage.getItem("email") || "";

    const menuItems = [
        { label: "Dashboard", to: "/dashboard", icon: HiOutlineViewGrid },
        { label: "Create Test", to: "/createTest", icon: HiOutlineClipboardList },
        { label: "Scoreboard", to: "/scoreboard", icon: HiOutlineChartBar },
    ];

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onMobileToggle}
                />
            )}

            {/* Sidebar - FIXED LAYOUT */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 shadow-2xl
                transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                lg:h-screen h-screen overflow-hidden flex flex-col
            `}>
                {/* User Info - Fixed at top */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white sticky top-0 z-10 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400/20">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-lg tracking-tight truncate text-slate-800">{userName}</h3>
                                <p className="text-sm text-slate-500 truncate">{userEmail}</p>
                            </div>
                        </div>
                        <button
                            onClick={onMobileToggle}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <HiOutlineX size={24} />
                        </button>
                    </div>
                </div>

                {/* Navigation - Scrollable middle section */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                    <ul className="space-y-1.5">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = selectedSection === item.label;

                            return (
                                <li key={item.label}>
                                    <button
                                        onClick={() => {
                                            navigate(item.to, { replace: true });
                                            onSelect(item.label);
                                            onMobileToggle(); // Close mobile menu
                                        }}
                                        className={`
                                            group relative w-full flex items-center gap-3.5 px-5 py-3.5 rounded-xl text-left transition-all duration-200
                                            ${isActive
                                                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                                                : "text-slate-700 hover:bg-slate-100 hover:text-indigo-700 hover:shadow-md hover:translate-x-1 hover:shadow-indigo-100"
                                            }
                                        `}
                                    >
                                        <Icon
                                            size={22}
                                            className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                                        />
                                        <span className="font-medium">{item.label}</span>

                                        {isActive && (
                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-r-full shadow-lg" />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Faculty Portal Badge - FIXED at Bottom */}
                <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold py-3 px-6 rounded-2xl text-center shadow-lg shadow-indigo-500/30">
                        Faculty Portal
                    </div>
                </div>
            </aside>
        </>
    );
}

// ──────────────────────────────────────────────
// PROFESSIONAL FACULTY HEADER (AuthHeader Style)
// ──────────────────────────────────────────────
function FacultyHeader({ selectedSection, onMobileToggle, isMobileOpen }) {
    const navigate = useNavigate();
    const userName = localStorage.getItem("name") || "Faculty";

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (err) {
            console.error("Logout error:", err);
        }

        localStorage.clear();
        sessionStorage.clear();
        navigate("/login", { replace: true });
    };

    return (
        <header className="
            sticky top-0 z-50
            bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900/95
            border-b border-slate-700/40
            shadow-2xl shadow-black/30 backdrop-blur-xl
        ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-[80px] items-center justify-between">
                    {/* Left - Logo + Brand */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onMobileToggle}
                            className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
                        >
                            <HiOutlineMenu size={24} className="text-white" />
                        </button>
                        <div className="hidden md:block absolute ">
                            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-white to-purple-400 bg-clip-text text-transparent tracking-tight">
                                {selectedSection}
                            </h1>
                            <p className="text-slate-400 text-sm font-medium mt-1">{new Date().toLocaleDateString('en-IN')}</p>
                        </div>
                    </div>

                    {/* Right - Actions */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <NavLink
                                to="/profile"
                                className="
                                    flex items-center gap-2 px-4 py-2.5
                                    bg-white/10 backdrop-blur-sm text-white hover:text-slate-200
                                    rounded-xl font-semibold border border-white/20
                                    hover:bg-white/20 hover:shadow-lg hover:shadow-white/20
                                    transition-all duration-200 active:scale-95
                                    hover:-translate-y-0.5
                                "
                            >
                                <HiOutlineUserCircle size={20} />
                                Profile
                            </NavLink>

                            <button
                                onClick={handleLogout}
                                className="
                                    flex items-center gap-2 px-5 py-2.5
                                    bg-gradient-to-r from-red-500 to-red-600 text-white
                                    rounded-xl font-semibold shadow-lg shadow-red-500/30
                                    hover:from-red-600 hover:to-red-700
                                    hover:shadow-xl hover:shadow-red-500/40
                                    hover:-translate-y-0.5 active:scale-95
                                    transition-all duration-200 border border-red-400/30
                                "
                            >
                                <HiOutlineLogout size={20} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

// ──────────────────────────────────────────────
// ✅ FIXED STUDENT HEADER WITH WORKING MOBILE MENU
// ──────────────────────────────────────────────
function StudentHeader() {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isMobileMenuOpen]);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (err) {
            console.error("Logout error:", err);
        }

        localStorage.clear();
        sessionStorage.clear();
        navigate("/login", { replace: true });
    };

    const menuItems = [
        { to: "/student/dashboard", icon: HiOutlineViewGrid, label: "Dashboard" },
        { to: "/student/scoreboard", icon: HiOutlineChartBar, label: "Scoreboard" },
        { to: "/student/profile", icon: HiOutlineUserCircle, label: "Profile" },
        { action: handleLogout, icon: HiOutlineLogout, label: "Logout" },
    ];

    return (
        <>
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                    onTouchMove={(e) => e.preventDefault()}
                />
            )}

            {/* Mobile Menu Dropdown */}
            <div className={`sm:hidden fixed top-[80px] right-4 z-50 transition-opacity duration-200 ${isMobileMenuOpen
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}>
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/50 w-64 py-2">
                    {menuItems.map((item, index) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            onClick={item.action || (() => setIsMobileMenuOpen(false))}
                            className={({ isActive }) => `
                                flex items-center gap-4 px-6 py-4 text-lg font-semibold
                                transition-all duration-200 rounded-xl mx-2
                                ${isActive
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                                    : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md hover:translate-x-1'
                                }
                            `}
                        >
                            <item.icon size={24} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

            <header className="
                sticky top-0 z-50
                bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600/95
                border-b border-indigo-500/40
                shadow-2xl shadow-indigo-500/40 backdrop-blur-xl
            ">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-[80px] items-center justify-between">
                        {/* Logo */}
                        <Link to="/student/dashboard" className="flex items-center gap-3 group">
                            <div className="
                                w-12 h-12
                                bg-gradient-to-br from-white via-slate-100 to-white
                                rounded-2xl flex items-center justify-center
                                text-indigo-700 font-black text-2xl
                                shadow-2xl shadow-indigo-400/50
                                ring-2 ring-white/50
                                transition-all duration-300 group-hover:scale-110 group-hover:shadow-indigo-500/60
                            ">
                                EP
                            </div>
                            <div>
                                <span className="text-xl font-black text-white tracking-tight">
                                    ExamPortal
                                </span>
                                <p className="text-indigo-100 text-xs font-medium hidden sm:block">
                                    Student Portal
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Navigation - Hidden on mobile */}
                        <nav className="hidden sm:flex items-center gap-2 sm:gap-4 lg:gap-8">
                            <NavLink
                                to="/student/dashboard"
                                className={({ isActive }) => `
                                    flex items-center gap-2 px-3 py-2.5 sm:px-4 text-xs sm:text-sm lg:text-base
                                    rounded-xl font-semibold transition-all duration-200 whitespace-nowrap
                                    ${isActive
                                        ? 'bg-white/20 backdrop-blur-sm shadow-lg shadow-white/30 text-white border border-white/30'
                                        : 'text-indigo-200 hover:text-white hover:bg-white/10 hover:shadow-md hover:shadow-white/20'
                                    }
                                    hover:-translate-y-0.5
                                `}
                            >
                                <HiOutlineViewGrid size={18} className="sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </NavLink>

                            <NavLink
                                to="/student/scoreboard"
                                className={({ isActive }) => `
                                    flex items-center gap-2 px-3 py-2.5 sm:px-4 text-xs sm:text-sm lg:text-base
                                    rounded-xl font-semibold transition-all duration-200 whitespace-nowrap
                                    ${isActive
                                        ? 'bg-white/20 backdrop-blur-sm shadow-lg shadow-white/30 text-white border border-white/30'
                                        : 'text-indigo-200 hover:text-white hover:bg-white/10 hover:shadow-md hover:shadow-white/20'
                                    }
                                    hover:-translate-y-0.5
                                `}
                            >
                                <HiOutlineChartBar size={18} className="sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Scoreboard</span>
                            </NavLink>

                            <NavLink
                                to="/student/profile"
                                className={({ isActive }) => `
                                    flex items-center gap-2 px-3 py-2.5 sm:px-4 text-xs sm:text-sm lg:text-base
                                    rounded-xl font-semibold transition-all duration-200 whitespace-nowrap
                                    ${isActive
                                        ? 'bg-white/20 backdrop-blur-sm shadow-lg shadow-white/30 text-white border border-white/30'
                                        : 'text-indigo-200 hover:text-white hover:bg-white/10 hover:shadow-md hover:shadow-white/20'
                                    }
                                    hover:-translate-y-0.5
                                `}
                            >
                                <HiOutlineUserCircle size={18} className="sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Profile</span>
                            </NavLink>
                        </nav>

                        {/* ✅ WORKING MOBILE MENU BUTTON */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="sm:hidden p-3 rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 shadow-lg shadow-white/30 border border-white/30 hover:shadow-xl hover:shadow-white/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                        >
                            <HiOutlineMenu size={24} className="text-white" />
                        </button>

                        {/* Desktop Logout */}
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                onClick={handleLogout}
                                className="
                                    flex items-center gap-2 px-5 py-2.5
                                    bg-white/20 backdrop-blur-sm text-white
                                    rounded-xl font-semibold border border-white/30
                                    hover:bg-white/30 hover:shadow-lg hover:shadow-white/30
                                    hover:-translate-y-0.5 active:scale-95
                                    transition-all duration-200
                                "
                            >
                                <HiOutlineLogout size={20} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}

// ──────────────────────────────────────────────
// FIXED MOBILE RESPONSIVE AUTH HEADER
// ──────────────────────────────────────────────
function AuthHeader() {
    return (
        <header className="
            sticky top-0 z-50
            bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-700/95
            border-b border-indigo-500/40
            shadow-2xl shadow-indigo-500/50 backdrop-blur-xl
        ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-[80px] items-center justify-between">
                    {/* Logo - Fixed positioning */}
                    <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
                        <div className="
                            w-12 h-12 sm:w-14 sm:h-14
                            bg-gradient-to-br from-white via-blue-50 to-white
                            rounded-2xl flex items-center justify-center
                            text-indigo-700 font-black text-xl sm:text-3xl
                            shadow-2xl shadow-indigo-400/50
                            ring-2 ring-white/60
                            transition-all duration-300 group-hover:scale-110 group-hover:shadow-indigo-500/60
                        ">
                            EP
                        </div>
                        <div className="hidden sm:block">
                            <span className="
                                text-2xl lg:text-3xl font-black
                                bg-gradient-to-r from-white to-slate-100 bg-clip-text text-transparent
                                tracking-tight
                                transition-all duration-300 group-hover:scale-105
                            ">
                                ExamPortal
                            </span>
                            <p className="text-indigo-200 text-xs font-semibold mt-1">
                                Professional Assessment Platform
                            </p>
                        </div>
                        {/* Mobile logo text */}
                        <span className="sm:hidden text-xl font-bold text-white tracking-tight">
                            EP
                        </span>
                    </Link>

                    {/* Responsive Auth Buttons */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        {/* Login Button - Always visible */}
                        <Link
                            to="/login"
                            className="
                                px-3 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold
                                text-white/90 hover:text-white
                                bg-white/20 backdrop-blur-sm
                                rounded-2xl border border-white/30
                                hover:bg-white/30 hover:shadow-xl hover:shadow-white/40
                                hover:-translate-y-1 transition-all duration-200
                                active:scale-95 whitespace-nowrap
                            "
                        >
                            Login
                        </Link>

                        {/* Get Started Button - Always visible */}
                        <Link
                            to="/register"
                            className="
                                px-3 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-bold
                                bg-gradient-to-r from-white to-slate-50 text-indigo-800
                                rounded-2xl shadow-2xl shadow-indigo-400/40
                                ring-2 ring-white/50
                                hover:shadow-3xl hover:shadow-indigo-500/50
                                hover:-translate-y-1 hover:scale-[1.02]
                                active:scale-95
                                transition-all duration-200 whitespace-nowrap
                                flex-shrink-0
                            "
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

// ──────────────────────────────────────────────
// MAIN PROFESSIONAL LAYOUT
// ──────────────────────────────────────────────
function Layout() {
    const [role, setRole] = useState("");
    const [selectedSection, setSelectedSection] = useState("Dashboard");
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        return () => {
            window.scrollTo(0, 0);
        };
    }, []);

    useEffect(() => {
        const userRole = localStorage.getItem("role");
        setRole(userRole || "");

        const path = location.pathname.toLowerCase();
        if (path.includes("dashboard")) setSelectedSection("Dashboard");
        else if (path.includes("createtest")) setSelectedSection("Create Test");
        else if (path.includes("questions")) setSelectedSection("Questions");
        else if (path.includes("scoreboard")) setSelectedSection("Scoreboard");
    }, [location.pathname]);

    const isAuthPage = ["/login", "/register"].includes(location.pathname);
    const isStudentExam = !!(location.state && location.state.hideHeader);

    // ── Public / Auth pages ──
    if (!role || isAuthPage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 flex flex-col">
                <AuthHeader />
                <main className="flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <Outlet />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }
    // ── Faculty layout ── ✅ NO GAPS FIXED
    if (role === "faculty") {
        return (
            <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-hidden">
                {/* FIXED SIDEBAR - 320px */}
                <FacultySidebar
                    selectedSection={selectedSection}
                    onSelect={setSelectedSection}
                    isMobileOpen={isMobileOpen}
                    onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
                />

                {/* MAIN CONTENT - PERFECT ALIGNMENT */}
                <div className="flex-1 flex flex-col ml-0 overflow-hidden">
                    {/* Header - Full width */}
                    <FacultyHeader
                        selectedSection={selectedSection}
                        isMobileOpen={isMobileOpen}
                        onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
                    />

                    {/* Content - NO GAPS! */}
                    <main className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 p-6 lg:p-10">
                        {/* REMOVED max-w-7xl mx-auto - THIS WAS CAUSING GAPS */}
                        <Outlet />
                    </main>
                </div>
            </div>
        );
    }



    // ── Student layout ──
    if (role === "student") {
        return (
            <div className="min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50/50 flex flex-col">
                {!isStudentExam && <StudentHeader />}
                <main className="flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
                        <Outlet />
                    </div>
                </main>
                
            </div>
        );
    }

    return null;
}

export default Layout;
