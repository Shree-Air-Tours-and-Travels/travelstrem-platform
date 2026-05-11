const listeners = {};
let clearSessionCache = null;
let clearAuthHeader = null;

export const registerSessionCacheClearer = (clearer) => {
    clearSessionCache = clearer;
};

export const registerAuthHeaderClearer = (clearer) => {
    clearAuthHeader = clearer;
};

export const emit = (event, payload) => {
    (listeners[event] || []).forEach((cb) => cb(payload));
    if (typeof window !== "undefined" && !listeners[event]?.length) {
        window.dispatchEvent(new CustomEvent(event, { detail: payload }));
    }
};

export const on = (event, cb) => {
    listeners[event] = [...(listeners[event] || []), cb];

    return () => {
        listeners[event] = (listeners[event] || []).filter((listener) => listener !== cb);
    };
};

let initialized = false;

export const initEventBus = () => {
    if (!initialized && typeof window !== "undefined") {
        initialized = true;
        const clearSession = () => {
            localStorage.removeItem("token");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            localStorage.removeItem("auth_token_key_name");
            clearAuthHeader?.();
            clearSessionCache?.();
        };

        on("USER_LOGOUT", clearSession);
    }

    return { emit, on };
};
