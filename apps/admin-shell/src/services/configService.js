import { getConfiguredApiBase } from "../core/config/portalEnvironment";
import api from "./apiClient";

const normalizeApiBase = (raw) => {
    const base = raw || "http://localhost:5000";
    const normalized = base.replace(/\/$/, "");
    return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export const API_BASE = normalizeApiBase(getConfiguredApiBase());

const readComponentData = async (path, params = {}) => {
    const { data } = await api.get(path, { params });
    return data.componentData || data;
};

export const getHeaderConfig = (params) => readComponentData("/header-config", params);

export const getPageConfig = (params) => readComponentData("/page-config", params);
