import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Icon, Title, Paragraph } from "@packages/trem-ui";
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
            <Paragraph primaryClassname="auth-trem__eyebrow">{appName}</Paragraph>
            <Title primaryClassname="auth-trem__title" text={activeTab === "login" ? cfg.strings?.signInWith || "Sign in" : cfg.strings?.signUpWith || "Create account"} />
            <Paragraph primaryClassname="auth-trem__sub">{activeTab === "login" ? "Enter your details to continue." : "Create access for this shell."}</Paragraph>
          </div>
          <div className="auth-trem__brand-icon">
            <Icon name="shield" size={36} title="authentication" />
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
            <input className="auth-trem__field" placeholder={cfg.strings?.placeholder?.name || "Full name"} value={form.name} onChange={update("name")} required />
          )}

          <input className="auth-trem__field" type="email" placeholder={cfg.strings?.placeholder?.email || "Email"} value={form.email} onChange={update("email")} required />

          <div className="auth-trem__field-wrap">
            <input className="auth-trem__field-input" type={showPassword ? "text" : "password"} placeholder={cfg.strings?.placeholder?.password || "Password"} value={form.password} onChange={update("password")} required />
            <Button variant="text" iconLeft={showPassword ? "eyeSlash" : "eye"} iconSize={16} onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility" primaryClassName="auth-trem__field-action" />
          </div>

          {activeTab === "register" && (
            <>
              <div className="auth-trem__field-wrap">
                <input className="auth-trem__field-input" type={showConfirmPassword ? "text" : "password"} placeholder={cfg.strings?.placeholder?.confirmPassword || "Confirm password"} value={form.confirmPassword} onChange={update("confirmPassword")} required />
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
                    <input className="auth-trem__field" type="text" inputMode="numeric" placeholder="Backend console OTP" value={form.adminOtp} onChange={update("adminOtp")} required />
                    <Button variant="outline" size="small" text={otpLoading ? "Sending..." : "Get OTP"} onClick={requestRegistrationOtp} disabled={otpLoading} primaryClassName="auth-trem__otp-button" />
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
            <Button variant="text" text={cfg.strings?.forgotPassword || "Forgot password?"} onClick={() => setShowForgotModal(true)} primaryClassName="auth-trem__link" />
          </div>

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
            navigate(afterAuthPath, { replace: true });
          }} />
        )}
      </div>
    </div>
  );
}
