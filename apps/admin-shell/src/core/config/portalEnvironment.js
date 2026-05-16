import { createAdminPortalEnvironment } from "@packages/trem-environment";

const environment = createAdminPortalEnvironment(process.env);

export const PORTAL_ENV = environment.PORTAL_ENV;
export const portalEnvironment = environment.portalEnvironment;
export const getConfiguredApiBase = environment.getConfiguredApiBase;
