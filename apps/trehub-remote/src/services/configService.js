import { getConfiguredApiBase } from "../core/config/portalEnvironment.js";

const normalizeApiBase = (raw) => {
  const base = String(raw || getConfiguredApiBase()).replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
};

export const API_BASE = normalizeApiBase(process.env.REACT_APP_API_URL || getConfiguredApiBase());

const requestJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (response.headers.get("content-type")?.includes("text/html")) {
      throw new Error("Trehub received an HTML page instead of API data. Check REACT_APP_API_URL or REACT_APP_BACKEND_URL and restart Trehub.");
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.status === "error") {
      const error = new Error(payload?.message || "This request could not be completed. Please try again.");
      error.code = payload?.code;
      error.details = payload?.details;
      error.status = response.status;
      throw error;
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("This request took too long. Please try again.");
    throw error;
  } finally { clearTimeout(timeout); }
};

export const readComponentData = async (path, params = {}) => {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  return requestJson(url.toString(), {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

};

export const createComponentData = async (path, body = {}) => {
  return requestJson(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

export const getHeaderConfig = async (params) => {
  const data = await readComponentData("/header-config", params);
  return data.componentData || data;
};
export const getPageConfig = (params) => readComponentData("/page-config", params);
