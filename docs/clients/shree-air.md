# Shree Air Tours & Travels

Shree Air is a travel agency and a TravelsTREM client. TravelsTREM is a separate SaaS organisation created by engineer Akshat Goyal. Agency branding, travel services and customer relationships stay with Shree Air. Founder and portfolio content belongs on the TravelsTREM website.

## Client identity

| Setting                    | Value                                   |
| -------------------------- | --------------------------------------- |
| Client slug                | `shree-air`                             |
| Client ID                  | `6abe72dbc23ba0ff53e9d22c`              |
| Tenant database            | `shree-air-dev` locally                 |
| Runtime database reference | `TENANT_RUNTIME_DB_SHREE_AIR`           |
| Deployment mode            | App Shell with enrolled product remotes |
| Enrolled services          | Flights, hotels, trips and tours        |
| Agency email               | `shreeairs1972@gmail.com`               |
| Agency phone               | `9602225763`                            |

Branding, theme, contact details and enrolled services come from the client configuration. Update them through tenant administration. Do not put database passwords or provider credentials in this document or a frontend environment.

## Local servers

Run commands from the repository root unless a directory is specified. The client launcher reads the registered domains, so changed client configuration can change these ports.

| Server                   | Local URL                                       | Source                  |
| ------------------------ | ----------------------------------------------- | ----------------------- |
| Agency marketing website | `http://localhost:3031`                         | `website/shree-air`     |
| Agency blog              | `http://localhost:3031/blog`                    | Same website server     |
| Agency About page        | `http://localhost:3031/about`                   | Same website server     |
| Agency contact form      | `http://localhost:3031/contact`                 | Same website server     |
| Client backend           | `http://127.0.0.1:5011`                         | `apps/backend-api`      |
| Client travel webapp     | `http://127.0.0.1:3028`                         | `apps/app-shell`        |
| Client authentication    | `http://127.0.0.1:3023`                         | `apps/auth-trem`        |
| Client administration    | `http://127.0.0.1:3029`                         | `apps/admin-shell`      |
| Client account dashboard | `http://127.0.0.1:3037`                         | `apps/dashboard-remote` |
| Flight and hotel remote  | `http://127.0.0.1:3038/remoteEntry.js`          | `apps/trehub-remote`    |
| Trips remote             | `http://127.0.0.1:3039/remoteEntry.js`          | `apps/trevio-remote`    |
| Tours remote             | `http://127.0.0.1:3040/remoteEntry.js`          | `apps/trevista-remote`  |
| TravelsTREM SaaS website | `http://localhost:3032` using the command below | `website/travelstrem`   |

Product remotes are consumed through the client App Shell. A partner portal starts only if it is enabled and has a registered domain. The launcher does not start a payment-app server; payment checkout needs its own tenant deployment/configuration when enabled.

## Local environment and run commands

Install the existing workspace dependencies:

```sh
pnpm install --frozen-lockfile
```

The backend platform configuration is `apps/backend-api/.env.development`. The single client secret file is `.env.shree-air.local`. Keep both uncommitted.

```dotenv
TENANT_CLIENT_ID=6abe72dbc23ba0ff53e9d22c
TENANT_PRODUCT=
TENANT_RUNTIME_DB_SHREE_AIR=<collection-scoped-runtime-mongodb-uri>
JWT_ACCESS_SECRET=<client-specific-access-secret>
JWT_REFRESH_SECRET=<different-client-specific-refresh-secret>
```

`TENANT_PRODUCT` stays empty for this multi-product client. Use the dedicated runtime database reference for Atlas. The launcher derives the tenant database name from the registration and validates effective database permissions. Do not use `atlasAdmin` or a broad database `readWrite` role as the client runtime credential. Configure the collection-scoped role through Atlas; the launcher does not create Atlas users or roles.

Start the client backend and its enrolled webapps:

```sh
node scripts/local/tenant.mjs shree-air
```

If the frontend ports are already running, start only the backend:

```sh
node scripts/local/tenant.mjs shree-air --backend-only
```

Prepare `website/shree-air/.env.development` using these public/server routing values:

```dotenv
SHREE_AIR_SITE_URL=http://localhost:3031
SHREE_AIR_API_URL=http://127.0.0.1:5011
SHREE_AIR_CLIENT_ID=6abe72dbc23ba0ff53e9d22c
SHREE_AIR_WEBAPP_URL=http://127.0.0.1:3028
```

Start the agency website and the separate SaaS website in separate terminals:

```sh
pnpm --filter @websites/shree-air dev
pnpm --filter @apps/travelstrem-marketing dev --port 3032
```

The agency site has no dependency on the TravelsTREM marketing server. Its public branding cache refreshes every five minutes from the tenant API. `website/shree-air/lib/branding.json` is a database-sourced public baseline used if the tenant API is unavailable; it contains no credentials. Refresh that baseline from verified public client configuration when branding changes. Customer enquiries always need the live tenant API.

## Production website deployment

Create a separate Vercel project for each website. Enable source files outside the Root Directory because both use the shared design tokens.

| Project        | Root Directory        | Build package                 | Output  |
| -------------- | --------------------- | ----------------------------- | ------- |
| Agency website | `website/shree-air`   | `@websites/shree-air`         | `.next` |
| SaaS website   | `website/travelstrem` | `@apps/travelstrem-marketing` | `.next` |

Each directory has its own `vercel.json`. Installation runs `pnpm install --frozen-lockfile` from the repository root, and the build filters only the corresponding website.

Set these on the agency website project. Replace the example domains with the actual agency domains; the examples below are placeholders.

```dotenv
SHREE_AIR_SITE_URL=https://www.shreeair.example
SHREE_AIR_API_URL=https://api.shreeair.example
SHREE_AIR_CLIENT_ID=6abe72dbc23ba0ff53e9d22c
SHREE_AIR_WEBAPP_URL=https://app.shreeair.example
```

`SHREE_AIR_SITE_URL` controls metadata and canonical URLs. `SHREE_AIR_WEBAPP_URL` controls the booking-portal link. `SHREE_AIR_API_URL` must point to this client's backend, not the platform API or the SaaS website. These website variables are server configuration; no MongoDB, JWT, SMTP or payment credentials belong here.

TravelsTREM has its own optional public analytics variables in `website/travelstrem/.env.example`. Its analytics and advertising settings are not inherited by Shree Air.

For production-style local checks, build each site and start it separately:

```sh
pnpm --filter @websites/shree-air build
SHREE_AIR_SITE_URL=http://localhost:3031 \
SHREE_AIR_API_URL=http://127.0.0.1:5011 \
SHREE_AIR_CLIENT_ID=6abe72dbc23ba0ff53e9d22c \
SHREE_AIR_WEBAPP_URL=http://127.0.0.1:3028 \
pnpm --filter @websites/shree-air start --port 3031
pnpm --filter @apps/travelstrem-marketing build
pnpm --filter @apps/travelstrem-marketing start --port 3032
```

## Production tenant backend

Deploy `apps/backend-api` as a separate Node server. Start with `apps/backend-api/.env.example`, supply the client's real values through the hosting provider, and use `pnpm --filter @apps/backend-api start`. Do not deploy the local tenant launcher or load developer dotenv files in production.

| Variables                                                                       | Required configuration                                                                                                   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`, `PORTAL_ENV`, `USE_DOTENV`                                          | `production`, `production`, `false`                                                                                      |
| `PORT`, `BASE_URL`                                                              | Hosting-assigned port and the client's public HTTPS API origin                                                           |
| `TENANT_CLIENT_ID`, `TENANT_PRODUCT`                                            | Client ID above; empty product for App Shell                                                                             |
| `MONGO_URI`                                                                     | Restricted runtime URI targeting the provisioned client database; production does not use `MONGO_URI_DEV`                |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`                                       | Independent client-specific secrets                                                                                      |
| `ADMIN_CREATION_SECRET`, `PII_ENCRYPTION_KEY`                                   | Required backend-only security values                                                                                    |
| `REDIS_URL`                                                                     | Client backend's reachable Redis connection; keep tenant cache/session isolation                                         |
| `SHELL_URL`, `TREHUB_URL`, `TREVIO_URL`, `TREVISTA_URL`                         | Client webapp origin for this embedded multi-product deployment                                                          |
| `AUTH_APP_URL`, `ADMIN_URL`, `ADMIN_REMOTE_URL`, `DASHBOARD_URL`                | Actual deployed client portal URLs                                                                                       |
| `FRONTENDS`                                                                     | JSON list of exact client frontend origins; add the agency website where applicable                                      |
| `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SAMESITE`                                    | Cookie domain owned by the client and a SameSite policy matching the real deployment; keep cookies out of platform scope |
| `DEPLOYMENT_SECRET_STORE_PROVIDER`, `DEPLOYMENT_SECRET_STORE_ENCRYPTED_AT_REST` | Verified provider and `true` after encryption-at-rest evidence is recorded                                               |
| `ENABLE_EMAILS`, SMTP/integration settings                                      | Enabled delivery with the client's configured sender/provider                                                            |
| `REALTIME_ENABLED`, `REALTIME_PATH`                                             | Realtime capability and path used by client portals                                                                      |

Client-owned provider, document-storage and payment credentials remain backend-only. Configure their tenant integration profiles and secret references using the existing integration registry. Keep development mocks and OTP bypasses out of production. Payment availability remains subject to the backend environment policy.

## Production webapps

Deploy the existing `apps/` projects separately with tenant-specific build variables. Use each app's `.env.example` and `vercel.json`; do not copy platform production URLs into the client project.

| Variables                                                                                           | Client value                                                     |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `REACT_APP_PORTAL_ENV`                                                                              | `production`                                                     |
| `REACT_APP_API_URL`, `REACT_APP_BACKEND_URL`                                                        | Client API URL, respectively with `/api` and without it          |
| `REACT_APP_SHELL_URL`, `REACT_APP_TRAVELSTREM_APP_URL`                                              | Client travel webapp URL, where consumed                         |
| `REACT_APP_AUTH_APP_URL`                                                                            | Client authentication URL                                        |
| `REACT_APP_ADMIN_SHELL_URL`, `REACT_APP_DASHBOARD_URL`                                              | Corresponding client portal URLs, where consumed                 |
| `REACT_APP_TREHUB_URL`, `REACT_APP_TREVIO_URL`, `REACT_APP_TREVISTA_URL`                            | Client webapp URL for embedded products                          |
| `REACT_APP_TREHUB_REMOTE_ENTRY`, `REACT_APP_TREVIO_REMOTE_ENTRY`, `REACT_APP_TREVISTA_REMOTE_ENTRY` | Client-owned product deployment URLs ending in `/remoteEntry.js` |
| `REACT_APP_DASHBOARD_REMOTE_ENTRY`                                                                  | Client dashboard deployment URL ending in `/remoteEntry.js`      |
| `REACT_APP_TENANT_DEPLOYMENT_MODE`                                                                  | `app-shell` where consumed                                       |
| `REACT_APP_REMOTE_ONLY`                                                                             | `true` for enrolled product remotes, not the App Shell           |
| `REACT_APP_REALTIME_URL`, `REACT_APP_REALTIME_PATH`                                                 | Client API origin and matching Socket.IO path                    |
| `REACT_APP_THEME_COOKIE_DOMAIN`                                                                     | Client-owned cookie domain, where consumed                       |

`REACT_APP_*` variables are public and build-time. A changed value needs a rebuilt deployment. Verify deep links, authentication cookies, remote-entry JavaScript and client API responses before handover.

## Enquiries and notifications

The website posts to its own `/api/enquiry` route. That server route checks the tenant identity before forwarding to the existing `/api/submit.json?form=contact-agent` backend flow. The backend owns validation, persistence, client-admin inbox/realtime notifications and best-effort email delivery. The saved enquiry belongs in the client database.

A successful form submission is not proof that email delivery succeeded. Verify the client admin's inbox and the configured email provider separately. If the tenant API is unavailable, the form shows an error and directs the traveller to the agency's direct-call link; it does not claim the enquiry was saved.

## Startup troubleshooting

- `bad auth : authentication failed`: verify the Atlas database username/password and restricted role in `TENANT_RUNTIME_DB_SHREE_AIR`; do not substitute a platform administrator credential.
- Excess database privileges: assign only the runtime collections/actions for the enrolled services. Keep tenant enforcement enabled.
- Port already in use: check the table above and reuse the existing frontend processes with `--backend-only`.
- Branding is older than the latest tenant edit: allow the five-minute public cache to refresh and check the tenant API response. The committed baseline can remain visible while the API is offline.
- Marketing pages load but enquiries fail: check port 5011, tenant ID, backend database/Redis readiness and the submission response before changing the website.
- Product deep link returns HTML for JavaScript: inspect remote-entry URLs, public paths and SPA rewrites in the relevant app deployment.
