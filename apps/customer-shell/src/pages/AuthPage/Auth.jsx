// FILE: src/pages/AuthPage/Auth.jsx
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import api from "../../utils/api.js"; // axios instance
import { initAuth } from "../../redux/authSlice.js";
import { useNavigate, useLocation } from "react-router-dom";

import Icon from "../../icons/Icon.jsx";
import {ForgotPasswordModal, ResetPasswordModal} from "./authModals/ForgotPasswordModal.jsx";
import { Button } from "@packages/trem-ui";

// Color tokens
const COLORS = {
    primary: "#1c7578",
    secondary: "#3bb5b9",
    tertiary: "#4e8d8e",
    accent: "#ff9900",
    success: "#28a745",
    danger: "#dc3545",
    lightBg: "#f8f9fa",
    white: "#fefefe",
    textDark: "#1c1c1c",
    textMuted: "#6c757d",
    border: "#ced4da",
};

// Helper extractors
const extractToken = (res) => res?.data?.token || res?.token || res?.data?.data?.token || res?.data?.user?.token;
const extractSafeUser = (res) =>
    res?.data?.user || res?.data?.data?.user || (res?.data && typeof res.data === "object" && res.data.user) || (res && res.user) || null;

const Auth = () => {
    const dispatch = useDispatch();
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
    const [remember, setRemember] = useState(false);
    const [cfg, setCfg] = useState(null);
    const [cfgLoading, setCfgLoading] = useState(true);
    const [cfgError, setCfgError] = useState(null);
    const [form, setForm] = useState(null);

    // fetch config
    useEffect(() => {
        let canceled = false;
        const fetchCfg = async () => {
            setCfgLoading(true);
            setCfgError(null);
            try {
                const res = await api.get("/auth/config");
                const remote = res?.data?.componentData?.structure;
                if (!remote) throw new Error("Invalid config format from server");

                const normalized = {
                    defaultRole: remote.defaultRole || "member",
                    roles: Array.isArray(remote.roles) ? remote.roles : [],
                    socialProviders: Array.isArray(remote.socialProviders) ? remote.socialProviders : [],
                    strings: { ...(remote.strings || {}) },
                    storageKeys: {
                        token: (remote.storageKeys && remote.storageKeys.token) || "token",
                        rememberEmail:
                            (remote.storageKeys && (remote.storageKeys.rememberMe || remote.storageKeys.rememberEmail)) ||
                            "remember_email",
                    },
                };

                if (!canceled) setCfg(normalized);
            } catch (err) {
                console.error("Failed to load auth config:", err);
                if (!canceled) {
                    setCfgError(err?.response?.data?.message || err.message || "Failed to load auth config");
                    setCfg(null);
                }
            } finally {
                if (!canceled) setCfgLoading(false);
            }
        };
        fetchCfg();
        return () => (canceled = true);
    }, []);

    useEffect(() => {
        if (!cfg) return;
        const remembered = localStorage.getItem(cfg.storageKeys.rememberEmail);
        if (remembered) setRemember(true);

        setForm({
            name: "",
            email: remembered || "",
            password: "",
            confirmPassword: "",
            role: cfg.defaultRole || "member",
            adminSecret: "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cfg]);

    const update = (key) => (e) => {
        if (!form) return;
        const value = e?.target?.value ?? e;
        setForm((s) => ({ ...s, [key]: value }));
    };

    const handleRememberToggle = (e) => {
        const checked = e.target.checked;
        setRemember(checked);
        if (!checked && cfg) localStorage.removeItem(cfg.storageKeys.rememberEmail);
    };

    const handleForgotPassword = () => setShowForgotModal(true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!cfg || !form) {
            setError("Configuration is still loading. Please wait.");
            return;
        }

        if (activeTab === "login") {
            if (!form.email || !form.password) {
                setError(cfg.strings?.missingLoginFields || "Email and password are required.");
                return;
            }
            setLoading(true);
            try {
                const res = await api.post(
                    "/auth/login",
                    { email: form.email.trim(), password: form.password },
                    { headers: { "Content-Type": "application/json" } }
                );
                const token = extractToken(res);
                if (!token) throw new Error("No token from server (see console).");
                const safeUser = extractSafeUser(res);

                localStorage.setItem(cfg.storageKeys.token, token);
                localStorage.setItem("auth_token", token);
                localStorage.setItem("auth_token_key_name", cfg.storageKeys.token);
                if (safeUser) localStorage.setItem("auth_user", JSON.stringify(safeUser));
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                if (remember) localStorage.setItem(cfg.storageKeys.rememberEmail, form.email.trim());
                else localStorage.removeItem(cfg.storageKeys.rememberEmail);

                await dispatch(initAuth()).unwrap();
                const dest = location.state?.from?.pathname || "/";
                navigate(dest, { replace: true });
            } catch (err) {
                console.error("[Auth] login error:", err);
                const msg = err?.response?.data?.message || err.message || "Login failed";
                setError(msg);
            } finally {
                setLoading(false);
            }
        } else {
            // register
            if (!form.name || !form.email || !form.password) {
                setError(cfg.strings?.missingRegisterFields || "Please fill name, email and password.");
                return;
            }
            if (form.password !== form.confirmPassword) {
                setError(cfg.strings?.passwordsMismatch || "Passwords do not match.");
                return;
            }
            if ((form.role === "admin" || form.role === "agent") && !form.adminSecret) {
                setError(cfg.strings?.needAdminSecret || "Admin secret required to register as admin/agent.");
                return;
            }

            setLoading(true);
            try {
                const payload = {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    role: form.role,
                    ...(form.role === "admin" || form.role === "agent" ? { adminSecret: form.adminSecret } : {}),
                };
                const res = await api.post("/auth/register", payload, { headers: { "Content-Type": "application/json" } });
                const token = extractToken(res);
                if (!token) throw new Error("No token from server (see console).");
                const safeUser = extractSafeUser(res);

                localStorage.setItem(cfg.storageKeys.token, token);
                localStorage.setItem("auth_token", token);
                localStorage.setItem("auth_token_key_name", cfg.storageKeys.token);
                if (safeUser) localStorage.setItem("auth_user", JSON.stringify(safeUser));
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                await dispatch(initAuth()).unwrap();
                navigate("/", { replace: true });
            } catch (err) {
                console.error("[Auth] register error:", err);
                const msg = err?.response?.data?.message || err.message || "Registration failed";
                setError(msg);
            } finally {
                setLoading(false);
            }
        }
    };

    // Loading state
    if (cfgLoading || form === null) {
        return (
            <div className="auth-shell">
                <style>{authCss()}</style>
                <div className="auth-card auth-card--center">
                    <div className="loader-text">Loading authentication configuration…</div>
                    {cfgError && <div className="cfg-error">Failed to load config: {cfgError}. Please try again later.</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="auth-shell">
            <style>{authCss()}</style>

            <div className="auth-card">
                <header className="auth-header">
                    <div>
                        <h2 className="auth-title">{activeTab === "login" ? cfg.strings?.signInWith || "Sign in" : cfg.strings?.signUpWith || "Create account"}</h2>
                        <p className="auth-sub">{activeTab === "login" ? "Welcome back — enter your details to continue." : "Join us — choose a role and create your account."}</p>
                    </div>
                    <div className="brand-icon">
                        <Icon name="shield" size={28} title="auth" />
                    </div>
                </header>

                <div className="auth-tabs">
                    <button className={`tab ${activeTab === "login" ? "tab--active" : ""}`} onClick={() => { setActiveTab("login"); setError(null); }}>
                        {cfg.strings?.loginButton || "Log In"}
                    </button>
                    <button className={`tab ${activeTab === "register" ? "tab--active" : ""}`} onClick={() => { setActiveTab("register"); setError(null); }}>
                        {cfg.strings?.registerButton || "Register"}
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {activeTab === "register" && (
                        <input className="field" placeholder={cfg.strings?.placeholder?.name || "Full name"} value={form.name} onChange={update("name")} required />
                    )}

                    <input className="field" type="email" placeholder={cfg.strings?.placeholder?.email || "Email or username"} value={form.email} onChange={update("email")} required />

                    <div className="field field--with-action">
                        <input className="field-input" type={showPassword ? "text" : "password"} placeholder={cfg.strings?.placeholder?.password || "Password"} value={form.password} onChange={update("password")} required />
                        <button type="button" className="field-action" onClick={() => setShowPassword((s) => !s)} aria-label="toggle password">
                            <Icon name={showPassword ? "eyeSlash" : "eye"} size={16} />
                        </button>
                    </div>

                    {activeTab === "register" && (
                        <>
                            <div className="field field--with-action">
                                <input className="field-input" type={showConfirmPassword ? "text" : "password"} placeholder={cfg.strings?.placeholder?.confirmPassword || "Confirm password"} value={form.confirmPassword} onChange={update("confirmPassword")} required />
                                <button type="button" className="field-action" onClick={() => setShowConfirmPassword((s) => !s)} aria-label="toggle confirm password">
                                    <Icon name={showConfirmPassword ? "eyeSlash" : "eye"} size={16} />
                                </button>
                            </div>

                            <div className="roles-wrap">
                                <div className="roles-intro">Choose a role</div>
                                <div className="roles-grid">
                                    <RoleCard
                                        title="Member"
                                        subtitle="Standard access"
                                        active={form.role === "member"}
                                        onClick={() => setForm((s) => ({ ...s, role: "member" }))}
                                        descriptor="Default"
                                    />

                                    <RoleCard
                                        title="Agent"
                                        subtitle="Managed listings & tools"
                                        active={form.role === "agent"}
                                        onClick={() => setForm((s) => ({ ...s, role: "agent" }))}
                                        actionLabel="Agent Login"
                                        onAction={() => { setActiveTab("login"); setError(null); }}
                                    />

                                    <RoleCard
                                        title="Admin"
                                        subtitle="Full access & settings"
                                        active={form.role === "admin"}
                                        onClick={() => setForm((s) => ({ ...s, role: "admin" }))}
                                        actionLabel="Admin Login"
                                        onAction={() => { setActiveTab("login"); setError(null); }}
                                    />
                                </div>
                            </div>

                            {(form.role === "admin" || form.role === "agent") && (
                                <div className="secret-wrap">
                                    <input className="field" type="password" placeholder={cfg.strings?.placeholder?.adminSecret || "Secret code"} value={form.adminSecret} onChange={update("adminSecret")} required />
                                    <div className="hint">{form.role === "admin" ? "Admin secret required to register as admin." : "Agent registration requires a secret code for verification."}</div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="form-row">
                        <label className="remember">
                            <input type="checkbox" checked={remember} onChange={handleRememberToggle} /> Remember me
                        </label>
                        <button type="button" className="link" onClick={handleForgotPassword}>{cfg.strings?.forgotPassword || "Forgot password?"}</button>
                    </div>

                    {error && <div className="form-error" role="alert">{error}</div>}

                    <button className="primary" type="submit" disabled={loading}>{loading ? cfg.strings?.processing || "Processing..." : activeTab === "login" ? cfg.strings?.loginButton || "Log In" : cfg.strings?.registerButton || "Register"}</button>
                </form>

                <div className="auth-footer">
                    {activeTab === "login" ? (
                        <div>Not a member? <Button onClick={() => { setActiveTab("register"); setError(null); }} text={cfg.strings?.signUp || "Sign up"} variant="text" color="primary" /></div>
                    ) : (
                        <div>Already a member? <Button onClick={() => { setActiveTab("login"); setError(null); }} text={cfg.strings?.loginButton || "Log In"} variant="text" color="primary" /></div>
                    )}
                </div>

                {showForgotModal && (
                    <ForgotPasswordModal open={showForgotModal} initialEmail={form.email} onClose={() => setShowForgotModal(false)} onOtpSent={(email) => { setResetEmail(email); setShowForgotModal(false); setShowResetModal(true); }} api={api} />
                )}

                {showResetModal && (
                    <ResetPasswordModal open={showResetModal} email={resetEmail} onClose={() => setShowResetModal(false)} api={api} onResetSuccess={async (data) => {
                        const token = data?.token;
                        const returnedUser = data?.user || data?.data?.user || null;
                        if (token) {
                            localStorage.setItem(cfg.storageKeys.token, token);
                            localStorage.setItem("auth_token", token);
                            localStorage.setItem("auth_token_key_name", cfg.storageKeys.token);
                            if (returnedUser) localStorage.setItem("auth_user", JSON.stringify(returnedUser));
                            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                            try { await dispatch(initAuth()).unwrap(); } catch (err) { }
                            setShowResetModal(false);
                            navigate("/", { replace: true });
                        }
                    }} />
                )}
            </div>
        </div>
    );
};

// RoleCard component (small, flexible & responsive)
function RoleCard({ title, subtitle, active, onClick, actionLabel, onAction, descriptor }) {
    return (
        <div className={`role-card ${active ? "role-card--active" : ""}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick && onClick()}>
            <div className="role-row">
                <div className={`dot ${active ? "dot--active" : ""}`} />
                <div>
                    <div className="role-title">{title} {descriptor && <span className="role-descriptor">{descriptor}</span>}</div>
                    <div className="role-sub">{subtitle}</div>
                </div>
            </div>
            {actionLabel ? (
                <div className="role-action-row">
                    <button type="button" className="ghost" onClick={(e) => { e.stopPropagation(); onAction && onAction(); }}>{actionLabel}</button>
                </div>
            ) : null}
        </div>
    );
}

// CSS-in-JS string with responsive rules
function authCss() {
    return `
  :root{
    --primary:${COLORS.primary};
    --secondary:${COLORS.secondary};
    --accent:${COLORS.accent};
    --text:${COLORS.textDark};
    --muted:${COLORS.textMuted};
    --card:#ffffff;
    --border:${COLORS.border};
  }

  .auth-shell{display:flex;align-items:center;justify-content:center;padding:28px;background:linear-gradient(180deg, ${COLORS.lightBg}, #fff);min-height:60vh;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial}
  .auth-card{width:920px;max-width:100%;background:var(--card);border-radius:14px;box-shadow:0 14px 50px rgba(28,117,120,0.06);border:1px solid var(--border);padding:26px;}
  .auth-card--center{max-width:520px;margin:40px auto;text-align:center}
  .brand-icon{width:56px;height:56px;border-radius:12px;background:rgba(28,117,120,0.06);display:flex;align-items:center;justify-content:center}
  .auth-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
  .auth-title{margin:0;color:var(--text);font-size:20px}
  .auth-sub{margin:4px 0 0;color:var(--muted);font-size:13px}

  .auth-tabs{display:flex;gap:10px;margin-bottom:14px}
  .tab{flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text);font-weight:700;cursor:pointer}
  .tab--active{background:linear-gradient(90deg,var(--primary),var(--secondary));color:#fff;border-color:transparent}

  .auth-form{display:flex;flex-direction:column;gap:12px}
  .field{border-radius:10px;border:1px solid var(--border);font-size:14px;outline:none}
  .field:focus{box-shadow:0 6px 18px rgba(28,117,120,0.06);border-color:var(--primary)}
  .field--with-action{position:relative}
  .field-input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid var(--border);font-size:14px}
  .field-action{position:absolute;right:20px;top:50%;transform:translateY(-50%);background:transparent;border:none;padding:6px;cursor:pointer}

  .roles-wrap{margin-top:6px}
  .roles-intro{color:var(--muted);font-size:13px;margin-bottom:8px}
  .roles-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}

  .role-card{background:transparent;border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;cursor:pointer;transition:transform 140ms ease,box-shadow 140ms ease}
  .role-card:hover{transform:translateY(-6px);box-shadow:0 12px 30px rgba(28,117,120,0.06)}
  .role-card--active{border-color:var(--primary);background:linear-gradient(180deg, rgba(28,117,120,0.04), rgba(59,181,185,0.02))}
  .role-row{display:flex;gap:12px;align-items:center}
  .dot{width:12px;height:12px;border-radius:12px;background:var(--border)}
  .dot--active{background:var(--primary)}
  .role-title{font-weight:800;color:var(--text);font-size:16px}
  .role-descriptor{font-weight:600;color:var(--muted);font-size:13px;margin-left:8px}
  .role-sub{font-size:13px;color:var(--muted);margin-top:4px}
  .role-action-row{text-align:right}
  .ghost{padding:8px 10px;border-radius:10px;border:1px dashed var(--accent);background:transparent;color:var(--accent);font-weight:700;cursor:pointer}

  .secret-wrap{display:flex;flex-direction:column;gap:6px}
  .hint{font-size:12px;color:var(--muted)}
  .form-row{display:flex;justify-content:space-between;align-items:center;margin-top:4px}
  .remember{display:flex;align-items:center;gap:8px;color:var(--muted)}
  .link{background:transparent;border:none;color:var(--secondary);cursor:pointer;font-weight:700}

  .form-error{color:${COLORS.danger};font-size:13px}
  .primary{padding:12px;border-radius:12px;border:none;background:linear-gradient(90deg,var(--primary),var(--secondary));color:#fff;font-weight:800;cursor:pointer}
  .primary:disabled{opacity:0.6;cursor:not-allowed}

  .auth-footer{margin-top:14px;color:var(--muted);text-align:center}

  .cfg-error{color:#7a2f00;background:#fff4e5;padding:10px;border-radius:8px;margin-top:10px}

  /* Responsive rules */
  @media (max-width: 880px){
    .auth-card{padding:18px}
    .roles-grid{grid-template-columns:repeat(2,1fr)}
  }
  @media (max-width: 580px){
    .auth-card{padding:16px}
    .auth-header{flex-direction:row;gap:12px}
    .auth-title{font-size:18px}
    .roles-grid{grid-template-columns:1fr}
    .auth-header{align-items:flex-start}
    .auth-card{border-radius:12px}
    .brand-icon{display:none}
    .form-row{flex-direction:column;align-items:flex-start;gap:8px}
    .tab{padding:10px 8px}
  }
`;
}

export default Auth;

