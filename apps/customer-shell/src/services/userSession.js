import apiService from "./apiService";

let sessionPromise = null;
let cachedSession = null;

export const initUserSession = async (params = {}) => {
    if (cachedSession) return cachedSession;
    if (sessionPromise) return sessionPromise;

    sessionPromise = apiService
        .get("/session", { params })
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
