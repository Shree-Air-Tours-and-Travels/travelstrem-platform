// frontend/src/utils/api.js
import axios from "axios";
import { getConfiguredApiBase } from "../config/portalEnvironment";
import { registerAuthHeaderClearer } from "../core/eventBus";
import { setFetchDataApiClient } from "@packages/trem-utils";

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
      const preferredKey = localStorage.getItem("auth_token_key_name");
      const token =
        (preferredKey && localStorage.getItem(preferredKey)) ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token");

      if (token) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${token}`;
      } else if (cfg?.headers?.Authorization) {
        delete cfg.headers.Authorization;
      }
    } catch (err) {
      // ignore parse errors
    }
    return cfg;
  },
  (err) => Promise.reject(err)
);

export default api;
