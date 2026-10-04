import { getConfiguredApiBase } from "../core/config/portalEnvironment.js";

const normalizeApiBase = (raw) => {
  const base = raw || getConfiguredApiBase();
  const normalized = base.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export const API_BASE = normalizeApiBase(process.env.REACT_APP_API_URL || getConfiguredApiBase());

const readComponentData = async (path, params = {}) => {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Config request failed: ${path}`);

  const data = await res.json();
  return data.componentData || data;
};

export const getHeaderConfig = (params) => readComponentData("/header-config", params);

// Retained for standalone diagnostics/CMS previews. Normal init consumes pageConfig from /session.
export const getPageConfig = (params) => readComponentData("/page-config", params);
