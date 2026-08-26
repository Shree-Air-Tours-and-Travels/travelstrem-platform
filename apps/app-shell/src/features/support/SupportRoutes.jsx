import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SupportHomePage from "./SupportHomePage";
import {
  NewSupportRequestPage,
  SupportRequestsPage,
  SupportTicketDetailPage,
} from "./SupportTicketPages";
import "./support.scss";

export default function SupportRoutes() {
  return (
    <Routes>
      <Route path="/help" element={<SupportHomePage />} />
      <Route path="/help/new-request" element={<NewSupportRequestPage />} />
      <Route path="/help/requests" element={<SupportRequestsPage />} />
      <Route path="/help/requests/:ticketId" element={<SupportTicketDetailPage />} />
      <Route path="*" element={<Navigate to="/help" replace />} />
    </Routes>
  );
}
