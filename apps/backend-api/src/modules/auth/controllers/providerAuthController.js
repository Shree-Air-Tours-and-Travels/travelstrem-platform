import config from "../../../config/index.js";
import { normalizePortalScope } from "../../../core/auth/portalSession.js";
import { beginGoogleAuthentication, completeGoogleAuthentication } from "../services/googleAuth.service.js";
import { requestMobileOtp, verifyMobileOtp } from "../services/mobileAuth.service.js";
import { createSession } from "../services/session.service.js";
import { authFailureUrl } from "../services/returnUrl.service.js";
import { mobileOtpProvider } from "../providers/mobile/index.js";

const noStore = (res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");
};

const sendError = (res, error, fallbackCode = "AUTH_FAILED") => {
  const status = Number(error?.status) || 500;
  return res.status(status).json({
    status: "error",
    code: error?.code || fallbackCode,
    message: status >= 500 ? (error?.code ? error.message : "Authentication is temporarily unavailable.") : error.message,
  });
};

export const getAuthMethods = (_req, res) => {
  noStore(res);
  return res.json({
    status: "success",
    methods: {
      google: { enabled: Boolean(config.GOOGLE_AUTH_ENABLED && config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) },
      mobile: {
        enabled: Boolean(config.MOBILE_AUTH_ENABLED),
        available: Boolean(mobileOtpProvider.available),
      },
    },
  });
};

export const startGoogle = async (req, res) => {
  noStore(res);
  try {
    const authorizationUrl = await beginGoogleAuthentication({
      portal: req.query.portal || req.query.app || "customer",
      returnTo: req.query.returnTo,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.redirect(302, authorizationUrl);
  } catch (error) {
    return sendError(res, error, "GOOGLE_AUTH_FAILED");
  }
};

export const googleCallback = async (req, res) => {
  noStore(res);
  let portal = normalizePortalScope(req.query.portal || "customer");
  try {
    if (req.query.error) throw Object.assign(new Error("Google authentication was cancelled."), { code: "GOOGLE_AUTH_CANCELLED", status: 400 });
    const result = await completeGoogleAuthentication({ state: req.query.state, code: req.query.code });
    portal = result.portal;
    req.authPortalOverride = portal;
    await createSession({ user: result.user, req, res, portal });
    return res.redirect(303, result.returnTo);
  } catch (error) {
    return res.redirect(303, authFailureUrl({ portal, code: error?.code || "GOOGLE_AUTH_FAILED" }));
  }
};

export const requestOtp = async (req, res) => {
  noStore(res);
  try {
    const portal = getRequestPortal(req);
    const result = await requestMobileOtp({ phoneNumber: req.body?.phoneNumber, portal, ipAddress: req.ip });
    return res.status(201).json({ status: "success", ...result });
  } catch (error) {
    return sendError(res, error, "MOBILE_OTP_REQUEST_FAILED");
  }
};

export const verifyOtp = async (req, res) => {
  noStore(res);
  try {
    const portal = getRequestPortal(req);
    const result = await verifyMobileOtp({ challengeId: req.body?.challengeId, otp: req.body?.otp, portal });
    const session = await createSession({ user: result.user, req, res, portal });
    return res.json(session);
  } catch (error) {
    return sendError(res, error, "INVALID_OTP");
  }
};

const getRequestPortal = (req) => normalizePortalScope(req.headers["x-travelstrem-portal"] || req.body?.portal || "customer");
