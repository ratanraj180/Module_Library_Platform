import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    // Redirect to login page with original path state
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          message: "Please login as Developer or Admin to access enterprise modules."
        }}
        replace
      />
    );
  }

  const role = (user.role || "").toLowerCase();

  // If roles array provided, verify role permissions
  if (roles && roles.length > 0) {
    const formattedRoles = roles.map(r => r.toLowerCase());
    if (!formattedRoles.includes(role)) {
      return (
        <Navigate
          to="/access-denied"
          state={{
            message: "You do not have the required permissions to access this page."
          }}
          replace
        />
      );
    }
  }

  return children;
}
