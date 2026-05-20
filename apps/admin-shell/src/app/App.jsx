import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ManageTours from "../features/tours/ManageTours";
import BookingDetail from "../features/tours/BookingDetail/BookingDetail";
import { initApp } from "../core/initApp";
import "../main.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import { useThemeMode } from "@packages/trem-utils";
import { AuthPage, createAuthService } from "@apps/auth-trem";
import { Header, Footer } from "@packages/trem-ui";
import api from "../services/apiClient";
import { emit } from "@packages/trem-events";
import { clearUserSessionCache } from "../services/userSession";

const authService = createAuthService(api);
const adminRoles = ["admin", "agent"];
const isAllowedAdminRole = (session) => adminRoles.includes(session?.user?.role);
const adminHeaderConfig = {
    brand: { label: "AdminTREM", homePath: "/admin/tours" },
    leftSection: { welcome: true, showStatus: true, showNotifications: false },
    menu: [
        { id: "adminTours", label: "Tours", path: "/admin/tours", access: "roles", roles: adminRoles },
        { id: "agentTours", label: "Agent", path: "/agent/tours", access: "roles", roles: adminRoles },
    ],
    authActions: {
        login: { label: "Login", path: "/login" },
        logout: { label: "Logout" },
    },
};

export default function AdminApp({ embedded = false, session: providedSession = null }) {
    const { theme, toggleTheme } = useThemeMode();
    const location = useLocation();
    const [state, setState] = React.useState({
        loading: !embedded,
        error: null,
        session: providedSession,
    });

    const initAdminApp = React.useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const { session } = await initApp({
                pathname: window.location.pathname,
                search: window.location.search,
                hash: window.location.hash,
                app: "adminTREM",
            });
            setState({ loading: false, error: null, session });
        } catch (error) {
            setState({ loading: false, error: error?.message || "init-app-failed", session: null });
        }
    }, []);

    React.useEffect(() => {
        if (embedded) return undefined;
        initAdminApp();
    }, [embedded, initAdminApp]);

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
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token_key_name");
        delete api.defaults.headers.common.Authorization;
        clearUserSessionCache();
        emit("USER_LOGOUT");
        api.post("/auth/logout").catch(() => {});
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
        return (
            <main className="app-status app-status--center">
                <div>
                    <div className="app-status__title">AdminTREM initialization failed</div>
                    <div className="app-status__muted">{state.error}</div>
                    <button className="btn btn-primary mt-3" onClick={initAdminApp}>
                        Retry
                    </button>
                </div>
            </main>
        );
    }

    if (!embedded && (!state.session?.isAuthenticated || !isAllowedAdminRole(state.session))) {
        const afterAuthPath = `${location.pathname}${location.search}${location.hash}` || "/admin/tours";
        return (
            <div className="admin-app-shell">
                <Header headerConfig={adminHeaderConfig} theme={theme} onToggleTheme={toggleTheme} showNotifications={false} />
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
                        afterAuthPath={afterAuthPath}
                    />
                </main>
                <Footer user={state.session?.user} />
            </div>
        );
    }

    return (
        <div className={embedded ? "admin-app-shell admin-app-shell--embedded" : "admin-app-shell"}>
            {!embedded && (
                <Header session={state.session} headerConfig={adminHeaderConfig} theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} showNotifications={false} />
            )}
            <Routes>
                <Route path="/manage/tours" element={<ManageTours embedded={embedded} session={state.session} />} />
                <Route path="/admin/tours" element={<ManageTours embedded={embedded} session={state.session} />} />
                <Route path="/agent/tours" element={<ManageTours embedded={embedded} session={state.session} />} />
                <Route path="/bookings/:bookingId" element={<BookingDetail />} />
                <Route path="*" element={<Navigate to="/manage/tours" replace />} />
            </Routes>
            {!embedded && <Footer user={state.session?.user} />}
        </div>
    );
}
