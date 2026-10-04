import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { TourDetailsPage } from "@packages/trem-ui";
import ToursListPage from "../tours/management/ToursListPage.view";
import TourBuilderPage from "../tours/TourBuilderPage";
import { AgentAdminBookingJourney } from "@apps/booking-engine";

const tourDetailsProps = {
  appKey: "agent/services",
  breadcrumbRoot: { label: "PartnerTREM", path: "/agent/services/tours" },
};

export default function ServicesContainer() {
  return (
    <Routes>
      <Route path="tours" element={<ToursListPage />} />
      <Route path="tours/builder" element={<TourBuilderPage />} />
      <Route path="bookings/*" element={<AgentAdminBookingJourney />} />
      <Route
        path="tours/create"
        element={<Navigate to="/agent/services/tours/builder" replace />}
      />
      <Route path="tours/:tourId/edit" element={<TourBuilderPage mode="edit" />} />
      <Route path="tours/:tourRef/view" element={<TourDetailsPage {...tourDetailsProps} />} />
      <Route path="tours/edit/:tourId" element={<TourBuilderPage mode="edit" />} />
      <Route path="tours/:tourRef/manage" element={<TourDetailsPage {...tourDetailsProps} />} />
      <Route path="tours/:tourRef" element={<TourDetailsPage {...tourDetailsProps} />} />
      <Route path="*" element={<Navigate to="tours" replace />} />
    </Routes>
  );
}
