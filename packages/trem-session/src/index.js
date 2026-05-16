export const normalizeSession = (data = {}) => ({
    user: data.user || null,
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    isAuthenticated: Boolean(data.isAuthenticated),
    flags: data.flags || {},
    config: data.config || {},
});

export const getStoredAuthToken = ({ preferTokenKeyName = false } = {}) => {
    if (typeof localStorage === "undefined") return null;

    const preferredKey = preferTokenKeyName ? localStorage.getItem("auth_token_key_name") : null;

    return (
        (preferredKey && localStorage.getItem(preferredKey)) ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token")
    );
};

const appendParams = (url, params = {}) => {
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });
};

export const createUserSession = ({ requestSession }) => {
    let sessionPromise = null;
    let cachedSession = null;

    const initUserSession = async (params = {}) => {
        if (cachedSession) return cachedSession;
        if (sessionPromise) return sessionPromise;

        sessionPromise = requestSession(params)
            .then((data) => {
                cachedSession = normalizeSession(data);
                return cachedSession;
            })
            .finally(() => {
                sessionPromise = null;
            });

        return sessionPromise;
    };

    const clearUserSessionCache = () => {
        cachedSession = null;
        sessionPromise = null;
    };

    return { initUserSession, clearUserSessionCache };
};

export const createApiServiceUserSession = ({ apiService }) =>
    createUserSession({
        requestSession: (params = {}) => apiService.get("/session", { params }),
    });

export const createFetchUserSession = ({ apiBase, preferTokenKeyName = false, fetchImpl } = {}) =>
    createUserSession({
        requestSession: async (params = {}) => {
            const url = new URL(`${apiBase}/session`);
            const token = getStoredAuthToken({ preferTokenKeyName });
            appendParams(url, params);

            const res = await (fetchImpl || fetch)(url.toString(), {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            return res.json();
        },
    });
