# TravelsTREM authentication

AuthTREM is the only authentication UI. Customer, admin, partner, Trevista, Trevio, and booking clients redirect to it with an `app` identity and allow-listed `returnTo` URL. The backend maps the request to a portal-scoped session and independently enforces role access.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/methods` | Public availability of Google/mobile methods |
| `GET` | `/api/auth/google` | Starts Google OIDC authorization-code flow |
| `GET` | `/api/auth/google/callback` | Validates state, PKCE, nonce and Google ID token; creates the TravelsTREM session |
| `POST` | `/api/auth/mobile/request-otp` | Normalizes an E.164 number and creates an expiring OTP challenge |
| `POST` | `/api/auth/mobile/verify-otp` | Consumes a valid challenge and creates the same TravelsTREM session |
| `POST` | `/api/auth/refresh` | Rotates a database-backed refresh session |
| `POST` | `/api/auth/logout` | Revokes the current refresh session and clears cookies |
| `GET` | `/api/auth/me` | Returns the authenticated internal user |
| `GET` | `/api/auth/session` | Restores/rotates the browser session used by portal providers |

All sessions use portal-specific HttpOnly cookies. Provider tokens, OTPs, password hashes, and refresh-token values are never returned by user/session endpoints.

## Required configuration

Copy `apps/backend-api/.env.example` to the environment file used by the backend and configure:

```env
BASE_URL=http://localhost:5000
FRONTENDS=["http://localhost:3001","http://localhost:3002","http://localhost:3003","http://localhost:3004","http://localhost:3005","http://localhost:3006","http://localhost:3007"]
AUTH_APP_URL=http://localhost:3003
SHELL_URL=http://localhost:3006
ADMIN_URL=http://localhost:3002
PARTNER_URL=http://localhost:3004

GOOGLE_AUTH_ENABLED=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
```

Run the schema/index migration once after deployment:

```bash
pnpm --filter @apps/backend-api migrate:authentication
```

## Google Cloud Console

Create an OAuth client of type **Web application**.

- Development authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
- Production authorized redirect URI: `${BACKEND_PUBLIC_ORIGIN}/api/auth/google/callback`
- Authorized JavaScript origins are not required by this redirect-only server flow. If Google Console requires one for another Google Identity feature, use the AuthTREM origins (development: `http://localhost:3003`; production: the deployed AuthTREM origin).

The redirect URI must exactly equal `GOOGLE_CALLBACK_URL`. Put the generated values in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; do not add them to frontend environment files.

## Mobile provider integration

The only provider integration point is:

`apps/backend-api/src/modules/auth/providers/mobile/index.js`

Add an adapter beside `UnavailableOtpProvider.js` implementing `sendOtp(phoneNumber, otp)`, then select it using `MOBILE_AUTH_PROVIDER`. Challenge hashing, expiry, resend cooldown, attempts, replay prevention, E.164 normalization, identities, users, and sessions are already handled by `mobileAuth.service.js`.

Without a provider, production returns `MOBILE_OTP_PROVIDER_NOT_CONFIGURED`. For explicit local testing only:

```env
MOBILE_AUTH_DEV_MODE=true
MOBILE_AUTH_TEST_OTP=123456
```

Startup rejects development OTP mode in production.
