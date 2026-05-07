// FILE: src/pages/AuthPage/authModals/Modals.jsx
import React, { useEffect, useState } from "react";

// Shared color tokens (match Auth palette)
const COLORS = {
    primary: "#1c7578",
    secondary: "#3bb5b9",
    accent: "#ff9900",
    danger: "#dc3545",
    muted: "#6c757d",
    bg: "#ffffff",
    overlay: "rgba(7,10,18,0.55)",
};

const baseStyles = {
    overlay: {
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COLORS.overlay,
        zIndex: 12000,
        padding: 20,
    },
    card: {
        width: "100%",
        maxWidth: 520,
        background: COLORS.bg,
        borderRadius: 14,
        padding: 20,
        boxShadow: "0 20px 60px rgba(11,22,25,0.18)",
        border: `1px solid rgba(0,0,0,0.04)`,
    },
    headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
    title: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0b0b0b" },
    subtitle: { margin: 0, color: COLORS.muted, fontSize: 13 },
    field: {
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.06)",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
    },
    actions: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 },
    primaryBtn: {
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
        color: "white",
        fontWeight: 800,
        cursor: "pointer",
    },
    ghostBtn: {
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.06)",
        background: "transparent",
        cursor: "pointer",
    },
    message: { fontSize: 13, marginTop: 8 },
    error: { color: COLORS.danger },
    success: { color: COLORS.primary },
};

// small helper to trap focus (basic)
function usePreventScroll(open) {
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => (document.body.style.overflow = "");
    }, [open]);
}

export function ForgotPasswordModal({ open, initialEmail = "", onClose, onOtpSent, api }) {
    const [email, setEmail] = useState(initialEmail || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [variant, setVariant] = useState("info");

    useEffect(() => {
        if (open) {
            setEmail(initialEmail || "");
            setMessage(null);
            setLoading(false);
            setVariant("info");
        }
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
            const serverMsg = res?.data?.message || "If that email exists, an OTP has been sent.";
            setVariant("success");
            setMessage(serverMsg);
            if (res.status === 200 && onOtpSent) {
                // small delay to let message be seen
                setTimeout(() => onOtpSent(email), 700);
            }
        } catch (err) {
            console.error("forgot password error", err);
            const msg = err?.response?.data?.message || "Failed to send OTP. Try again later.";
            setVariant("error");
            setMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;
    return (
        <div style={baseStyles.overlay} role="dialog" aria-modal="true" aria-label="Forgot password dialog">
            <div style={baseStyles.card}>
                <div style={baseStyles.headerRow}>
                    <div>
                        <h3 style={baseStyles.title}>Forgot password</h3>
                        <p style={baseStyles.subtitle}>Enter your account email and we'll send a secure OTP to reset your password.</p>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(28,117,120,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>🔒</div>
                </div>

                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 13, color: COLORS.muted }}>Email</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        style={baseStyles.field}
                        type="email"
                        autoFocus
                    />

                    {message && (
                        <div style={{ ...baseStyles.message, ...(variant === "error" ? baseStyles.error : baseStyles.success) }}>{message}</div>
                    )}

                    <div style={baseStyles.actions}>
                        <button style={{ ...baseStyles.ghostBtn, color: "teal" }} onClick={onClose} disabled={loading} aria-label="Close">
                            Close
                        </button>
                        <button style={baseStyles.primaryBtn} onClick={handleSendOtp} disabled={loading} aria-label="Send OTP">
                            {loading ? "Sending…" : "Send OTP"}
                        </button>
                    </div>
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
        if (open) {
            setOtp("");
            setPassword("");
            setConfirm("");
            setMessage(null);
            setLoading(false);
            setVariant("info");
        }
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
            setMessage("Password reset successful — signing you in now.");

            const token = res?.data?.token;
            if (token) {
                localStorage.setItem("auth_token", token);
                api.defaults.headers.common = api.defaults.headers.common || {};
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            }

            if (onResetSuccess) setTimeout(() => onResetSuccess(res?.data), 500);
        } catch (err) {
            console.error("reset error", err);
            const msg = err?.response?.data?.message || "Invalid or expired OTP.";
            setVariant("error");
            setMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;
    return (
        <div style={baseStyles.overlay} role="dialog" aria-modal="true" aria-label="Reset password dialog">
            <div style={baseStyles.card}>
                <div style={baseStyles.headerRow}>
                    <div>
                        <h3 style={baseStyles.title}>Reset password</h3>
                        <p style={baseStyles.subtitle}>OTP was sent to <strong>{email}</strong>. Enter the code and a new password to continue.</p>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(28,117,120,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>🔑</div>
                </div>

                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 13, color: COLORS.muted }}>One-time code</label>
                    <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" style={baseStyles.field} />

                    <label style={{ fontSize: 13, color: COLORS.muted }}>New password</label>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" type="password" style={baseStyles.field} />

                    <label style={{ fontSize: 13, color: COLORS.muted }}>Confirm password</label>
                    <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" type="password" style={baseStyles.field} />

                    {message && <div style={{ ...baseStyles.message, ...(variant === "error" ? baseStyles.error : baseStyles.success) }}>{message}</div>}

                    <div style={baseStyles.actions}>
                        <button style={baseStyles.ghostBtn} onClick={onClose} disabled={loading}>Close</button>
                        <button style={baseStyles.primaryBtn} onClick={handleReset} disabled={loading}>{loading ? "Resetting…" : "Reset password"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default { ForgotPasswordModal, ResetPasswordModal };
