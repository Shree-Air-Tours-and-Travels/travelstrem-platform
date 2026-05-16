import React from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

import { AuthPage } from "@apps/auth-trem";
import Home from "../features/home/Home";
import About from "../features/about/About";
import CheckoutPage from "../features/checkout/Checkout";
import DashboardPage from "../features/dashboard/Dashboard";
import FederatedToursApp from "../federation/FederatedToursApp";
import SearchResultList from "../shared/ui/SEO/SearchResultList";
import ScrollToTop from "../shared/ui/ScrollToTop/ScrollToTop";
import { ROUTES } from "@packages/trem-utils";
import { usePortalConfig } from "./providers/PortalProvider";
import api from "../services/apiClient";
import authService from "../services/authService";
import { emit } from "@packages/trem-events";
import { canAccessAuthRoute, hasAuthRole } from "@packages/trem-auth-core";

const interpolatePath = (path, params) =>
    Object.entries(params || {}).reduce(
        (nextPath, [key, value]) => nextPath.replace(`:${key}`, encodeURIComponent(String(value))),
        path
    );

const ConfigRedirect = ({ to }) => {
    const params = useParams();
    return <Navigate to={interpolatePath(to, params)} replace />;
};

const AdminShellRedirect = () => {
    React.useEffect(() => {
        const adminUrl = process.env.REACT_APP_ADMIN_SHELL_URL || "http://localhost:3002/admin/tours";
        window.location.assign(adminUrl);
    }, []);

    return null;
};

const Routers = () => {
    const location = useLocation();
    const { loading, session, headerConfig, reload } = usePortalConfig();
    const user = session?.user || null;
    const fromLocation = location.state?.from;
    const redirectAfterAuth = fromLocation
        ? `${fromLocation.pathname || ROUTES.home}${fromLocation.search || ""}${fromLocation.hash || ""}`
        : ROUTES.home;
    const fallbackPath = user
        ? headerConfig?.fallbacks?.authenticated || ROUTES.home
        : headerConfig?.fallbacks?.anonymous || ROUTES.login;
    const routeConfig = Array.isArray(headerConfig?.routes) && headerConfig.routes.length ? headerConfig.routes : null;
    const customerAuthPage = (
        <AuthPage
            api={api}
            authService={authService}
            emit={emit}
            reload={reload}
            appName="TravelsTREM"
            allowedRoles={["member"]}
            roleOptions={[
                {
                    value: "member",
                    title: "Member",
                    subtitle: "Book trips and manage your journeys",
                    descriptor: "Customer",
                },
            ]}
            defaultRole="member"
            afterAuthPath={redirectAfterAuth}
            showAdminSecret={false}
        />
    );

    const componentByKey = {
        home: <Home />,
        about: <About />,
        search: <SearchResultList />,
        auth: user ? <Navigate to={redirectAfterAuth} replace /> : customerAuthPage,
        checkout: <CheckoutPage />,
        dashboard: <DashboardPage />,
        "remote.adminTREM": <AdminShellRedirect />,
        "remote.admin": <AdminShellRedirect />,
        admin: <AdminShellRedirect />,
        "remote.toursTREM": <FederatedToursApp />,
        "remote.tours": <FederatedToursApp />,
    };

    const protectRoute = (route, element) => {
        // This is a generic interpreter for backend route.access config.
        // The rules are not page-specific hardchecks; backend still owns route metadata and fallbacks.
        if (route.access === "authenticated" && !canAccessAuthRoute(route, session)) {
            return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
        }

        if (route.access === "roles") {
            if (!session?.isAuthenticated) {
                return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
            }

            if (!hasAuthRole(session, route.roles || [])) {
                return <Navigate to={headerConfig?.fallbacks?.unauthorized || ROUTES.home} replace />;
            }
        }

        if (route.access === "publicOnly") {
            const redirectTo = fromLocation ? redirectAfterAuth : route.authenticatedRedirect || ROUTES.home;
            return user ? <Navigate to={redirectTo} replace /> : element;
        }

        return element;
    };

    const renderConfiguredRoute = (route) => {
        const baseElement = route.redirectTo
            ? <ConfigRedirect to={route.redirectTo} />
            : componentByKey[route.component] || <Navigate to={fallbackPath} replace />;

        return protectRoute(route, baseElement);
    };

    if (loading) return null;

    return (
        <>
            <ScrollToTop />

            <Routes>
                {routeConfig ? (
                    routeConfig.map((route) => (
                        <Route key={route.id || route.path} path={route.path} element={renderConfiguredRoute(route)} />
                    ))
                ) : (
                    // Backend route config is the normal source of truth. These minimal fallbacks only keep
                    // the shell usable if /header-config is unavailable during local development.
                    <>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/search" element={<SearchResultList />} />
                        <Route
                            path="/login"
                            element={user ? <Navigate to={redirectAfterAuth} replace /> : customerAuthPage}
                        />
                        <Route
                            path="/auth"
                            element={user ? <Navigate to={redirectAfterAuth} replace /> : customerAuthPage}
                        />
                        <Route
                            path="/tours/*"
                            element={protectRoute({ access: "authenticated" }, <FederatedToursApp />)}
                        />
                        <Route
                            path="/dashboard"
                            element={protectRoute({ access: "authenticated" }, <DashboardPage />)}
                        />
                        <Route
                            path="/checkout/:bookingId"
                            element={protectRoute({ access: "authenticated" }, <CheckoutPage />)}
                        />
                        <Route
                            path="/admin/*"
                            element={protectRoute({ access: "roles", roles: ["admin"] }, <AdminShellRedirect />)}
                        />
                    </>
                )}

                <Route path="*" element={<Navigate to={fallbackPath} replace state={{ from: location }} />} />
            </Routes>
        </>
    );
};

export default Routers;
