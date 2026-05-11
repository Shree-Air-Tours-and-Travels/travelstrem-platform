import React, { useEffect, useState } from "react";

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

export function ForgotPasswordModal({ open, initialEmail = "", onClose, onOtpSent, api }) {
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
      const res = await api.post("/auth/forgot-password", { email });
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
            <h3>Forgot password</h3>
            <p>Enter your account email and we will send a secure OTP.</p>
          </div>
        </div>
        <label className="auth-modal__label">Email</label>
        <input className="auth-modal__field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoFocus />
        {message && <div className={`auth-modal__message auth-modal__message--${variant}`}>{message}</div>}
        <div className="auth-modal__actions">
          <button type="button" className="auth-modal__ghost" onClick={onClose} disabled={loading}>Close</button>
          <button type="button" className="auth-modal__primary" onClick={handleSendOtp} disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordModal({ open, email = "", onClose, onResetSuccess, api }) {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState("info");

  useEffect(() => {
    if (!open) return;
    setOtp("");
    setPassword("");
    setConfirm("");
    setMessage(null);
    setLoading(false);
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
      const res = await api.post("/auth/reset-password", { email, otp, password });
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

  if (!open) return null;

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Reset password dialog">
      <div className="auth-modal__card">
        <div className="auth-modal__header">
          <div>
            <h3>Reset password</h3>
            <p>OTP was sent to <strong>{email}</strong>.</p>
          </div>
        </div>
        <label className="auth-modal__label">One-time code</label>
        <input className="auth-modal__field" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
        <label className="auth-modal__label">New password</label>
        <input className="auth-modal__field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" type="password" />
        <label className="auth-modal__label">Confirm password</label>
        <input className="auth-modal__field" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" type="password" />
        {message && <div className={`auth-modal__message auth-modal__message--${variant}`}>{message}</div>}
        <div className="auth-modal__actions">
          <button type="button" className="auth-modal__ghost" onClick={onClose} disabled={loading}>Close</button>
          <button type="button" className="auth-modal__primary" onClick={handleReset} disabled={loading}>{loading ? "Resetting..." : "Reset password"}</button>
        </div>
      </div>
    </div>
  );
}
