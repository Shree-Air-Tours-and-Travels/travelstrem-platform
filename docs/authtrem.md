Here's a comprehensive audit of your Authtrem flow.
Stack & Architecture (Solid Foundation)
Component Technology
Framework CRA + React 18 (SPA)
Backend Express.js
Auth Custom JWT (jsonwebtoken) + bcryptjs
DB MongoDB + Mongoose 8
Monorepo pnpm + Turborepo
Well-structured monorepo with clean separation: trem-auth-core (shared hooks/factory), trem-session (session init), trem-events (auth event bus), and auth-trem (standalone auth UI app). Good use of dual token storage (httpOnly cookie + Bearer header).
✅ What's Good

1. Role-based OTP flow – Admin/agent logins require email OTP verification before issuing JWT; agent emails restricted to @travelstrem.com.
2. Admin approval chain – Agent signups need admin approval; admin signups need master admin approval (returns 202 pending).
3. Event bus integration – USER_LOGOUT / SESSION_EXPIRED events propagate across micro-frontends cleanly.
4. Config-driven routes – Route access rules (public, authenticated, roles) come from backend, not hardcoded.
5. OTP security – Configurable TTL, max attempts (3), resend cooldown.
6. Prefix-based session isolation – Each shell app uses its own storage prefix, preventing collisions.
   🔴 Critical Issues

# Issue

1 Hardcoded JWT secret – "replace_this_in_production" as fallback
2 No refresh token rotation – /auth/refresh endpoint exists but frontend never calls it; token expires → silent logout
3 LocalStorage token = XSS-vulnerable – Token readable by any JS despite httpOnly cookie existing
4 No CSRF tokens – State-changing requests protected only by cookie presence
5 Password validation is 6 chars minimum – No complexity rules
6 Forgot password reveals email existence – Returns 404 vs 200
🟡 Medium Concerns

# Issue

7 Rate limiting only in production – Dev has no throttle on auth endpoints
8 No account lockout – Repeated login failures don't lock the account
9 No email verification for members – Register → immediate JWT
10 Password change doesn't invalidate JWTs – Old tokens still valid
11 Admin creation secret hardcoded in dev – "dev-secret-123"
12 JWT payload used as source of truth – Some endpoints check DB, some don't; decoded JWT is mutable client-side
13 No logout-from-all-devices – Only current cookie cleared
14 OTP resend has no hard cap – Only cooldown between resends
🔧 What's Missing Entirely

- OAuth providers – Google/GitHub/Apple routes return 501; social login button never renders
- CAPTCHA/reCAPTCHA – On login/register/reset-password
- Audit logging – No record of auth events (login, register, password reset)
- Session management UI – Can't view/logout other sessions
- Input sanitization – No NoSQL injection prevention in auth endpoints
- Test coverage – Only placeholder.test.js exists
- TypeScript – Entire codebase is plain JS
  🎯 Recommended Priority Order

1.  Fix hardcoded JWT secret → env var with no fallback or crash on missing
2.  Implement refresh token rotation → short-lived access token (15m) + long-lived refresh token (7d) with auto-refresh interceptor
3.  Add CSRF token mechanism → double-submit cookie pattern or custom header check
4.  Strengthen password policy → add uppercase, number, special char requirements (both frontend + backend)
5.  Fix email enumeration → return generic message for forgot-password regardless of email existence
6.  Rate limit all auth endpoints unconditionally → stricter limits on login/OTP/register (5/min) vs normal endpoints (60/min)
7.  Add input validation/sanitization → email format, password strength, NoSQL injection prevention
8.  Invalidate sessions on password change → add tokenVersion to User model, include in JWT
9.  Add account lockout → 5 failed attempts → 15-minute lock
10. Remove localStorage token, rely on httpOnly cookie → single source of truth for auth
