import React from "react";
import { useLocation } from "react-router-dom";
import Tours from "../pages/Tour/Tours";
import ToursDetails from "../pages/Tour/ToursDetails";

const LocalToursFallback = () => {
    const { pathname } = useLocation();
    const normalized = pathname.replace(/\/+$/, "");

    if (normalized && normalized !== "/tours" && normalized !== "/packages") {
        return <ToursDetails />;
    }

    return <Tours />;
};

const RemoteToursApp = React.lazy(() =>
    import("toursTREM/ToursApp").catch(() => ({
        default: LocalToursFallback,
    }))
);

export default function ToursRemote() {
    return (
        <React.Suspense fallback={<LocalToursFallback />}>
            <RemoteToursApp embedded />
        </React.Suspense>
    );
}
