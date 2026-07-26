export const normalizeSession = (data = {}) => ({
    user: data.user || null,
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    isAuthenticated: Boolean(data.isAuthenticated || data.user || data.token),
    token: data.token || null,
    flags: data.flags || {},
    config: data.config || {},
});

/** @deprecated Tokens are now stored in httpOnly cookies. */
export const getStoredAuthToken = () => null;

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

export const createFetchUserSession = ({ apiBase, fetchImpl } = {}) =>
    createUserSession({
        requestSession: async (params = {}) => {
            const url = new URL(`${apiBase}/session`);
            appendParams(url, params);

            const res = await (fetchImpl || fetch)(url.toString(), {
                credentials: "include",
            });

            return res.json();
        },
    });
