import jwt from "jsonwebtoken";
import pageDefinitionService from "../../services/pageDefinitionService.js";
import config from "../../config/index.js";
import {
    getPortalScope,
    normalizePortalScope,
    readPortalAccessToken,
} from "../../core/auth/portalSession.js";
import { buildDashboardSnapshot } from "./dashboardDataService.js";
import { buildAdminDashboardSnapshot } from "./adminDashboardDataService.js";
import { buildHomeFeatureSnapshot } from "./homeFeatureDataService.js";
import User from "../auth/models/User.js";
import { buildClientDashboardSnapshot } from "./clientDashboardDataService.js";
import { buildSupportDashboardSnapshot } from "./supportDashboardDataService.js";
import {
    ADMIN_DASHBOARD_WIDGET_KEYS,
    buildAdminDashboardWidgetSnapshot,
} from "./adminDashboardWidgetDataService.js";

// Pages that carry user-specific injected data on top of the definition.
const parseOverride = (raw) => {
    if (!raw) return undefined;
    try {
        return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
        return undefined;
    }
};

function extractOptionalUser(req) {
    if (req.user)
        return { userId: req.user.sub || req.user.id, tokenVersion: req.user.tokenVersion };

    const token = (() => {
        const authHeader = req.headers.authorization || req.headers.Authorization || "";
        if (authHeader && authHeader.startsWith("Bearer ")) return authHeader.split(" ")[1];
        if (req.headers["x-ignore-cookie-auth"] === "true") return null;
        return readPortalAccessToken(req);
    })();

    if (!token) return null;

    try {
        const secret = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;
        const payload = jwt.verify(token, secret);
        if (!payload.portal || normalizePortalScope(payload.portal) !== getPortalScope(req))
            return null;
        return { userId: payload.sub || payload.id, tokenVersion: payload.tokenVersion };
    } catch {
        return null;
    }
}

async function findAdminViewer(req, authUser = extractOptionalUser(req)) {
    const user = authUser?.userId
        ? await User.findById(authUser.userId)
              .select(
                  "name role adminLevel adminApprovalStatus accountStatus tokenVersion internalTeamRoles",
              )
              .lean()
        : null;
    if (
        !user ||
        user.role !== "admin" ||
        !["standard", "master"].includes(user.adminLevel) ||
        (user.accountStatus || "active") !== "active" ||
        Number(authUser?.tokenVersion || 0) !== Number(user.tokenVersion || 0) ||
        (user.adminLevel !== "master" && user.adminApprovalStatus !== "approved")
    )
        return null;
    return user;
}

export const getPageDefinition = async (req, res) => {
    const pageKey = pageDefinitionService.resolvePageKey(
        req.params.pageKey || `${req.params.app}/${req.params.page}`,
    );
    const authUser = extractOptionalUser(req);
    let injectData;
    if (pageKey === "admin-shell/dashboard") {
        const user = await findAdminViewer(req, authUser);
        if (!user) {
            return res.status(403).json({ status: "error", message: "Dashboard access denied." });
        }
        injectData =
            user.internalTeamRoles?.includes("support") && user.adminLevel !== "master"
                ? { supportDashboard: await buildSupportDashboardSnapshot(user) }
                : await buildAdminDashboardSnapshot();
    } else if (pageKey === "app-shell/home") {
        injectData = await buildHomeFeatureSnapshot();
    } else if (pageKey === "app-shell/dashboard") {
        const [homeFeatures, dashboard, clientDashboard, supportDashboard] = await Promise.all([
            buildHomeFeatureSnapshot(),
            authUser?.userId ? buildDashboardSnapshot(authUser.userId) : Promise.resolve({}),
            authUser?.userId
                ? buildClientDashboardSnapshot(authUser.userId, authUser.tokenVersion)
                : Promise.resolve(null),
            authUser?.userId
                ? User.findById(authUser.userId)
                      .select("name role internalTeamRoles accountStatus tokenVersion")
                      .lean()
                      .then((user) =>
                          user &&
                          (user.accountStatus || "active") === "active" &&
                          Number(authUser.tokenVersion || 0) === Number(user.tokenVersion || 0) &&
                          user.internalTeamRoles?.includes("support")
                              ? buildSupportDashboardSnapshot(user)
                              : null,
                      )
                : Promise.resolve(null),
        ]);
        injectData = { homeFeatures: homeFeatures.homeFeatures, ...dashboard, clientDashboard, supportDashboard };
    }
    return pageDefinitionService.resolvePage(req, res, pageKey, {
        remoteOverrides: parseOverride(req.query.remoteOverrides),
        featureOverrides: parseOverride(req.query.featureOverrides),
        authUser,
        injectData,
    });
};

export const getDashboardWidget = async (req, res) => {
    if (
        req.params.app !== "admin-shell" ||
        req.params.page !== "dashboard" ||
        !ADMIN_DASHBOARD_WIDGET_KEYS.has(req.params.widgetKey)
    ) {
        return res.status(404).json({ status: "error", message: "Dashboard widget not found." });
    }
    const user = await findAdminViewer(req);
    if (!user || (user.internalTeamRoles?.includes("support") && user.adminLevel !== "master")) {
        return res.status(403).json({ status: "error", message: "Dashboard access denied." });
    }
    const definition =
        pageDefinitionService.loadPageDefinition("admin-shell/dashboard").definition.component;
    const widget = (definition.structure?.widgets || []).find((entry) =>
        entry.props?.endpoint?.endsWith(`/widgets/${req.params.widgetKey}`),
    );
    if (!widget)
        return res.status(404).json({ status: "error", message: "Dashboard widget not found." });
    const data = await buildAdminDashboardWidgetSnapshot(req.params.widgetKey);
    if (req.params.widgetKey === "quickActions") {
        data.actions = (definition.structure?.actions || []).filter(
            (action) => !action.masterOnly || user.adminLevel === "master",
        );
    }
    return res.json({
        status: "success",
        component: {
            data,
            dataScope: { options: {} },
            elements: { labels: definition.elements?.labels || {}, urls: {} },
            structure: { header: {}, widgets: [widget], config: {}, actions: [] },
        },
    });
};

export const getPageRegistry = (req, res) =>
    res.json({
        status: "success",
        component: {
            data: {
                pages: pageDefinitionService.getRegisteredPages(),
                pathMap: pageDefinitionService.getPathMap(),
                aliases: pageDefinitionService.getAliases(),
            },
            dataScope: { options: {} },
            elements: { labels: {}, urls: {} },
            structure: { header: {}, widgets: [], config: {}, actions: [] },
        },
    });
