import React from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ToursListPage from "../tours/management/ToursListPage.view";
import BookingsListPage from "../bookings/BookingsListPage.view";
import BookingDetailPage from "../bookings/BookingDetailPage.view";
import BookingSummaryPage from "../bookings/BookingSummaryPage.view";

function TourModalRedirect({ mode }) {
    const { tourId } = useParams();
    const query = mode === "create" ? "create=true" : `${mode}=${encodeURIComponent(tourId || "")}`;
    return <Navigate to={`/agent/services/tours?${query}`} replace />;
}

export default function ServicesContainer() {
    return (
        <Routes>
            <Route path="tours" element={<ToursListPage />} />
            <Route path="tours/create" element={<TourModalRedirect mode="create" />} />
            <Route path="tours/edit/:tourId" element={<TourModalRedirect mode="edit" />} />
            <Route path="tours/:tourId/manage" element={<TourModalRedirect mode="view" />} />
            <Route path="bookings" element={<BookingsListPage />} />
            <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
            <Route path="bookings/:bookingId/summary" element={<BookingSummaryPage />} />
            <Route path="*" element={<Navigate to="tours" replace />} />
        </Routes>
    );
}
