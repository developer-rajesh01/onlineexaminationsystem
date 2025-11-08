// src/component/GuestRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

export default function GuestRoute({ children }) {
    const userRole = localStorage.getItem("role");
    // Redirect logged-in users to their dashboard
    if (userRole === "faculty") return <Navigate to="/dashboard" replace />;
    if (userRole === "student") return <Navigate to="/student/dashboard" replace />;
    return children;
}
