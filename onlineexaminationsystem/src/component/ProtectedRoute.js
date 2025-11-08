import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children, roleRequired }) {
  const userRole = localStorage.getItem("role");
  const loginTimestamp = Number(localStorage.getItem("loginTimestamp"));
  const navigate = useNavigate();

  useEffect(() => {
    const maxAge = 2 * 24 * 60 * 60 * 1000; // 2 days in ms
    if (loginTimestamp && Date.now() - loginTimestamp > maxAge) {
      // Clear localStorage and redirect to login
      localStorage.removeItem("role");
      localStorage.removeItem("loginTimestamp");
      localStorage.removeItem("authUser");
      navigate("/login", { replace: true });
    }
  }, [loginTimestamp, navigate]);

  if (!userRole || userRole !== roleRequired) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
