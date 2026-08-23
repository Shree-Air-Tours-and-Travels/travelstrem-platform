import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ToursListPage from "../tours/management/ToursListPage.view";
import TourBuilderPage from "../tours/TourBuilderPage";
import EnquiriesPage from "../../enquiries/EnquiriesPage";

export default function ServicesContainer() {
  return (
    <Routes>
      <Route path="tours" element={<ToursListPage />} />
      <Route path="tours/builder" element={<TourBuilderPage />} />
      <Route path="bookings/*" element={<EnquiriesPage />} />
      <Route
        path="tours/create"
        element={<Navigate to="/agent/services/tours/builder" replace />}
      />
      <Route path="tours/:tourId/edit" element={<TourBuilderPage mode="edit" />} />
      <Route path="tours/:tourId/view" element={<TourBuilderPage mode="view" />} />
      <Route path="tours/edit/:tourId" element={<TourBuilderPage mode="edit" />} />
      <Route path="tours/:tourId/manage" element={<TourBuilderPage mode="view" />} />
      <Route path="*" element={<Navigate to="tours" replace />} />
    </Routes>
  );
}
