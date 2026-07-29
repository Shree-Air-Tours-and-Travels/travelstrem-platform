import React, { useEffect, useState } from "react";
import { Button, Icon, SubTitle, Paragraph } from "@packages/trem-ui";

const usePreventScroll = (open) => {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
};

export function ForgotPasswordModal({ open, initialEmail = "", onClose, onOtpSent, authService }) {
  const [email, setEmail] = useState(initialEmail || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState("info");

  useEffect(() => {
    if (!open) return;
    setEmail(initialEmail || "");
    setMessage(null);
    setLoading(false);
    setVariant("info");
  }, [open, initialEmail]);

  usePreventScroll(open);

  const handleSendOtp = async (event) => {
    event?.preventDefault();
    setMessage(null);
    if (!email || !email.includes("@")) {
      setVariant("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword({ email });
      setVariant("success");
      setMessage(res?.data?.message || "If that email exists, an OTP has been sent.");
      setTimeout(() => onOtpSent?.(email), 700);
    } catch (err) {
      setVariant("error");
      setMessage(err?.response?.data?.message || "Failed to send OTP. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Forgot password dialog">
      <form className="auth-modal__card" onSubmit={handleSendOtp}>
        <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Close forgot password dialog">
          <Icon name="x" size={20} />
        </button>
        <div className="auth-modal__header">
          <div>
            <SubTitle text="Forgot password" />
            <Paragraph>Enter your account email and we will send a secure OTP.</Paragraph>
          </div>
        </div>
        <label className="auth-modal__label" htmlFor="forgot-password-email">Email address</label>
        <input id="forgot-password-email" className="auth-modal__field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" autoFocus />
        {message && <div className={`auth-modal__message auth-modal__message--${variant}`} role={variant === "error" ? "alert" : "status"}>{message}</div>}
        <div className="auth-modal__actions">
          <Button variant="outline" text="Cancel" onClick={onClose} primaryClassName="auth-modal__ghost" />
          <Button variant="solid" color="primary" text={loading ? "Sending..." : "Send secure code"} type="submit" disabled={loading} primaryClassName="auth-modal__primary" />
        </div>
      </form>
    </div>
  );
}

export function ResetPasswordModal({ open, email = "", onClose, onResetSuccess, authService }) {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState("info");

  useEffect(() => {
    if (!open) return;
    setOtp("");
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setShowConfirm(false);
    setMessage(null);
    setLoading(false);
    setResending(false);
    setVariant("info");
  }, [open]);

  usePreventScroll(open);

  const handleReset = async (event) => {
    event?.preventDefault();
    setMessage(null);
    if (!otp || !password) {
      setVariant("error");
      setMessage("OTP and new password are required.");
      return;
    }
    if (password.length < 6) {
      setVariant("error");
      setMessage("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setVariant("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({ email, otp, password });
      setVariant("success");
      setMessage("Password reset successful. Signing you in now.");
      setTimeout(() => onResetSuccess?.(res?.data), 500);
    } catch (err) {
      setVariant("error");
      setMessage(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage(null);
    if (!email || !email.includes("@")) {
      setVariant("error");
      setMessage("A valid email is required before resending OTP.");
      return;
    }

    setResending(true);
    try {
      const res = await authService.forgotPassword({ email });
      setVariant("success");
      setMessage(res?.data?.message || "A new OTP has been sent.");
    } catch (err) {
      setVariant("error");
      setMessage(err?.response?.data?.message || "Could not resend OTP.");
    } finally {
      setResending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Reset password dialog">
      <form className="auth-modal__card" onSubmit={handleReset}>
        <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Close reset password dialog">
          <Icon name="x" size={20} />
        </button>
        <div className="auth-modal__header">
          <div>
            <SubTitle text="Reset password" />
            <Paragraph>OTP was sent to <strong>{email}</strong>.</Paragraph>
          </div>
        </div>
        <label className="auth-modal__label" htmlFor="reset-password-otp">One-time code</label>
        <input id="reset-password-otp" className="auth-modal__field auth-modal__field--otp" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" autoFocus />
        <label className="auth-modal__label" htmlFor="reset-password-new">New password</label>
        <div className="auth-modal__field-wrap">
          <input id="reset-password-new" className="auth-modal__field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" type={showPassword ? "text" : "password"} autoComplete="new-password" />
          <button type="button" className="auth-modal__field-action" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide new password" : "Show new password"}>
            <Icon name={showPassword ? "eyeSlash" : "eye"} size={18} />
          </button>
        </div>
        <label className="auth-modal__label" htmlFor="reset-password-confirm">Confirm password</label>
        <div className="auth-modal__field-wrap">
          <input id="reset-password-confirm" className="auth-modal__field" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your new password" type={showConfirm ? "text" : "password"} autoComplete="new-password" />
          <button type="button" className="auth-modal__field-action" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? "Hide confirmed password" : "Show confirmed password"}>
            <Icon name={showConfirm ? "eyeSlash" : "eye"} size={18} />
          </button>
        </div>
        {message && <div className={`auth-modal__message auth-modal__message--${variant}`} role={variant === "error" ? "alert" : "status"}>{message}</div>}
        <div className="auth-modal__actions">
          <Button variant="outline" color="primary" text={resending ? "Sending..." : "Resend OTP"} onClick={handleResend} disabled={loading || resending} primaryClassName="auth-modal__secondary" />
          <Button variant="solid" color="primary" text={loading ? "Resetting..." : "Reset password"} type="submit" disabled={loading} primaryClassName="auth-modal__primary" />
        </div>
      </form>
    </div>
  );
}
