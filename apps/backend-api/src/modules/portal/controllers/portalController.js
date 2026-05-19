import jwt from "jsonwebtoken";
import config from "../../../config/index.js";
import headerConfigTemplate from "../../../config/header.js";
import sessionConfigTemplate from "../../../config/session.js";
import pageConfigTemplate from "../../../config/pageConfig.js";
import User from "../../auth/models/User.js";

const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET || "replace_this_in_production";
const COOKIE_NAME = config.IS_PRODUCTION ? "__Host-token" : "token";


const getBearerToken = (req) => {
    const cookieToken = req.cookies?.[COOKIE_NAME] || req.cookies?.token;
    if (cookieToken) return cookieToken;

    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (!authHeader.startsWith("Bearer ")) return null;
    return authHeader.split(" ")[1] || null;
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
        const dbUser = userId ? await User.findById(userId).select("name email role") : null;
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

const resolvePageConfig = (req) => {
    const json = pageConfigTemplate;
    const pathname = req.query.pathname || "/";
    const pageName = req.query.page || json.componentData?.pathMap?.[pathname] || json.componentData?.defaultPage || "home";
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
        const headerConfig = applyEnvironmentRemotes(json.componentData);
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
