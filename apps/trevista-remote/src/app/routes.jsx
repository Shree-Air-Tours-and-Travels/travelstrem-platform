import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ToursPage from "../features/tours/Tours";
import ToursDetails from "../features/tourDetails/ToursDetails";
import BookingPage from "../features/bookingJourney/BookingJourney";
import BookingSummaryPage from "../features/bookingSummary/BookingSummary";
import BookingCheckoutPage from "../features/bookingCheckout/BookingCheckout";

export default function AppRoutes({ dispatchEvent, embedded = false, userSession = null }) {
    const routeProps = { dispatchEvent, userSession };

    if (embedded) {
        return (
            <Routes>
                <Route index element={<ToursPage {...routeProps} />} />
                <Route path=":tourRef" element={<ToursDetails {...routeProps} />} />
                <Route path="bookings/:bookingId" element={<BookingSummaryPage {...routeProps} />} />
                <Route path="bookings/:bookingId/checkout" element={<BookingCheckoutPage {...routeProps} />} />
                <Route path=":tourRef/book" element={<BookingPage {...routeProps} />} />
                <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/trevista" replace />} />
            <Route path="/trevista" element={<ToursPage {...routeProps} />} />
            <Route path="/trevista/:tourRef" element={<ToursDetails {...routeProps} />} />
            <Route path="/trevista/bookings/:bookingId" element={<BookingSummaryPage {...routeProps} />} />
            <Route path="/trevista/bookings/:bookingId/checkout" element={<BookingCheckoutPage {...routeProps} />} />
            <Route path="/trevista/:tourRef/book" element={<BookingPage {...routeProps} />} />
            <Route path="*" element={<Navigate to="/trevista" replace />} />
        </Routes>
    );
}
