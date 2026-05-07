import { getApiBaseUrl, getPortalEnvironment, normalizeEnvironment } from "@packages/trem-config";

export const PORTAL_ENV = normalizeEnvironment(process.env.REACT_APP_PORTAL_ENV || process.env.NODE_ENV);

export const portalEnvironment = getPortalEnvironment(PORTAL_ENV);

export const getConfiguredApiBase = () =>
    getApiBaseUrl({
        env: PORTAL_ENV,
        apiUrl: process.env.REACT_APP_API_URL,
        backendUrl: process.env.REACT_APP_BACKEND_URL,
        allowOverrides: true,
    });
