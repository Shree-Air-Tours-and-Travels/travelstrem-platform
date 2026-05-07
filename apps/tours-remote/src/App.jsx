import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { initApp } from "./core/initApp";
import "./main.scss";
import { useThemeMode } from "./hooks/useThemeMode";

export default function App({ embedded = false }) {
    const { theme, toggleTheme } = useThemeMode();
    const [state, setState] = React.useState({
        loading: !embedded,
        error: null,
        session: null,
    });

    React.useEffect(() => {
        // When loaded through the shell, ToursTREM skips its own session call.
        // The shell has already validated the user; standalone ToursTREM still validates independently.
        if (embedded) return undefined;

        let active = true;

        initApp({
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            app: "toursTREM",
        })
            .then(({ session }) => {
                if (!active) return;
                setState({ loading: false, error: null, session });
                if (!session?.isAuthenticated && window.location.pathname !== "/login") {
                    window.location.replace("/login");
                }
            })
            .catch((error) => {
                if (!active) return;
                setState({ loading: false, error: error?.message || "init-app-failed", session: null });
            });

        return () => {
            active = false;
        };
    }, [embedded]);

    if (state.loading) return null;

    if (state.error) return <div className="app-status">ToursTREM initialization failed: {state.error}</div>;

    if (!embedded && !state.session?.isAuthenticated) {
        return <div className="app-status">Authentication required. Please sign in from the shell app.</div>;
    }

    return (
        <div className={embedded ? "tours-app-shell tours-app-shell--embedded" : "tours-app-shell"}>
            {!embedded && (
                <header className="micro-app-header">
                    <button className="micro-app-header__brand" type="button">ToursTREM</button>
                    <button className="micro-app-header__theme-toggle" type="button" onClick={toggleTheme}>
                        {theme === "dark" ? "Light" : "Dark"}
                    </button>
                </header>
            )}
            <AppRoutes embedded={embedded} />
        </div>
    );
}
