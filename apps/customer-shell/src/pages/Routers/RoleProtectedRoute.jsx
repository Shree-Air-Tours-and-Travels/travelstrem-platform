// src/components/RoleProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * RoleProtectedRoute
 * Props:
 *  - allowedRoles: array of strings, e.g. ['admin','agent']
 * Usage (wrap a component):
 *  <RoleProtectedRoute allowedRoles={['admin']}><AdminPage/></RoleProtectedRoute>
 *
 * If children are not provided it falls back to Outlet for nested routing.
 */
export default function RoleProtectedRoute({ allowedRoles = [], children }) {
  const { user } = useSelector((state) => state.auth || {});

  console.log(user, allowedRoles, "admin");

  // not logged in -> redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // if allowedRoles provided and user's role isn't included -> redirect (or show not-authorized)
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // You could render a dedicated NotAuthorized component instead
    return <Navigate to="/" replace />;
  }

  // authorized: render children or nested routes
  return children ? children : <Outlet />;
}
