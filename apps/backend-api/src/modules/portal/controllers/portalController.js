import jwt from "jsonwebtoken";
import config from "../../../config/index.js";
import headerConfigTemplate from "../../../config/header.js";
import sessionConfigTemplate from "../../../config/session.js";
import pageConfigTemplate from "../../../config/pageConfig.js";
import User from "../../auth/models/User.js";

const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;
const USE_SHARED_COOKIE_DOMAIN = config.IS_PRODUCTION && Boolean((config.AUTH_COOKIE_DOMAIN || process.env.AUTH_COOKIE_DOMAIN || "").toString().trim());
const COOKIE_NAME = config.IS_PRODUCTION && !USE_SHARED_COOKIE_DOMAIN ? "__Host-token" : "token";
const MASTER_ADMIN_EMAIL = (config.MASTER_ADMIN_EMAIL || "")
    .toString()
    .trim()
    .toLowerCase();


const getBearerToken = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (authHeader.startsWith("Bearer ")) return authHeader.split(" ")[1] || null;
    if (req.headers["x-ignore-cookie-auth"] === "true") return null;

    return req.cookies?.[COOKIE_NAME] || req.cookies?.token || req.cookies?.["__Host-token"] || null;
};

const getUserFromRequest = (req) => {
    const token = getBearerToken(req);
    if (!token) return null;

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return {
            id: payload.sub || payload.id || payload.userId || null,
            name: payload.name || null,
            email: payload.email || null,
            role: payload.role || "member",
            agentRef: payload.agentRef || "",
            agencyRef: payload.agencyRef || "",
            partnerAgencyRef: payload.partnerAgencyRef || "",
            agentApprovalStatus: payload.agentApprovalStatus || "not_required",
            adminLevel: payload.adminLevel || "none",
            adminApprovalStatus: payload.adminApprovalStatus || "not_required",
        };
    } catch (error) {
        return null;
    }
};

const toSafeUser = (user, fallback = {}) => {
    if (!user && !fallback) return null;

    return {
        id: user?._id?.toString?.() || user?.id || fallback.sub || fallback.id || fallback.userId || null,
        name: user?.name || fallback.name || null,
        email: user?.email || fallback.email || null,
        role: user?.role || fallback.role || "member",
        agentRef: user?.agentRef || fallback.agentRef || "",
        agencyRef: user?.agencyRef || fallback.agencyRef || "",
        partnerAgencyRef: user?.partnerAgencyRef || fallback.partnerAgencyRef || "",
        agentApprovalStatus: user?.agentApprovalStatus || fallback.agentApprovalStatus || "not_required",
        adminLevel: user?.adminLevel || fallback.adminLevel || "none",
        adminApprovalStatus: user?.adminApprovalStatus || fallback.adminApprovalStatus || "not_required",
    };
};

const getSessionFromRequest = async (req) => {
    const token = getBearerToken(req);
    if (!token) {
        return {
            user: null,
            permissions: ["public"],
            isAuthenticated: false,
        };
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const userId = payload.sub || payload.id || payload.userId;
        const dbUser = userId ? await User.findById(userId).select("name email role agentRef agencyRef partnerAgencyRef agentApprovalStatus adminLevel adminApprovalStatus") : null;
        if (dbUser?.role === "admin" && dbUser.email === MASTER_ADMIN_EMAIL && dbUser.adminLevel !== "master") {
            dbUser.adminLevel = "master";
            dbUser.adminApprovalStatus = "approved";
            await dbUser.save();
        }
        if (dbUser?.role === "admin" && dbUser.adminApprovalStatus !== "approved") {
            return {
                user: null,
                permissions: ["public"],
                isAuthenticated: false,
            };
        }
        if (dbUser?.role === "agent" && dbUser.agentApprovalStatus !== "approved") {
            return {
                user: null,
                permissions: ["public"],
                isAuthenticated: false,
            };
        }
        const user = toSafeUser(dbUser, payload);
        const role = user?.role || "member";

        return {
            user,
            permissions: [role],
            isAuthenticated: Boolean(user),
        };
    } catch (error) {
        return {
            user: null,
            permissions: ["public"],
            isAuthenticated: false,
        };
    }
};

const pathToRegex = (routePath) => {
    const paramNames = [];
    const pattern = routePath
        .replace(/\/\*$/, "(?:/.*)?")
        .replace(/:([^/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return "([^/]+)";
        });

    return { regex: new RegExp(`^${pattern}$`), paramNames };
};

const matchRoute = (pathname, routePaths = {}) => {
    const routeEntries = Object.entries(routePaths);

    for (const [key, routePath] of routeEntries) {
        const { regex, paramNames } = pathToRegex(routePath);
        const match = pathname.match(regex);
        if (!match) continue;

        return {
            key,
            path: routePath,
            params: paramNames.reduce((acc, paramName, index) => {
                acc[paramName] = decodeURIComponent(match[index + 1] || "");
                return acc;
            }, {}),
        };
    }

    return null;
};

const flattenMenuItems = (items = []) => items.flatMap((item) => [
    item,
    ...(Array.isArray(item.items) ? flattenMenuItems(item.items) : []),
]);

const resolveActivePath = (pathname = "/", configData = {}) => {
    const normalizedPath = pathname || "/";
    const routeMap = configData.routeMap || {};
    const paths = Object.keys(routeMap || {}).sort((a, b) => b.length - a.length);
    const matchedPath = paths.find((routePath) => (
        routePath === "/"
            ? normalizedPath === "/"
            : normalizedPath === routePath || normalizedPath.startsWith(`${routePath}/`)
    ));

    const matchedApp = matchedPath ? routeMap[matchedPath] : null;
    const menuMatch = flattenMenuItems(configData.menu || []).find((item) => (
        matchedApp && item?.app === matchedApp && item?.path
    ));
    if (menuMatch?.path) return menuMatch.path;

    return matchedPath || "";
};

const stripRemoteEntry = (value = "") => String(value || "").replace(/\/remoteEntry\.js$/, "").replace(/\/$/, "");

const applyEnvironmentRemotes = (headerConfig = {}) => {
    const envFrontends = config.PORTAL_CONFIG?.frontends || {};
    const remotes = headerConfig.remotes || {};

    const trevistaRemoteUrl = stripRemoteEntry(config.TREVISTA_URL || envFrontends.trevista?.remoteEntry || envFrontends.trevista?.baseUrl);
    const trevioRemoteUrl = stripRemoteEntry(config.TREVIO_URL || envFrontends.trevio?.remoteEntry || envFrontends.trevio?.baseUrl);
    const adminRemoteUrl = stripRemoteEntry(config.ADMIN_REMOTE_URL || envFrontends.adminTREM?.remoteEntry || envFrontends.adminTREM?.baseUrl);
    const productUrls = {
        Trevio: trevioRemoteUrl,
        Trevista: trevistaRemoteUrl,
    };
    const menu = (headerConfig.menu || []).map((item) => {
        if (!Array.isArray(item.items)) return item;
        return {
            ...item,
            items: item.items.map((child) => (
                productUrls[child.label]
                    ? { ...child, href: productUrls[child.label] }
                    : child
            )),
        };
    });

    return {
        ...headerConfig,
        menu,
        remotes: {
            ...remotes,
            ...(remotes.adminTREM ? {
                adminTREM: {
                    ...remotes.adminTREM,
                    defaultRemoteUrl: adminRemoteUrl || remotes.adminTREM.defaultRemoteUrl,
                },
            } : {}),
            ...(remotes.admin ? {
                admin: {
                    ...remotes.admin,
                    defaultRemoteUrl: adminRemoteUrl || remotes.admin.defaultRemoteUrl,
                },
            } : {}),
        },
    };
};

const buildTrevioHeaderConfig = (baseConfig = {}) => ({
    ...baseConfig,
    brand: {
        label: "Trevio",
        subtitle: "by TravelsTrem",
        mark: "T",
        homePath: "/trevio",
    },
    menu: [
        { id: "home", label: "Home", type: "internal", path: "/trevio", disabled: false },
        { id: "myTrips", label: "My Trips", type: "internal", path: "/trevio/profile", disabled: false },
        {
            id: "explore",
            label: "Explore",
            type: "dropdown",
            disabled: false,
            items: [
                { id: "trevista", label: "Trevista", type: "external", href: config.TREVISTA_URL, target: "_self", disabled: false },
            ],
        },
    ],
    navigation: [
        { id: "home", label: "Home", path: "/trevio", access: "public" },
        { id: "my-trips", label: "My Trips", path: "/trevio/profile", access: "authenticated" },
        { id: "explore", label: "Explore", path: "/trevista", access: "public" },
    ],
    authActions: {
        login: { label: "Sign in", path: "/auth?app=trevio" },
        logout: { label: "Logout", eventName: "USER_LOGOUT", redirectTo: "/trevio" },
    },
    routeMap: {
        "/trevio": "trevio",
        "/trevio/profile": "trevio",
        "/trevista": "trevista",
    },
    routes: [
        { id: "home", path: "/trevio", component: "home", access: "public" },
        { id: "profile", path: "/trevio/profile", component: "profile", access: "authenticated" },
    ],
    fallbacks: {
        authenticated: "/trevio",
        anonymous: "/auth?app=trevio",
        unauthorized: "/trevio",
    },
});

const buildTrevistaHeaderConfig = (baseConfig = {}) => ({
    ...baseConfig,
    brand: {
        label: "Trevista",
        subtitle: "by TravelsTrem",
        mark: "T",
        homePath: "/trevista",
    },
    menu: [
        { id: "home", label: "Home", type: "internal", path: "/trevista", disabled: false },
        { id: "bookings", label: "My Bookings", type: "internal", path: "/trevista/bookings", disabled: false },
        {
            id: "explore",
            label: "Explore More",
            type: "dropdown",
            disabled: false,
            items: [
                { id: "trevio", label: "Trevio", type: "external", href: config.TREVIO_URL, target: "_self", disabled: false },
            ],
        },
    ],
    navigation: [
        { id: "home", label: "Home", path: "/trevista", access: "public" },
        { id: "bookings", label: "My Bookings", path: "/trevista/bookings", access: "authenticated" },
        { id: "explore", label: "Explore More", path: "/trevio", access: "public" },
    ],
    authActions: {
        login: { label: "Sign in", path: "/auth?app=trevista" },
        logout: { label: "Logout", eventName: "USER_LOGOUT", redirectTo: "/trevista" },
    },
    routeMap: {
        "/trevista": "trevista",
        "/trevista/bookings": "trevista",
        "/trevista/tour": "trevista",
        "/trevio": "trevio",
    },
    routes: [
        { id: "home", path: "/trevista", component: "home", access: "public" },
        { id: "bookings", path: "/trevista/bookings", component: "bookings", access: "authenticated" },
        { id: "tourDetails", path: "/trevista/tour/:tourRef", component: "tourDetails", access: "public" },
    ],
    fallbacks: {
        authenticated: "/trevista",
        anonymous: "/auth?app=trevista",
        unauthorized: "/trevista",
    },
});

const buildAdminHeaderConfig = (baseConfig = {}) => ({
    ...baseConfig,
    brand: {
        ...(baseConfig.brand || {}),
        label: "AdminTREM",
        homePath: "/manage/tours?tab=dashboard",
    },
    leftSection: {
        ...(baseConfig.leftSection || {}),
        welcome: true,
        showLogout: true,
        showStatus: true,
        showFavorites: false,
    },
    menu: [
        {
            id: "adminServices",
            label: "Services",
            type: "dropdown",
            disabled: false,
            items: [
                {
                    id: "adminTours",
                    label: "Tour Management",
                    app: "adminTREM",
                    path: "/manage/tours?tab=tours",
                    disabled: false,
                },
                {
                    id: "agencyManagement",
                    label: "Agency Management",
                    app: "adminTREM",
                    path: "/manage/tours?tab=agencies",
                    disabled: false,
                },
            ],
        },
        {
            id: "adminDashboard",
            label: "Dashboard",
            app: "adminTREM",
            path: "/manage/tours?tab=dashboard",
            disabled: false,
        },
    ],
    navigation: [
        { id: "services", label: "Services", path: "/manage/tours?tab=tours", access: "authenticated" },
        { id: "dashboard", label: "Dashboard", path: "/manage/tours?tab=dashboard", access: "authenticated" },
        { id: "agencies", label: "Agencies", path: "/manage/tours?tab=agencies", access: "roles", roles: ["admin"] },
    ],
    routeMap: {
        "/manage/tours": "adminTREM",
        "/admin/tours": "adminTREM",
        "/bookings": "adminTREM",
        "/login": "auth",
    },
    routes: [
        { id: "login", path: "/login", component: "auth", access: "publicOnly", authenticatedRedirect: "/manage/tours?tab=dashboard" },
        { id: "manageTours", path: "/manage/tours", component: "tourManagement", access: "roles", roles: ["admin"], preserveState: true },
        { id: "adminTours", path: "/admin/tours", component: "tourManagement", access: "roles", roles: ["admin"], preserveState: true },
        { id: "bookingDetail", path: "/bookings/:bookingId", component: "adminBookingDetail", access: "roles", roles: ["admin"], preserveState: true },
    ],
    fallbacks: {
        authenticated: "/manage/tours?tab=dashboard",
        anonymous: "/login",
        unauthorized: "/login",
    },
});

const buildAgentHeaderConfig = (baseConfig = {}) => ({
    ...baseConfig,
    brand: {
        ...(baseConfig.brand || {}),
        label: "Partner Portal",
        homePath: "/agent/services",
    },
    leftSection: {
        ...(baseConfig.leftSection || {}),
        welcome: true,
        showLogout: true,
        showStatus: true,
        showFavorites: false,
    },
    menu: [
        {
            id: "agentServices",
            label: "Services",
            app: "agentTREM",
            path: "/agent/services",
            disabled: false,
        },
        {
            id: "agentDashboard",
            label: "Dashboard",
            app: "agentTREM",
            path: "/agent/dashboard",
            disabled: false,
        },
        {
            id: "agentBookings",
            label: "Bookings",
            app: "agentTREM",
            path: "/agent/bookings",
            disabled: false,
        },
        {
            id: "agentAgency",
            label: "Partner Agency",
            app: "agentTREM",
            path: "/agent/agency",
            disabled: false,
        },
    ],
    navigation: [
        { id: "services", label: "Services", path: "/agent/services", access: "roles", roles: ["agent"] },
        { id: "dashboard", label: "Dashboard", path: "/agent/dashboard", access: "roles", roles: ["agent"] },
        { id: "bookings", label: "Bookings", path: "/agent/bookings", access: "roles", roles: ["agent"] },
        { id: "agency", label: "Partner Agency", path: "/agent/agency", access: "roles", roles: ["agent"] },
    ],
    routeMap: {
        "/agent/services": "agentTREM",
        "/agent/dashboard": "agentTREM",
        "/agent/bookings": "agentTREM",
        "/agent/agency": "agentTREM",
        "/agent/settings": "agentTREM",
        "/agent/tours": "agentTREM",
        "/bookings": "agentTREM",
        "/login": "auth",
    },
    routes: [
        { id: "login", path: "/login", component: "auth", access: "publicOnly", authenticatedRedirect: "/agent/services" },
        { id: "agentServices", path: "/agent/services", component: "agentServices", access: "roles", roles: ["agent"], preserveState: true },
        { id: "agentDashboard", path: "/agent/dashboard", component: "agentProfileDashboard", access: "roles", roles: ["agent"], preserveState: true },
        { id: "agentBookings", path: "/agent/bookings", component: "agentBookings", access: "roles", roles: ["agent"], preserveState: true },
        { id: "agentAgency", path: "/agent/agency", component: "partnerAgency", access: "roles", roles: ["agent"], preserveState: true },
        { id: "agentSettings", path: "/agent/settings", component: "agentSettings", access: "roles", roles: ["agent"], preserveState: true },
        { id: "bookingDetail", path: "/bookings/:bookingId", component: "agentBookingDetail", access: "roles", roles: ["agent"], preserveState: true },
    ],
    fallbacks: {
        authenticated: "/agent/services",
        anonymous: "/login",
        unauthorized: "/login",
    },
});

const resolvePageConfig = (req) => {
    const json = pageConfigTemplate;
    const pathname = req.query.pathname || "/";
    const agentPathMap = {
        "/agent/services": "agent-services",
        "/agent/tours": "agent-services",
        "/agent/dashboard": "agent-dashboard",
        "/agent/bookings": "agent-bookings",
        "/agent/agency": "agent-agency",
        "/agent/settings": "agent-dashboard",
    };
    const pageName = req.query.page
        || (req.query.app === "agentTREM" ? agentPathMap[pathname] : null)
        || json.componentData?.pathMap?.[pathname]
        || json.componentData?.defaultPage
        || "home";
    const pageConfig = json.componentData?.pages?.[pageName] || json.componentData?.pages?.home || {
        page: pageName,
        widgets: [],
    };

    return {
        ...pageConfig,
        pathname,
    };
};

export const getUserSession = async (req, res) => {
    try {
        const json = sessionConfigTemplate;
        const pathname = req.query.pathname || "/";
        const search = req.query.search || "";
        const hash = req.query.hash || "";
        const user = getUserFromRequest(req);
        const role = user?.role || "public";
        const routeMatch = matchRoute(pathname, json.componentData?.routePaths);

        return res.json({
            ...json,
            componentData: {
                ...json.componentData,
                state: {
                    isAuthenticated: Boolean(user),
                    role,
                    user,
                    currentRoute: {
                        pathname,
                        search,
                        hash,
                        fullPath: `${pathname}${search}${hash}`,
                        match: routeMatch,
                    },
                },
            },
        });
    } catch (error) {
        console.error("getUserSession error:", error && error.stack ? error.stack : error);
        return res.status(500).json({ status: "error", message: "Failed to load user session config" });
    }
};

export const getSession = async (req, res) => {
    try {
        const session = await getSessionFromRequest(req);
        const pageConfig = resolvePageConfig(req);

        return res.json({
            ...session,
            flags: {
                role: session.user?.role || "public",
                validatedAt: new Date().toISOString(),
            },
            config: {
                pageConfig,
                eventConfig: sessionConfigTemplate.componentData?.eventConfig || {},
                eventNames: sessionConfigTemplate.componentData?.eventNames || {},
                routeState: sessionConfigTemplate.componentData?.routeState || {},
            },
        });
    } catch (error) {
        console.error("getSession error:", error && error.stack ? error.stack : error);
        return res.status(500).json({ status: "error", message: "Failed to initialize session" });
    }
};

export const getHeaderConfig = async (req, res) => {
    try {
        const json = headerConfigTemplate;
        const requestedApp = req.query.app || "";
        const baseHeaderConfig = applyEnvironmentRemotes(json.componentData);
        const headerConfig = requestedApp === "trevio"
            ? buildTrevioHeaderConfig(baseHeaderConfig)
            : requestedApp === "trevista"
                ? buildTrevistaHeaderConfig(baseHeaderConfig)
                : requestedApp === "adminTREM"
                    ? buildAdminHeaderConfig(baseHeaderConfig)
                    : requestedApp === "agentTREM"
                        ? buildAgentHeaderConfig(baseHeaderConfig)
                        : baseHeaderConfig;
        const pathname = req.query.pathname || "/";
        const activePath = resolveActivePath(pathname, headerConfig);
        const pageConfig = resolvePageConfig(req);
        const isAuthenticated = req.query.isAuthenticated === "true";
        const user = isAuthenticated
            ? {
                id: null,
                name: req.query.userName || null,
                email: req.query.userEmail || null,
                role: req.query.role || "member",
            }
            : null;

        return res.json({
            ...json,
            componentData: {
                ...headerConfig,
                activePath,
                pageConfig,
                state: {
                    isAuthenticated,
                    role: user?.role || "public",
                    user,
                    pathname,
                    activePath,
                },
            },
        });
    } catch (error) {
        console.error("getHeaderConfig error:", error && error.stack ? error.stack : error);
        return res.status(500).json({ status: "error", message: "Failed to load header config" });
    }
};

export const getPageConfig = async (req, res) => {
    try {
        const pageConfig = resolvePageConfig(req);

        return res.json({
            status: "success",
            message: "Page config loaded",
            componentData: pageConfig,
        });
    } catch (error) {
        console.error("getPageConfig error:", error && error.stack ? error.stack : error);
        return res.status(500).json({ status: "error", message: "Failed to load page config" });
    }
};
