const normalizeEnvironment = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "production" || raw === "prod") return "production";
    if (raw === "staging" || raw === "stage") return "staging";
    return "development";
};

export const PORTAL_ENV = normalizeEnvironment(process.env.REACT_APP_PORTAL_ENV || process.env.NODE_ENV);
const allowEnvOverrides = process.env.REACT_APP_ALLOW_ENV_OVERRIDES === "true";

const environments = {
    development: {
        backend: {
            baseUrl: "http://localhost:5000",
            apiBaseUrl: "http://localhost:5000/api",
        },
        frontends: {
            shell: { baseUrl: "http://localhost:3000" },
            toursTREM: { baseUrl: "http://localhost:3001", remoteEntry: "http://localhost:3001/remoteEntry.js" },
            adminShell: { baseUrl: "http://localhost:3002" },
        },
        auth: {
            shellLoginPath: "/auth",
        },
    },
    staging: {
        backend: {
            baseUrl: "https://travelstrem-testbe.onrender.com",
            apiBaseUrl: "https://travelstrem-testbe.onrender.com/api",
        },
        frontends: {},
        auth: {
            shellLoginPath: "/auth",
        },
    },
    production: {
        backend: {
            baseUrl: "https://travelstrem-testbe.onrender.com",
            apiBaseUrl: "https://travelstrem-testbe.onrender.com/api",
        },
        frontends: {},
        auth: {
            shellLoginPath: "/auth",
        },
    },
};

export const portalEnvironment = environments[PORTAL_ENV] || environments.development;

const stripRemoteEntry = (remoteEntry) => String(remoteEntry || "").replace(/\/remoteEntry\.js$/, "").replace(/\/$/, "");

export const getConfiguredApiBase = () =>
    (allowEnvOverrides && process.env.REACT_APP_API_URL) ||
    portalEnvironment?.backend?.apiBaseUrl ||
    (portalEnvironment?.backend?.baseUrl ? `${portalEnvironment.backend.baseUrl.replace(/\/$/, "")}/api` : "");

export const getConfiguredFrontendOrigin = (key) => {
    const app = portalEnvironment?.frontends?.[key] || {};
    return app.baseUrl || stripRemoteEntry(app.remoteEntry);
};

export const getConfiguredRemoteOrigin = (key) => {
    const envKey = key === "adminTREM" ? "REACT_APP_ADMIN_REMOTE_URL" : key === "toursTREM" ? "REACT_APP_TOURS_REMOTE_URL" : null;
    const envValue = allowEnvOverrides && envKey ? process.env[envKey] : "";
    const app = portalEnvironment?.frontends?.[key] || {};
    return stripRemoteEntry(envValue || app.remoteEntry || app.baseUrl);
};

export const getShellLoginUrl = () => {
    const shellBase = getConfiguredFrontendOrigin("shell") || window.location.origin;
    const loginPath = portalEnvironment?.auth?.shellLoginPath || "/login";
    return `${shellBase.replace(/\/$/, "")}${loginPath.startsWith("/") ? loginPath : `/${loginPath}`}`;
};
