import React from "react";
import ToursPage from "../pages/Tour/Tours";
import { initApp } from "../core/initApp";

export default function FeaturedTours({ embedded = false }) {
    const [ready, setReady] = React.useState(embedded);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        // Shell-embedded widgets inherit the shell session and avoid duplicate /session calls.
        // Standalone widget usage still runs the microapp lifecycle contract.
        if (embedded) {
            setReady(true);
            return undefined;
        }

        let active = true;

        initApp({
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            app: "toursTREM",
            widget: "featuredTours",
        })
            .then(({ session }) => {
                if (!active) return;
                if (!session?.isAuthenticated) {
                    if (window.location.pathname !== "/login") {
                        window.location.replace("/login");
                    }
                    return;
                }
                setReady(true);
            })
            .catch((err) => {
                if (!active) return;
                setError(err?.message || "featured-tours-init-failed");
            });

        return () => {
            active = false;
        };
    }, [embedded]);

    if (error) return null;
    if (!ready) return null;

    return <ToursPage />;
}
