import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthHeader, Button, Icon, Preloader, Title, Paragraph } from "@packages/trem-ui";
import { getReturnPath, useAuthFlow } from "@packages/trem-auth-core";
import { ForgotPasswordModal, ResetPasswordModal } from "./PasswordModals.jsx";
import "./auth-page.scss";

const ALLOWED_RETURN_ORIGINS = String(process.env.REACT_APP_ALLOWED_RETURN_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, "").toLowerCase())
  .filter(Boolean);

const CONFIGURED_PRODUCT_RETURN_URLS = {
  trevio: process.env.REACT_APP_TREVIO_URL || "",
  trevista: process.env.REACT_APP_TREVISTA_URL || "",
  dashboard: process.env.REACT_APP_DASHBOARD_URL || "",
  booking: process.env.REACT_APP_BOOKING_ENGINE_URL || "",
  "booking-engine": process.env.REACT_APP_BOOKING_ENGINE_URL || "",
  admin: process.env.REACT_APP_ADMIN_SHELL_URL || "",
};

const isSafeReturnUrl = (value = "") => {
  if (!value) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return ALLOWED_RETURN_ORIGINS.includes(url.origin.toLowerCase());
  } catch (error) {
    return false;
  }
};

const PRODUCT_HOST_LABELS = {
  trevio: ["trevio"],
  trevista: ["trevista"],
  dashboard: ["dashboard"],
  booking: ["booking"],
  "booking-engine": ["booking"],
  admin: ["admin"],
};

const getAllowedProductReturnUrl = (app = "") => {
  const configured = CONFIGURED_PRODUCT_RETURN_URLS[app] || "";
  if (isSafeReturnUrl(configured)) return configured;

  const labels = PRODUCT_HOST_LABELS[app] || [];
  if (!labels.length) return "";

  return ALLOWED_RETURN_ORIGINS.find((origin) => {
    try {
      const hostname = new URL(origin).hostname.toLowerCase();
      return labels.some((label) => hostname === label || hostname.startsWith(`${label}.`));
    } catch (error) {
      return false;
    }
  }) || "";
};

const getSafeReferrer = () => {
  if (typeof document === "undefined") return "";
  return isSafeReturnUrl(document.referrer) ? document.referrer : "";
};

function AuthExperience({ cfg, theme, onToggleTheme, headerBrand, children, loading = false, className = "" }) {
  const company = cfg?.company || {};
  const headerConfig = {
    ...(cfg?.header || {}),
    brand: {
      ...(cfg?.header?.brand || {}),
      ...(headerBrand || {}),
    },
  };

  return (
    <>
      <AuthHeader config={headerConfig} theme={theme} onToggleTheme={onToggleTheme} />
      <main className={`auth-trem${className ? ` ${className}` : ""}`}>
        <div className={`auth-trem__experience${loading ? " auth-trem__experience--loading" : ""}`}>
          {!loading && (
            <section className="auth-trem__company" aria-label={company.title || "About TravelsTREM"}>
              <Paragraph primaryClassname="auth-trem__company-eyebrow">
                {company.eyebrow}
              </Paragraph>
              <Title
                primaryClassname="auth-trem__company-title"
                text={company.title}
              />
              <Paragraph primaryClassname="auth-trem__company-description">
                {company.description}{" "}
                {company.descriptionHighlight && (
                  <strong className="auth-trem__company-description-highlight">
                    {company.descriptionHighlight}
                  </strong>
                )}
              </Paragraph>

              <div className="auth-trem__highlights">
                {(company.highlights || []).map((item) => (
                  <article className="auth-trem__highlight" key={item.title}>
                    <span className="auth-trem__highlight-icon">
                      <Icon name={item.icon || "sparkles"} size={20} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                  </article>
                ))}
              </div>

              {(company.businessName || company.location) && (
                <Paragraph primaryClassname="auth-trem__business">
                  {[company.businessName, company.location].filter(Boolean).join(" · ")}
                </Paragraph>
              )}
            </section>
          )}
          <section className="auth-trem__access" aria-label="Account access">
            {children}
          </section>
        </div>
      </main>
    </>
  );
}

export default function AuthPage({
  api,
  authService,
  emit,
  reload,
  appName = "TravelsTrem",
  allowedRoles = ["member"],
  roleOptions,
  defaultRole = "member",
  afterAuthPath = "/",
  registerEnabled = true,
  showAdminSecret = true,
  otpLoginEnabled = false,
  adminShellUrl = "",
  authStoragePrefix = "",
  className = "",
  theme = "light",
  onToggleTheme,
  headerBrand,
  formNotice = "",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [guestCheckLoading, setGuestCheckLoading] = useState(true);
  const {
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
    needsSecret,
    update,
    persistSession,
    requestRegistrationOtp,
    submitAuth,
    loginOtpStep,
    setLoginOtpStep,
    otpCode,
    setOtpCode,
    submitLoginOtp,
    resendLoginOtp,
  } = useAuthFlow({
    api,
    authService,
    emit,
    reload,
    allowedRoles,
    roleOptions,
    defaultRole,
    registerEnabled,
    showAdminSecret,
    otpLoginEnabled,
    storagePrefix: authStoragePrefix,
  });

  const isAdminRole = (role) => role && ["admin", "agent", "super_admin", "superadmin"].includes(String(role).toLowerCase());
  const searchParams = new URLSearchParams(location.search);
  const queryReturnTo = searchParams.get("returnTo") || "";
  const requestingApp = (searchParams.get("app") || "").trim().toLowerCase();

  React.useEffect(() => {
    const mode = (searchParams.get("mode") || "").toLowerCase();
    if (registerEnabled && ["register", "signup", "sign-up"].includes(mode)) {
      setActiveTab("register");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, registerEnabled]);

  React.useEffect(() => {
    const rememberKey = cfg?.storageKeys?.rememberEmail;
    if (!rememberKey || form === null) return;
    if (remember && form.email?.trim()) {
      localStorage.setItem(rememberKey, form.email.trim());
    } else if (!remember) {
      localStorage.removeItem(rememberKey);
    }
  }, [cfg?.storageKeys?.rememberEmail, form, remember]);

  const resolveReturnDestination = () => {
    if (isSafeReturnUrl(queryReturnTo)) return queryReturnTo;

    const productReturnUrl = getAllowedProductReturnUrl(requestingApp);
    if (productReturnUrl) return productReturnUrl;

    if (requestingApp) {
      const referrer = getSafeReferrer();
      if (referrer) return referrer;
      return "";
    }

    return getReturnPath(location.state, afterAuthPath);
  };

  React.useEffect(() => {
    let cancelled = false;
    const checkExistingSession = async () => {
      setGuestCheckLoading(true);
      try {
        const response = await authService.getSession?.();
        const session = response?.data || response;
        if (!cancelled && (session?.authenticated || session?.isAuthenticated || session?.user)) {
          const nextPath = resolveReturnDestination();
          if (/^https?:\/\//i.test(nextPath)) window.location.replace(nextPath);
          else navigate(nextPath || afterAuthPath || "/", { replace: true });
          return;
        }
      } catch (error) {
        // Unauthenticated users should see the auth page.
      } finally {
        if (!cancelled) setGuestCheckLoading(false);
      }
    };
    checkExistingSession();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authService, location.search]);

  const redirectAfterLogin = (result) => {
    if (adminShellUrl && result?.user && isAdminRole(result.user.role)) {
      window.location.replace(adminShellUrl);
      return;
    }
    const nextPath = resolveReturnDestination();

    if (!nextPath) {
      setError(`Signed in successfully, but the return URL for "${requestingApp}" is not configured.`);
      return;
    }

    if (/^https?:\/\//i.test(nextPath)) {
      window.location.replace(nextPath);
      return;
    }

    navigate(nextPath, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await submitAuth();
    if (!result) return;
    if (result.status === "verify_otp") return;
    if (result.status === "pending_approval") return;
    redirectAfterLogin(result);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const result = await submitLoginOtp();
    if (!result) return;
    redirectAfterLogin(result);
  };

  const handleOtpBack = () => {
    setLoginOtpStep(null);
    setOtpCode("");
    setError(null);
  };

  if (guestCheckLoading || cfgLoading || form === null) {
    return (
      <AuthExperience cfg={cfg} theme={theme} onToggleTheme={onToggleTheme} headerBrand={headerBrand} loading className={className}>
        <div className="auth-trem__card auth-trem__card--center">
          <Preloader variant="cards" count={2} label="Loading authentication" />
          {cfgError && <div className="auth-trem__config-error">Config fallback active: {cfgError}</div>}
        </div>
      </AuthExperience>
    );
  }

  if (loginOtpStep) {
    return (
      <AuthExperience cfg={cfg} theme={theme} onToggleTheme={onToggleTheme} headerBrand={headerBrand} className={className}>
        <div className="auth-trem__card auth-trem__card--otp">
          <header className="auth-trem__header">
            <div>
              <Paragraph primaryClassname="auth-trem__eyebrow">{appName}</Paragraph>
              <Title primaryClassname="auth-trem__title" text="Verify your login" />
              <Paragraph primaryClassname="auth-trem__sub">
                Enter the OTP sent to {loginOtpStep.email}.
              </Paragraph>
            </div>
          </header>

          <form className="auth-trem__form" onSubmit={handleOtpSubmit}>
            <label className="auth-trem__otp-label" htmlFor="auth-login-otp">
              Verification code
            </label>
            <input
              id="auth-login-otp"
              className="auth-trem__field auth-trem__field--otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              enterKeyHint="done"
              aria-describedby="auth-login-otp-hint"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
            />
            <p className="auth-trem__otp-hint" id="auth-login-otp-hint">
              Enter the six-digit code from your email.
            </p>

            {error && <div className="auth-trem__error" role="alert">{error}</div>}
            {otpMessage && <div className="auth-trem__otp-message">{otpMessage}</div>}

            <Button
              variant="solid"
              color="primary"
              type="submit"
              text={otpLoading ? "Verifying..." : "Verify & Sign In"}
              disabled={otpLoading || otpCode.trim().length !== 6}
              primaryClassName="auth-trem__primary"
            />

            <div className="auth-trem__otp-actions">
              <Button
                variant="text"
                text="Back to login"
                iconLeft="arrowLeft"
                onClick={handleOtpBack}
                primaryClassName="auth-trem__link"
              />
              <Button
                variant="text"
                text={otpLoading ? "Sending..." : "Resend code"}
                onClick={resendLoginOtp}
                disabled={otpLoading}
                primaryClassName="auth-trem__link"
              />
            </div>
          </form>
        </div>
      </AuthExperience>
    );
  }

  return (
    <AuthExperience cfg={cfg} theme={theme} onToggleTheme={onToggleTheme} headerBrand={headerBrand} className={className}>
      <div className="auth-trem__card">
        {formNotice ? (
          <div className="auth-trem__form-notice" role="alert">
            <Icon name="alertTriangle" size={18} />
            <span>{formNotice}</span>
          </div>
        ) : null}
        <header className="auth-trem__header">
          <div>
            <Paragraph primaryClassname="auth-trem__eyebrow">{appName}</Paragraph>
            <Title primaryClassname="auth-trem__title" text={activeTab === "login" ? cfg.strings?.signInWith || "Sign in" : cfg.strings?.signUpWith || "Create account"} />
            <Paragraph primaryClassname="auth-trem__sub">{activeTab === "login" ? "Enter your details to continue." : "Create access for this shell."}</Paragraph>
          </div>
        </header>

        <div className="auth-trem__tabs">
          <Button variant="text" text={cfg.strings?.loginButton || "Log In"} onClick={() => setActiveTab("login")} primaryClassName={`auth-trem__tab ${activeTab === "login" ? "is-active" : ""}`} />
          {registerEnabled && (
            <Button variant="text" text={cfg.strings?.registerButton || "Register"} onClick={() => setActiveTab("register")} primaryClassName={`auth-trem__tab ${activeTab === "register" ? "is-active" : ""}`} />
          )}
        </div>

        <form className="auth-trem__form" onSubmit={handleSubmit}>
          {activeTab === "register" && (
            <input className="auth-trem__field" name="name" autoComplete="name" placeholder={cfg.strings?.placeholder?.name || "Full name"} value={form.name} onChange={update("name")} required />
          )}

          <input className="auth-trem__field" name="email" type="email" inputMode="email" autoCapitalize="none" autoComplete="email" placeholder={cfg.strings?.placeholder?.email || "Email"} value={form.email} onChange={update("email")} required />

          {activeTab === "register" && form.role === "admin" && (
            <input className="auth-trem__field" type="tel" placeholder="Mobile number" value={form.phone || ""} onChange={update("phone")} />
          )}

          <div className="auth-trem__field-wrap">
            <input className="auth-trem__field-input" name="password" type={showPassword ? "text" : "password"} autoComplete={activeTab === "register" ? "new-password" : "current-password"} placeholder={cfg.strings?.placeholder?.password || "Password"} value={form.password} onChange={update("password")} required />
            <Button variant="text" iconLeft={showPassword ? "eyeSlash" : "eye"} iconSize={16} onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility" primaryClassName="auth-trem__field-action" />
          </div>

          {activeTab === "register" && (
            <>
              <div className="auth-trem__field-wrap">
                <input className="auth-trem__field-input" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder={cfg.strings?.placeholder?.confirmPassword || "Confirm password"} value={form.confirmPassword} onChange={update("confirmPassword")} required />
                <Button variant="text" iconLeft={showConfirmPassword ? "eyeSlash" : "eye"} iconSize={16} onClick={() => setShowConfirmPassword((value) => !value)} aria-label="Toggle confirm password visibility" primaryClassName="auth-trem__field-action" />
              </div>

              {roles.length > 1 && (
                <div className="auth-trem__roles">
                  {roles.map((role) => (
                    <div key={role.value} className={`auth-trem__role ${form.role === role.value ? "is-active" : ""}`} onClick={() => setForm((state) => ({ ...state, role: role.value }))} role="button" tabIndex={0}>
                      <span className="auth-trem__role-title">{role.title}</span>
                      <span className="auth-trem__role-sub">{role.subtitle}</span>
                    </div>
                  ))}
                </div>
              )}

              {needsSecret && (
                <div className="auth-trem__secret">
                  <div className="auth-trem__otp-row">
                    <input
                      className="auth-trem__field"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="Registration OTP"
                      value={form.adminOtp}
                      onChange={(event) => setForm((state) => ({
                        ...state,
                        adminOtp: event.target.value.replace(/\D/g, "").slice(0, 6),
                      }))}
                      required
                    />
                    <Button variant="outline" size="small" text={otpLoading ? "Sending..." : "Get OTP"} onClick={requestRegistrationOtp} disabled={otpLoading} primaryClassName="auth-trem__otp-button" />
                  </div>
                  <div className="auth-trem__hint">Enter the OTP from the registration record.</div>
                  {otpMessage && <div className="auth-trem__otp-message">{otpMessage}</div>}
                </div>
              )}
            </>
          )}

          {activeTab === "login" && (
            <div className="auth-trem__row">
              <label className="auth-trem__remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
              </label>
              <Button variant="text" text={cfg.strings?.forgotPassword || "Forgot password?"} onClick={() => setShowForgotModal(true)} primaryClassName="auth-trem__link" />
            </div>
          )}

          {error && <div className="auth-trem__error" role="alert">{error}</div>}

          <Button variant="solid" color="primary" type="submit" text={loading ? cfg.strings?.processing || "Processing..." : activeTab === "login" ? cfg.strings?.loginButton || "Log In" : cfg.strings?.registerButton || "Register"} disabled={loading} primaryClassName="auth-trem__primary" />
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
          <ForgotPasswordModal open initialEmail={form.email} onClose={() => setShowForgotModal(false)} onOtpSent={(email) => { setResetEmail(email); setShowForgotModal(false); setShowResetModal(true); }} authService={authService} />
        )}

        {showResetModal && (
          <ResetPasswordModal open email={resetEmail} onClose={() => setShowResetModal(false)} authService={authService} onResetSuccess={async (data) => {
            await persistSession({ data });
            setShowResetModal(false);
            redirectAfterLogin(data);
          }} />
        )}
      </div>
    </AuthExperience>
  );
}
