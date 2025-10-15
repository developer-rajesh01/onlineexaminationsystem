import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from './Navbar';
import Footer from './Footer';

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
                <header className="bg-white shadow p-4 flex justify-between mb-10 items-center">
                   <Navbar/>
                </header>
                {children}
                <Footer/>
            </>
        );
    }
    if (role === "faculty") {
        return (
            <div className="flex min-h-screen">
                <aside className="w-1/4 bg-indigo-100 p-5">
                    <h2 className="font-bold text-xl mb-5">Faculty Sidebar</h2>
                    <nav>
                        <ul>
                            <li><Link to="/faculty/dashboard" className="text-indigo-700 hover:underline">Dashboard</Link></li>
                            {/* More faculty links */}
                        </ul>
                    </nav>
                </aside>
                <main className="flex-1 p-10 bg-white overflow-auto">
                    {children}
                </main>
            </div>
        );
    }

    if (role === "student") {
        return (
            <>
                <header className="bg-white shadow p-4 flex justify-between items-center">
                    <div className="font-bold text-xl">YourLogo</div>
                    <nav>
                        <ul className="flex gap-6">
                            <li><Link to="/profile" className="hover:text-indigo-700">Profile</Link></li>
                            <li><Link to="/dashboard" className="hover:text-indigo-700">Dashboard</Link></li>
                            {/* Other student menu */}
                        </ul>
                    </nav>
                </header>
                <main className="p-10">{children}</main>
                <footer className="bg-gray-100 text-center p-4 text-sm text-gray-600">&copy; 2025  Company</footer>
            </>
        );
    }

    // Default fallback layout with Navbar and Footer component
    return (
        <>
            <header className="bg-white shadow p-4 flex justify-between items-center">
                <div className="font-bold text-xl">YourLogo</div>
                <Navbar />
            </header>
            <main className="p-10">{children}</main>
            <footer className="bg-gray-100 text-center p-4 text-sm text-gray-600">
                <Footer />
            </footer>
        </>
    );
}

export default Layout;
