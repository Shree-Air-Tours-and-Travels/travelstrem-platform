import { createPortalEnvironment } from "@packages/trem-environment";

const environment = createPortalEnvironment({
  processEnv: process.env,
  environments: {
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
  },
  allowApiUrlWithoutOverrideFlag: true,
  allowBackendUrlFallback: true,
});

export const PORTAL_ENV = environment.PORTAL_ENV;
export const getConfiguredApiBase = environment.getConfiguredApiBase;
