// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute renders the given element only when the user is authenticated.
 * Optionally, it can restrict access to specific roles via the `allowedRoles` prop.
 *
 * Props:
 *   - element: React element to render when access is granted.
 *   - allowedRoles?: string[] – list of role values (e.g., ['AGENT','ADMIN']).
 */
const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <section className="page-section">
        <div className="container" style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading…</p>
        </div>
      </section>
    );
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role restriction – if allowedRoles provided, enforce membership
  if (allowedRoles && allowedRoles.length && !allowedRoles.includes(user.role)) {
    // Could redirect to a Not Authorized page; for now, send to home
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;

