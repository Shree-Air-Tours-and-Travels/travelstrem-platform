import { createFetchUserSession } from "@packages/trem-session";
import { API_BASE } from "./configService";

const userSession = createFetchUserSession({ apiBase: API_BASE });

export const initUserSession = userSession.initUserSession;
export const clearUserSessionCache = userSession.clearUserSessionCache;
