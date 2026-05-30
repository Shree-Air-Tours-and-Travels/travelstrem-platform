import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ToursListPage from "../tours/management/ToursListPage.view";
import CreateTourPage from "../tours/management/CreateTourPage.view";
import ManageTourPage from "../tours/management/ManageTourPage.view";
import BookingsListPage from "../bookings/BookingsListPage.view";
import BookingDetailPage from "../bookings/BookingDetailPage.view";
import BookingSummaryPage from "../bookings/BookingSummaryPage.view";

export default function ServicesContainer() {
    return (
        <Routes>
            <Route path="tours" element={<ToursListPage />} />
            <Route path="tours/create" element={<CreateTourPage />} />
            <Route path="tours/edit/:tourId" element={<CreateTourPage />} />
            <Route path="tours/:tourId/manage" element={<ManageTourPage />} />
            <Route path="bookings" element={<BookingsListPage />} />
            <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
            <Route path="bookings/:bookingId/summary" element={<BookingSummaryPage />} />
            <Route path="*" element={<Navigate to="tours" replace />} />
        </Routes>
    );
}
