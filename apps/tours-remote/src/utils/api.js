import axios from "axios";
import { getConfiguredApiBase } from "../config/portalEnvironment";

function normalizeBase(raw) {
    if (raw == null || raw === "") return raw;
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
    return `https://${raw}`.replace(/\/$/, "");
}

const RAW_BASE = getConfiguredApiBase();
const BASE = normalizeBase(RAW_BASE) ?? "";
const baseURL = (BASE.endsWith("/api") ? BASE : `${BASE}/api`).replace(/([^:]\/)\/+/g, "$1");

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

export default api;
