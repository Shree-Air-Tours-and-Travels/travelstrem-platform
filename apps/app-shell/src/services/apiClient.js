import axios from "axios";
import { getConfiguredApiBase } from "../core/config/portalEnvironment";
import { registerAuthHeaderClearer } from "@packages/trem-events";
import { setFetchDataApiClient } from "@packages/trem-utils";
import { setupRefreshInterceptor } from "@packages/trem-auth-core";
import { getCsrfToken, detectScriptInjection, detectPrivacyBreaches, auditLog_event, setCsrfBaseUrl } from "./security";

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

setFetchDataApiClient(api);

export const clearApiAuthHeader = () => {
  if (api.defaults?.headers?.common?.Authorization) {
    delete api.defaults.headers.common.Authorization;
  }
};

registerAuthHeaderClearer(clearApiAuthHeader);

api.interceptors.request.use(
  async (cfg) => {
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
  (err) => Promise.reject(err)
);

setupRefreshInterceptor(api, AUTH_STORAGE_PREFIX);

export default api;
