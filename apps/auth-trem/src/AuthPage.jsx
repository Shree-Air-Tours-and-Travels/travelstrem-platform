import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Icon } from "@packages/trem-ui";
import { DEFAULT_AUTH_ROLES, filterRoles } from "./roles.js";
import { ForgotPasswordModal, ResetPasswordModal } from "./PasswordModals.jsx";
import "./auth-page.scss";

const extractToken = (res) => res?.data?.token || res?.token || res?.data?.data?.token || res?.data?.user?.token;
const extractSafeUser = (res) =>
  res?.data?.user || res?.data?.data?.user || (res?.data && typeof res.data === "object" && res.data.user) || res?.user || null;

const getReturnPath = (locationState, fallback) => {
  const from = locationState?.from;
  if (!from) return fallback;
  return `${from.pathname || fallback}${from.search || ""}${from.hash || ""}`;
};

const normalizeConfig = (remote, roleOptions, defaultRole) => ({
  defaultRole: defaultRole || remote?.defaultRole || "member",
  roles: Array.isArray(roleOptions) && roleOptions.length ? roleOptions : Array.isArray(remote?.roles) ? remote.roles : DEFAULT_AUTH_ROLES,
  socialProviders: Array.isArray(remote?.socialProviders) ? remote.socialProviders : [],
  strings: { ...(remote?.strings || {}) },
  storageKeys: {
    token: remote?.storageKeys?.token || "token",
    rememberEmail: remote?.storageKeys?.rememberMe || remote?.storageKeys?.rememberEmail || "remember_email",
  },
});

export default function AuthPage({
  api,
  authService,
  emit,
  reload,
  appName = "TravelsTREM",
  allowedRoles = ["member"],
  roleOptions,
  defaultRole = "member",
  afterAuthPath = "/",
  registerEnabled = true,
  showAdminSecret = true,
  className = "",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState(null);
  const [remember, setRemember] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [cfgLoading, setCfgLoading] = useState(true);
  const [cfgError, setCfgError] = useState(null);
  const [form, setForm] = useState(null);

  const roles = useMemo(() => {
    const configured = cfg?.roles || roleOptions || DEFAULT_AUTH_ROLES;
    return filterRoles(configured, allowedRoles);
  }, [allowedRoles, cfg?.roles, roleOptions]);

  useEffect(() => {
    let canceled = false;
    const fetchCfg = async () => {
      setCfgLoading(true);
      setCfgError(null);
      try {
        const res = await authService.getConfig();
        const remote = res?.componentData?.structure || res?.data?.componentData?.structure || res?.data?.data?.componentData?.structure;
        if (!remote) throw new Error("Invalid config format from server");
        if (!canceled) setCfg(normalizeConfig(remote, roleOptions, defaultRole));
      } catch (err) {
        if (!canceled) {
          setCfgError(err?.response?.data?.message || err.message || "Failed to load auth config");
          setCfg(normalizeConfig(null, roleOptions, defaultRole));
        }
      } finally {
        if (!canceled) setCfgLoading(false);
      }
    };
    fetchCfg();
    return () => {
      canceled = true;
    };
  }, [authService, defaultRole, roleOptions]);

  useEffect(() => {
    if (!cfg) return;
    const remembered = localStorage.getItem(cfg.storageKeys.rememberEmail);
    if (remembered) setRemember(true);
    const initialRole = roles.some((role) => role.value === cfg.defaultRole) ? cfg.defaultRole : roles[0]?.value || defaultRole;
    setForm({
      name: "",
      email: remembered || "",
      password: "",
      confirmPassword: "",
      role: initialRole,
      adminOtp: "",
    });
  }, [cfg, defaultRole, roles]);

  const update = (key) => (e) => setForm((state) => ({ ...state, [key]: e?.target?.value ?? e }));

  const selectedRole = roles.find((role) => role.value === form?.role);
  const needsSecret = Boolean(showAdminSecret && selectedRole?.requiresSecret);

  const handleRequestRegistrationOtp = async () => {
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
      });
      setOtpMessage(res?.data?.message || res?.message || "OTP generated. Check the backend console.");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Could not generate registration OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const persistSession = async (res) => {
    const token = extractToken(res);
    if (!token) throw new Error("No token from server.");
    const safeUser = extractSafeUser(res);

    localStorage.setItem(cfg.storageKeys.token, token);
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_token_key_name", cfg.storageKeys.token);
    if (safeUser) localStorage.setItem("auth_user", JSON.stringify(safeUser));
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    if (remember) localStorage.setItem(cfg.storageKeys.rememberEmail, form.email.trim());
    else localStorage.removeItem(cfg.storageKeys.rememberEmail);

    emit?.("SESSION_TOKEN_READY", { token, user: safeUser });
    await reload?.({ forceSession: true });
    return safeUser;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!cfg || !form) return setError("Configuration is still loading. Please wait.");
    if (!allowedRoles.includes(form.role)) return setError("This shell does not allow that role.");

    setLoading(true);
    try {
      if (activeTab === "login") {
        if (!form.email || !form.password) throw new Error(cfg.strings?.missingLoginFields || "Email and password are required.");
        const res = await authService.login({ email: form.email.trim(), password: form.password });
        await persistSession(res);
        navigate(getReturnPath(location.state, afterAuthPath), { replace: true });
        return;
      }

      if (!registerEnabled) throw new Error("Registration is not enabled for this shell.");
      if (!form.name || !form.email || !form.password) throw new Error(cfg.strings?.missingRegisterFields || "Please fill name, email and password.");
      if (form.password !== form.confirmPassword) throw new Error(cfg.strings?.passwordsMismatch || "Passwords do not match.");
      if (needsSecret && !form.adminOtp) throw new Error("Console OTP is required for this role.");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(needsSecret ? { adminOtp: form.adminOtp } : {}),
      };
      const res = await authService.register(payload);
      await persistSession(res);
      navigate(afterAuthPath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (cfgLoading || form === null) {
    return (
      <div className={`auth-trem ${className}`}>
        <div className="auth-trem__card auth-trem__card--center">
          <div className="auth-trem__loader">Loading authentication configuration...</div>
          {cfgError && <div className="auth-trem__config-error">Config fallback active: {cfgError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`auth-trem ${className}`}>
      <div className="auth-trem__card">
        <header className="auth-trem__header">
          <div>
            <p className="auth-trem__eyebrow">{appName}</p>
            <h2 className="auth-trem__title">{activeTab === "login" ? cfg.strings?.signInWith || "Sign in" : cfg.strings?.signUpWith || "Create account"}</h2>
            <p className="auth-trem__sub">{activeTab === "login" ? "Enter your details to continue." : "Create access for this shell."}</p>
          </div>
          <div className="auth-trem__brand-icon">
            <Icon name="shield" size={36} title="authentication" />
          </div>
        </header>

        <div className="auth-trem__tabs">
          <button type="button" className={`auth-trem__tab ${activeTab === "login" ? "is-active" : ""}`} onClick={() => setActiveTab("login")}>
            {cfg.strings?.loginButton || "Log In"}
          </button>
          {registerEnabled && (
            <button type="button" className={`auth-trem__tab ${activeTab === "register" ? "is-active" : ""}`} onClick={() => setActiveTab("register")}>
              {cfg.strings?.registerButton || "Register"}
            </button>
          )}
        </div>

        <form className="auth-trem__form" onSubmit={handleSubmit}>
          {activeTab === "register" && (
            <input className="auth-trem__field" placeholder={cfg.strings?.placeholder?.name || "Full name"} value={form.name} onChange={update("name")} required />
          )}

          <input className="auth-trem__field" type="email" placeholder={cfg.strings?.placeholder?.email || "Email"} value={form.email} onChange={update("email")} required />

          <div className="auth-trem__field-wrap">
            <input className="auth-trem__field-input" type={showPassword ? "text" : "password"} placeholder={cfg.strings?.placeholder?.password || "Password"} value={form.password} onChange={update("password")} required />
            <button type="button" className="auth-trem__field-action" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
              <Icon name={showPassword ? "eyeSlash" : "eye"} size={16} />
            </button>
          </div>

          {activeTab === "register" && (
            <>
              <div className="auth-trem__field-wrap">
                <input className="auth-trem__field-input" type={showConfirmPassword ? "text" : "password"} placeholder={cfg.strings?.placeholder?.confirmPassword || "Confirm password"} value={form.confirmPassword} onChange={update("confirmPassword")} required />
                <button type="button" className="auth-trem__field-action" onClick={() => setShowConfirmPassword((value) => !value)} aria-label="Toggle confirm password visibility">
                  <Icon name={showConfirmPassword ? "eyeSlash" : "eye"} size={16} />
                </button>
              </div>

              {roles.length > 1 && (
                <div className="auth-trem__roles">
                  {roles.map((role) => (
                    <button type="button" key={role.value} className={`auth-trem__role ${form.role === role.value ? "is-active" : ""}`} onClick={() => setForm((state) => ({ ...state, role: role.value }))}>
                      <span className="auth-trem__role-title">{role.title}</span>
                      <span className="auth-trem__role-sub">{role.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}

              {needsSecret && (
                <div className="auth-trem__secret">
                  <div className="auth-trem__otp-row">
                    <input className="auth-trem__field" type="text" inputMode="numeric" placeholder="Backend console OTP" value={form.adminOtp} onChange={update("adminOtp")} required />
                    <button type="button" className="auth-trem__otp-button" onClick={handleRequestRegistrationOtp} disabled={otpLoading}>
                      {otpLoading ? "Sending..." : "Get OTP"}
                    </button>
                  </div>
                  <div className="auth-trem__hint">Click Get OTP, then copy the code printed in the backend console.</div>
                  {otpMessage && <div className="auth-trem__otp-message">{otpMessage}</div>}
                </div>
              )}
            </>
          )}

          <div className="auth-trem__row">
            <label className="auth-trem__remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
            </label>
            <button type="button" className="auth-trem__link" onClick={() => setShowForgotModal(true)}>
              {cfg.strings?.forgotPassword || "Forgot password?"}
            </button>
          </div>

          {error && <div className="auth-trem__error" role="alert">{error}</div>}

          <button className="auth-trem__primary" type="submit" disabled={loading}>
            {loading ? cfg.strings?.processing || "Processing..." : activeTab === "login" ? cfg.strings?.loginButton || "Log In" : cfg.strings?.registerButton || "Register"}
          </button>
        </form>

        {registerEnabled && (
          <div className="auth-trem__footer">
            {activeTab === "login" ? (
              <span>Need an account? <Button onClick={() => setActiveTab("register")} text={cfg.strings?.signUp || "Sign up"} variant="text" color="primary" /></span>
            ) : (
              <span>Already have access? <Button onClick={() => setActiveTab("login")} text={cfg.strings?.loginButton || "Log In"} variant="text" color="primary" /></span>
            )}
          </div>
        )}

        {showForgotModal && (
          <ForgotPasswordModal open initialEmail={form.email} onClose={() => setShowForgotModal(false)} onOtpSent={(email) => { setResetEmail(email); setShowForgotModal(false); setShowResetModal(true); }} api={api} />
        )}

        {showResetModal && (
          <ResetPasswordModal open email={resetEmail} onClose={() => setShowResetModal(false)} api={api} onResetSuccess={async (data) => {
            await persistSession({ data });
            setShowResetModal(false);
            navigate(afterAuthPath, { replace: true });
          }} />
        )}
      </div>
    </div>
  );
}
