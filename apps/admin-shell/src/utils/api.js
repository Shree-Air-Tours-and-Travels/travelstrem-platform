import axios from "axios";
import { getConfiguredApiBase } from "../config/portalEnvironment";

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

api.interceptors.request.use(
    (cfg) => {
        try {
            const preferredKey = localStorage.getItem("auth_token_key_name");
            const token =
                (preferredKey && localStorage.getItem(preferredKey)) ||
                localStorage.getItem("auth_token") ||
                localStorage.getItem("token") ||
                JSON.parse(localStorage.getItem("userInfo") || "{}")?.token;
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
