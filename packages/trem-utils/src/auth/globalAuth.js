const normalizeBase = (value = "") => String(value || "").replace(/\/$/, "");

const isLocalHost = (hostname = "") => ["localhost", "127.0.0.1", "::1"].includes(hostname);

export const getGlobalAuthBaseUrl = (override = "") => {
  const configured = override || process.env.REACT_APP_AUTH_APP_URL || process.env.REACT_APP_AUTH_URL || "";
  if (configured) return normalizeBase(configured);

  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return "http://localhost:3003";
  }

  return "https://auth.travelstrem.in";
};

export const getCurrentReturnUrl = () => {
  if (typeof window === "undefined") return "/";
  return `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const buildGlobalAuthUrl = ({
  authBaseUrl = "",
  returnTo = getCurrentReturnUrl(),
  mode = "login",
  app = "",
} = {}) => {
  const url = new URL("/login", getGlobalAuthBaseUrl(authBaseUrl));
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  if (mode) url.searchParams.set("mode", mode);
  if (app) url.searchParams.set("app", app);
  return url.toString();
};

export const redirectToGlobalAuth = (options = {}) => {
  if (typeof window === "undefined") return;
  window.location.assign(buildGlobalAuthUrl(options));
};

export const getGlobalDashboardBaseUrl = (override = "") => {
  const configured = override || process.env.REACT_APP_DASHBOARD_URL || "";
  if (configured) return normalizeBase(configured);

  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return "http://localhost:3006";
  }

  return "https://dashboard.travelstrem.in";
};

export const buildGlobalDashboardUrl = ({
  dashboardBaseUrl = "",
  returnTo = getCurrentReturnUrl(),
  product = "",
} = {}) => {
  const base = getGlobalDashboardBaseUrl(dashboardBaseUrl);
  const url = new URL("/", base);
  if (product) url.searchParams.set("product", product);
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  return url.toString();
};

export const redirectToGlobalDashboard = (options = {}) => {
  if (typeof window === "undefined") return;
  window.location.assign(buildGlobalDashboardUrl(options));
};
