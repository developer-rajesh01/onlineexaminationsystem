import React from "react";
import { Navigate } from "react-router-dom";

function HomeRedirect() {
    const userRole = localStorage.getItem("userRole");

    if (userRole === "faculty") {
        return <Navigate to="/dashboard" replace />;
    } else if (userRole === "student") {
        return <Navigate to="/student/dashboard" replace />;
    } else {
        return <Navigate to="/login" replace />;
    }
}

export default HomeRedirect;

