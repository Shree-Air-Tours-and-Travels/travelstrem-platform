Auth Flow Security Review (QA)
I reviewed the full stack: authController.js (1312 lines), routes.js, authMiddleware.js, portalSession.js, RefreshToken/UserVerification/User models, profileController.js, config/env.js, and bootstrap/middleware.js (CORS/CSRF/rate-limit/helmet).
Verdict
The baseline design is solid: httpOnly cookies, 15-min access tokens, opaque hashed refresh tokens with rotation, tokenVersion revocation, portal-scoped sessions, and approval gates for admin/agent. But there are 2 high-severity and several medium/low issues that should be fixed before production.
High severity

1. OTP generated with Math.random() — authController.js:216
   generateOtp uses Math.random(), a predictable xorshift128+ PRNG. V8's outputs can be reconstructed with enough samples, which makes OTPs potentially guessable. Fix: crypto.randomInt(100000, 1000000).
2. No password-strength enforcement on reset/register — authController.js:870-872 and create.validation.js:9-15
   resetPassword and register only check the field exists. An attacker who intercepts a reset OTP can set a 1-char password (password: "a"). updatePassword requires ≥8 chars, so the policy is inconsistent. Fix: shared validator (min 8, reject common/leaked-passwords).
3. User enumeration — authController.js:840-843 (forgotPassword returns 404 for unknown emails), :570-572 (register returns 409 "Email already in use"), :1155-1171 (checkPartnerAgency reveals application status by email). Login correctly returns generic 401, but these endpoints undo that. Fix: always return a generic success/neutral response.
4. No auth-specific rate limiting / lockout — middleware.js:156-163
   The global limiter is only enabled when !IS_DEVELOPMENT and is coarse (60/min/IP). login, verify-otp, forgot-password, resend-otp have no dedicated throttling and no per-account lockout. An attacker rotating IPs can brute-force passwords and email-bomb via forgot-password. Fix: per-IP + per-email/verification rate limiters on these endpoints.
5. Master-admin auto-promotion — authController.js:434-439
   On every login, any account whose email === MASTER_ADMIN_EMAIL is silently escalated to master and approved. If a master-email account is ever created via any path (invitation, import), it becomes superuser. Fix: remove auto-promotion; promote only through explicit provisioning.
   Medium severity
6. CSRF protection is opt-in and off by default — middleware.js:132-151
   Requests without x-csrf-token pass through. With sameSite=lax (production with shared AUTH_COOKIE_DOMAIN, portalSession.js:42), cookie-authed state-changing calls are CSRF-exposed. Fix: either enforce CSRF when auth comes from cookies, or keep strict SameSite (already default without shared domain).
7. OTP compared with === and stored in plaintext — authController.js:246, UserVerification.js:10
   acceptsOtp uses string equality (a timingSafeEqual helper already exists at :303 but is only used for the admin PIN). OTPs are also stored raw in the DB. Fix: timing-safe compare; store sha256(otp).
8. No refresh-token reuse detection — authController.js:964
   The family field is written but never used. A rotated/stolen refresh token being replayed just returns 401 silently instead of revoking the whole token family. Fix: track and rotate the family on reuse.
9. Portal scope comes from a client header — portalSession.js:23
   getPortalScope trusts x-travelstrem-portal. Tokens/cookies are minted for whatever scope the caller declares (e.g., a member could log in with x-travelstrem-portal: admin and get an admin-portal cookie). Role checks prevent direct escalation, but scope should be derived from the trusted origin/host instead.
10. Sanitizer mutates passwords — middleware.js:34-51
    All strings have </> stripped, including passwords at login/register/reset. A legit password containing those chars will never authenticate. Fix: skip secrets in the sanitizer.
    Low / hardening

- OTP TTL is 15 min (env.js:252) — consider 5 min for login.
- forgotPassword echoes internal error messages in dev responses (:861).
- bcryptjs (pure JS) rather than native bcrypt; cost 10 is fine.
- No audit events on failed logins/OTP abuse (audit infra exists).
- resend-otp resets attempts to 0 (:804) — combined with no rate limit it enables OTP spam.
- DEV_OTP_BYPASS (env.js:255) is on for every non-production env, including staging. Recommend gating to localhost only.
  Questions before we proceed
  Want me to (a) write this up as a checklist, or (b) start implementing fixes? If (b), I'd prioritize: #1–5 (high), then #6–10. Let me know the scope and whether you want the staging-guard for DEV_OTP_BYPASS included.
