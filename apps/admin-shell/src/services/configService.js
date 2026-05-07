import { getConfiguredApiBase } from "../config/portalEnvironment";

const normalizeApiBase = (raw) => {
    const base = raw || "http://localhost:5000";
    const normalized = base.replace(/\/$/, "");
    return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export const API_BASE = normalizeApiBase(getConfiguredApiBase());

const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");

    return token ? { Authorization: `Bearer ${token}` } : {};
};

const readComponentData = async (path, params = {}) => {
    const url = new URL(`${API_BASE}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });

    const res = await fetch(url.toString(), {
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!res.ok) throw new Error(`Config request failed: ${path}`);

    const data = await res.json();
    return data.componentData || data;
};

export const getHeaderConfig = (params) => readComponentData("/header-config", params);

// Retained for standalone diagnostics/CMS previews. Normal init consumes pageConfig from /session.
export const getPageConfig = (params) => readComponentData("/page-config", params);
