import React from "react";
import ManageTours from "./pages/ManageTours";
import { initApp } from "./core/initApp";
import "./main.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import "remixicon/fonts/remixicon.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useThemeMode } from "./hooks/useThemeMode";
import { getShellLoginUrl } from "./config/portalEnvironment";

const SHELL_LOGIN_URL = process.env.REACT_APP_ALLOW_ENV_OVERRIDES === "true" && process.env.REACT_APP_SHELL_URL
    ? `${process.env.REACT_APP_SHELL_URL.replace(/\/$/, "")}/login`
    : getShellLoginUrl();

export default function AdminApp({ embedded = false, session: providedSession = null }) {
    const { theme, toggleTheme } = useThemeMode();
    const [state, setState] = React.useState({
        loading: !embedded,
        error: null,
        session: providedSession,
    });

    React.useEffect(() => {
        // Embedded AdminTREM trusts the shell session boundary and avoids duplicate auth calls.
        // Standalone AdminTREM still validates itself through its own lifecycle.
        if (embedded) return undefined;

        let active = true;

        initApp({
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            app: "adminTREM",
        })
            .then(({ session }) => {
                if (!active) return;
                setState({ loading: false, error: null, session });
                if (!session?.isAuthenticated || session?.user?.role !== "admin") {
                    window.location.href = SHELL_LOGIN_URL;
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

    if (state.loading) {
        return (
            <main className="app-status app-status--center">
                <div>
                    <div className="app-status__title">Loading admin app</div>
                    <div className="app-status__muted">Initializing AdminTREM lifecycle...</div>
                </div>
            </main>
        );
    }

    if (state.error) {
        return <main className="app-status">AdminTREM initialization failed: {state.error}</main>;
    }

    if (!embedded && (!state.session?.isAuthenticated || state.session?.user?.role !== "admin")) {
        return <main className="app-status">Redirecting to login...</main>;
    }

    return (
        <div className={embedded ? "admin-app-shell admin-app-shell--embedded" : "admin-app-shell"}>
            {!embedded && (
                <header className="micro-app-header">
                    <button className="micro-app-header__brand" type="button">AdminTREM</button>
                    <button className="micro-app-header__theme-toggle" type="button" onClick={toggleTheme}>
                        {theme === "dark" ? "Light" : "Dark"}
                    </button>
                </header>
            )}
            <ManageTours embedded={embedded} session={state.session} />
        </div>
    );
}
