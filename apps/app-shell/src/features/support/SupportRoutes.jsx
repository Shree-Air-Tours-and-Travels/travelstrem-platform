import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SupportHomePage from "./SupportHomePage";
import { ArticlePage, ContactSupportPage, ServiceSupportPage, TopicSupportPage } from "./SupportContentPages";
import { NewSupportRequestPage, SupportRequestsPage, SupportTicketDetailPage } from "./SupportTicketPages";
import "./support.scss";

export default function SupportRoutes() {
  return <Routes>
    <Route path="/help" element={<SupportHomePage />} />
    <Route path="/help/service/:serviceId" element={<ServiceSupportPage />} />
    <Route path="/help/topic/:topicId" element={<TopicSupportPage />} />
    <Route path="/help/articles/:articleId" element={<ArticlePage />} />
    <Route path="/help/contact" element={<ContactSupportPage />} />
    <Route path="/help/new-request" element={<NewSupportRequestPage />} />
    <Route path="/help/requests" element={<SupportRequestsPage />} />
    <Route path="/help/requests/:ticketId" element={<SupportTicketDetailPage />} />
    <Route path="*" element={<Navigate to="/help" replace />} />
  </Routes>;
}
