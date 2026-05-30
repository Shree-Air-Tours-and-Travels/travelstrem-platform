# TravelsTREM Deployment Guide: Render + Vercel

This repo is a pnpm/Turbo monorepo:

- Backend API: `@apps/backend-api` -> deploy on Render
- Customer frontend: `@apps/customer-shell` -> deploy on Vercel
- Admin frontend: `@apps/admin-shell` -> deploy on Vercel
- Tours remote/MFE: `@apps/tours-remote` -> deploy on Vercel

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

| Setting | Value |
| --- | --- |
| Name | `travelstrem-api` |
| Environment | `Node` |
| Region | nearest to users |
| Branch | `main` or your production branch |
| Root Directory | leave empty / repo root |
| Build Command | `pnpm install --frozen-lockfile && pnpm --filter @apps/backend-api build` |
| Start Command | `pnpm --filter @apps/backend-api start` |

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
FRONTENDS=https://customer-app.vercel.app,https://admin-app.vercel.app,https://tours-remote.vercel.app
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
OAUTH_GOOGLE_URL=<full-google-authorize-url>
OAUTH_GITHUB_URL=<full-github-authorize-url>
OAUTH_APPLE_URL=<full-apple-authorize-url>
REDIS_URL=<redis-url-if-notification-queue-uses-redis>
```

Important: after Vercel deploys create real URLs, update `FRONTENDS` in Render to include every exact frontend origin. No trailing paths and no trailing slash.

## 4. Deploy Tours Remote on Vercel First

Deploy this first because the customer shell loads its `remoteEntry.js`.

1. Vercel -> Add New -> Project -> import the repo.
2. Configure:

| Setting | Value |
| --- | --- |
| Framework Preset | Create React App |
| Root Directory | repo root |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter @apps/tours-remote build` |
| Output Directory | `apps/tours-remote/build` |

3. Add environment variables:

```env
REACT_APP_PORTAL_ENV=production
REACT_APP_API_URL=https://travelstrem-api.onrender.com/api
REACT_APP_BACKEND_URL=https://travelstrem-api.onrender.com
```

4. Deploy.
5. Confirm this URL works:

```text
https://tours-remote.vercel.app/remoteEntry.js
```

## 5. Deploy Customer Shell on Vercel

1. Create another Vercel project from the same repo.
2. Configure:

| Setting | Value |
| --- | --- |
| Framework Preset | Create React App |
| Root Directory | repo root |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter @apps/customer-shell build` |
| Output Directory | `apps/customer-shell/build` |

3. Add environment variables:

```env
REACT_APP_PORTAL_ENV=production
REACT_APP_ALLOW_ENV_OVERRIDES=true
REACT_APP_API_URL=https://travelstrem-api.onrender.com/api
REACT_APP_BACKEND_URL=https://travelstrem-api.onrender.com
REACT_APP_TOURS_REMOTE_URL=https://tours-remote.vercel.app
REACT_APP_ADMIN_SHELL_URL=https://admin-shell.vercel.app/admin/tours
```

4. Deploy.

## 6. Deploy Admin Shell on Vercel

1. Create another Vercel project from the same repo.
2. Configure:

| Setting | Value |
| --- | --- |
| Framework Preset | Create React App |
| Root Directory | repo root |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter @apps/admin-shell build` |
| Output Directory | `apps/admin-shell/build` |

3. Add environment variables:

```env
REACT_APP_PORTAL_ENV=production
REACT_APP_ALLOW_ENV_OVERRIDES=true
REACT_APP_API_URL=https://travelstrem-api.onrender.com/api
REACT_APP_BACKEND_URL=https://travelstrem-api.onrender.com
```

4. Deploy.

## 7. Add Vercel Rewrites

Single-page React apps need all routes to serve `index.html`.

`apps/tours-remote/vercel.json` already has rewrites and a `remoteEntry.js` CORS header.

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

If Vercel is using repo root for each project, also configure the same rewrite in Vercel Project Settings or use a root-level Vercel config per project.

## 8. Final Wiring Checklist

1. Render `FRONTENDS` includes:
   - Customer Vercel origin
   - Admin Vercel origin
   - Tours remote Vercel origin
   - Any custom domains
2. Customer Vercel `REACT_APP_TOURS_REMOTE_URL` points to the Tours remote origin.
3. Every frontend `REACT_APP_API_URL` points to the Render backend with `/api`.
4. MongoDB Atlas Network Access allows Render connections. For quick setup use `0.0.0.0/0`; for stricter production security use Render outbound IPs if your plan supports stable IPs.
5. Redeploy frontends after changing any `REACT_APP_*` variable. CRA bakes these into the static build.
6. Redeploy backend after changing backend env vars.

## 9. Suggested Deploy Order

1. Render backend with placeholder `FRONTENDS`.
2. Vercel tours remote.
3. Vercel customer shell.
4. Vercel admin shell.
5. Update Render `FRONTENDS` with the final Vercel/custom domains.
6. Redeploy Render backend.
7. Smoke test login, tour listing, booking flow, image upload, and admin routes.

## 10. Common Issues

- CORS blocked: update Render `FRONTENDS` with the exact Vercel/custom origin.
- Frontend still calls old API: update `REACT_APP_API_URL` and redeploy the frontend.
- Customer shell cannot load tours: check `https://tours-remote.vercel.app/remoteEntry.js` and `REACT_APP_TOURS_REMOTE_URL`.
- Backend ignores `FRONTENDS`/`BASE_URL`: make sure Render has `ALLOW_ENV_OVERRIDES=true`.
- Mongo connection fails: verify `MONGO_URI`, Atlas database user permissions, and Atlas Network Access.
- Refreshing `/admin/...` or `/tours/...` gives 404: add Vercel rewrites to `index.html`.
