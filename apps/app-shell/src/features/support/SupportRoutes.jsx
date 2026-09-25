import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SupportHomePage from "./SupportHomePage";
import {
  NewSupportRequestPage,
  SupportRequestsPage,
  SupportTicketDetailPage,
} from "./SupportTicketPages";
import "./support.scss";

export default function SupportRoutes({ isAuthenticated = false, onRequireAuthentication }) {
  const authenticatedRoute = (element) =>
    isAuthenticated ? element : <Navigate to="/help" replace />;

  return (
    <Routes>
      <Route
        path="/help"
        element={
          <SupportHomePage
            isAuthenticated={isAuthenticated}
            onRequireAuthentication={onRequireAuthentication}
          />
        }
      />
      <Route path="/help/new-request" element={authenticatedRoute(<NewSupportRequestPage />)} />
      <Route path="/help/requests" element={authenticatedRoute(<SupportRequestsPage />)} />
      <Route
        path="/help/requests/:ticketId"
        element={authenticatedRoute(<SupportTicketDetailPage />)}
      />
      <Route path="*" element={<Navigate to="/help" replace />} />
    </Routes>
  );
}
