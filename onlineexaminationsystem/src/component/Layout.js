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
function FacultySidebar({ selectedSection, onSelect }) {
    const navigate = useNavigate();

    const userName = localStorage.getItem("name") || "Guest";
    const handleLogout = () => {
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("name");
        navigate("/login", { replace: true });
    };
 

    const items = [
        {
            label: "Dashboard",
            to: "/dashboard",
            icon: <HiOutlineViewGrid size={20} className="mr-3 group-hover:scale-110 transition-transform" />
        },
        {
            label: "Create Test",
            to: "/createTest",
            icon: <HiOutlineClipboardList size={20} className="mr-3 group-hover:scale-125 transition-transform" />
        },
        {
            label: "Questions",
            to: "/questions",
            icon: <HiOutlineQuestionMarkCircle size={20} className="mr-3 group-hover:scale-110 transition-transform" />
        },
        {
            label: "Scoreboard",
            to: "/scoreboard",
            icon: <HiOutlineClipboardList size={20} className="mr-3 group-hover:scale-110 transition-transform" />
        },
    ];

    return (
        <aside className="w-76  bg-indigo-900 p-5 min-h-screen flex flex-col">
            <div>
                <h2 className="font-bold text-xl mb-2 text-gray-100">{userName}</h2>
                <hr className="border-blue-300 mb-4" />
            </div>
            <nav className="flex-1">
                <ul className="flex flex-col gap-2">
                    {items.map(item => (
                        <li key={item.label}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center rounded-lg px-3 py-2 transition-all duration-200 group ${selectedSection === item.label || isActive
                                        ? "bg-teal-400 text-white shadow-md"
                                        : "text-gray-100 hover:bg-blue-400 hover:text-white hover:shadow-lg transform hover:scale-105"
                                    }`
                                }
                                onClick={() => { if (onSelect) onSelect(item.label); }}
                            >
                                {item.icon}
                                <span className="text-base">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
          
        </aside>
    );
}

// StudentHeader, AuthHeader and Layout remain similar; main faculty logic updated:
function StudentHeader() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("name");
        navigate("/login", { replace: true });
    };
    return (
        <header className="bg-indigo-600 shadow-md p-4 flex justify-between items-center text-white">
            {/* Logo */}
            <div className="flex items-center space-x-2">
                <div className="font-bold text-2xl">YourLogo</div>
            </div>
            <nav>
                <ul className="flex gap-8 items-center">
                    <li>
                        <Link to="/student/dashboard" className="flex items-center hover:text-indigo-200 transition duration-200">
                            <HiOutlineHome className="mr-1" size={20} /> Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link to="/student/scoreboard" className="flex items-center hover:text-indigo-200 transition duration-200">
                            <HiOutlineChartBar className="mr-1" size={20} /> Scoreboard
                        </Link>
                    </li>
                    <li>
                        <Link to="/student/profile" className="flex items-center hover:text-indigo-200 transition duration-200">
                            <HiOutlineUserCircle className="mr-1" size={20} /> Profile
                        </Link>
                    </li>
                    <li>
                        <button onClick={handleLogout} className="flex items-center hover:text-red-400 transition duration-200">
                            <HiOutlineLogout className="mr-1" size={20} /> Logout
                        </button>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

function AuthHeader() {
    return (
        <header className="bg-white shadow p-4 flex justify-between mb-10 items-center">
            <Navbar />
        </header>
    );
}

// MAIN LAYOUT - sidebar sets and manages selectedSection
function Layout() {
    const [role, setRole] = useState("");
    const [selectedSection, setSelectedSection] = useState("Dashboard");
    const location = useLocation();
    const navigate = useNavigate();


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

        
        const handleLogout = () => {
            localStorage.removeItem("role");
            localStorage.removeItem("email");
            localStorage.removeItem("name");
            navigate("/login", { replace: true });
        };

        return (
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar with its own scroll -- notice selectedSection/handler passed */}
                <aside className="w-56 bg-indigo-900 p-0 flex-shrink-0 h-full overflow-y-auto">
                    <div className="h-full">
                        <FacultySidebar selectedSection={selectedSection} onSelect={setSelectedSection} />
                    </div>
                </aside>
                {/* Main content */}
                <main className="flex-1 flex flex-col bg-gray-50 h-full overflow-y-auto">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 flex justify-between items-center h-16 pl-10 pr-10 bg-white border-b shadow-sm">
                        {/* Dynamically show current section */}
                        <span className="text-lg font-semibold text-gray-700">{selectedSection}</span>
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-sky-100 rounded text-sky-800 text-sm"></div>
                                <NavLink
                                    to="/profile"
                                    className={({ isActive }) =>
                                        `flex items-center rounded-lg px-4 py-2 transition-all duration-200 group ${isActive
                                            ? "bg-teal-400 text-white shadow-md"
                                            : "text-gray-100 hover:bg-blue-400 hover:text-white hover:shadow-lg transform hover:scale-105"
                                        }`
                                    }
                                >
                                    <HiOutlineUserCircle size={30} className="mr-3 group-hover:scale-110 transition-transform" />
                                    <span className="text-base">Profile</span>
                                </NavLink>
                            <button
                                onClick={handleLogout}
                                className="text-blue-700 hover:underline text-sm" >
                                Sign Out
                            </button>
                            
                               
                        </div>
                    </div>
                    {/* Page Content */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        <Outlet />
                    </div>
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

    // Fallback for guests or unknown roles:
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
