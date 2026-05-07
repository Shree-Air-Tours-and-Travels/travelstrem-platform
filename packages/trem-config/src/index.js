export const normalizeEnvironment = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    return raw === "production" || raw === "prod" ? "production" : "development";
};

export const portalEnvironments = {
    development: {
        backend: {
            baseUrl: "http://localhost:5000",
            apiBaseUrl: "http://localhost:5000/api",
        },
        frontends: {
            shell: { baseUrl: "http://localhost:3000" },
            tours: { baseUrl: "http://localhost:3001", remoteEntry: "http://localhost:3001/remoteEntry.js" },
            admin: { baseUrl: "http://localhost:3002", remoteEntry: "http://localhost:3002/remoteEntry.js" },
        },
        auth: {
            shellLoginPath: "/auth",
        },
    },
    production: {
        backend: {
            baseUrl: "https://travelstrem-test.onrender.com",
            apiBaseUrl: "https://travelstrem-test.onrender.com/api",
        },
        frontends: {
            shell: { baseUrl: "" },
            tours: { baseUrl: "", remoteEntry: "" },
            admin: { baseUrl: "", remoteEntry: "" },
        },
        auth: {
            shellLoginPath: "/auth",
        },
    },
};

export const getPortalEnvironment = (env) =>
    portalEnvironments[normalizeEnvironment(env)] || portalEnvironments.development;

export const normalizeUrl = (url) => String(url || "").replace(/\/$/, "");

export const getApiBaseUrl = ({ env, apiUrl, backendUrl, allowOverrides = true } = {}) => {
    const portalEnvironment = getPortalEnvironment(env);
    if (allowOverrides && apiUrl) return normalizeUrl(apiUrl);
    if (allowOverrides && backendUrl) return `${normalizeUrl(backendUrl)}/api`;
    return portalEnvironment.backend?.apiBaseUrl || `${normalizeUrl(portalEnvironment.backend?.baseUrl)}/api`;
};

export const getShellLoginUrl = ({ env, shellUrl, allowOverrides = true } = {}) => {
    const portalEnvironment = getPortalEnvironment(env);
    const shellBase = allowOverrides && shellUrl ? shellUrl : portalEnvironment.frontends?.shell?.baseUrl;
    const loginPath = portalEnvironment.auth?.shellLoginPath || "/auth";
    return `${normalizeUrl(shellBase || "http://localhost:3000")}${loginPath.startsWith("/") ? loginPath : `/${loginPath}`}`;
};
