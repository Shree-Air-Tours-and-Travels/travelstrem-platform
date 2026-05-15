import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ToursPage from "../pages/Tour/Tours";
import ToursDetails from "../pages/Tour/ToursDetails";

export default function AppRoutes({ embedded = false }) {
    if (embedded) {
        return (
            <Routes>
                <Route index element={<ToursPage />} />
                <Route path=":tourRef" element={<ToursDetails />} />
                <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/tours" replace />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/tours/:tourRef" element={<ToursDetails />} />
            <Route path="*" element={<Navigate to="/tours" replace />} />
        </Routes>
    );
}
