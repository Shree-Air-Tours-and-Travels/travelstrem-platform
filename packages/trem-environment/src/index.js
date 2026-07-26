export const normalizeEnvironment = (value, { supportStaging = false } = {}) => {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "production" || raw === "prod") return "production";
    if (supportStaging && (raw === "staging" || raw === "stage")) return "staging";
    return "development";
};

export const stripRemoteEntry = (remoteEntry) =>
    String(remoteEntry || "").replace(/\/remoteEntry\.js$/, "").replace(/\/$/, "");

const normalizeUrl = (url) => String(url || "").replace(/\/$/, "");

const defaultBackend = {
    development: {
        baseUrl: process.env.REACT_APP_BACKEND_URL,
        apiBaseUrl: process.env.REACT_APP_API_URL,
    },
    production: {
        baseUrl: process.env.REACT_APP_BACKEND_URL,
        apiBaseUrl: process.env.REACT_APP_API_URL,
    },
};

const customerEnvironments = {
    development: {
        backend: defaultBackend.development,
        frontends: {
            shell: { baseUrl: process.env.REACT_APP_SHELL_URL },
            ...(process.env.REACT_APP_TREVISTA_URL ? { trevista: { baseUrl: process.env.REACT_APP_TREVISTA_URL, remoteEntry: `${process.env.REACT_APP_TREVISTA_URL}/remoteEntry.js` } } : {}),
            ...(process.env.REACT_APP_TREVIO_URL ? { trevio: { baseUrl: process.env.REACT_APP_TREVIO_URL, remoteEntry: `${process.env.REACT_APP_TREVIO_URL}/remoteEntry.js` } } : {}),
            adminShell: { baseUrl: process.env.REACT_APP_ADMIN_SHELL_URL },
        },
        auth: { shellLoginPath: "/auth" },
    },
    staging: {
        backend: defaultBackend.production,
        frontends: {
            shell: { baseUrl: process.env.REACT_APP_SHELL_URL },
            ...(process.env.REACT_APP_TREVISTA_URL ? { trevista: { baseUrl: process.env.REACT_APP_TREVISTA_URL, remoteEntry: process.env.REACT_APP_TREVISTA_REMOTE_URL } } : {}),
            ...(process.env.REACT_APP_TREVIO_URL ? { trevio: { baseUrl: process.env.REACT_APP_TREVIO_URL, remoteEntry: process.env.REACT_APP_TREVIO_REMOTE_URL } } : {}),
            adminShell: { baseUrl: process.env.REACT_APP_ADMIN_SHELL_URL },
        },
        auth: { shellLoginPath: "/auth" },
    },
    production: {
        backend: defaultBackend.production,
        frontends: {
            shell: { baseUrl: process.env.REACT_APP_SHELL_URL },
            ...(process.env.REACT_APP_TREVISTA_URL ? { trevista: { baseUrl: process.env.REACT_APP_TREVISTA_URL, remoteEntry: process.env.REACT_APP_TREVISTA_REMOTE_URL } } : {}),
            ...(process.env.REACT_APP_TREVIO_URL ? { trevio: { baseUrl: process.env.REACT_APP_TREVIO_URL, remoteEntry: process.env.REACT_APP_TREVIO_REMOTE_URL } } : {}),
            adminShell: { baseUrl: process.env.REACT_APP_ADMIN_SHELL_URL },
        },
        auth: { shellLoginPath: "/auth" },
    },
};

const adminEnvironments = {
    development: {
        backend: defaultBackend.development,
        frontends: {
            adminShell: { baseUrl: process.env.REACT_APP_ADMIN_SHELL_URL },
        },
        auth: { shellLoginPath: "/auth" },
    },
    production: {
        backend: defaultBackend.production,
        frontends: {
            adminShell: { baseUrl: process.env.REACT_APP_ADMIN_SHELL_URL },
        },
        auth: { shellLoginPath: "/auth" },
    },
};

const toursEnvironments = {
    development: {
        backend: defaultBackend.development,
    },
    production: {
        backend: defaultBackend.production,
    },
};

export const createPortalEnvironment = ({
    processEnv = {},
    environments,
    supportStaging = false,
    allowEnvOverrides = false,
    allowApiUrlWithoutOverrideFlag = false,
    allowBackendUrlFallback = false,
} = {}) => {
    const portalEnv = normalizeEnvironment(processEnv.REACT_APP_PORTAL_ENV || processEnv.NODE_ENV, { supportStaging });
    const portalEnvironment = environments[portalEnv] || environments.development;

    const getConfiguredApiBase = () => {
        const envApiUrl = allowEnvOverrides || allowApiUrlWithoutOverrideFlag ? processEnv.REACT_APP_API_URL : "";
        const envBackendApiUrl =
            allowBackendUrlFallback && processEnv.REACT_APP_BACKEND_URL
                ? `${normalizeUrl(processEnv.REACT_APP_BACKEND_URL)}/api`
                : "";

        return (
            envApiUrl ||
            envBackendApiUrl ||
            portalEnvironment?.backend?.apiBaseUrl ||
            (portalEnvironment?.backend?.baseUrl ? `${normalizeUrl(portalEnvironment.backend.baseUrl)}/api` : "")
        );
    };

    const getConfiguredFrontendOrigin = (key) => {
        const app = portalEnvironment?.frontends?.[key] || {};
        return app.baseUrl || stripRemoteEntry(app.remoteEntry);
    };

    const getConfiguredRemoteOrigin = (key) => {
        const envKey = key === "adminTREM" ? "REACT_APP_ADMIN_REMOTE_URL" : key === "trevista" ? "REACT_APP_TREVISTA_REMOTE_URL" : key === "trevio" ? "REACT_APP_TREVIO_REMOTE_URL" : null;
        const envValue = allowEnvOverrides && envKey ? processEnv[envKey] : "";
        const app = portalEnvironment?.frontends?.[key] || {};
        return stripRemoteEntry(envValue || app.remoteEntry || app.baseUrl);
    };

    const getShellLoginUrl = () => {
        const shellBase =
            getConfiguredFrontendOrigin("shell") ||
            (typeof window !== "undefined" ? window.location.origin : "");
        const loginPath = portalEnvironment?.auth?.shellLoginPath || "/login";
        return `${shellBase.replace(/\/$/, "")}${loginPath.startsWith("/") ? loginPath : `/${loginPath}`}`;
    };

    return {
        PORTAL_ENV: portalEnv,
        portalEnvironment,
        getConfiguredApiBase,
        getConfiguredFrontendOrigin,
        getConfiguredRemoteOrigin,
        getShellLoginUrl,
    };
};

export const createCustomerPortalEnvironment = (processEnv = {}) =>
    createPortalEnvironment({
        processEnv,
        environments: customerEnvironments,
        supportStaging: true,
        allowEnvOverrides: processEnv.REACT_APP_ALLOW_ENV_OVERRIDES === "true",
    });

export const createAdminPortalEnvironment = (processEnv = {}) =>
    createPortalEnvironment({
        processEnv,
        environments: adminEnvironments,
        allowEnvOverrides: processEnv.REACT_APP_ALLOW_ENV_OVERRIDES === "true",
    });

export const createToursPortalEnvironment = (processEnv = {}) =>
    createPortalEnvironment({
        processEnv,
        environments: toursEnvironments,
        allowApiUrlWithoutOverrideFlag: true,
        allowBackendUrlFallback: true,
    });
