import api from "./api";

const readTokenFromStorage = () => {
    try {
        const configuredKey = localStorage.getItem("auth_token_key_name");
        if (configuredKey) {
            const token = localStorage.getItem(configuredKey);
            if (token) return token;
        }
        return localStorage.getItem("token") || localStorage.getItem("auth_token") || null;
    } catch (e) {
        return null;
    }
};

const readAuthUserFromStorage = () => {
    try {
        const raw = localStorage.getItem("auth_user");
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
};

const ensureAuthHeader = () => {
    try {
        if (!api.defaults) api.defaults = {};
        if (!api.defaults.headers) api.defaults.headers = { common: {} };

        if (!api.defaults.headers.common || !api.defaults.headers.common.Authorization) {
            const token = readTokenFromStorage();
            if (token) {
                api.defaults.headers.common.Authorization = `Bearer ${token}`;
            }
        }
    } catch (e) {
        // ignore
    }

};

export const fetchData = async (endpoint, options = {}) => {
    const { method = "GET", body = null, headers = {}, params = {} } = options;

    ensureAuthHeader();

    const methodUpper = method.toUpperCase();
    let finalParams = { ...(params || {}) };
    let finalBody = body;

    const storedUser = readAuthUserFromStorage();

    if (storedUser) {
        try {
            if (methodUpper === "GET") {
                if (!finalParams.userId && (storedUser.id || storedUser._id)) {
                    finalParams.userId = storedUser.id || storedUser._id;
                }
                if (!finalParams.userRole && storedUser.role) {
                    finalParams.userRole = storedUser.role;
                }
            } else if (!finalBody) {
                finalBody = JSON.stringify({
                    user: { id: storedUser.id || storedUser._id, role: storedUser.role },
                });
            } else if (typeof finalBody === "string") {
                const parsed = JSON.parse(finalBody);
                if (!parsed.user) {
                    parsed.user = { id: storedUser.id || storedUser._id, role: storedUser.role };
                }
                finalBody = JSON.stringify(parsed);
            } else if (typeof finalBody === "object" && !(finalBody instanceof FormData)) {
                if (!finalBody.user) {
                    finalBody.user = { id: storedUser.id || storedUser._id, role: storedUser.role };
                }
                finalBody = JSON.stringify(finalBody);
            }
        } catch (e) {
            // ignore malformed JSON
        }
    }

    try {
        let res;

        if (methodUpper === "GET") {
            res = await api.get(endpoint, { params: finalParams, headers });
        } else if (methodUpper === "POST") {
            res = await api.post(endpoint, finalBody, { params: finalParams, headers });
        } else if (methodUpper === "PUT") {
            res = await api.put(endpoint, finalBody, { params: finalParams, headers });
        } else if (methodUpper === "PATCH") {
            res = await api.patch(endpoint, finalBody, { params: finalParams, headers });
        } else if (methodUpper === "DELETE") {
            res = await api.delete(endpoint, { data: finalBody, params: finalParams, headers });
        } else {
            res = await api.request({
                url: endpoint,
                method: methodUpper,
                data: finalBody,
                params: finalParams,
                headers,
            });
        }

        const { status, message, componentData } = res?.data || {};

        return {
            status: status || "error",
            message: message || "",
            componentData: componentData || {
                title: "",
                description: "",
                data: [],
                structure: {},
                config: {},
            },
            httpStatus: res?.status, // ✅ PRESERVE HTTP STATUS
        };
    } catch (err) {
        const httpStatus = err?.response?.status;

        return {
            status: "error",
            message:
                err?.response?.data?.message ||
                err.message ||
                "Network error",
            componentData: {
                title: "",
                description: "",
                data: [],
                structure: {},
                config: {},
            },
            httpStatus, // ✅ CRITICAL FIX
        };
    }

};

export default fetchData;