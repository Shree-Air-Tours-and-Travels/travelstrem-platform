const DEFAULT_SESSION_KEYS = ["token", "auth_token", "auth_user", "auth_token_key_name"];

export const createEventBus = (initialOptions = {}) => {
    const listeners = {};
    let clearSessionCache = null;
    let clearAuthHeader = null;
    let initialized = false;
    let options = {
        dispatchWindowEvent: "always",
        clearSessionOnLogout: false,
        sessionStorageKeys: DEFAULT_SESSION_KEYS,
        ...initialOptions,
    };

    const configure = (nextOptions = {}) => {
        options = { ...options, ...nextOptions };
    };

    const registerSessionCacheClearer = (clearer) => {
        clearSessionCache = clearer;
    };

    const registerAuthHeaderClearer = (clearer) => {
        clearAuthHeader = clearer;
    };

    const shouldDispatchWindowEvent = (event) =>
        options.dispatchWindowEvent === "always" ||
        (options.dispatchWindowEvent === "when-no-listeners" && !listeners[event]?.length);

    const emit = (event, payload) => {
        (listeners[event] || []).forEach((cb) => cb(payload));
        if (typeof window !== "undefined" && shouldDispatchWindowEvent(event)) {
            window.dispatchEvent(new CustomEvent(event, { detail: payload }));
        }
    };

    const on = (event, cb) => {
        listeners[event] = [...(listeners[event] || []), cb];

        return () => {
            listeners[event] = (listeners[event] || []).filter((listener) => listener !== cb);
        };
    };

    const clearBrowserSession = () => {
        if (typeof localStorage !== "undefined") {
            options.sessionStorageKeys.forEach((key) => localStorage.removeItem(key));
        }
        clearAuthHeader?.();
        clearSessionCache?.();
    };

    const initEventBus = (nextOptions = {}) => {
        configure(nextOptions);

        if (!initialized && options.clearSessionOnLogout && typeof window !== "undefined") {
            initialized = true;
            on("USER_LOGOUT", clearBrowserSession);
        }

        return { emit, on };
    };

    return {
        configure,
        emit,
        on,
        initEventBus,
        registerAuthHeaderClearer,
        registerSessionCacheClearer,
    };
};

const defaultEventBus = createEventBus();

export const configureEventBus = defaultEventBus.configure;
export const emit = defaultEventBus.emit;
export const on = defaultEventBus.on;
export const initEventBus = defaultEventBus.initEventBus;
export const registerAuthHeaderClearer = defaultEventBus.registerAuthHeaderClearer;
export const registerSessionCacheClearer = defaultEventBus.registerSessionCacheClearer;
