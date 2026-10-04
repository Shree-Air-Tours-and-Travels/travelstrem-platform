import { createPortalEnvironment } from "@packages/trem-environment";

const environment = createPortalEnvironment({
  processEnv: process.env,
  environments: {
    development: {
      backend: {
        baseUrl: process.env.REACT_APP_BACKEND_URL,
        apiBaseUrl: process.env.REACT_APP_API_URL,
      },
    },
    production: {
      backend: {
        baseUrl: process.env.REACT_APP_BACKEND_URL,
        apiBaseUrl: process.env.REACT_APP_API_URL,
      },
    },
  },
  allowApiUrlWithoutOverrideFlag: true,
  allowBackendUrlFallback: true,
});

export const PORTAL_ENV = environment.PORTAL_ENV;
export const getConfiguredApiBase = environment.getConfiguredApiBase;
