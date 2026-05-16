import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ManageTours from "../features/tours/ManageTours";
import { initApp } from "../core/initApp";
import "../main.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import "remixicon/fonts/remixicon.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useThemeMode } from "@packages/trem-utils";
import { AuthPage, createAuthService } from "@apps/auth-trem";
import { AdminShellHeader, Footer } from "@packages/trem-ui";
import api from "../services/apiClient";
import { emit } from "@packages/trem-events";
import { clearUserSessionCache } from "../services/userSession";

const authService = createAuthService(api);
const adminRoles = ["admin", "agent"];
const isAllowedAdminRole = (session) => adminRoles.includes(session?.user?.role);

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
            })
            .catch((error) => {
                if (!active) return;
                setState({ loading: false, error: error?.message || "init-app-failed", session: null });
            });

        return () => {
            active = false;
        };
    }, [embedded]);

    const reloadAdminSession = React.useCallback(async () => {
        clearUserSessionCache();
        const next = await initApp({
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            app: "adminTREM",
        });
        setState({ loading: false, error: null, session: next.session });
        return next;
    }, []);

    const handleLogout = React.useCallback(() => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token_key_name");
        delete api.defaults.headers.common.Authorization;
        clearUserSessionCache();
        emit("USER_LOGOUT");
        setState({ loading: false, error: null, session: null });
    }, []);

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

    if (!embedded && (!state.session?.isAuthenticated || !isAllowedAdminRole(state.session))) {
        return (
            <div className="admin-app-shell">
                <AdminShellHeader theme={theme} onToggleTheme={toggleTheme} />
                <main className="admin-auth-page">
                    {state.session?.isAuthenticated && !isAllowedAdminRole(state.session) && (
                        <div className="admin-auth-page__notice">This account does not have AdminTREM access.</div>
                    )}
                    <AuthPage
                        api={api}
                        authService={authService}
                        emit={emit}
                        reload={reloadAdminSession}
                        appName="AdminTREM"
                        allowedRoles={adminRoles}
                        roleOptions={[
                            {
                                value: "admin",
                                title: "Admin",
                                subtitle: "Full platform access and controls",
                                descriptor: "Platform",
                                requiresSecret: true,
                            },
                            {
                                value: "agent",
                                title: "Agent",
                                subtitle: "Manage tours, quotes, and customer requests",
                                descriptor: "Operations",
                                requiresSecret: true,
                            },
                        ]}
                        defaultRole="admin"
                        afterAuthPath="/admin/tours"
                    />
                </main>
                <Footer user={state.session?.user} />
            </div>
        );
    }

    return (
        <div className={embedded ? "admin-app-shell admin-app-shell--embedded" : "admin-app-shell"}>
            {!embedded && (
                <AdminShellHeader user={state.session?.user} theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
            )}
            <Routes>
                <Route path="/manage/tours" element={<ManageTours embedded={embedded} session={state.session} />} />
                <Route path="/admin/tours" element={<ManageTours embedded={embedded} session={state.session} />} />
                <Route path="/agent/tours" element={<ManageTours embedded={embedded} session={state.session} />} />
                <Route path="*" element={<Navigate to="/manage/tours" replace />} />
            </Routes>
            {!embedded && <Footer user={state.session?.user} />}
        </div>
    );
}
