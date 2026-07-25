import { createApiServiceUserSession } from "@packages/trem-session";
import apiService from "./apiService";

const userSession = createApiServiceUserSession({ apiService });

export const initUserSession = userSession.initUserSession;
export const clearUserSessionCache = userSession.clearUserSessionCache;
