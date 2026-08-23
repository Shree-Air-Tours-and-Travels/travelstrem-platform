# TravelsTREM Deployment Guide: Render + Vercel

This repo is a pnpm/Turbo monorepo:

- Backend API: `@apps/backend-api` -> deploy on Render
- TravelsTrem parent website: `@apps/travelstrem` -> deploy on Vercel
- Dashboard app: `@apps/dashboard` -> deploy on Vercel
- Admin portal: `@apps/admin` -> deploy on Vercel
- Partner portal: `@apps/partner` -> deploy on Vercel
- Auth app/package: `@apps/auth`
- Trevio product app: `@apps/trevio` -> deploy on Vercel
- Trevista product app: `@apps/trevista` -> deploy on Vercel

Use fresh production secrets. Do not reuse development values.

## 1. Before You Deploy

1. Push the repo to GitHub.
2. Create a MongoDB Atlas production database.
3. Create/verify Cloudinary credentials if image upload is needed.
4. Create SMTP credentials if email/OTP email should work.
5. Generate secrets:

```bash
openssl rand -hex 64
openssl rand -hex 64
openssl rand -hex 32
```

Use different values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_CREATION_SECRET`.

## 2. Deploy Backend API on Render

1. Go to Render -> New -> Web Service.
2. Connect the GitHub repo.
3. Use these settings:

| Setting        | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Name           | `travelstrem-api`                                                         |
| Environment    | `Node`                                                                    |
| Region         | nearest to users                                                          |
| Branch         | `main` or your production branch                                          |
| Root Directory | leave empty / repo root                                                   |
| Build Command  | `pnpm install --frozen-lockfile && pnpm --filter @apps/backend-api build` |
| Start Command  | `pnpm --filter @apps/backend-api start`                                   |

4. Add the backend environment variables below.
5. Deploy.
6. Copy the Render URL, for example:

```text
https://travelstrem-api.onrender.com
```

7. Test:

```text
https://travelstrem-api.onrender.com/api
```

If there is a health route in the app, use that too.

## 3. Render Backend Environment Variables

Required:

```env
NODE_ENV=production
ALLOW_ENV_OVERRIDES=true
BASE_URL=https://travelstrem-api.onrender.com
FRONTENDS=https://travelstrem.com,https://auth.travelstrem.com,https://admin.travelstrem.com,https://trevio.travelstrem.com,https://trevista.travelstrem.com
AUTH_COOKIE_DOMAIN=.travelstrem.com
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/DB_NAME?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<different-long-random-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
ADMIN_CREATION_SECRET=<long-random-admin-secret>
PII_ENCRYPTION_KEY=<long-random-secret>
CLOUDINARY_NAME=<cloudinary-cloud-name>
CLOUDINARY_KEY=<cloudinary-api-key>
CLOUDINARY_SECRET=<cloudinary-api-secret>
```

Recommended:

```env
ENABLE_DEBUG_LOGS=false
ENABLE_EMAILS=false
RATE_WINDOW_MS=60000
RATE_MAX=60
OTP_TTL_MS=900000
```

Email/SMTP, only if email sending is enabled:

```env
ENABLE_EMAILS=true
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-username>
SMTP_PASS=<smtp-password>
SMTP_FROM=noreply@your-domain.com
```

Optional integrations:

```env
AGENT_WEBHOOK_URL=<zapier-or-automation-webhook>
REDIS_URL=<redis-url-if-notification-queue-uses-redis>
```

For backend-driven Google login, configure `GOOGLE_AUTH_ENABLED`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, and the exact backend `GOOGLE_CALLBACK_URL` described in
[`authentication.md`](./authentication.md). Do not put Google client secrets or provider tokens in a frontend environment.

Important: use a first-party API domain such as `api.travelstrem.com`. Authentication is intentionally isolated into customer, AdminTREM, and PartnerTREM cookie pairs. Signing into one portal must not replace another portal's user. `AUTH_COOKIE_DOMAIN=.travelstrem.com` is supported, but the separate cookie names still preserve this boundary. A host-only API cookie (leave `AUTH_COOKIE_DOMAIN` empty) is preferable when every frontend calls the same `api.travelstrem.com` host.

After Vercel deploys create real URLs, update `FRONTENDS` in Render to include every exact frontend origin. No trailing paths and no trailing slash.

## 4. Deploy Product Apps on Vercel

Deploy Trevio and Trevista as independent product applications.

1. Vercel -> Add New -> Project -> import the repo.
2. Configure:

| Setting          | Value                              |
| ---------------- | ---------------------------------- |
| Framework Preset | Create React App                   |
| Root Directory   | repo root                          |
| Install Command  | `pnpm install --frozen-lockfile`   |
| Build Command    | `pnpm --filter @apps/trevio build` |
| Output Directory | `apps/trevio-remote/build`         |

3. Add environment variables:

```env
REACT_APP_PORTAL_ENV=production
REACT_APP_API_URL=https://api.travelstrem.com/api
REACT_APP_BACKEND_URL=https://api.travelstrem.com
REACT_APP_AUTH_APP_URL=https://auth.travelstrem.com
```

4. Deploy.
   Repeat for Trevista:

| Setting          | Value                                |
| ---------------- | ------------------------------------ |
| Framework Preset | Create React App                     |
| Root Directory   | repo root                            |
| Install Command  | `pnpm install --frozen-lockfile`     |
| Build Command    | `pnpm --filter @apps/trevista build` |
| Output Directory | `apps/trevista-remote/build`         |

Confirm both product app URLs load in the browser:

```text
https://trevio.vercel.app
https://trevista.vercel.app
```

## 5. Deploy Auth App on Vercel

Deploy the global auth app at `auth.travelstrem.com`.

| Setting          | Value                            |
| ---------------- | -------------------------------- |
| Framework Preset | Create React App                 |
| Root Directory   | repo root                        |
| Install Command  | `pnpm install --frozen-lockfile` |
| Build Command    | `pnpm --filter @apps/auth build` |
| Output Directory | `apps/auth-trem/build`           |

Environment:

```env
REACT_APP_PORTAL_ENV=production
REACT_APP_API_URL=https://api.travelstrem.com/api
REACT_APP_BACKEND_URL=https://api.travelstrem.com
REACT_APP_TRAVELSTREM_APP_URL=https://travelstrem.com
```

## 6. Deploy Dashboard App on Vercel

Deploy the common dashboard app at `dashboard.travelstrem.com`.

| Setting          | Value                                 |
| ---------------- | ------------------------------------- |
| Framework Preset | Create React App                      |
| Root Directory   | repo root                             |
| Install Command  | `pnpm install --frozen-lockfile`      |
| Build Command    | `pnpm --filter @apps/dashboard build` |
| Output Directory | `apps/dashboard/build`                |

Environment:

```env
REACT_APP_PORTAL_ENV=production
REACT_APP_API_URL=https://api.travelstrem.com/api
REACT_APP_BACKEND_URL=https://api.travelstrem.com
REACT_APP_DASHBOARD_URL=https://dashboard.travelstrem.com
```

## 7. Deploy TravelsTrem Parent Website on Vercel

1. Create another Vercel project from the same repo.
2. Configure:

| Setting          | Value                                   |
| ---------------- | --------------------------------------- |
| Framework Preset | Create React App                        |
| Root Directory   | repo root                               |
| Install Command  | `pnpm install --frozen-lockfile`        |
| Build Command    | `pnpm --filter @apps/travelstrem build` |
| Output Directory | `apps/customer-shell/build`             |

3. Add environment variables:

```env
REACT_APP_PORTAL_ENV=production
REACT_APP_ALLOW_ENV_OVERRIDES=true
REACT_APP_API_URL=https://api.travelstrem.com/api
REACT_APP_BACKEND_URL=https://api.travelstrem.com
REACT_APP_AUTH_APP_URL=https://auth.travelstrem.com
REACT_APP_TREVIO_APP_URL=https://trevio.vercel.app
REACT_APP_TREVISTA_APP_URL=https://trevista.vercel.app
REACT_APP_ADMIN_SHELL_URL=https://admin-shell.vercel.app/admin/tours
```

4. Deploy.

## 8. Deploy Admin Shell on Vercel

1. Create another Vercel project from the same repo.
2. Configure:

| Setting          | Value                             |
| ---------------- | --------------------------------- |
| Framework Preset | Create React App                  |
| Root Directory   | repo root                         |
| Install Command  | `pnpm install --frozen-lockfile`  |
| Build Command    | `pnpm --filter @apps/admin build` |
| Output Directory | `apps/admin-shell/build`          |

3. Add environment variables:

```env
REACT_APP_PORTAL_ENV=production
REACT_APP_ALLOW_ENV_OVERRIDES=true
REACT_APP_API_URL=https://travelstrem-api.onrender.com/api
REACT_APP_BACKEND_URL=https://travelstrem-api.onrender.com
```

4. Deploy.

## 9. Add Vercel Rewrites

Single-page React apps need all routes to serve `index.html`.

`apps/trevio-remote/vercel.json` and `apps/trevista-remote/vercel.json` should serve product routes through `index.html`.

If customer/admin routes show 404 after refresh, add `vercel.json` files:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Add this file in:

- `apps/customer-shell/vercel.json`
- `apps/admin-shell/vercel.json`
- `apps/dashboard/vercel.json`

If Vercel is using repo root for each project, also configure the same rewrite in Vercel Project Settings or use a root-level Vercel config per project.

## 10. Final Wiring Checklist

1. Render `FRONTENDS` includes:
   - TravelsTrem parent website origin
   - Dashboard app origin
   - Admin Vercel origin
   - Trevio product origin
   - Trevista product origin
   - Any custom domains
2. Customer Vercel `REACT_APP_TREVIO_APP_URL` and `REACT_APP_TREVISTA_APP_URL` point to the product app origins.
3. All frontend `REACT_APP_DASHBOARD_URL` points to the dashboard app origin.
4. Every frontend `REACT_APP_API_URL` points to the Render backend with `/api`.
5. MongoDB Atlas Network Access allows Render connections. For quick setup use `0.0.0.0/0`; for stricter production security use Render outbound IPs if your plan supports stable IPs.
6. Redeploy frontends after changing any `REACT_APP_*` variable. CRA bakes these into the static build.
7. Redeploy backend after changing backend env vars.

## 11. Suggested Deploy Order

1. Render backend with placeholder `FRONTENDS`.
2. Vercel Auth app.
3. Vercel Dashboard app.
4. Vercel Trevio and Trevista product apps.
5. Vercel TravelsTrem parent website.
6. Vercel admin portal.
7. Update Render `FRONTENDS` and `AUTH_COOKIE_DOMAIN` with the final custom domains.
8. Redeploy Render backend.
9. Smoke test login from `auth.travelstrem.com`, dashboard access from products, Trevio/Trevista booking flows, image upload, and admin routes.

## 12. Common Issues

- CORS blocked: update Render `FRONTENDS` with the exact Vercel/custom origin.
- Frontend still calls old API: update `REACT_APP_API_URL` and redeploy the frontend.
- Product click opens the wrong URL: check `REACT_APP_TREVIO_APP_URL` and `REACT_APP_TREVISTA_APP_URL`, then redeploy the parent website.
- Dashboard link not working: verify `REACT_APP_DASHBOARD_URL` is set in all frontend apps and points to `https://dashboard.travelstrem.com`.
- Product still asks users to login after auth success: verify the API is on a `travelstrem.com` subdomain, credentials are enabled, and the frontend sends `X-Travelstrem-Portal: customer`.
- AdminTREM changes the customer shown in TravelsTREM: redeploy the backend and both shells together, then sign in once per portal so the old shared cookie is replaced by portal-scoped cookies.
- Backend ignores `FRONTENDS`/`BASE_URL`: make sure Render has `ALLOW_ENV_OVERRIDES=true`.
- Mongo connection fails: verify `MONGO_URI`, Atlas database user permissions, and Atlas Network Access.
- Refreshing product/admin/dashboard routes gives 404: add Vercel rewrites to `index.html`.
