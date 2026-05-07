// import React, { useState, useEffect } from "react";



// export function ResetPasswordModal({ open, email = "", onClose, onResetSuccess, api }) {
//     const [otp, setOtp] = useState("");
//     const [password, setPassword] = useState("");
//     const [confirm, setConfirm] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [message, setMessage] = useState(null);
//     const [variant, setVariant] = useState("info");

//     useEffect(() => {
//         if (open) {
//             setOtp("");
//             setPassword("");
//             setConfirm("");
//             setMessage(null);
//             setLoading(false);
//             setVariant("info");
//         }
//     }, [open]);

//     usePreventScroll(open);

//     const handleReset = async () => {
//         setMessage(null);
//         if (!otp || !password) {
//             setVariant("error");
//             setMessage("OTP and new password are required.");
//             return;
//         }
//         if (password.length < 6) {
//             setVariant("error");
//             setMessage("Password should be at least 6 characters.");
//             return;
//         }
//         if (password !== confirm) {
//             setVariant("error");
//             setMessage("Passwords do not match.");
//             return;
//         }

//         setLoading(true);
//         try {
//             const res = await api.post("/auth/reset-password", { email, otp, password });
//             setVariant("success");
//             setMessage("Password reset successful — signing you in now.");

//             const token = res?.data?.token;
//             if (token) {
//                 localStorage.setItem("auth_token", token);
//                 api.defaults.headers.common = api.defaults.headers.common || {};
//                 api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//             }

//             if (onResetSuccess) setTimeout(() => onResetSuccess(res?.data), 500);
//         } catch (err) {
//             console.error("reset error", err);
//             const msg = err?.response?.data?.message || "Invalid or expired OTP.";
//             setVariant("error");
//             setMessage(msg);
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (!open) return null;
//     return (
//         <div style={baseStyles.overlay} role="dialog" aria-modal="true" aria-label="Reset password dialog">
//             <div style={baseStyles.card}>
//                 <div style={baseStyles.headerRow}>
//                     <div>
//                         <h3 style={baseStyles.title}>Reset password</h3>
//                         <p style={baseStyles.subtitle}>OTP was sent to <strong>{email}</strong>. Enter the code and a new password to continue.</p>
//                     </div>
//                     <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(28,117,120,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>🔑</div>
//                 </div>

//                 <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
//                     <label style={{ fontSize: 13, color: COLORS.muted }}>One-time code</label>
//                     <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" style={baseStyles.field} />

//                     <label style={{ fontSize: 13, color: COLORS.muted }}>New password</label>
//                     <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" type="password" style={baseStyles.field} />

//                     <label style={{ fontSize: 13, color: COLORS.muted }}>Confirm password</label>
//                     <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" type="password" style={baseStyles.field} />

//                     {message && <div style={{ ...baseStyles.message, ...(variant === "error" ? baseStyles.error : baseStyles.success) }}>{message}</div>}

//                     <div style={baseStyles.actions}>
//                         <button style={baseStyles.ghostBtn} onClick={onClose} disabled={loading}>Close</button>
//                         <button style={baseStyles.primaryBtn} onClick={handleReset} disabled={loading}>{loading ? "Resetting…" : "Reset password"}</button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
// export default ResetPasswordModal