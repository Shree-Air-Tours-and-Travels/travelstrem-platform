import { createCustomerPortalEnvironment } from "@packages/trem-environment";

const environment = createCustomerPortalEnvironment(process.env);

export const PORTAL_ENV = environment.PORTAL_ENV;
export const portalEnvironment = environment.portalEnvironment;
export const getConfiguredApiBase = environment.getConfiguredApiBase;
export const getConfiguredFrontendOrigin = environment.getConfiguredFrontendOrigin;
export const getConfiguredRemoteOrigin = environment.getConfiguredRemoteOrigin;
export const getShellLoginUrl = environment.getShellLoginUrl;
