import { useCallback, useEffect, useMemo, useState } from "react";
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
  if (route.access === "roles") return Boolean(session?.isAuthenticated) && hasAuthRole(session, route.roles || []);
  if (route.access === "publicOnly") return !session?.isAuthenticated;
  return true;
};

export const normalizeBase = (raw) => {
  if (raw == null || raw === "") return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw}`.replace(/\/$/, "");
};

export const extractToken = (res) => res?.data?.token || res?.token || res?.data?.data?.token || res?.data?.user?.token;

export const extractSafeUser = (res) =>
  res?.data?.user || res?.data?.data?.user || (res?.data && typeof res.data === "object" && res.data.user) || res?.user || null;

/** @deprecated Tokens are now stored in httpOnly cookies. Kept for backward compat during migration. */
export const getStoredAuthToken = ({ storage = localStorage } = {}) => {
  if (!storage) return null;
  return storage.getItem("token") || storage.getItem("auth_token");
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
  const token = extractToken(response);
  if (!token) throw new Error("No token from server.");

  const safeUser = extractSafeUser(response);
  const rememberKey = storageKeys.rememberEmail || "remember_email";
  const tokenKey = storageKeys.token || "token";
  const userKey = storageKeys.user || "auth_user";

  storage.setItem(tokenKey, token);
  if (safeUser) storage.setItem(userKey, JSON.stringify(safeUser));
  setAuthHeader(api, token);

  if (remember) storage.setItem(rememberKey, rememberEmail);
  else storage.removeItem(rememberKey);

  emit?.("SESSION_TOKEN_READY", { token, user: safeUser });
  return { token, user: safeUser };
};

export const clearAuthSession = ({ api, storage = localStorage, storagePrefix = "" } = {}) => {
  const prefix = storagePrefix ? `${storagePrefix}:` : "";
  [prefix + "token", "token", "auth_token", prefix + "auth_user", "auth_user", "auth_token_key_name"].forEach((key) => storage?.removeItem(key));
  clearAuthHeader(api);
};

export const setupRefreshInterceptor = (api, storagePrefix = "") => {
  const prefix = storagePrefix ? `${storagePrefix}:` : "";
  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(token);
    });
    failedQueue = [];
  };

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

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post("/auth/refresh");
        const { token } = response.data;
        if (token) {
          localStorage.setItem(prefix + "token", token);
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          processQueue(null, token);
          return api(originalRequest);
        }
        throw new Error("No token in refresh response");
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthSession({ api, storagePrefix });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("USER_LOGOUT", { detail: { reason: "refresh_failed" } }));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
};

export const createRefreshHandler = ({ authService, persistSession, onRefresh } = {}) => async (payload = {}) => {
  if (!authService?.refresh) return null;
  const response = await authService.refresh(payload);
  const session = await persistSession(response);
  await onRefresh?.(session);
  return session;
};

export const createAuthApi = (base = process.env.REACT_APP_API_URL || "") => {
  const normalized = normalizeBase(base) ?? "";
  const baseURL = (normalized.endsWith("/api") ? normalized : `${normalized}/api`).replace(/([^:]\/)\/+/g, "$1");

  const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  api.interceptors.request.use((cfg) => {
    const token = getStoredAuthToken();
    if (token) {
      cfg.headers = cfg.headers || {};
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
  });

  return api;
};

export const createAuthService = (api) => ({
  getConfig: () => api.get("/auth/config"),
  requestAdminRegistrationOtp: (payload) => api.post("/auth/admin-registration-otp", payload, { headers: { "Content-Type": "application/json" } }),
  login: (payload) => api.post("/auth/login", payload, { headers: { "Content-Type": "application/json" } }),
  register: (payload) => api.post("/auth/register", payload, { headers: { "Content-Type": "application/json" } }),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload, { headers: { "Content-Type": "application/json" } }),
  resetPassword: (payload) => api.post("/auth/reset-password", payload, { headers: { "Content-Type": "application/json" } }),
  verifyLoginOtp: (payload) => api.post("/auth/verify-otp", payload, { headers: { "Content-Type": "application/json" } }),
  resendLoginOtp: (payload) => api.post("/auth/resend-otp", payload, { headers: { "Content-Type": "application/json" } }),
  refresh: (payload = {}) => api.post("/auth/refresh", payload, { headers: { "Content-Type": "application/json" } }),
});

export const getReturnPath = (locationState, fallback) => {
  const from = locationState?.from;
  if (!from) return fallback;
  return `${from.pathname || fallback}${from.search || ""}${from.hash || ""}`;
};

export const normalizeAuthConfig = (remote, roleOptions, defaultRole, storagePrefix = "") => {
  const prefix = storagePrefix ? `${storagePrefix}:` : "";
  return ({
  defaultRole: defaultRole || remote?.defaultRole || "member",
  roles: Array.isArray(roleOptions) && roleOptions.length ? roleOptions : Array.isArray(remote?.roles) ? remote.roles : DEFAULT_AUTH_ROLES,
  socialProviders: Array.isArray(remote?.socialProviders) ? remote.socialProviders : [],
  strings: { ...(remote?.strings || {}) },
  storageKeys: {
    token: remote?.storageKeys?.token || `${prefix}token`,
    user: remote?.storageKeys?.user || `${prefix}auth_user`,
    rememberEmail: remote?.storageKeys?.rememberMe || remote?.storageKeys?.rememberEmail || `${prefix}remember_email`,
  },
  });
};

export const extractAuthConfig = (res) =>
  res?.componentData?.structure || res?.data?.componentData?.structure || res?.data?.data?.componentData?.structure;

export const useAuthConfig = ({ authService, roleOptions, defaultRole, storagePrefix = "" } = {}) => {
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
  const [remember, setRemember] = useState(false);
  const [form, setForm] = useState(null);
  const [loginOtpStep, setLoginOtpStep] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const { cfg, cfgLoading, cfgError } = useAuthConfig({ authService, roleOptions, defaultRole, storagePrefix });

  const roles = useMemo(() => {
    const configured = cfg?.roles || roleOptions || DEFAULT_AUTH_ROLES;
    return filterRoles(configured, allowedRoles);
  }, [allowedRoles, cfg?.roles, roleOptions]);

  useEffect(() => {
    if (!cfg) return;
    const remembered = localStorage.getItem(cfg.storageKeys.rememberEmail);
    if (remembered) setRemember(true);
    const initialRole = roles.some((role) => role.value === cfg.defaultRole) ? cfg.defaultRole : roles[0]?.value || defaultRole;
    setForm({
      name: "",
      email: remembered || "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: initialRole,
      adminOtp: "",
    });
  }, [cfg, defaultRole, roles]);

  const update = useCallback((key) => (e) => setForm((state) => ({ ...state, [key]: e?.target?.value ?? e })), []);

  const selectedRole = roles.find((role) => role.value === form?.role);
  const needsSecret = Boolean(
    showAdminSecret &&
      (selectedRole?.requiresSecret ||
        (selectedRole?.requiresSecretForEmail &&
          form?.email?.trim().toLowerCase() === String(selectedRole.requiresSecretForEmail).trim().toLowerCase()))
  );

  const persistSession = useCallback(async (response) => {
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
  }, [api, cfg?.storageKeys, emit, form?.email, reload, remember]);

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
      setOtpMessage(res?.data?.message || res?.message || "Registration OTP generated.");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Could not generate registration OTP.");
    } finally {
      setOtpLoading(false);
    }
  }, [authService, form?.email, form?.role]);

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
        if (!form.email || !form.password) throw new Error(cfg.strings?.missingLoginFields || "Email and password are required.");
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
      if (!form.name || !form.email || !form.password) throw new Error(cfg.strings?.missingRegisterFields || "Please fill name, email and password.");
      if (form.password !== form.confirmPassword) throw new Error(cfg.strings?.passwordsMismatch || "Passwords do not match.");
      if (needsSecret && !form.adminOtp) throw new Error("Console OTP is required for this role.");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || "",
        password: form.password,
        role: form.role,
        ...(needsSecret ? { adminOtp: form.adminOtp } : {}),
      };
      const res = await authService.register(payload);
      const responseData = res?.data || res;
      if (responseData?.status === "pending_approval") {
        setError(responseData.message || "Registration submitted. Admin approval is required before login.");
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
  }, [activeTab, allowedRoles, authService, cfg, form, needsSecret, persistSession, registerEnabled]);

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

  const refresh = useMemo(() => createRefreshHandler({ authService, persistSession }), [authService, persistSession]);

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
