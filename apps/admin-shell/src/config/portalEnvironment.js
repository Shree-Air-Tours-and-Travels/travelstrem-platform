import {
    getApiBaseUrl,
    getPortalEnvironment,
    getShellLoginUrl as resolveShellLoginUrl,
    normalizeEnvironment,
} from "@packages/trem-config";

export const PORTAL_ENV = normalizeEnvironment(process.env.REACT_APP_PORTAL_ENV || process.env.NODE_ENV);
const allowEnvOverrides = process.env.REACT_APP_ALLOW_ENV_OVERRIDES === "true";

export const portalEnvironment = getPortalEnvironment(PORTAL_ENV);

export const getConfiguredApiBase = () =>
    getApiBaseUrl({
        env: PORTAL_ENV,
        apiUrl: process.env.REACT_APP_API_URL,
        backendUrl: process.env.REACT_APP_BACKEND_URL,
        allowOverrides: allowEnvOverrides,
    });

export const getShellLoginUrl = () =>
    resolveShellLoginUrl({
        env: PORTAL_ENV,
        shellUrl: process.env.REACT_APP_SHELL_URL,
        allowOverrides: allowEnvOverrides,
    });
