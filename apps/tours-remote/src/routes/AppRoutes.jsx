import React from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import ToursPage from "../pages/Tour/Tours";
import ToursDetails from "../pages/Tour/ToursDetails";

function EmbeddedRouteFallback() {
    const { pathname } = useLocation();
    const path = pathname.replace(/\/+$/, "") || "/";

    if (path === "/" || path === "/tours" || path === "/packages") {
        return <ToursPage />;
    }

    if (/^\/(?:(?:tours|packages)\/)?(?:slug\/)?[^/]+$/.test(path)) {
        return <ToursDetails />;
    }

    return <ToursPage />;
}

function PackageRedirect({ slug = false }) {
    const params = useParams();
    const value = slug ? params.slug : params.id;
    const path = slug ? `/tours/slug/${encodeURIComponent(String(value))}` : `/tours/${encodeURIComponent(String(value))}`;

    return <Navigate to={path} replace />;
}

export default function AppRoutes({ embedded = false }) {
    if (embedded) {
        return (
            <Routes>
                <Route index element={<ToursPage />} />
                <Route path=":id" element={<ToursDetails />} />
                <Route path="slug/:slug" element={<ToursDetails />} />
                <Route path="tours" element={<ToursPage />} />
                <Route path="tours/:id" element={<ToursDetails />} />
                <Route path="tours/slug/:slug" element={<ToursDetails />} />
                <Route path="packages" element={<ToursPage />} />
                <Route path="packages/:id" element={<ToursDetails />} />
                <Route path="packages/slug/:slug" element={<ToursDetails />} />
                <Route path="*" element={<EmbeddedRouteFallback />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/tours" replace />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/tours/:id" element={<ToursDetails />} />
            <Route path="/tours/slug/:slug" element={<ToursDetails />} />
            <Route path="/packages" element={<Navigate to="/tours" replace />} />
            <Route path="/packages/:id" element={<PackageRedirect />} />
            <Route path="/packages/slug/:slug" element={<PackageRedirect slug />} />
            <Route path="*" element={<Navigate to="/tours" replace />} />
        </Routes>
    );
}
