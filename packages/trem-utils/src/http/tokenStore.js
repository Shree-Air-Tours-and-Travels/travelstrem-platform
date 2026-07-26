/**
 * In-memory JWT token store.
 *
 * Access tokens are stored here (never in localStorage/sessionStorage)
 * to avoid XSS exposure while still being readable by JS for Bearer
 * header attachment.  The httpOnly refresh-token cookie handles renewal.
 *
 * Usage:
 *   import { tokenStore } from "@packages/trem-utils";
 *   tokenStore.set(response.data.token);   // after login
 *   tokenStore.clear();                     // on logout
 */

let accessToken = null;

export const tokenStore = {
  get() {
    return accessToken;
  },

  set(token) {
    accessToken = typeof token === "string" && token.length > 10 ? token : null;
  },

  clear() {
    accessToken = null;
  },

  /** Returns true if a token is currently held in memory. */
  has() {
    return !!accessToken;
  },
};

export default tokenStore;
