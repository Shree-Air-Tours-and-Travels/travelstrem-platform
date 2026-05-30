import React, { useEffect, useState } from "react";
import { Button, SubTitle, Paragraph } from "@packages/trem-ui";

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

  const handleSendOtp = async () => {
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
      <div className="auth-modal__card">
        <div className="auth-modal__header">
          <div>
            <SubTitle text="Forgot password" />
            <Paragraph>Enter your account email and we will send a secure OTP.</Paragraph>
          </div>
        </div>
        <label className="auth-modal__label">Email</label>
        <input className="auth-modal__field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoFocus />
        {message && <div className={`auth-modal__message auth-modal__message--${variant}`}>{message}</div>}
        <div className="auth-modal__actions">
          <Button variant="text" isCircular iconLeft="x" onClick={onClose} aria-label="Close" primaryClassName="auth-modal__ghost" />
          <Button variant="solid" color="primary" text="Send OTP" onClick={handleSendOtp} disabled={loading} primaryClassName="auth-modal__primary" />
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordModal({ open, email = "", onClose, onResetSuccess, authService }) {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState("info");

  useEffect(() => {
    if (!open) return;
    setOtp("");
    setPassword("");
    setConfirm("");
    setMessage(null);
    setLoading(false);
    setResending(false);
    setVariant("info");
  }, [open]);

  usePreventScroll(open);

  const handleReset = async () => {
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
      <div className="auth-modal__card">
        <div className="auth-modal__header">
          <div>
            <SubTitle text="Reset password" />
            <Paragraph>OTP was sent to <strong>{email}</strong>.</Paragraph>
          </div>
        </div>
        <label className="auth-modal__label">One-time code</label>
        <input className="auth-modal__field" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" inputMode="numeric" autoComplete="one-time-code" />
        <label className="auth-modal__label">New password</label>
        <input className="auth-modal__field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" type="password" autoComplete="new-password" />
        <label className="auth-modal__label">Confirm password</label>
        <input className="auth-modal__field" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" type="password" autoComplete="new-password" />
        {message && <div className={`auth-modal__message auth-modal__message--${variant}`}>{message}</div>}
        <div className="auth-modal__actions">
          <Button variant="text" isCircular iconLeft="x" onClick={onClose} aria-label="Close" primaryClassName="auth-modal__ghost" />
          <Button variant="outline" color="primary" text={resending ? "Sending..." : "Resend OTP"} onClick={handleResend} disabled={loading || resending} primaryClassName="auth-modal__secondary" />
          <Button variant="solid" color="primary" text="Reset Password" type="submit" onClick={handleReset} disabled={loading} primaryClassName="auth-modal__primary" />
        </div>
      </div>
    </div>
  );
}
