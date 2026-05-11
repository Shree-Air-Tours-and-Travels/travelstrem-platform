import axios from "axios";

const normalizeBase = (raw) => {
  if (raw == null || raw === "") return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw}`.replace(/\/$/, "");
};

export const createAuthApi = (base = process.env.REACT_APP_API_URL || "") => {
  const normalized = normalizeBase(base) ?? "";
  const baseURL = (normalized.endsWith("/api") ? normalized : `${normalized}/api`).replace(/([^:]\/)\/+/g, "$1");

  const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  api.interceptors.request.use((cfg) => {
    const preferredKey = localStorage.getItem("auth_token_key_name");
    const token =
      (preferredKey && localStorage.getItem(preferredKey)) ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("token");
    if (token) {
      cfg.headers = cfg.headers || {};
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
  });

  return api;
};

export const createAuthService = (api) => ({
  getConfig: () => api.get("/auth/config"),
  requestAdminRegistrationOtp: (payload) => api.post("/auth/admin-registration-otp", payload, { headers: { "Content-Type": "application/json" } }),
  login: (payload) => api.post("/auth/login", payload, { headers: { "Content-Type": "application/json" } }),
  register: (payload) => api.post("/auth/register", payload, { headers: { "Content-Type": "application/json" } }),
});
