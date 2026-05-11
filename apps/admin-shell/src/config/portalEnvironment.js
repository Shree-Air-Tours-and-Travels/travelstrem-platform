const normalizeEnvironment = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    return raw === "production" || raw === "prod" ? "production" : "development";
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
            adminShell: { baseUrl: "http://localhost:3002" },
        },
        auth: {
            shellLoginPath: "/auth",
        },
    },
    production: {
        backend: {
            baseUrl: "https://travelstrem-testbe.onrender.com",
            apiBaseUrl: "https://travelstrem-testbe.onrender.com/api",
        },
        frontends: {
            adminShell: { baseUrl: "" },
        },
        auth: {
            shellLoginPath: "/auth",
        },
    },
};

export const portalEnvironment = environments[PORTAL_ENV] || environments.development;

export const getConfiguredApiBase = () =>
    (allowEnvOverrides && process.env.REACT_APP_API_URL) ||
    portalEnvironment?.backend?.apiBaseUrl ||
    (portalEnvironment?.backend?.baseUrl ? `${portalEnvironment.backend.baseUrl.replace(/\/$/, "")}/api` : "");
