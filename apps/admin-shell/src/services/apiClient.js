import axios from "axios";
import { getConfiguredApiBase } from "../core/config/portalEnvironment";
import { registerAuthHeaderClearer } from "@packages/trem-events";
import { setFetchDataApiClient } from "@packages/trem-utils";
import { setupRefreshInterceptor } from "@packages/trem-auth-core";

function normalizeBase(raw) {
    if (raw == null || raw === "") return raw;
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
    return `https://${raw}`.replace(/\/$/, "");
}

let RAW_BASE = getConfiguredApiBase();

const BASE = normalizeBase(RAW_BASE) ?? "";
const baseURL = (BASE.endsWith("/api") ? BASE : `${BASE}/api`).replace(/([^:]\/)\/+/g, "$1");
const AUTH_STORAGE_PREFIX = "adminTREM";
if (typeof window !== "undefined") {
    window.__TREM_AUTH_STORAGE_PREFIX__ = AUTH_STORAGE_PREFIX;
    window.__TREM_AUTH_PORTAL__ = "admin";
}

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json", "X-Travelstrem-Portal": "admin" },
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
            if (cfg?.headers?.Authorization) {
                delete cfg.headers.Authorization;
            }
        } catch (err) {
            // ignore parse errors
        }
        if (cfg.data instanceof FormData) {
            delete cfg.headers?.["Content-Type"];
            delete cfg.headers?.["content-type"];
        }
        return cfg;
    },
    (err) => Promise.reject(err)
);

setupRefreshInterceptor(api, AUTH_STORAGE_PREFIX);

export default api;
