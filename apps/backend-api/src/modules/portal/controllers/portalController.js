import jwt from "jsonwebtoken";
import config from "../../../config/index.js";
import headerConfigTemplate from "../../../config/header.js";
import sessionConfigTemplate from "../../../config/session.js";
import pageConfigTemplate from "../../../config/pageConfig.js";
import User from "../../auth/models/User.js";

const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;
const COOKIE_NAME = config.IS_PRODUCTION ? "__Host-token" : "token";
const MASTER_ADMIN_EMAIL = (config.MASTER_ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAIL || "akshat.goyal@travelstrem.com")
    .toString()
    .trim()
    .toLowerCase();


const getBearerToken = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (authHeader.startsWith("Bearer ")) return authHeader.split(" ")[1] || null;
    if (req.headers["x-ignore-cookie-auth"] === "true") return null;

    return req.cookies?.[COOKIE_NAME] || req.cookies?.token || null;
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

    const toursRemoteUrl = stripRemoteEntry(envFrontends.toursTREM?.remoteEntry || envFrontends.toursTREM?.baseUrl);
    const adminRemoteUrl = stripRemoteEntry(envFrontends.adminTREM?.remoteEntry || envFrontends.adminTREM?.baseUrl);

    return {
        ...headerConfig,
        remotes: {
            ...remotes,
            ...(remotes.toursTREM ? {
                toursTREM: {
                    ...remotes.toursTREM,
                    defaultRemoteUrl: toursRemoteUrl || remotes.toursTREM.defaultRemoteUrl,
                },
            } : {}),
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
        showNotifications: false,
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
        label: "AgentTREM",
        homePath: "/agent/services",
    },
    leftSection: {
        ...(baseConfig.leftSection || {}),
        welcome: true,
        showLogout: true,
        showStatus: true,
        showNotifications: false,
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
            label: "Agency",
            app: "agentTREM",
            path: "/agent/agency",
            disabled: false,
        },
    ],
    navigation: [
        { id: "services", label: "Services", path: "/agent/services", access: "roles", roles: ["agent"] },
        { id: "dashboard", label: "Dashboard", path: "/agent/dashboard", access: "roles", roles: ["agent"] },
        { id: "bookings", label: "Bookings", path: "/agent/bookings", access: "roles", roles: ["agent"] },
        { id: "agency", label: "Agency", path: "/agent/agency", access: "roles", roles: ["agent"] },
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
        const headerConfig = requestedApp === "adminTREM"
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
