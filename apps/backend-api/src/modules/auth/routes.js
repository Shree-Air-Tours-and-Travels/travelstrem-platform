// modules/auth/routes.js
import express from "express";
import * as controller from "./controllers/authController.js";
import * as profileController from "./controllers/profileController.js";
import authMiddleware from "../../shared/auth/middleware.js";
import { validateLogin, validateRegister } from "./validators/create.validation.js";
import rateLimit from "express-rate-limit";
import * as providerAuthController from "./controllers/providerAuthController.js";
import config from "../../config/index.js";

const router = express.Router();
const trustedOrigins = new Set(
    (config.FRONTENDS || []).flatMap((value) => {
        try {
            return [new URL(value).origin];
        } catch {
            return [];
        }
    }),
);
const requireTrustedOrigin = (req, res, next) => {
    const origin = req.get("origin");
    if (
        !origin ||
        trustedOrigins.has(origin) ||
        (config.IS_DEVELOPMENT && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin))
    )
        return next();
    return res.status(403).json({
        status: "error",
        code: "UNTRUSTED_ORIGIN",
        message: "Request origin is not allowed.",
    });
};

// serve auth configuration to frontend
router.get("/config", controller.getAuthConfig);
router.get("/methods", providerAuthController.getAuthMethods);

/*
  Public auth endpoints
*/
router.post("/register", requireTrustedOrigin, validateRegister, controller.register);
router.post("/login", requireTrustedOrigin, validateLogin, controller.login);
router.post("/verify-otp", requireTrustedOrigin, controller.verifyLoginOtp);
router.post("/resend-otp", requireTrustedOrigin, controller.resendLoginOtp);
router.post(
    "/admin-registration-otp",
    requireTrustedOrigin,
    controller.requestAdminRegistrationOtp,
);
router.post(
    "/verify-admin-registration-otp",
    requireTrustedOrigin,
    controller.verifyAdminRegistrationOtp,
);
router.post("/partner-agencies/apply", controller.applyPartnerAgency);
router.get("/partner-agencies/check", controller.checkPartnerAgency);
router.get("/partner-agencies", authMiddleware, controller.listPartnerAgencies);
router.post("/partner-agencies/:id/review", authMiddleware, controller.reviewPartnerAgency);
router.get("/agents", authMiddleware, controller.listAgents);
router.post("/agents/:id/review", authMiddleware, controller.reviewAgent);
router.get("/admins", authMiddleware, controller.listAdmins);
router.post("/admins/:id/review", authMiddleware, controller.reviewAdmin);
router.post("/admins/:id/remove", authMiddleware, controller.removeAdmin);
router.patch("/admins/:id/internal-team", authMiddleware, controller.updateAdminInternalTeam);

/*
  Password reset flow
  - POST /forgot-password  { email }        -> sends reset email (generic response)
  - POST /reset-password   { email, otp, password } -> resets password and logs user in
*/
router.post("/forgot-password", requireTrustedOrigin, controller.forgotPassword);
router.post("/reset-password", requireTrustedOrigin, controller.resetPassword);

/*
  Agent activation flow
  - POST /activate-validate     { token }                    -> validates invitation, returns short-lived code
  - POST /request-activation-otp  { code }                   -> sends OTP to invited user's email
  - POST /activate-with-otp       { code, otp, password }    -> verifies OTP, activates account
*/
router.post("/activate-validate", requireTrustedOrigin, controller.activateValidate);
router.post("/request-activation-otp", requireTrustedOrigin, controller.requestActivationOtp);
router.post("/activate-with-otp", requireTrustedOrigin, controller.activateWithOtp);

router.get("/google", providerAuthController.startGoogle);
router.get("/google/callback", providerAuthController.googleCallback);

const mobileRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
        res.status(429).json({
            status: "error",
            code: "OTP_RATE_LIMITED",
            message: "Too many verification requests. Please try again later.",
        }),
});
const mobileVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
        res.status(429).json({
            status: "error",
            code: "OTP_RATE_LIMITED",
            message: "Too many verification attempts. Please try again later.",
        }),
});
router.post(
    "/mobile/request-otp",
    requireTrustedOrigin,
    mobileRequestLimiter,
    providerAuthController.requestOtp,
);
router.post(
    "/mobile/verify-otp",
    requireTrustedOrigin,
    mobileVerifyLimiter,
    providerAuthController.verifyOtp,
);

/*
  Logout - clears the auth cookie
*/
router.post("/refresh", requireTrustedOrigin, controller.refreshTokenEndpoint);
router.post("/logout", requireTrustedOrigin, controller.logout);

/*
  Protected route - returns current user info (requires jwtAuth middleware)
*/
router.get("/me", authMiddleware, controller.getCurrentUser);

/*
  Session - returns current cookie-backed user state without exposing credentials.
*/
router.get("/session", controller.getSession);

/*
  Profile routes (authenticated)
*/
router.get("/profile", authMiddleware, profileController.getProfile);
router.put("/profile", authMiddleware, profileController.updateProfile);
router.put("/password", authMiddleware, profileController.updatePassword);

export default router;
