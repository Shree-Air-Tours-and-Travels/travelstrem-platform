import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

export const DEFAULT_AUTH_ROLES = [
  {
    value: "member",
    title: "Member",
    subtitle: "Book trips and manage your journeys",
    descriptor: "Customer",
  },
  {
    value: "agent",
    title: "Agent",
    subtitle: "Manage tours, quotes, and customer requests",
    descriptor: "Operations",
    requiresSecret: true,
  },
  {
    value: "admin",
    title: "Admin",
    subtitle: "Full platform access and controls",
    descriptor: "Platform",
    requiresSecret: true,
  },
];

export const filterRoles = (roles, allowedRoles) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return roles;
  const allowed = new Set(allowedRoles);
  return roles.filter((role) => allowed.has(role.value));
};

export const hasAuthRole = (session, roles = []) => {
  if (!roles.length) return true;
  const permissions = session?.permissions || [];
  const role = session?.user?.role;

  return roles.includes(role) || permissions.some((permission) => roles.includes(permission));
};

export const canAccessAuthRoute = (route = {}, session = null) => {
  if (route.access === "authenticated") return Boolean(session?.isAuthenticated);
  if (route.access === "roles")
    return Boolean(session?.isAuthenticated) && hasAuthRole(session, route.roles || []);
  if (route.access === "publicOnly") return !session?.isAuthenticated;
  return true;
};

export const AUTH_CHANNEL_NAME = "travelstrem-auth";
export const SESSION_EXPIRED_EVENT = "TREM_SESSION_EXPIRED";
export const SESSION_REFRESHED_EVENT = "TREM_SESSION_REFRESHED";
export const SESSION_KEEPALIVE_EVENT = "TREM_SESSION_KEEPALIVE";
export const DEFAULT_SESSION_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

const currentAuthPortal = () => {
  if (typeof window === "undefined") return "customer";
  const explicit = String(window.__TREM_AUTH_PORTAL__ || "")
    .trim()
    .toLowerCase();
  if (["admin", "partner", "customer"].includes(explicit)) return explicit;
  const prefix = String(window.__TREM_AUTH_STORAGE_PREFIX__ || "").toLowerCase();
  if (prefix.includes("admin")) return "admin";
  if (prefix.includes("agent") || prefix.includes("partner")) return "partner";
  return "customer";
};

const authChannelName = () => `${AUTH_CHANNEL_NAME}:${currentAuthPortal()}`;

export const emitAuthEvent = (message = {}) => {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  const portal = currentAuthPortal();
  const channel = new BroadcastChannel(authChannelName());
  channel.postMessage({ ...message, portal });
  channel.close();
};

export const subscribeAuthEvents = (handler) => {
  if (
    typeof window === "undefined" ||
    typeof BroadcastChannel === "undefined" ||
    typeof handler !== "function"
  ) {
    return () => {};
  }
  const channel = new BroadcastChannel(authChannelName());
  channel.onmessage = (event) => handler(event.data || {});
  return () => channel.close();
};

export const clearAuthBrowserState = ({ storage = localStorage, prefixes = [] } = {}) => {
  const baseKeys = [
    "token",
    "auth_token",
    "auth_user",
    "auth_token_key_name",
    "travelstrem:token",
    "travelstrem:auth_user",
  ];
  const prefixedKeys = prefixes.flatMap((prefix) => [
    `${prefix}:token`,
    `${prefix}:auth_user`,
    `${prefix}:auth_token`,
    `${prefix}:auth_token_key_name`,
  ]);
  (prefixes.length ? prefixedKeys : baseKeys).forEach((key) => storage?.removeItem(key));
};

export const extractToken = () => null;

export const extractSafeUser = (res) =>
  res?.data?.user ||
  res?.data?.data?.user ||
  (res?.data && typeof res.data === "object" && res.data.user) ||
  res?.user ||
  null;

export const appendTokenToUrl = (url, token) => {
  return typeof url === "string" ? url : "";
};

export const consumeUrlToken = (storageKeys = {}) => {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("auth_token")) return null;
    url.searchParams.delete("auth_token");
    window.history.replaceState({}, "", url.toString());
    return null;
  } catch {
    return null;
  }
};

export const setAuthHeader = (api, token) => {
  if (!api?.defaults?.headers?.common || !token) return;
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const clearAuthHeader = (api) => {
  if (api?.defaults?.headers?.common?.Authorization) {
    delete api.defaults.headers.common.Authorization;
  }
};

export const persistAuthSession = ({
  api,
  response,
  storage = localStorage,
  storageKeys = {},
  remember = false,
  rememberEmail = "",
  emit,
} = {}) => {
  const safeUser = extractSafeUser(response);
  const rememberKey = storageKeys.rememberEmail || "remember_email";

  clearAuthHeader(api);

  if (remember) storage.setItem(rememberKey, rememberEmail);
  else storage.removeItem(rememberKey);

  emitAuthEvent({
    type: "LOGIN",
    userId: safeUser?.id || safeUser?._id || "",
    sessionVersion: response?.data?.sessionVersion || response?.sessionVersion || "",
  });
  emit?.("SESSION_READY", { user: safeUser });
  return { user: safeUser };
};

export const clearAuthSession = ({ api, storage = localStorage, storagePrefix = "" } = {}) => {
  const prefix = storagePrefix ? `${storagePrefix}:` : "";
  const keys = prefix
    ? [
        prefix + "token",
        prefix + "auth_token",
        prefix + "auth_user",
        prefix + "auth_token_key_name",
      ]
    : ["token", "auth_token", "auth_user", "auth_token_key_name"];
  keys.forEach((key) => storage?.removeItem(key));
  clearAuthHeader(api);
};

export const setupRefreshInterceptor = (api, storagePrefix = "") => {
  let refreshRequest = null;
  const notifyExpired = () => {
    clearAuthSession({ api, storagePrefix });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason: "session_expired" } }),
      );
    }
  };
  const refreshSession = async () => {
    if (!refreshRequest) {
      refreshRequest = api
        .post("/auth/refresh", {}, { _skipAuthRefresh: true })
        .finally(() => {
          refreshRequest = null;
        });
    }
    await refreshRequest;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SESSION_REFRESHED_EVENT));
    }
  };

  if (typeof window !== "undefined" && !api.__tremKeepAliveListener) {
    api.__tremKeepAliveListener = () => refreshSession().catch(notifyExpired);
    window.addEventListener(SESSION_KEEPALIVE_EVENT, api.__tremKeepAliveListener);
  }

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status !== 401 ||
        originalRequest._retry ||
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/logout")
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        await refreshSession();
        return api(originalRequest);
      } catch (refreshError) {
        notifyExpired();
        return Promise.reject(refreshError);
      }
    },
  );
};

export function useSessionInactivity({
  enabled = false,
  timeoutMs = DEFAULT_SESSION_INACTIVITY_TIMEOUT_MS,
  onExpired,
} = {}) {
  const [expired, setExpired] = useState(false);
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const lastRecordedRef = useRef(0);
  const lastKeepAliveRef = useRef(Date.now());
  const expiredRef = useRef(false);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    if (!enabled) {
      expiredRef.current = false;
      setExpired(false);
      return undefined;
    }

    const limit = Math.max(60_000, Number(timeoutMs) || DEFAULT_SESSION_INACTIVITY_TIMEOUT_MS);
    const clearTimer = () => window.clearTimeout(timerRef.current);
    const expire = (reason = "inactivity") => {
      if (expiredRef.current) return;
      expiredRef.current = true;
      clearTimer();
      setExpired(true);
      onExpiredRef.current?.(reason);
      if (reason === "inactivity") {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }));
      }
    };
    const schedule = () => {
      clearTimer();
      const remaining = limit - (Date.now() - lastActivityRef.current);
      if (remaining <= 0) return expire();
      timerRef.current = window.setTimeout(() => expire(), remaining);
    };
    const recordActivity = ({ force = false } = {}) => {
      if (expiredRef.current) return;
      const now = Date.now();
      if (!force && now - lastRecordedRef.current < 30_000) return;
      lastRecordedRef.current = now;
      lastActivityRef.current = now;
      const keepAliveInterval = Math.min(8 * 60 * 1000, Math.floor(limit * 0.6));
      if (now - lastKeepAliveRef.current >= keepAliveInterval) {
        lastKeepAliveRef.current = now;
        window.dispatchEvent(new CustomEvent(SESSION_KEEPALIVE_EVENT));
      }
      schedule();
    };
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActivityRef.current >= limit) expire();
      else recordActivity({ force: true });
    };
    const handleSessionExpired = (event) => expire(event?.detail?.reason || "expired");
    const activityEvents = ["pointerdown", "pointermove", "keydown", "touchstart", "scroll"];

    expiredRef.current = false;
    setExpired(false);
    lastKeepAliveRef.current = Date.now();
    recordActivity({ force: true });
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      clearTimer();
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [enabled, timeoutMs]);

  return expired;
}

export const createRefreshHandler =
  ({ authService, persistSession, onRefresh } = {}) =>
  async (payload = {}) => {
    if (!authService?.refresh) return null;
    const response = await authService.refresh(payload);
    const session = await persistSession(response);
    await onRefresh?.(session);
    return session;
  };

const normalizeBase = (raw) => {
  if (raw == null || raw === "") return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw}`.replace(/\/$/, "");
};

export const createAuthApi = (base = process.env.REACT_APP_API_URL || "", portal = "customer") => {
  const normalized = normalizeBase(base) ?? "";
  const baseURL = (normalized.endsWith("/api") ? normalized : `${normalized}/api`).replace(
    /([^:]\/)\/+/g,
    "$1",
  );

  const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json", "X-Travelstrem-Portal": portal },
  });

  if (typeof window !== "undefined") window.__TREM_AUTH_PORTAL__ = portal;

  return api;
};

export const createAuthService = (api) => ({
  getConfig: () => api.get("/auth/config"),
  getMethods: () => api.get("/auth/methods"),
  getSession: () => api.get("/auth/session"),
  getCurrentUser: () => api.get("/auth/me"),
  requestMobileOtp: (payload) => api.post("/auth/mobile/request-otp", payload),
  verifyMobileOtp: (payload) => api.post("/auth/mobile/verify-otp", payload),
  getGoogleAuthUrl: ({ portal = "customer", returnTo = "" } = {}) => {
    const url = new URL(
      `${api.defaults.baseURL.replace(/\/$/, "")}/auth/google`,
      typeof window !== "undefined" ? window.location.origin : "http://localhost",
    );
    url.searchParams.set("portal", portal);
    if (returnTo) url.searchParams.set("returnTo", returnTo);
    return url.toString();
  },
  requestAdminRegistrationOtp: (payload) =>
    api.post("/auth/admin-registration-otp", payload, {
      headers: { "Content-Type": "application/json" },
    }),
  verifyAdminRegistrationOtp: (payload) =>
    api.post("/auth/verify-admin-registration-otp", payload, {
      headers: { "Content-Type": "application/json" },
    }),
  login: (payload) =>
    api.post("/auth/login", payload, { headers: { "Content-Type": "application/json" } }),
  register: (payload) =>
    api.post("/auth/register", payload, { headers: { "Content-Type": "application/json" } }),
  forgotPassword: (payload) =>
    api.post("/auth/forgot-password", payload, { headers: { "Content-Type": "application/json" } }),
  resetPassword: (payload) =>
    api.post("/auth/reset-password", payload, { headers: { "Content-Type": "application/json" } }),
  activateValidate: (payload) =>
    api.post("/auth/activate-validate", payload, {
      headers: { "Content-Type": "application/json" },
    }),
  requestActivationOtp: (payload) =>
    api.post("/auth/request-activation-otp", payload, {
      headers: { "Content-Type": "application/json" },
    }),
  activateWithOtp: (payload) =>
    api.post("/auth/activate-with-otp", payload, {
      headers: { "Content-Type": "application/json" },
    }),
  verifyLoginOtp: (payload) =>
    api.post("/auth/verify-otp", payload, { headers: { "Content-Type": "application/json" } }),
  resendLoginOtp: (payload) =>
    api.post("/auth/resend-otp", payload, { headers: { "Content-Type": "application/json" } }),
  refresh: (payload = {}) =>
    api.post("/auth/refresh", payload, { headers: { "Content-Type": "application/json" } }),
});

export const getReturnPath = (locationState, fallback) => {
  const from = locationState?.from;
  if (!from) return fallback;
  return `${from.pathname || fallback}${from.search || ""}${from.hash || ""}`;
};

export const normalizeAuthConfig = (remote, roleOptions, defaultRole, storagePrefix = "") => {
  const prefix = storagePrefix ? `${storagePrefix}:` : "";
  return {
    defaultRole: defaultRole || remote?.defaultRole || "member",
    roles:
      Array.isArray(roleOptions) && roleOptions.length
        ? roleOptions
        : Array.isArray(remote?.roles)
          ? remote.roles
          : DEFAULT_AUTH_ROLES,
    strings: { ...(remote?.strings || {}) },
    header: { ...(remote?.header || {}) },
    company: {
      ...(remote?.company || {}),
      highlights: Array.isArray(remote?.company?.highlights) ? remote.company.highlights : [],
    },
    storageKeys: {
      token: remote?.storageKeys?.token || `${prefix}token`,
      user: remote?.storageKeys?.user || `${prefix}auth_user`,
      rememberEmail:
        remote?.storageKeys?.rememberMe ||
        remote?.storageKeys?.rememberEmail ||
        `${prefix}remember_email`,
    },
  };
};

const extractAuthConfig = (res) =>
  res?.componentData?.structure ||
  res?.data?.componentData?.structure ||
  res?.data?.data?.componentData?.structure;

export const useAuthConfig = ({
  authService,
  roleOptions,
  defaultRole,
  storagePrefix = "",
} = {}) => {
  const [cfg, setCfg] = useState(null);
  const [cfgLoading, setCfgLoading] = useState(true);
  const [cfgError, setCfgError] = useState(null);

  useEffect(() => {
    let canceled = false;
    const fetchCfg = async () => {
      setCfgLoading(true);
      setCfgError(null);
      try {
        const res = await authService.getConfig();
        const remote = extractAuthConfig(res);
        if (!remote) throw new Error("Invalid config format from server");
        if (!canceled) setCfg(normalizeAuthConfig(remote, roleOptions, defaultRole, storagePrefix));
      } catch (err) {
        if (!canceled) {
          setCfgError(err?.response?.data?.message || err.message || "Failed to load auth config");
          setCfg(normalizeAuthConfig(null, roleOptions, defaultRole, storagePrefix));
        }
      } finally {
        if (!canceled) setCfgLoading(false);
      }
    };
    fetchCfg();
    return () => {
      canceled = true;
    };
  }, [authService, defaultRole, roleOptions, storagePrefix]);

  return { cfg, cfgLoading, cfgError };
};

export const useAuthFlow = ({
  api,
  authService,
  emit,
  reload,
  allowedRoles = ["member"],
  roleOptions,
  defaultRole = "member",
  registerEnabled = true,
  showAdminSecret = true,
  otpLoginEnabled = false,
  storagePrefix = "",
} = {}) => {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState(null);
  const [adminRegistrationStep, setAdminRegistrationStep] = useState(null);
  const [remember, setRemember] = useState(false);
  const [form, setForm] = useState(null);
  const [loginOtpStep, setLoginOtpStep] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const { cfg, cfgLoading, cfgError } = useAuthConfig({
    authService,
    roleOptions,
    defaultRole,
    storagePrefix,
  });

  const roles = useMemo(() => {
    const configured = cfg?.roles || roleOptions || DEFAULT_AUTH_ROLES;
    return filterRoles(configured, allowedRoles);
  }, [allowedRoles, cfg?.roles, roleOptions]);

  useEffect(() => {
    if (!cfg) return;
    const remembered = localStorage.getItem(cfg.storageKeys.rememberEmail);
    if (remembered) setRemember(true);
    const initialRole = roles.some((role) => role.value === cfg.defaultRole)
      ? cfg.defaultRole
      : roles[0]?.value || defaultRole;
    setForm({
      name: "",
      email: remembered || "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: initialRole,
      adminOtp: "",
      adminPin: "",
    });
  }, [cfg, defaultRole, roles]);

  const update = useCallback(
    (key) => (e) => {
      const value = e?.target?.value ?? e;
      setForm((state) => ({ ...state, [key]: value }));
      if (["email", "phone", "role"].includes(key)) {
        setAdminRegistrationStep(null);
        setOtpMessage(null);
        setForm((state) => ({ ...state, adminOtp: "", adminPin: "" }));
      }
    },
    [],
  );

  const selectedRole = roles.find((role) => role.value === form?.role);
  const needsSecret = Boolean(
    showAdminSecret &&
    (selectedRole?.requiresSecret ||
      (selectedRole?.requiresSecretForEmail &&
        form?.email?.trim().toLowerCase() ===
          String(selectedRole.requiresSecretForEmail).trim().toLowerCase())),
  );

  const persistSession = useCallback(
    async (response) => {
      const session = persistAuthSession({
        api,
        response,
        storageKeys: cfg.storageKeys,
        remember,
        rememberEmail: form.email.trim(),
        emit,
      });
      await reload?.({ forceSession: true });
      return session.user;
    },
    [api, cfg?.storageKeys, emit, form?.email, reload, remember],
  );

  const requestRegistrationOtp = useCallback(async () => {
    setError(null);
    setOtpMessage(null);
    if (!form?.email) {
      setError("Enter the email first, then request the console OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authService.requestAdminRegistrationOtp({
        email: form.email.trim(),
        role: form.role,
        phone: form.phone?.trim() || "",
      });
      setAdminRegistrationStep({ status: "otp_sent" });
      setOtpMessage(res?.data?.message || res?.message || "Registration OTP generated.");
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Could not generate registration OTP.",
      );
    } finally {
      setOtpLoading(false);
    }
  }, [authService, form?.email, form?.phone, form?.role]);

  const verifyRegistrationOtp = useCallback(async () => {
    setError(null);
    setOtpMessage(null);
    if (!/^\d{6}$/.test(form?.adminOtp || "")) {
      setError("Enter the 6 digit registration OTP.");
      return null;
    }
    setOtpLoading(true);
    try {
      const res = await authService.verifyAdminRegistrationOtp({
        email: form.email.trim(),
        phone: form.phone?.trim() || "",
        otp: form.adminOtp,
      });
      const data = res?.data || res;
      setAdminRegistrationStep({ status: "verified", verificationId: data.verificationId });
      setOtpMessage(data.message || "OTP verified. Enter your Admin PIN.");
      return data;
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Could not verify the registration OTP.",
      );
      return null;
    } finally {
      setOtpLoading(false);
    }
  }, [authService, form?.adminOtp, form?.email, form?.phone]);

  const submitAuth = useCallback(async () => {
    setError(null);
    if (!cfg || !form) {
      setError("Configuration is still loading. Please wait.");
      return null;
    }
    if (!allowedRoles.includes(form.role)) {
      setError("This shell does not allow that role.");
      return null;
    }

    setLoading(true);
    try {
      if (activeTab === "login") {
        if (!form.email || !form.password)
          throw new Error(cfg.strings?.missingLoginFields || "Email and password are required.");
        const res = await authService.login({ email: form.email.trim(), password: form.password });
        const responseData = res?.data || res;
        if (responseData?.status === "verify_otp") {
          setLoginOtpStep({
            verificationId: responseData.verificationId,
            email: responseData.email,
            expiresInMs: responseData.expiresInMs,
          });
          setOtpCode("");
          return { status: "verify_otp", action: "login" };
        }
        const userData = await persistSession(res);
        return { status: "authenticated", action: "login", user: userData };
      }

      if (!registerEnabled) throw new Error("Registration is not enabled for this shell.");
      if (!form.name || !form.email || !form.password)
        throw new Error(
          cfg.strings?.missingRegisterFields || "Please fill name, email and password.",
        );
      if (form.password !== form.confirmPassword)
        throw new Error(cfg.strings?.passwordsMismatch || "Passwords do not match.");
      if (needsSecret && adminRegistrationStep?.status !== "verified")
        throw new Error("Verify the registration OTP before continuing.");
      if (needsSecret && !/^\d{6}$/.test(form.adminPin || ""))
        throw new Error("Enter the 6 digit Admin PIN.");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || "",
        password: form.password,
        role: form.role,
        ...(needsSecret
          ? {
              adminVerificationId: adminRegistrationStep.verificationId,
              adminPin: form.adminPin,
            }
          : {}),
      };
      const res = await authService.register(payload);
      const responseData = res?.data || res;
      if (responseData?.status === "pending_approval") {
        setError(
          responseData.message ||
            "Registration submitted. Admin approval is required before login.",
        );
        setActiveTab("login");
        return { status: "pending_approval", action: "register", user: responseData.user };
      }
      const userData = await persistSession(res);
      return { status: "authenticated", action: "register", user: userData };
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Authentication failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    adminRegistrationStep,
    allowedRoles,
    authService,
    cfg,
    form,
    needsSecret,
    persistSession,
    registerEnabled,
  ]);

  const submitLoginOtp = useCallback(async () => {
    if (!loginOtpStep) return { status: "error", message: "No verification session." };
    setError(null);
    setOtpLoading(true);
    try {
      if (typeof authService?.verifyLoginOtp !== "function") {
        throw new Error("OTP login is not configured for this shell.");
      }
      const res = await authService.verifyLoginOtp({
        verificationId: loginOtpStep.verificationId,
        otp: otpCode.trim(),
      });
      const otpUserData = await persistSession(res);
      setLoginOtpStep(null);
      setOtpCode("");
      return { status: "authenticated", action: "login", user: otpUserData };
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "OTP verification failed");
      return null;
    } finally {
      setOtpLoading(false);
    }
  }, [authService, loginOtpStep, otpCode, persistSession]);

  const resendLoginOtpHandler = useCallback(async () => {
    if (!loginOtpStep) return;
    setError(null);
    setOtpMessage(null);
    setOtpLoading(true);
    try {
      if (typeof authService?.resendLoginOtp !== "function") {
        throw new Error("OTP login is not configured for this shell.");
      }
      const res = await authService.resendLoginOtp({
        verificationId: loginOtpStep.verificationId,
      });
      setOtpMessage(res?.data?.message || "New OTP generated.");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Could not resend OTP.");
    } finally {
      setOtpLoading(false);
    }
  }, [authService, loginOtpStep]);

  const refresh = useMemo(
    () => createRefreshHandler({ authService, persistSession }),
    [authService, persistSession],
  );

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    setError,
    otpLoading,
    otpMessage,
    remember,
    setRemember,
    cfg,
    cfgLoading,
    cfgError,
    form,
    setForm,
    roles,
    selectedRole,
    needsSecret,
    update,
    persistSession,
    requestRegistrationOtp,
    verifyRegistrationOtp,
    adminRegistrationStep,
    submitAuth,
    refresh,
    loginOtpStep,
    setLoginOtpStep,
    otpCode,
    setOtpCode,
    submitLoginOtp,
    resendLoginOtp: resendLoginOtpHandler,
  };
};
