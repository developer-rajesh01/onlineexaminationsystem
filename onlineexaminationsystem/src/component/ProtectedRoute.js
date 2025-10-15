import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute restricts route access based on userRole stored in localStorage.
 * @param children - The component to render if authorized.
 * @param roleRequired - String role name required to access this route ("faculty" or "student").
 */
export default function ProtectedRoute({ children, roleRequired }) {
    const userRole = localStorage.getItem("userRole");

    if (!userRole || userRole !== roleRequired) {
        // Not authorized: redirect to login page
        return <Navigate to="/login" replace />;
    }

    // Authorized: render children
    return children;
}
