import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SUPPORT_REQUEST_TYPE } from "@packages/trem-support-contracts";
import SupportHomePage from "./SupportHomePage";
import BookingRequestPage from "./BookingRequestPage";
import { ArticlePage, BookingSupportListPage, BookingSupportPage, ContactSupportPage, ServiceSupportPage, TopicSupportPage } from "./SupportContentPages";
import { NewSupportRequestPage, SupportRequestsPage, SupportTicketDetailPage } from "./SupportTicketPages";
import "./support.scss";

export default function SupportRoutes() {
  return <Routes>
    <Route path="/help" element={<SupportHomePage />} />
    <Route path="/help/bookings" element={<BookingSupportListPage />} />
    <Route path="/help/booking/:bookingId" element={<BookingSupportPage />} />
    <Route path="/help/service/:serviceId" element={<ServiceSupportPage />} />
    <Route path="/help/topic/:topicId" element={<TopicSupportPage />} />
    <Route path="/help/articles/:articleId" element={<ArticlePage />} />
    <Route path="/help/contact" element={<ContactSupportPage />} />
    <Route path="/help/new-request" element={<NewSupportRequestPage />} />
    <Route path="/help/requests" element={<SupportRequestsPage />} />
    <Route path="/help/requests/:ticketId" element={<SupportTicketDetailPage />} />
    <Route path="/help/refund/:bookingId" element={<BookingRequestPage type={SUPPORT_REQUEST_TYPE.REFUND} />} />
    <Route path="/help/cancel/:bookingId" element={<BookingRequestPage type={SUPPORT_REQUEST_TYPE.CANCELLATION} />} />
    <Route path="/help/reschedule/:bookingId" element={<BookingRequestPage type={SUPPORT_REQUEST_TYPE.RESCHEDULE} />} />
    <Route path="*" element={<Navigate to="/help" replace />} />
  </Routes>;
}
