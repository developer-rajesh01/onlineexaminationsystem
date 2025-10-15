import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roleRequired }) {
  const userRole = localStorage.getItem("role");

  if (!userRole || userRole !== roleRequired) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
