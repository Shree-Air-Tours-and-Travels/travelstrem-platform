import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthHeader, Button, Icon, Paragraph, Title } from "@packages/trem-ui";
import "./auth-page.scss";

const APP_PORTALS = {
  admin: "admin",
  admintrem: "admin",
  "admin-trem": "admin",
  agent: "partner",
  agenttrem: "partner",
  "agent-trem": "partner",
  partner: "partner",
  partnertrem: "partner",
  "partner-trem": "partner",
};

const ERROR_MESSAGES = {
  GOOGLE_AUTH_CANCELLED: "Google authentication was cancelled.",
  GOOGLE_AUTH_FAILED: "Unable to authenticate with Google. Please try again.",
  GOOGLE_AUTH_NOT_CONFIGURED: "Google authentication is not configured yet.",
  OAUTH_STATE_INVALID: "That login request expired. Please start again.",
  GOOGLE_ID_TOKEN_INVALID: "Google could not verify this login.",
  PORTAL_ACCESS_DENIED: "This account does not have access to this portal.",
  PORTAL_ACCOUNT_REQUIRED: "An existing portal account is required.",
};

const portalForApp = (app) => APP_PORTALS[String(app || "").toLowerCase()] || "customer";

const secondsFromMs = (value, fallbackSeconds = 0) =>
  Math.max(0, Math.ceil(Number(value || fallbackSeconds * 1000) / 1000));

const formatOtpTimer = (seconds) => {
  const value = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(value / 60);
  const remainingSeconds = value % 60;
  return minutes ? `${minutes}:${String(remainingSeconds).padStart(2, "0")}` : `${remainingSeconds}s`;
};

// Deployments sometimes configure app URLs without a scheme ("app-dev.travelstrem.com").
// `new URL(value, origin)` would then resolve them as RELATIVE PATHS on the auth
// origin (auth-dev.travelstrem.com/app-dev.travelstrem.com). Normalize here so a
// missing protocol can never turn an absolute redirect into an in-page path.
const withScheme = (entry) => {
  const value = String(entry || "").trim();
  if (!value) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
};

const clientPortalOrigins = (portal, fallbackUrl) => {
  const configured =
    portal === "admin"
      ? [withScheme(process.env.REACT_APP_ADMIN_SHELL_URL)]
      : portal === "partner"
        ? [withScheme(process.env.REACT_APP_PARTNER_SHELL_URL)]
        : [
            withScheme(process.env.REACT_APP_SHELL_URL),
            withScheme(process.env.REACT_APP_TRAVELSTREM_APP_URL),
            withScheme(process.env.REACT_APP_TREVISTA_URL),
            withScheme(process.env.REACT_APP_TREVIO_URL),
            withScheme(process.env.REACT_APP_BOOKING_ENGINE_URL),
          ];
  return new Set([
    fallbackUrl.origin,
    ...configured.flatMap((entry) => {
      try {
        return entry ? [new URL(entry).origin] : [];
      } catch {
        return [];
      }
    }),
  ]);
};

const safeClientReturnUrl = (value, fallback, portal) => {
  // Scheme-less configured URLs must resolve against their own https origin,
  // never as a relative path on the auth origin.
  const fallbackUrl = new URL(withScheme(fallback) || "/", window.location.origin);
  const allowedOrigins = clientPortalOrigins(portal, fallbackUrl);
  try {
    const resolved = new URL(value || fallbackUrl.toString(), fallbackUrl);
    return /^https?:$/.test(resolved.protocol) && allowedOrigins.has(resolved.origin)
      ? resolved.toString()
      : fallbackUrl.toString();
  } catch {
    return fallbackUrl.toString();
  }
};

const GoogleMark = () => (
  <svg className="auth-trem__google-mark" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.3c1.9-1.8 2.9-4.4 2.9-7.9Z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.8c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.9A10 10 0 0 0 12 22Z"
    />
    <path
      fill="#FBBC05"
      d="M6.4 13.7A6 6 0 0 1 6.1 12c0-.6.1-1.2.3-1.7V7.4H3A10 10 0 0 0 3 16.6l3.4-2.9Z"
    />
    <path
      fill="#EA4335"
      d="M12 6.2c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3 7.4l3.4 2.9C7.2 8 9.4 6.2 12 6.2Z"
    />
  </svg>
);

const SecretField = ({ value, onChange, placeholder, ...inputProps }) => {
  const [visible, setVisible] = useState(false);
  const label = visible ? `Hide ${placeholder.toLowerCase()}` : `Show ${placeholder.toLowerCase()}`;

  return (
    <div className="auth-trem__field-wrap">
      <input
        {...inputProps}
        className="auth-trem__field-input"
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="auth-trem__field-action"
        aria-label={label}
        title={label}
        aria-pressed={visible}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((current) => !current)}
      >
        <Icon name={visible ? "eyeSlash" : "eye"} size={18} />
      </button>
    </div>
  );
};

export default function AuthPage({
  authService,
  appName = "TravelsTREM",
  defaultRole = "member",
  registerEnabled = true,
  afterAuthPath = "/",
  theme = "light",
  onToggleTheme,
  accessRequest,
  activationToken,
}) {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestingApp = params.get("app") || "app-shell";
  const portal = portalForApp(requestingApp);
  const returnTo = safeClientReturnUrl(params.get("returnTo"), afterAuthPath, portal);
  const isCustomer = portal === "customer";
  const isAdmin = portal === "admin";
  const masterAdminEmail = String(process.env.REACT_APP_MASTER_ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const [methods, setMethods] = useState({
    directAuth: true,
    actions: {
      emailLogin: true,
      emailRegister: true,
      forgotPassword: true,
      google: false,
      mobile: false,
    },
    email: { enabled: true, login: true, register: true, forgotPassword: true },
    google: { enabled: false },
    mobile: { enabled: false, available: false },
  });
  const [screen, setScreen] = useState("methods");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => ERROR_MESSAGES[params.get("error")] || "");
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailMode, setEmailMode] = useState("login");
  const [emailForm, setEmailForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    adminOtp: "",
    adminPin: "",
  });
  const [adminRegistration, setAdminRegistration] = useState(null);
  const [emailOtpStep, setEmailOtpStep] = useState(null);
  const [resetForm, setResetForm] = useState({ otp: "", password: "", confirmPassword: "" });
  const [activationEmail, setActivationEmail] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [activationForm, setActivationForm] = useState({
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [activationRequestSent, setActivationRequestSent] = useState(false);
  const otpRef = useRef(null);
  const isMasterAdminRegistration =
    isAdmin &&
    emailMode === "register" &&
    Boolean(masterAdminEmail) &&
    emailForm.email.trim().toLowerCase() === masterAdminEmail;

  useEffect(() => {
    Promise.all([authService.getMethods(), authService.getSession().catch(() => null)])
      .then(([methodsResponse, sessionResponse]) => {
        const methodsPayload = methodsResponse?.data || methodsResponse || {};
        setMethods({
          ...methods,
          ...(methodsPayload.methods || {}),
          directAuth: methodsPayload.directAuth ?? methodsPayload.methods?.directAuth ?? true,
          actions: {
            ...(methods.actions || {}),
            ...(methodsPayload.actions || {}),
            ...(methodsPayload.methods?.actions || {}),
          },
        });
        const session = sessionResponse?.data || sessionResponse;
        if (session?.authenticated || session?.isAuthenticated) redirectAfterAuth();
      })
      .catch(() => setError("Authentication methods could not be loaded."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authService]);

  useEffect(() => {
    if (screen === "otp" || screen === "emailOtp") otpRef.current?.focus();
  }, [screen]);

  useEffect(() => {
    if (!otpExpiresIn && !resendCooldown) return undefined;
    const timer = window.setInterval(() => {
      setOtpExpiresIn((value) => Math.max(0, value - 1));
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpExpiresIn, resendCooldown]);

  useEffect(() => {
    if (!activationToken) return;
    setLoading(true);
    setScreen("activation");
    setError("");
    // Step 1: Exchange raw token for a short-lived authorization code
    authService
      .activateValidate({ token: activationToken })
      .then((validateResponse) => {
        const { code, email } = validateResponse?.data || validateResponse;
        setActivationCode(code);
        setActivationEmail(email || "");
        // Step 2: Request OTP using the code (never the raw token)
        return authService.requestActivationOtp({ code });
      })
      .then((otpResponse) => {
        const data = otpResponse?.data || otpResponse;
        setActivationRequestSent(true);
        setOtpExpiresIn(secondsFromMs(data.expiresInMs, 300));
        setResendCooldown(secondsFromMs(data.resendAfterMs, 30));
        setError(data.message || "A verification code has been sent to your email.");
      })
      .catch((err) => {
        const message =
          err?.response?.data?.message ||
          "Unable to send activation code. The link may be invalid or expired.";
        setError(message);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activationToken]);

  const redirectAfterAuth = () => window.location.replace(returnTo || afterAuthPath);

  const authActions = methods.actions || {};
  const emailMethod = methods.email || {};
  const allowDirectAuth = methods.directAuth !== false;
  const allowEmailLogin = allowDirectAuth && authActions.emailLogin !== false && emailMethod.login !== false;
  const allowEmailRegister =
    allowDirectAuth &&
    registerEnabled &&
    authActions.emailRegister !== false &&
    emailMethod.register !== false;
  const allowForgotPassword =
    allowDirectAuth && authActions.forgotPassword !== false && emailMethod.forgotPassword !== false;
  const allowGoogle = Boolean(authActions.google !== false && methods.google?.enabled);
  const allowMobile = Boolean(authActions.mobile !== false && methods.mobile?.enabled);
  const showExternalMethods = isCustomer && !activationToken && (allowGoogle || allowMobile);

  const loginWithGoogle = () => {
    setError("");
    if (!allowGoogle) {
      setError("Google authentication is not configured yet.");
      return;
    }
    window.location.assign(authService.getGoogleAuthUrl({ portal, returnTo }));
  };

  const requestOtp = async (event) => {
    event?.preventDefault();
    if (!allowMobile) {
      setError("Mobile authentication is not available.");
      setScreen("methods");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await authService.requestMobileOtp({ phoneNumber, portal });
      const data = response?.data || response;
      setChallenge(data);
      setPhoneNumber(data.phoneNumber);
      setOtpExpiresIn(Number(data.expiresIn || data.expiresInSeconds || 300));
      setResendCooldown(Number(data.resendAfter || data.resendAfterSeconds || 60));
      setScreen("otp");
    } catch (requestError) {
      const data = requestError?.response?.data || {};
      setError(
        data.message || "Mobile verification is coming soon. Please continue with Google for now.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.verifyMobileOtp({ challengeId: challenge?.challengeId, otp, portal });
      redirectAfterAuth();
    } catch (verifyError) {
      setError(
        verifyError?.response?.data?.message || "The verification code is invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const submitEmailAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (emailMode === "register") {
        if (!allowEmailRegister) throw new Error("Registration is not available.");
        if (emailForm.password !== emailForm.confirmPassword)
          throw new Error("Passwords do not match.");
        if (isMasterAdminRegistration && adminRegistration?.status !== "verified")
          throw new Error("Verify the administrator registration code first.");
        if (isMasterAdminRegistration && !/^\d{6}$/.test(emailForm.adminPin))
          throw new Error("Enter the configured 6 digit Admin PIN.");
        const response = await authService.register({
          name: emailForm.name.trim(),
          email: emailForm.email.trim(),
          phone: emailForm.phone.trim(),
          password: emailForm.password,
          role: defaultRole,
          ...(isMasterAdminRegistration
            ? {
                adminVerificationId: adminRegistration.verificationId,
                adminPin: emailForm.adminPin,
              }
            : {}),
        });
        const data = response?.data || response;
        if (data?.status === "pending_approval") {
          setEmailMode("login");
          setError(
            data.message || "Registration submitted. Sign in after your account is approved.",
          );
          return;
        }
        redirectAfterAuth();
        return;
      }

      if (!allowEmailLogin) throw new Error("Email login is not available.");
      const response = await authService.login({
        email: emailForm.email.trim(),
        password: emailForm.password,
      });
      const data = response?.data || response;
      if (data?.status === "verify_otp") {
        setEmailOtpStep({ verificationId: data.verificationId, email: data.email });
        setOtp("");
        setOtpExpiresIn(secondsFromMs(data.expiresInMs, 300));
        setResendCooldown(secondsFromMs(data.resendAfterMs, 30));
        setScreen("emailOtp");
        return;
      }
      redirectAfterAuth();
    } catch (authError) {
      setError(authError?.response?.data?.message || authError.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const requestAdminRegistrationOtp = async () => {
    if (!emailForm.email.trim() || !emailForm.phone.trim()) {
      setError("Enter the configured administrator email and mobile number first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await authService.requestAdminRegistrationOtp({
        email: emailForm.email.trim(),
        phone: emailForm.phone.trim(),
        role: "admin",
      });
      const data = response?.data || response;
      setAdminRegistration({ status: "otp_sent" });
      setOtpExpiresIn(secondsFromMs(data.expiresInMs, 300));
      setResendCooldown(secondsFromMs(data.resendAfterMs, 30));
      setError(data.message || "Registration code sent.");
    } catch (registrationError) {
      setError(
        registrationError?.response?.data?.message || "Unable to send the registration code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyAdminRegistrationOtp = async () => {
    if (!/^\d{6}$/.test(emailForm.adminOtp)) {
      setError("Enter the 6 digit registration code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await authService.verifyAdminRegistrationOtp({
        email: emailForm.email.trim(),
        phone: emailForm.phone.trim(),
        otp: emailForm.adminOtp,
      });
      const data = response?.data || response;
      setAdminRegistration({ status: "verified", verificationId: data.verificationId });
      setOtpExpiresIn(secondsFromMs(data.expiresInMs, 300));
      setError(data.message || "Registration code verified. Enter the Admin PIN.");
    } catch (registrationError) {
      setError(
        registrationError?.response?.data?.message || "Unable to verify the registration code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.verifyLoginOtp({ verificationId: emailOtpStep?.verificationId, otp });
      redirectAfterAuth();
    } catch (otpError) {
      setError(otpError?.response?.data?.message || "The verification code is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!emailForm.email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await authService.forgotPassword({ email: emailForm.email.trim() });
      const data = response?.data || response;
      setError(
        data?.message ||
          "If that email is registered, a password reset code has been sent.",
      );
      setResetForm({ otp: "", password: "", confirmPassword: "" });
      setOtpExpiresIn(secondsFromMs(data?.expiresInMs, 300));
      setResendCooldown(secondsFromMs(data?.resendAfterMs, 30));
      setScreen("resetPassword");
    } catch {
      setError("Unable to request a reset code right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    if (resetForm.password !== resetForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authService.resetPassword({
        email: emailForm.email.trim(),
        otp: resetForm.otp,
        password: resetForm.password,
      });
      redirectAfterAuth();
    } catch (resetError) {
      setError(resetError?.response?.data?.message || "The reset code is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const resendEmailLoginOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authService.resendLoginOtp({
        verificationId: emailOtpStep?.verificationId,
      });
      const data = response?.data || response;
      setOtpExpiresIn(secondsFromMs(data.expiresInMs, 300));
      setResendCooldown(secondsFromMs(data.resendAfterMs, 30));
      setError(data.message || "A new code has been sent.");
    } catch (resendError) {
      const retryAfterMs = resendError?.response?.data?.retryAfterMs;
      if (retryAfterMs) setResendCooldown(secondsFromMs(retryAfterMs));
      setError(resendError?.response?.data?.message || "Unable to resend the code.");
    } finally {
      setLoading(false);
    }
  };

  const requestActivationCode = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authService.requestActivationOtp({ code: activationCode });
      const data = response?.data || response;
      setActivationEmail(data.email || activationEmail);
      setActivationRequestSent(true);
      setOtpExpiresIn(secondsFromMs(data.expiresInMs, 300));
      setResendCooldown(secondsFromMs(data.resendAfterMs, 30));
      setError(data.message || "A verification code has been sent to your email.");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitActivation = async (event) => {
    event.preventDefault();
    if (activationForm.password !== activationForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authService.activateWithOtp({
        code: activationCode,
        otp: activationForm.otp,
        password: activationForm.password,
      });
      redirectAfterAuth();
    } catch (err) {
      setError(err?.response?.data?.message || "The code is invalid or expired. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = () => {
    const shell = process.env.REACT_APP_SHELL_URL || returnTo || "/";
    const url = new URL(shell, window.location.origin);
    url.pathname = "/";
    url.search = "?tab=overview&guest=1";
    window.location.assign(url.toString());
  };

  return (
    <>
      <AuthHeader
        config={{
          brand: {
            name: "TravelsTREM",
            subtitle: "Tours · Reservations · Experiences · Management",
          },
        }}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <main className="auth-trem">
        <div className="auth-trem__experience">
          <section className="auth-trem__company">
            <span className="auth-trem__company-eyebrow">TRAVEL, THOUGHTFULLY CONNECTED</span>
            <h1 className="auth-trem__company-title">
              One account for
              <br />
              every journey.
            </h1>
            <p className="auth-trem__company-description">
              Discover curated trips, manage reservations and keep every travel detail together with{" "}
              <strong className="auth-trem__company-description-highlight">TravelsTREM.</strong>
            </p>
            <div className="auth-trem__highlights">
              <article className="auth-trem__highlight">
                <span className="auth-trem__highlight-icon">
                  <Icon name="map" size={20} />
                </span>
                <span>
                  <strong>Curated experiences</strong>
                  <small>Thoughtfully planned adventures and holiday packages.</small>
                </span>
              </article>
              <article className="auth-trem__highlight">
                <span className="auth-trem__highlight-icon">
                  <Icon name="calendar" size={20} />
                </span>
                <span>
                  <strong>Reservations in one place</strong>
                  <small>Keep bookings, payments and travel details together.</small>
                </span>
              </article>
              <article className="auth-trem__highlight">
                <span className="auth-trem__highlight-icon">
                  <Icon name="support" size={20} />
                </span>
                <span>
                  <strong>Travel support</strong>
                  <small>Helpful guidance from our travel team.</small>
                </span>
              </article>
            </div>
          </section>

          <section className="auth-trem__access" aria-label="Account access">
            <div className="auth-trem__card">
              <Paragraph primaryClassname="auth-trem__eyebrow">{appName}</Paragraph>
              <Title
                primaryClassname="auth-trem__title"
                text={
                  screen === "otp"
                    ? "Verify your mobile"
                    : screen === "emailOtp"
                      ? "Verify your login"
                      : screen === "resetPassword"
                        ? "Reset your password"
                        : screen === "activation"
                          ? "Set your password"
                          : screen === "mobile"
                            ? "Your mobile number"
                            : "Welcome"
                }
              />
              <Paragraph primaryClassname="auth-trem__sub">
                {screen === "otp"
                  ? `We sent a verification code to ${phoneNumber}.`
                  : screen === "emailOtp"
                    ? `Enter the code sent to ${emailOtpStep?.email || "your email"}.`
                    : screen === "resetPassword"
                      ? `Enter the code sent to ${emailForm.email}.`
                      : screen === "activation"
                        ? `Enter the code sent to ${activationEmail || "your email"} and choose a password.`
                        : "Sign in or create your account securely."}
              </Paragraph>

              {error ? (
                <div className="auth-trem__error" role="alert">
                  {error}
                </div>
              ) : null}

              {screen === "methods" && showExternalMethods ? (
                <div className="auth-trem__method-list">
                  {allowGoogle ? (
                    <button
                      type="button"
                      className="auth-trem__google-button"
                      onClick={loginWithGoogle}
                      disabled={loading}
                    >
                      <GoogleMark />
                      <span>Continue with Google</span>
                    </button>
                  ) : null}
                  {allowMobile ? (
                    <Button
                      variant="outline"
                      iconLeft="phoneCall"
                      text="Continue with Mobile Number"
                      onClick={() => {
                        setError("");
                        setScreen("mobile");
                      }}
                      primaryClassName="auth-trem__mobile-button"
                    />
                  ) : null}
                  <div className="auth-trem__guest-divider">
                    <span>or use email</span>
                  </div>
                </div>
              ) : null}

              {(screen === "methods" || screen === "email") &&
              (allowEmailLogin || allowEmailRegister) ? (
                <form className="auth-trem__form auth-trem__email-form" onSubmit={submitEmailAuth}>
                  {allowEmailLogin && allowEmailRegister ? (
                    <div className="auth-trem__tabs">
                      <Button
                        variant="text"
                        type="button"
                        text="Log In"
                        onClick={() => {
                          setError("");
                          setEmailMode("login");
                        }}
                        primaryClassName={`auth-trem__tab ${emailMode === "login" ? "is-active" : ""}`}
                      />
                      <Button
                        variant="text"
                        type="button"
                        text="Register"
                        onClick={() => {
                          setError("");
                          setEmailMode("register");
                        }}
                        primaryClassName={`auth-trem__tab ${emailMode === "register" ? "is-active" : ""}`}
                      />
                    </div>
                  ) : null}
                  {emailMode === "register" ? (
                    <input
                      className="auth-trem__field"
                      autoComplete="name"
                      placeholder="Full name"
                      value={emailForm.name}
                      onChange={(event) =>
                        setEmailForm((value) => ({ ...value, name: event.target.value }))
                      }
                      required
                    />
                  ) : null}
                  <input
                    className="auth-trem__field"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Email"
                    value={emailForm.email}
                    onChange={(event) => {
                      const email = event.target.value;
                      setEmailForm((value) => ({ ...value, email, adminOtp: "", adminPin: "" }));
                      setAdminRegistration(null);
                    }}
                    required
                  />
                  {isAdmin && emailMode === "register" ? (
                    <input
                      className="auth-trem__field"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Mobile number"
                      value={emailForm.phone}
                      onChange={(event) => {
                        const phone = event.target.value;
                        setEmailForm((value) => ({ ...value, phone, adminOtp: "", adminPin: "" }));
                        setAdminRegistration(null);
                      }}
                      required
                    />
                  ) : null}
                  <SecretField
                    autoComplete={emailMode === "register" ? "new-password" : "current-password"}
                    placeholder="Password"
                    value={emailForm.password}
                    onChange={(event) =>
                      setEmailForm((value) => ({ ...value, password: event.target.value }))
                    }
                    required
                  />
                  {emailMode === "register" ? (
                    <SecretField
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      value={emailForm.confirmPassword}
                      onChange={(event) =>
                        setEmailForm((value) => ({ ...value, confirmPassword: event.target.value }))
                      }
                      required
                    />
                  ) : null}
                  {isMasterAdminRegistration ? (
                    <div className="auth-trem__secret">
                      {adminRegistration?.status !== "verified" ? (
                        <>
                          <div className="auth-trem__otp-row">
                            <input
                              className="auth-trem__field"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              placeholder="Registration code"
                              pattern="[0-9]{6}"
                              maxLength={6}
                              value={emailForm.adminOtp}
                              onChange={(event) =>
                                setEmailForm((value) => ({
                                  ...value,
                                  adminOtp: event.target.value.replace(/\D/g, "").slice(0, 6),
                                }))
                              }
                            />
                            <Button
                              variant="outline"
                              size="small"
                              type="button"
                              text={
                                adminRegistration?.status === "otp_sent"
                                  ? "Verify code"
                                  : "Send code"
                              }
                              disabled={
                                loading ||
                                (adminRegistration?.status === "otp_sent" &&
                                  (otpExpiresIn <= 0 || emailForm.adminOtp.length !== 6))
                              }
                              onClick={
                                adminRegistration?.status === "otp_sent"
                                  ? verifyAdminRegistrationOtp
                                  : requestAdminRegistrationOtp
                              }
                            />
                          </div>
                        {adminRegistration?.status === "otp_sent" ? (
                          <>
                            <div className="auth-trem__hint">
                              {otpExpiresIn > 0
                                ? `Registration code expires in ${formatOtpTimer(otpExpiresIn)}.`
                                : "Registration code expired. Send a new code."}
                            </div>
                            <Button
                              variant="text"
                              type="button"
                              text={
                                resendCooldown
                                  ? `Request another code in ${formatOtpTimer(resendCooldown)}`
                                  : "Resend registration code"
                              }
                              disabled={loading || resendCooldown > 0}
                              onClick={requestAdminRegistrationOtp}
                            />
                          </>
                        ) : null}
                        </>
                      ) : (
                        <SecretField
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="6 digit Admin PIN"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          value={emailForm.adminPin}
                          onChange={(event) =>
                            setEmailForm((value) => ({
                              ...value,
                              adminPin: event.target.value.replace(/\D/g, "").slice(0, 6),
                            }))
                          }
                          required
                        />
                      )}
                      <div className="auth-trem__hint">
                        The first master administrator must verify the configured email and mobile
                        before entering the private Admin PIN.
                      </div>
                    </div>
                  ) : null}
                  {emailMode === "login" && allowForgotPassword ? (
                    <Button
                      variant="text"
                      type="button"
                      text="Forgot password?"
                      onClick={requestPasswordReset}
                      primaryClassName="auth-trem__forgot-link"
                    />
                  ) : null}
                  <Button
                    variant="solid"
                    color="primary"
                    type="submit"
                    text={
                      loading ? "Please wait…" : emailMode === "register" ? "Register" : "Log In"
                    }
                    disabled={loading}
                    primaryClassName="auth-trem__primary"
                  />
                  {isCustomer ? (
                    <Button
                      variant="text"
                      type="button"
                      text="Continue as guest"
                      onClick={continueAsGuest}
                      primaryClassName="auth-trem__guest-link"
                    />
                  ) : null}
                </form>
              ) : null}

              {screen === "mobile" ? (
                <form className="auth-trem__form" onSubmit={requestOtp}>
                  <label className="auth-trem__mobile-label" htmlFor="mobile-number">
                    Mobile number
                  </label>
                  <div className="auth-trem__mobile-input">
                    <span>India&nbsp; +91</span>
                    <input
                      id="mobile-number"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="solid"
                    color="primary"
                    type="submit"
                    text={loading ? "Requesting code…" : "Continue"}
                    disabled={loading}
                    primaryClassName="auth-trem__primary"
                  />
                  <Button
                    variant="text"
                    type="button"
                    text="Back to sign in options"
                    onClick={() => {
                      setError("");
                      setScreen("methods");
                    }}
                    primaryClassName="auth-trem__guest-link"
                  />
                </form>
              ) : null}

              {screen === "otp" ? (
                <form className="auth-trem__form" onSubmit={verifyOtp}>
                  <label className="auth-trem__mobile-label" htmlFor="mobile-otp">
                    6-digit verification code
                  </label>
                  <input
                    ref={otpRef}
                    id="mobile-otp"
                    className="auth-trem__field auth-trem__field--otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                  <Button
                    variant="solid"
                    color="primary"
                    type="submit"
                    text={loading ? "Verifying…" : "Verify"}
                    disabled={loading || otp.length !== 6 || otpExpiresIn <= 0}
                    primaryClassName="auth-trem__primary"
                  />
                  <div className="auth-trem__hint">
                    {otpExpiresIn > 0
                      ? `Code expires in ${formatOtpTimer(otpExpiresIn)}.`
                      : "Code expired. Request a new OTP."}
                  </div>
                  {challenge?.developmentOtp ? (
                    <p className="auth-trem__dev-otp">
                      Development code: <strong>{challenge.developmentOtp}</strong>
                    </p>
                  ) : null}
                  <div className="auth-trem__otp-actions">
                    <Button
                      variant="text"
                      type="button"
                      text={
                        resendCooldown
                          ? `Request another OTP in ${formatOtpTimer(resendCooldown)}`
                          : "Resend OTP"
                      }
                      disabled={loading || resendCooldown > 0}
                      onClick={requestOtp}
                    />
                    <Button
                      variant="text"
                      type="button"
                      text="Change number"
                      onClick={() => {
                        setOtp("");
                        setError("");
                        setScreen("mobile");
                      }}
                    />
                  </div>
                </form>
              ) : null}

              {screen === "emailOtp" ? (
                <form className="auth-trem__form" onSubmit={verifyEmailOtp}>
                  <label className="auth-trem__mobile-label" htmlFor="email-login-otp">
                    6-digit verification code
                  </label>
                  <input
                    ref={otpRef}
                    id="email-login-otp"
                    className="auth-trem__field auth-trem__field--otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                  <Button
                    variant="solid"
                    color="primary"
                    type="submit"
                    text={loading ? "Verifying…" : "Verify and continue"}
                    disabled={loading || otp.length !== 6 || otpExpiresIn <= 0}
                    primaryClassName="auth-trem__primary"
                  />
                  <div className="auth-trem__hint">
                    {otpExpiresIn > 0
                      ? `Code expires in ${formatOtpTimer(otpExpiresIn)}.`
                      : "Code expired. Request a new code."}
                  </div>
                  <Button
                    variant="text"
                    type="button"
                    text={
                      resendCooldown
                        ? `Request another code in ${formatOtpTimer(resendCooldown)}`
                        : "Resend code"
                    }
                    disabled={loading || resendCooldown > 0}
                    onClick={resendEmailLoginOtp}
                  />
                  <Button
                    variant="text"
                    type="button"
                    text="Back to login"
                    onClick={() => {
                      setOtp("");
                      setError("");
                      setScreen(isCustomer ? "methods" : "email");
                    }}
                    primaryClassName="auth-trem__guest-link"
                  />
                </form>
              ) : null}

              {screen === "resetPassword" ? (
                <form className="auth-trem__form" onSubmit={submitPasswordReset}>
                  <label className="auth-trem__mobile-label" htmlFor="password-reset-otp">
                    6-digit reset code
                  </label>
                  <input
                    id="password-reset-otp"
                    className="auth-trem__field auth-trem__field--otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={resetForm.otp}
                    onChange={(event) =>
                      setResetForm((value) => ({
                        ...value,
                        otp: event.target.value.replace(/\D/g, "").slice(0, 6),
                      }))
                    }
                    required
                    autoFocus
                  />
                  <SecretField
                    autoComplete="new-password"
                    placeholder="New password"
                    value={resetForm.password}
                    onChange={(event) =>
                      setResetForm((value) => ({ ...value, password: event.target.value }))
                    }
                    required
                    minLength={8}
                  />
                  <SecretField
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={resetForm.confirmPassword}
                    onChange={(event) =>
                      setResetForm((value) => ({ ...value, confirmPassword: event.target.value }))
                    }
                    required
                    minLength={8}
                  />
                  <Button
                    variant="solid"
                    color="primary"
                    type="submit"
                    text={loading ? "Resetting…" : "Reset password"}
                    disabled={loading || resetForm.otp.length !== 6 || otpExpiresIn <= 0}
                    primaryClassName="auth-trem__primary"
                  />
                  <div className="auth-trem__hint">
                    {otpExpiresIn > 0
                      ? `Reset code expires in ${formatOtpTimer(otpExpiresIn)}.`
                      : "Reset code expired. Send another code."}
                  </div>
                  <Button
                    variant="text"
                    type="button"
                    text={
                      resendCooldown
                        ? `Request another code in ${formatOtpTimer(resendCooldown)}`
                        : "Send another code"
                    }
                    disabled={loading || resendCooldown > 0}
                    onClick={requestPasswordReset}
                  />
                  <Button
                    variant="text"
                    type="button"
                    text="Back to login"
                    onClick={() => {
                      setError("");
                      setScreen(isCustomer ? "methods" : "email");
                    }}
                    primaryClassName="auth-trem__guest-link"
                  />
                </form>
              ) : null}

              {screen === "activation" ? (
                <form className="auth-trem__form" onSubmit={submitActivation}>
                  <label className="auth-trem__mobile-label" htmlFor="activation-otp">
                    6-digit verification code
                  </label>
                  <input
                    id="activation-otp"
                    className="auth-trem__field auth-trem__field--otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={activationForm.otp}
                    onChange={(event) =>
                      setActivationForm((value) => ({
                        ...value,
                        otp: event.target.value.replace(/\D/g, "").slice(0, 6),
                      }))
                    }
                    required
                    autoFocus
                  />
                  <SecretField
                    autoComplete="new-password"
                    placeholder="Choose a password"
                    value={activationForm.password}
                    onChange={(event) =>
                      setActivationForm((value) => ({ ...value, password: event.target.value }))
                    }
                    required
                    minLength={8}
                  />
                  <SecretField
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={activationForm.confirmPassword}
                    onChange={(event) =>
                      setActivationForm((value) => ({
                        ...value,
                        confirmPassword: event.target.value,
                      }))
                    }
                    required
                    minLength={8}
                  />
                  <Button
                    variant="solid"
                    color="primary"
                    type="submit"
                    text={loading ? "Activating…" : "Activate account"}
                    disabled={
                      loading ||
                      activationForm.otp.length !== 6 ||
                      !activationRequestSent ||
                      otpExpiresIn <= 0
                    }
                    primaryClassName="auth-trem__primary"
                  />
                  <div className="auth-trem__hint">
                    {otpExpiresIn > 0
                      ? `Verification code expires in ${formatOtpTimer(otpExpiresIn)}.`
                      : "Verification code expired. Resend the code."}
                  </div>
                  <Button
                    variant="text"
                    type="button"
                    text={
                      resendCooldown
                        ? `Request another code in ${formatOtpTimer(resendCooldown)}`
                        : "Resend code"
                    }
                    disabled={loading || resendCooldown > 0}
                    onClick={requestActivationCode}
                  />
                  <Button
                    variant="text"
                    type="button"
                    text="Back to login"
                    onClick={() => {
                      setError("");
                      setScreen(isCustomer ? "methods" : "email");
                    }}
                    primaryClassName="auth-trem__guest-link"
                  />
                </form>
              ) : null}

              {accessRequest?.href && !isAdmin ? (
                <div className="auth-trem__access-request">
                  <span>{accessRequest.prompt}</span>
                  <a href={accessRequest.href}>{accessRequest.label}</a>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
