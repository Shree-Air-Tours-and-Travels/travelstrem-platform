import React from "react";
import { useLocation } from "react-router-dom";
import { initApp } from "../../core/initApp";
import { getHeaderConfig } from "../../services/configService";
import { clearUserSessionCache } from "../../services/userSession";
import { on, registerSessionCacheClearer } from "@packages/trem-events";

const DEFAULT_SESSION = {
    user: null,
    permissions: ["public"],
    isAuthenticated: false,
    flags: { role: "public" },
};

const DEFAULT_HEADER_CONFIG = {
    brand: {
        label: "TravelsTREM",
        homePath: "/",
    },
    leftSection: {
        welcome: true,
        showLogout: true,
        showStatus: true,
    },
    activePath: "/",
    menu: [
        { label: "Home", type: "internal", path: "/", disabled: false },
        { label: "About", type: "internal", path: "/about", disabled: false },
        {
            label: "Services",
            type: "dropdown",
            disabled: false,
            items: [{ label: "Tours & Packages", app: "toursTREM", path: "/tours", disabled: false }],
        },
        { label: "Dashboard", app: "customer-shell", path: "/dashboard", disabled: false },
    ],
    authActions: {
        login: { label: "Login", path: "/login" },
        logout: { label: "Logout", eventName: "USER_LOGOUT", redirectTo: "/login" },
    },
    routes: [],
    remotes: {},
    fallbacks: {
        authenticated: "/",
        anonymous: "/login",
        unauthorized: "/",
    },
};

const DEFAULT_PAGE_CONFIG = {
    page: "home",
    widgets: [],
};

const PortalConfigContext = React.createContext({
    loading: true,
    error: null,
    session: DEFAULT_SESSION,
    userSession: DEFAULT_SESSION,
    headerConfig: DEFAULT_HEADER_CONFIG,
    pageConfig: DEFAULT_PAGE_CONFIG,
    reload: () => Promise.resolve(),
    refreshHeader: () => Promise.resolve(),
});

const getPortalParams = ({ pathname, search, hash }) => ({
    pathname,
    search,
    hash,
});

export function PortalConfigProvider({ children }) {
    const location = useLocation();
    const initOnceRef = React.useRef(null);
    const latestLocationRef = React.useRef(location);
    const lastHeaderRouteRef = React.useRef("");
    const sessionRef = React.useRef(DEFAULT_SESSION);
    const [state, setState] = React.useState({
        loading: true,
        error: null,
        session: DEFAULT_SESSION,
        headerConfig: DEFAULT_HEADER_CONFIG,
        pageConfig: DEFAULT_PAGE_CONFIG,
    });

    React.useEffect(() => {
        latestLocationRef.current = location;
    }, [location]);

    React.useEffect(() => {
        sessionRef.current = state.session;
    }, [state.session]);

    React.useEffect(() => {
        registerSessionCacheClearer(clearUserSessionCache);
    }, []);

    const refreshHeader = React.useCallback(async (nextLocation = latestLocationRef.current, session = sessionRef.current) => {
        const routeKey = `${nextLocation.pathname}${nextLocation.search}${nextLocation.hash}`;
        lastHeaderRouteRef.current = routeKey;
        const params = {
            ...getPortalParams(nextLocation),
            isAuthenticated: session?.isAuthenticated ? "true" : "false",
            role: session?.user?.role || "public",
            userName: session?.user?.name || "",
            userEmail: session?.user?.email || "",
        };
        const header = await getHeaderConfig(params);

        setState((current) => ({
            ...current,
            headerConfig: header || DEFAULT_HEADER_CONFIG,
            pageConfig: header?.pageConfig || current.pageConfig,
        }));

        return header;
    }, []);

    const loadPortalConfig = React.useCallback(async ({ forceSession = false, location: nextLocation = null } = {}) => {
        const params = getPortalParams(nextLocation || latestLocationRef.current);

        if (forceSession) {
            clearUserSessionCache();
            initOnceRef.current = null;
        }

        if (initOnceRef.current) return initOnceRef.current;
        setState((current) => ({ ...current, loading: true, error: null }));

        initOnceRef.current = (async () => {
            const { session, header, pageConfig } = await initApp(params);
            lastHeaderRouteRef.current = `${params.pathname}${params.search}${params.hash}`;

            setState({
                loading: false,
                error: null,
                session: session || DEFAULT_SESSION,
                headerConfig: header || DEFAULT_HEADER_CONFIG,
                pageConfig: pageConfig || DEFAULT_PAGE_CONFIG,
            });
            sessionRef.current = session || DEFAULT_SESSION;
        })().catch((error) => {
            console.warn("[PortalConfig] initApp failed, using shell fallbacks:", error?.message || error);
            setState({
                loading: false,
                error: error?.message || "init-app-failed",
                session: DEFAULT_SESSION,
                headerConfig: DEFAULT_HEADER_CONFIG,
                pageConfig: DEFAULT_PAGE_CONFIG,
            });
        });

        return initOnceRef.current;
    }, []);

    React.useEffect(() => {
        const unsubscribe = on("SESSION_TOKEN_READY", () => {
            clearUserSessionCache();
            initOnceRef.current = null;
            loadPortalConfig({ forceSession: true, location: latestLocationRef.current }).catch((error) => {
                console.warn("[PortalConfig] session refresh failed:", error?.message || error);
            });
        });

        return unsubscribe;
    }, [loadPortalConfig]);

    React.useEffect(() => {
        loadPortalConfig();
    }, [loadPortalConfig]);

    React.useEffect(() => {
        if (state.loading) return;
        const routeKey = `${location.pathname}${location.search}${location.hash}`;
        if (lastHeaderRouteRef.current === routeKey) return;

        refreshHeader(location).catch((error) => {
            console.warn("[PortalConfig] header refresh failed:", error?.message || error);
        });
    }, [location, location.pathname, location.search, location.hash, refreshHeader, state.loading]);

    const value = React.useMemo(
        () => ({
            ...state,
            userSession: state.session,
            reload: loadPortalConfig,
            refreshHeader,
        }),
        [loadPortalConfig, refreshHeader, state]
    );

    return <PortalConfigContext.Provider value={value}>{children}</PortalConfigContext.Provider>;
}

export const usePortalConfig = () => React.useContext(PortalConfigContext);
