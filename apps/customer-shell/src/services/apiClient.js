// frontend/src/utils/api.js
import axios from "axios";
import { getConfiguredApiBase } from "../core/config/portalEnvironment";
import { registerAuthHeaderClearer } from "@packages/trem-events";
import { setFetchDataApiClient } from "@packages/trem-utils";
import { setupRefreshInterceptor } from "@packages/trem-auth-core";

/**
 * Normalize and choose base:
 * - If REACT_APP_API_URL is provided at build time, use it (strip trailing slash)
 * - Else default to empty string so the current origin can proxy /api in development
 *   and serve same-origin API requests in deployed environments.
 */

function normalizeBase(raw) {
  if (raw == null || raw === "") return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw}`.replace(/\/$/, "");
}

let RAW_BASE = getConfiguredApiBase();

const BASE = normalizeBase(RAW_BASE) ?? "";
const baseURL = (BASE.endsWith("/api") ? BASE : `${BASE}/api`).replace(/([^:]\/)\/+/g, "$1");
const AUTH_STORAGE_PREFIX = "customerTREM";
if (typeof window !== "undefined") window.__TREM_AUTH_STORAGE_PREFIX__ = AUTH_STORAGE_PREFIX;

console.info("API baseURL (built):", baseURL);


const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

setFetchDataApiClient(api);

export const clearApiAuthHeader = () => {
  if (api.defaults?.headers?.common?.Authorization) {
    delete api.defaults.headers.common.Authorization;
  }
};

registerAuthHeaderClearer(clearApiAuthHeader);

api.interceptors.request.use(
  (cfg) => {
    try {
      const token = localStorage.getItem(`${AUTH_STORAGE_PREFIX}:token`);
      if (token) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${token}`;
      } else if (cfg?.headers?.Authorization) {
        delete cfg.headers.Authorization;
      }
      if (!token) {
        cfg.headers = cfg.headers || {};
        cfg.headers["X-Ignore-Cookie-Auth"] = "true";
      }
    } catch (err) {
      // ignore parse errors
    }
    return cfg;
  },
  (err) => Promise.reject(err)
);

setupRefreshInterceptor(api, AUTH_STORAGE_PREFIX);

export default api;
