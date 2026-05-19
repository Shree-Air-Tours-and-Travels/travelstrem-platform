import axios from "axios";
import { getConfiguredApiBase } from "../core/config/portalEnvironment";
import { setFetchDataApiClient } from "@packages/trem-utils";

function normalizeBase(raw) {
    if (raw == null || raw === "") return raw;
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
    return `https://${raw}`.replace(/\/$/, "");
}

let rawBase = getConfiguredApiBase();

const base = normalizeBase(rawBase) ?? "";
const baseURL = (base.endsWith("/api") ? base : `${base}/api`).replace(/([^:]\/)\/+/g, "$1");

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

setFetchDataApiClient(api);

api.interceptors.request.use(
    (cfg) => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
            if (token) {
                cfg.headers = cfg.headers || {};
                cfg.headers.Authorization = `Bearer ${token}`;
            }
        } catch (err) {
            // ignore parse errors
        }
        return cfg;
    },
    (err) => Promise.reject(err)
);

export default api;
