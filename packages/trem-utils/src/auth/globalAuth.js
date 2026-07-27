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
  return "";
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

export const getGlobalDashboardBaseUrl = (override = "") => {
  const configured = override || process.env.REACT_APP_DASHBOARD_URL || "";
  if (configured) return normalizeBase(configured);
  return "";
};

export const buildGlobalDashboardUrl = ({
  dashboardBaseUrl = "",
  returnTo = "",
  product = "",
  tab = "",
} = {}) => {
  const base = getGlobalDashboardBaseUrl(dashboardBaseUrl);
  const url = new URL("/", safeBase(base));
  if (product) url.searchParams.set("product", product);
  if (tab) url.searchParams.set("tab", tab);
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  return url.toString();
};

export const redirectToGlobalDashboard = (options = {}) => {
  if (typeof window === "undefined") return;
  window.location.assign(buildGlobalDashboardUrl(options));
};

export const getGlobalBookingEngineBaseUrl = (override = "") => {
  const configured = override || process.env.REACT_APP_BOOKING_ENGINE_URL || "";
  if (configured) return normalizeBase(configured);
  return "";
};

export const buildGlobalBookingEngineUrl = ({
  bookingEngineBaseUrl = "",
  product = "",
  tourRef = "",
  returnTo = "",
} = {}) => {
  const url = new URL("/", safeBase(getGlobalBookingEngineBaseUrl(bookingEngineBaseUrl)));
  if (product) url.searchParams.set("product", product);
  if (tourRef) url.searchParams.set("tourRef", tourRef);
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  return url.toString();
};

export const redirectToGlobalBookingEngine = (options = {}) => {
  if (typeof window === "undefined") return;
  window.location.assign(buildGlobalBookingEngineUrl(options));
};
