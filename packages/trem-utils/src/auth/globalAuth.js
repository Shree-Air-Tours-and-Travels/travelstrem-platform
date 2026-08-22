const normalizeBase = (value = "") => String(value || "").replace(/\/$/, "");

const safeBase = (base) => {
  if (base) return base;
  if (typeof window !== "undefined") return window.location.origin;
  return "/";
};

const isLocalHost = (hostname = "") => ["localhost", "127.0.0.1", "::1"].includes(hostname);

export const getGlobalAuthBaseUrl = (override = "") => {
  const configured = override || process.env.REACT_APP_AUTH_APP_URL || "";
  if (configured) return normalizeBase(configured);
  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return "http://localhost:3003";
  }
  return "https://auth.travelstrem.com";
};

export const getCurrentReturnUrl = () => {
  if (typeof window === "undefined") return "/";
  return `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const buildGlobalAuthUrl = ({
  authBaseUrl = "",
  returnTo = "",
  mode = "login",
  app = "",
} = {}) => {
  const url = new URL("/login", safeBase(getGlobalAuthBaseUrl(authBaseUrl)));
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  if (mode) url.searchParams.set("mode", mode);
  if (app) url.searchParams.set("app", app);
  return url.toString();
};

export const redirectToGlobalAuth = (options = {}) => {
  if (typeof window === "undefined") return;
  window.location.assign(buildGlobalAuthUrl(options));
};

export const getGlobalAppShellBaseUrl = (override = "") => {
  const configured = override || process.env.REACT_APP_SHELL_URL || "";
  if (configured) return normalizeBase(configured);
  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return "http://localhost:3006";
  }
  return "https://app.travelstrem.com";
};

export const buildGlobalAppShellUrl = ({
  shellBaseUrl = "",
  returnTo = "",
  product = "",
  tab = "",
} = {}) => {
  const base = getGlobalAppShellBaseUrl(shellBaseUrl);
  const url = new URL("/", safeBase(base));
  if (product) url.searchParams.set("product", product);
  if (tab) url.searchParams.set("tab", tab);
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  return url.toString();
};

export const redirectToGlobalAppShell = (options = {}) => {
  if (typeof window === "undefined") return;
  window.location.assign(buildGlobalAppShellUrl(options));
};
