// frontend/src/utils/api.js
import axios from "axios";

/**
 * Normalize and choose base:
 * - If REACT_APP_API_URL is provided at build time, use it (strip trailing slash)
 * - Else if in development, default to http://localhost:5000
 * - Else in production, default to empty string (relative requests -> same origin)
 */

function normalizeBase(raw) {
  if (raw == null || raw === "") return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw}`.replace(/\/$/, "");
}

let RAW_BASE = process.env.REACT_APP_API_URL;
if (!RAW_BASE) {
  RAW_BASE = process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";
}

const BASE = normalizeBase(RAW_BASE) ?? "";
const baseURL = (`${BASE}/api`).replace(/([^:]\/)\/+/g, "$1");

console.info("API baseURL (built):", baseURL);


const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (cfg) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (userInfo?.token) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${userInfo.token}`;
      }
    } catch (err) {
      // ignore parse errors
    }
    return cfg;
  },
  (err) => Promise.reject(err)
);

export default api;
