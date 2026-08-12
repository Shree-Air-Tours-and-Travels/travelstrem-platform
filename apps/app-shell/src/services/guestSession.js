export const GUEST_SESSION_KEY = "trem_app_shell_guest";

const browserStorage = () => {
  try { return window.sessionStorage; } catch { return null; }
};

export const isGuestSession = ({ search, storage } = {}) => {
  const currentSearch = search ?? (typeof window !== "undefined" ? window.location.search : "");
  const currentStorage = storage ?? (typeof window !== "undefined" ? browserStorage() : null);
  const requested = new URLSearchParams(currentSearch).get("guest") === "1";
  if (requested) {
    try { currentStorage?.setItem(GUEST_SESSION_KEY, "true"); } catch {}
  }
  try { return requested || currentStorage?.getItem(GUEST_SESSION_KEY) === "true"; } catch { return requested; }
};

export const enableGuestSession = (storage) => {
  try { (storage ?? browserStorage())?.setItem(GUEST_SESSION_KEY, "true"); } catch {}
};

export const clearGuestSession = (storage) => {
  try { (storage ?? browserStorage())?.removeItem(GUEST_SESSION_KEY); } catch {}
};
