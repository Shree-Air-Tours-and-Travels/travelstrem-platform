import axios from "axios";
import { getConfiguredApiBase } from "../core/config/portalEnvironment";
import { registerAuthHeaderClearer } from "@packages/trem-events";
import { setFetchDataApiClient } from "@packages/trem-utils";
import { setupRefreshInterceptor } from "@packages/trem-auth-core";
import {
  getCsrfToken,
  detectScriptInjection,
  detectPrivacyBreaches,
  auditLog_event,
  setCsrfBaseUrl,
} from "./security";

function normalizeBase(raw) {
  if (raw == null || raw === "") return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw}`.replace(/\/$/, "");
}

let RAW_BASE = getConfiguredApiBase();
const BASE = normalizeBase(RAW_BASE) ?? "";
const baseURL = (BASE.endsWith("/api") ? BASE : `${BASE}/api`).replace(/([^:]\/)\/+/g, "$1");
const AUTH_STORAGE_PREFIX = "appShellTREM";

setCsrfBaseUrl(BASE.endsWith("/api") ? BASE.slice(0, -4) : BASE || "");
if (typeof window !== "undefined") {
  window.__TREM_AUTH_STORAGE_PREFIX__ = AUTH_STORAGE_PREFIX;
  window.__TREM_AUTH_PORTAL__ = "customer";
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json", "X-Travelstrem-Portal": "customer" },
});

const STARTUP_PATHS = new Set([
  "/auth/session", "/header-config",
  "/sidebar-config", "/app-header-config", "/navigation-config",
]);
const STARTUP_RECOVERY_MS = 90000;
let startupRecovery = { id: 0, active: true, deadline: null };

export const restartStartupRecovery = () => {
  startupRecovery = { id: startupRecovery.id + 1, active: true, deadline: null };
};

export const finishStartupRecovery = () => {
  startupRecovery.active = false;
};

setFetchDataApiClient(api);

export const clearApiAuthHeader = () => {
  if (api.defaults?.headers?.common?.Authorization) {
    delete api.defaults.headers.common.Authorization;
  }
};

registerAuthHeaderClearer(clearApiAuthHeader);

api.interceptors.request.use(
  async (cfg) => {
    // One tenant lookup per page load; allow a cold start without retrying it.
    if (cfg.method?.toLowerCase() === "get" && cfg.url === "/tenant-config") {
      cfg.timeout = cfg.timeout || STARTUP_RECOVERY_MS;
    }
    if (
      startupRecovery.active &&
      cfg.method?.toLowerCase() === "get" &&
      STARTUP_PATHS.has(cfg.url)
    ) {
      startupRecovery.deadline ??= Date.now() + STARTUP_RECOVERY_MS;
      cfg.startupRecoveryId = startupRecovery.id;
      cfg.timeout = Math.min(cfg.timeout || 15000, Math.max(1, startupRecovery.deadline - Date.now()));
    }
    try {
      if (cfg?.headers?.Authorization) {
        delete cfg.headers.Authorization;
      }

      // CSRF protection for state-changing requests
      if (["post", "put", "patch", "delete"].includes(cfg.method?.toLowerCase())) {
        const csrf = await getCsrfToken();
        if (csrf) {
          cfg.headers = cfg.headers || {};
          cfg.headers["X-CSRF-Token"] = csrf;
        }
      }

      // Security audit for request body
      const bodyStr = typeof cfg.data === "string" ? cfg.data : JSON.stringify(cfg.data || "");
      if (bodyStr) {
        if (detectScriptInjection(bodyStr)) {
          auditLog_event("script_injection_blocked", { url: cfg.url, method: cfg.method });
          return Promise.reject(new Error("Request blocked: potential script injection detected"));
        }
        const breaches = detectPrivacyBreaches(bodyStr);
        if (breaches.length > 0) {
          auditLog_event("privacy_breach_in_request", { url: cfg.url, breaches });
        }
      }

      // Validate request URL
      if (cfg.url && !cfg.url.startsWith("/") && !cfg.url.startsWith("http")) {
        return Promise.reject(new Error("Invalid request URL"));
      }
    } catch (err) {
      // ignore
    }
    return cfg;
  },
  (err) => Promise.reject(err),
);

setupRefreshInterceptor(api, AUTH_STORAGE_PREFIX);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error.config;
    const transient = !error.response || [502, 503, 504].includes(error.response.status);
    if (
      !cfg || axios.isCancel(error) || !transient || !startupRecovery.active ||
      cfg.startupRecoveryId !== startupRecovery.id
    ) throw error;

    // Prevent the session provider from starting another retry cycle after this window.
    error.startupRecoveryExhausted = true;
    const remaining = startupRecovery.deadline - Date.now();
    if (remaining <= 0 || cfg.signal?.aborted) throw error;

    await new Promise((resolve) => {
      const finish = () => {
        window.clearTimeout(timer);
        cfg.signal?.removeEventListener("abort", finish);
        resolve();
      };
      const timer = window.setTimeout(finish, Math.min(3000, remaining));
      cfg.signal?.addEventListener("abort", finish, { once: true });
    });
    if (
      !startupRecovery.active || cfg.startupRecoveryId !== startupRecovery.id ||
      cfg.signal?.aborted || Date.now() >= startupRecovery.deadline
    ) throw error;
    return api.request(cfg);
  },
);

export default api;
