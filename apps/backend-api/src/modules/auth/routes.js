// modules/auth/routes.js
import express from "express";
import * as controller from "./controllers/authController.js";
import * as profileController from "./controllers/profileController.js";
import authMiddleware from "../../core/auth/authMiddleware.js";
import { validateLogin, validateRegister } from "./validators/create.validation.js";
 
const router = express.Router();

// serve auth configuration to frontend
router.get("/config", controller.getAuthConfig);

/*
  Public auth endpoints
*/
router.post("/register", validateRegister, controller.register);
router.post("/login", validateLogin, controller.login);
router.post("/admin-registration-otp", controller.requestAdminRegistrationOtp);

/*
  Password reset flow
  - POST /forgot-password  { email }        -> sends reset email (generic response)
  - POST /reset-password   { token, password } -> resets password and logs user in
*/
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

/*
  OAuth entry points (frontend expects /auth/google, /auth/github, /auth/apple)
  These are lightweight placeholders. For production you should replace them
  with a proper OAuth implementation (e.g. Passport, or your own redirect flow)
  that issues tokens or sets cookies after successful auth.
*/
const oauthRedirectMap = {
  google: process.env.OAUTH_GOOGLE_URL || null,
  github: process.env.OAUTH_GITHUB_URL || null,
  apple: process.env.OAUTH_APPLE_URL || null,
};

const makeOAuthHandler = (provider) => (req, res) => {
  const redirectTo = oauthRedirectMap[provider];
  if (redirectTo) {
    // Redirect to configured provider endpoint (could be an endpoint on your backend that starts OAuth)
    return res.redirect(redirectTo);
  }

  // Not implemented , return a clear HTTP error so callers know to implement OAuth
  return res.status(501).json({
    message: `OAuth for "${provider}" is not implemented on the server. Set OAUTH_${provider.toUpperCase()}_URL or implement the provider flow.`,
  });
};

router.get("/google", makeOAuthHandler("google"));
router.get("/github", makeOAuthHandler("github"));
router.get("/apple", makeOAuthHandler("apple"));

/*
  Logout - clears the auth cookie
*/
router.post("/logout", controller.logout);

/*
  Protected route - returns current user info (requires jwtAuth middleware)
*/
router.get("/me", authMiddleware, controller.getCurrentUser);

/*
  Profile routes (authenticated)
*/
router.get("/profile", authMiddleware, profileController.getProfile);
router.put("/profile", authMiddleware, profileController.updateProfile);
router.put("/password", authMiddleware, profileController.updatePassword);

export default router;
