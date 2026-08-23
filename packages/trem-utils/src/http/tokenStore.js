/**
 * @deprecated Authentication is cookie-only. This compatibility store is a no-op.
 */

export const tokenStore = {
  get() {
    return null;
  },

  set(token) {
    return null;
  },

  clear() {
    return null;
  },

  has() {
    return false;
  },
};

export default tokenStore;
