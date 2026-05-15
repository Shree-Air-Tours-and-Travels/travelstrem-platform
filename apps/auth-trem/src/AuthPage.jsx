import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Icon } from "@packages/trem-ui";
import { getReturnPath, useAuthFlow } from "@packages/trem-auth-core";
import { ForgotPasswordModal, ResetPasswordModal } from "./PasswordModals.jsx";
import "./auth-page.scss";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const {
    activeTab,
    setActiveTab,
    loading,
    error,
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
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await submitAuth();
    if (!result) return;
    if (result.action === "login") {
      navigate(getReturnPath(location.state, afterAuthPath), { replace: true });
      return;
    }
    navigate(afterAuthPath, { replace: true });
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
                    <button type="button" className="auth-trem__otp-button" onClick={requestRegistrationOtp} disabled={otpLoading}>
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
          <ForgotPasswordModal open initialEmail={form.email} onClose={() => setShowForgotModal(false)} onOtpSent={(email) => { setResetEmail(email); setShowForgotModal(false); setShowResetModal(true); }} authService={authService} />
        )}

        {showResetModal && (
          <ResetPasswordModal open email={resetEmail} onClose={() => setShowResetModal(false)} authService={authService} onResetSuccess={async (data) => {
            await persistSession({ data });
            setShowResetModal(false);
            navigate(afterAuthPath, { replace: true });
          }} />
        )}
      </div>
    </div>
  );
}
