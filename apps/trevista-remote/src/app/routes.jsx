import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@packages/trem-ui";
import ToursHome from "../features/toursHome/ToursHome";
import ToursPage from "../features/tours/Tours";
import ToursDetails from "../features/tourDetails/ToursDetails";

export default function AppRoutes({ dispatchEvent, embedded = false, userSession = null }) {
    const routeProps = { dispatchEvent, userSession, embedded };

    if (embedded) {
        return (
            <>
                <ScrollToTop />
                <Routes>
                    <Route index element={<ToursHome {...routeProps} />} />
                    <Route path="tours" element={<ToursPage {...routeProps} />} />
                    <Route path="tours/:tourRef" element={<ToursDetails {...routeProps} />} />
                    <Route path="tour/:tourRef" element={<ToursDetails {...routeProps} />} />
                    <Route path="*" element={<Navigate to="." replace />} />
                </Routes>
            </>
        );
    }

    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Navigate to="/trevista" replace />} />
                <Route path="/trevista" element={<ToursHome {...routeProps} />} />
                <Route path="/trevista/tours" element={<ToursPage {...routeProps} />} />
                <Route path="/trevista/tours/:tourRef" element={<ToursDetails {...routeProps} />} />
                <Route path="/trevista/tour/:tourRef" element={<ToursDetails {...routeProps} />} />
                <Route path="*" element={<Navigate to="/trevista" replace />} />
            </Routes>
        </>
    );
}
