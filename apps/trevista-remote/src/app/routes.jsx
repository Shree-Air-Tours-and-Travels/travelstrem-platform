import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ToursPage from "../features/tours/Tours";
import ToursDetails from "../features/tourDetails/ToursDetails";
import BookingEngineRedirect from "../app/views/BookingEngineRedirect";

export default function AppRoutes({ dispatchEvent, embedded = false, userSession = null }) {
    const routeProps = { dispatchEvent, userSession };

    if (embedded) {
        return (
            <Routes>
                <Route index element={<ToursPage {...routeProps} />} />
                <Route path=":tourRef" element={<ToursDetails {...routeProps} />} />
                <Route path="bookings/:bookingId" element={<BookingEngineRedirect mode="summary" />} />
                <Route path="bookings/:bookingId/checkout" element={<BookingEngineRedirect mode="checkout" />} />
                <Route path=":tourRef/book" element={<BookingEngineRedirect />} />
                <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/trevista" replace />} />
            <Route path="/trevista" element={<ToursPage {...routeProps} />} />
            <Route path="/trevista/:tourRef" element={<ToursDetails {...routeProps} />} />
            <Route path="/trevista/bookings/:bookingId" element={<BookingEngineRedirect mode="summary" />} />
            <Route path="/trevista/bookings/:bookingId/checkout" element={<BookingEngineRedirect mode="checkout" />} />
            <Route path="/trevista/:tourRef/book" element={<BookingEngineRedirect />} />
            <Route path="*" element={<Navigate to="/trevista" replace />} />
        </Routes>
    );
}
