// src/pages/AuthPage/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, redirectTo = "/auth" }) => {
  const { user, loading } = useSelector((state) => state.auth || {});
  const location = useLocation();

  if (loading) {
    // while auth initializes, render nothing (or spinner)
    return <div style={{ padding: 24 }}>Checking authentication…</div>;
  }
  if (!user) {
    // redirect to login and store where user came from
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  return children;
};

export default ProtectedRoute;
