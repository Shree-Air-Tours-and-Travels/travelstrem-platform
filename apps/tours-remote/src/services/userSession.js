import { API_BASE } from "./configService";

let sessionPromise = null;
let cachedSession = null;

export const initUserSession = async (params = {}) => {
    if (cachedSession) return cachedSession;
    if (sessionPromise) return sessionPromise;

    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    const url = new URL(`${API_BASE}/session`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });

    sessionPromise = fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
        .then((res) => res.json())
        .then((data) => {
            cachedSession = {
                user: data.user || null,
                permissions: Array.isArray(data.permissions) ? data.permissions : [],
                isAuthenticated: Boolean(data.isAuthenticated),
                flags: data.flags || {},
                config: data.config || {},
            };

            return cachedSession;
        })
        .finally(() => {
            sessionPromise = null;
        });

    return sessionPromise;
};

export const clearUserSessionCache = () => {
    cachedSession = null;
    sessionPromise = null;
};
