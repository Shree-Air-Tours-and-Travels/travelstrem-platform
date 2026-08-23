import { createUserSession } from "@packages/trem-session";
import apiService from "./apiService";

const userSession = createUserSession({
  requestSession: (params = {}) =>
    apiService.get("/auth/session", { params }).catch((err) => {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message;
      console.warn(`[userSession] /auth/session failed (${status || "network"}):`, msg);
      throw err;
    }),
});

export const initUserSession = userSession.initUserSession;
export const clearUserSessionCache = userSession.clearUserSessionCache;
