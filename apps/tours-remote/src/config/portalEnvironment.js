const normalizeEnvironment = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    return raw === "production" || raw === "prod" ? "production" : "development";
};

export const PORTAL_ENV = normalizeEnvironment(process.env.REACT_APP_PORTAL_ENV || process.env.NODE_ENV);

const environments = {
    development: {
        backend: {
            baseUrl: "http://localhost:5000",
            apiBaseUrl: "http://localhost:5000/api",
        },
    },
    production: {
        backend: {
            baseUrl: "https://travelstrem-testbe.onrender.com",
            apiBaseUrl: "https://travelstrem-testbe.onrender.com/api",
        },
    },
};

const normalizeUrl = (url) => String(url || "").replace(/\/$/, "");

export const portalEnvironment = environments[PORTAL_ENV] || environments.development;

export const getConfiguredApiBase = () =>
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_BACKEND_URL && `${normalizeUrl(process.env.REACT_APP_BACKEND_URL)}/api` ||
    environments[PORTAL_ENV]?.backend?.apiBaseUrl ||
    (environments[PORTAL_ENV]?.backend?.baseUrl ? `${normalizeUrl(environments[PORTAL_ENV].backend.baseUrl)}/api` : "");
