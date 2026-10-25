# TravelsTREM development setup

Run all commands from the `travelstrem-platform` repository root unless noted otherwise. Architecture documentation is in [docs/README.md](docs/README.md); follow the [engineering rules](docs/contracts/08-engineering-rules.md) when changing code.

## 1. Prerequisites

- Node.js compatible with the repository's installed toolchain. This root package does not currently declare an `engines` version; use the team's agreed version rather than assuming the newest Node release is supported.
- pnpm **10.17.1**, as declared by the root `packageManager`.
- A running development MongoDB instance, or an approved development Atlas URI.
- A running Redis instance for authentication, sessions, CSRF, and cache.

```bash
pnpm install --frozen-lockfile
```

Use a development database and credentials. An empty database lets the server connect but does not provide existing users, tenants, bookings, or configured integrations. Obtain the team's development data/setup procedure before testing those workflows.

## 2. Environment files and precedence

Each app owns its environment file; a root `.env.development` is not a substitute.

| File | Purpose |
| --- | --- |
| `apps/<app>/.env.example` | Variable reference, generally containing production URLs and empty secrets. Not loaded automatically. |
| `apps/<app>/.env.development` | Development configuration for that app. |
| `apps/<app>/.env.development.local` | Machine-specific overrides; keep credentials here and out of Git. |

Some frontend `.env.development` files are already tracked. Do not put secrets into them. `.env.development.local` is ignored by this repository.

**Backend:** `pnpm --filter @apps/backend-api dev` sets `NODE_ENV=development` and `USE_DOTENV=true`. From the backend working directory, the loader reads `.env.development` if present, otherwise `.env`, then `.env.development.local` with override enabled. Existing process variables take precedence over the base file, but the local override file can replace them. A legacy root `.env.tenants.local`, if present, is loaded first. Avoid duplicate/conflicting values across these files.

**Frontends:** CRA loads development environment files at startup. Priority is process environment, `.env.development.local`, `.env.local`, `.env.development`, then `.env`. `REACT_APP_*` values are browser-visible build-time configuration, never a place for database passwords, JWT secrets, Redis credentials, or provider secret keys.

Restart the affected process after changing environment values. Backend nodemon watches source files, not these environment files; type `rs` in its terminal or restart it. Frontend URLs also require a dev-server restart.

## 3. Local ports

| Application folder | Package/filter | Port | Example reference |
| --- | --- | --- | --- |
| `backend-api` | `@apps/backend-api` | 5000 | [Backend](apps/backend-api/.env.example) |
| `auth-trem` | `@apps/auth` | **3013** | [AuthTREM](apps/auth-trem/.env.example) |
| `app-shell` | `@apps/app-shell` | 3006 | [Customer shell](apps/app-shell/.env.example) |
| `dashboard-remote` | `@apps/dashboard-remote` | 3017 | [Dashboard](apps/dashboard-remote/.env.example) |
| `trevista-remote` | `@apps/trevista` | 3001 | [Trevista](apps/trevista-remote/.env.example) |
| `trevio-remote` | `@apps/trevio` | 3005 | [Trevio](apps/trevio-remote/.env.example) |
| `trehub-remote` | `@apps/trehub` | 3008 | [TreHub](apps/trehub-remote/.env.example) |
| `admin-shell` | `@apps/admin` | 3002 | [Admin](apps/admin-shell/.env.example) |
| `agent-shell` | `@apps/partner` | 3004 | [Partner](apps/agent-shell/.env.example) |
| `booking-engine` | `@apps/booking-engine` | 3007 | [Booking](apps/booking-engine/.env.example) |
| `payment-app` | `@apps/payment-app` | 3018 | [Payment](apps/payment-app/.env.example) |

AuthTREM's current dev/start scripts use **3013**. Its `.env.example` still lists the older `3003`; override that when preparing local files. Port 3003 may belong to COB Universe. Every frontend that links to AuthTREM must use `REACT_APP_AUTH_APP_URL=http://localhost:3013` locally, including dashboard, admin, partner, and product apps where applicable. Do not accept a random alternate port when prompted: correct the collision and align URLs first. Frontend start scripts explicitly set their port, so changing only `PORT` in an env file is insufficient when moving an app.

## 4. Backend environment

Use [apps/backend-api/.env.example](apps/backend-api/.env.example) as the full variable reference. For a fresh setup, create `apps/backend-api/.env.development` using this local subset. If it already exists, merge these values rather than replacing it.

```dotenv
NODE_ENV=development
PORTAL_ENV=development
PORT=5000
APP_NAME=TravelsTrem
BASE_URL=http://localhost:5000
FRONTENDS=["http://localhost:3001","http://localhost:3002","http://localhost:3013","http://localhost:3004","http://localhost:3005","http://localhost:3006","http://localhost:3007","http://localhost:3008","http://localhost:3017","http://localhost:3018"]

AUTH_APP_URL=http://localhost:3013
SHELL_URL=http://localhost:3006
ADMIN_URL=http://localhost:3002
ADMIN_REMOTE_URL=http://localhost:3002
PARTNER_URL=http://localhost:3004
TREVISTA_URL=http://localhost:3001
TREVIO_URL=http://localhost:3005
TREHUB_URL=http://localhost:3008
DASHBOARD_URL=http://localhost:3017
PAYMENT_APP_URL=http://localhost:3018

MONGO_URI_DEV=mongodb://127.0.0.1:27017/travelstrem_dev
REDIS_URL=redis://127.0.0.1:6379
AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SAMESITE=lax
ENABLE_REDIS_SOCKET_ADAPTER=false
GOOGLE_AUTH_ENABLED=false
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
MOBILE_AUTH_ENABLED=false
ENABLE_EMAILS=false
DEV_OTP_BYPASS=false
DOCUMENT_STORAGE_PROVIDER=local
REALTIME_ENABLED=true
REALTIME_PATH=/socket.io
FLIGHT_PROVIDER=mock
```

This assumes MongoDB is actually listening on 27017 and Redis on 6379. For Atlas or authenticated Redis, put the approved development connection string in `.env.development.local` instead. Do not point local development at production data.

Add private values to `apps/backend-api/.env.development.local`:

```dotenv
JWT_ACCESS_SECRET=<unique-generated-development-secret>
JWT_REFRESH_SECRET=<different-generated-development-secret>
ADMIN_CREATION_SECRET=<another-generated-development-secret>
# Set these to the team's development administrator identity when testing admin setup.
MASTER_ADMIN_EMAIL=<development-admin-email>
MASTER_ADMIN_PHONE=<development-admin-phone>
MASTER_ADMIN_PIN=<your-six-digit-development-pin>
```

Replace every angle-bracket placeholder before running. Generate each secret separately:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

| Variable | Requirement |
| --- | --- |
| `BASE_URL` | Required API origin; use `http://localhost:5000`. |
| `JWT_ACCESS_SECRET` | Required; legacy `JWT_SECRET` is accepted as a fallback. Prefer the explicit access secret. |
| `JWT_REFRESH_SECRET` | Required, separate from the access secret. |
| `ADMIN_CREATION_SECRET` | Required by configuration validation. |
| `MONGO_URI_DEV` or `MONGO_URI` | Required; development prefers `MONGO_URI_DEV`. The database must be reachable. |
| `REDIS_URL` | Required by server startup; Redis must be reachable. |
| `MASTER_ADMIN_PIN` | Must be exactly six digits when supplied. Development currently has a fallback; set your own for administrator workflows. |
| `MASTER_ADMIN_EMAIL`, `MASTER_ADMIN_PHONE` | Administrator identity configuration; setting them alone does not guarantee an account has been provisioned. |

Other variables in `.env.example` are feature-specific: Google login needs its enabled flag/client credentials/callback, email needs SMTP configuration, payments need test provider credentials, and live hotel suppliers need their own credentials. Storage, encryption (`PII_ENCRYPTION_KEY`), and tenant integration settings must match the workflows and existing data you use. Do not invent or rotate an encryption key for an existing database. Starting the server does not mean all external integrations are configured.

For client-specific environments, retain the existing canonical `.env.<client-slug>.local` and the [tenant launcher](scripts/local/tenant.mjs). Use isolated client databases/runtime credentials and ports; do not copy a provisioning credential into tenant runtime access.

## 5. Frontend environment examples

For an app with no development file, copy its reference first, then replace production settings before launching it. This command preserves an existing file:

```bash
[ -f apps/app-shell/.env.development ] || cp apps/app-shell/.env.example apps/app-shell/.env.development
```

Repeat for each app you plan to run. A copied `.env.example` is **not ready for localhost** until you update the URLs and cookie settings.

### Customer shell: `apps/app-shell/.env.development`

Adapted from its [.env.example](apps/app-shell/.env.example):

```dotenv
PORT=3006
REACT_APP_PORTAL_ENV=development
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_REALTIME_ENABLED=true
REACT_APP_REALTIME_URL=http://localhost:5000
REACT_APP_REALTIME_PATH=/socket.io
REACT_APP_AUTH_APP_URL=http://localhost:3013
REACT_APP_SHELL_URL=http://localhost:3006
REACT_APP_TREVIO_URL=http://localhost:3005
REACT_APP_TREVIO_REMOTE_ENTRY=http://localhost:3005/remoteEntry.js
REACT_APP_TREVISTA_URL=http://localhost:3001
REACT_APP_TREVISTA_REMOTE_ENTRY=http://localhost:3001/remoteEntry.js
REACT_APP_TREHUB_URL=http://localhost:3008
REACT_APP_TREHUB_REMOTE_ENTRY=http://localhost:3008/remoteEntry.js
REACT_APP_DASHBOARD_URL=http://localhost:3017
REACT_APP_DASHBOARD_REMOTE_ENTRY=http://localhost:3017/remoteEntry.js
REACT_APP_THEME_COOKIE_DOMAIN=
```

### AuthTREM: `apps/auth-trem/.env.development`

Adapted from its [.env.example](apps/auth-trem/.env.example), with the current local port:

```dotenv
PORT=3013
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ADMIN_SHELL_URL=http://localhost:3002
REACT_APP_PARTNER_SHELL_URL=http://localhost:3004
REACT_APP_SHELL_URL=http://localhost:3006
REACT_APP_TRAVELSTREM_APP_URL=http://localhost:3006
REACT_APP_TREVISTA_URL=http://localhost:3001
REACT_APP_TREVIO_URL=http://localhost:3005
REACT_APP_TREHUB_URL=http://localhost:3008
REACT_APP_BOOKING_ENGINE_URL=http://localhost:3007
REACT_APP_COMPANY_NAME=TravelsTREM
REACT_APP_MASTER_ADMIN_EMAIL=
REACT_APP_THEME_COOKIE_DOMAIN=
```

### Dashboard: `apps/dashboard-remote/.env.development`

Adapted from its [.env.example](apps/dashboard-remote/.env.example):

```dotenv
PORT=3017
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AUTH_APP_URL=http://localhost:3013
REACT_APP_REALTIME_ENABLED=true
REACT_APP_REALTIME_URL=http://localhost:5000
REACT_APP_REALTIME_PATH=/socket.io
REACT_APP_THEME_COOKIE_DOMAIN=
```

### Other frontend apps

Use each app's linked example in the port table. Preserve its key set and replace matching production origins using this map:

| Production origin | Local origin |
| --- | --- |
| `https://api.travelstrem.com` | `http://localhost:5000` |
| `https://auth.travelstrem.com` | `http://localhost:3013` |
| `https://app.travelstrem.com` | `http://localhost:3006` |
| `https://dashboard.travelstrem.com` | `http://localhost:3017` |
| `https://admin.travelstrem.com` | `http://localhost:3002` |
| `https://partner.travelstrem.com` | `http://localhost:3004` |
| `https://trevista.travelstrem.com` | `http://localhost:3001` |
| `https://trevio.travelstrem.com` | `http://localhost:3005` |
| `https://trehub.travelstrem.com` | `http://localhost:3008` |
| `https://booking.travelstrem.com` | `http://localhost:3007` |
| `https://pay.travelstrem.com` | `http://localhost:3018` |

Keep `/api` and `/remoteEntry.js` suffixes where present. Set `REACT_APP_PORTAL_ENV=development` where the example defines it, clear `REACT_APP_THEME_COOKIE_DOMAIN`, and set the app's port from the table. Marketing/about links can remain public website links. Keep `localhost` consistent across browser app URLs; mixing it with `127.0.0.1` creates different cookie hosts. Database/Redis connection hostnames may still use `127.0.0.1`.

## 6. Start dependencies and applications

Start your development MongoDB service using your existing installation or connect to your configured development Atlas database.

If Redis is installed and not already running, start a local-only instance in its own terminal:

```bash
redis-server --bind 127.0.0.1 --port 6379
```

In another terminal, verify it:

```bash
redis-cli -h 127.0.0.1 -p 6379 ping
```

Expected response: `PONG`. Do not start another instance if that port is already occupied.

Start the backend in its own terminal and wait for database/Redis initialization and the listening message:

```bash
pnpm --filter @apps/backend-api dev
```

For customer-shell sign-in and account pages, start these in separate terminals:

```bash
pnpm --filter @apps/auth dev
pnpm --filter @apps/dashboard-remote dev
pnpm --filter @apps/app-shell dev
```

Open [the customer app](http://localhost:3006). Sign in should open [AuthTREM](http://localhost:3013/login), then return to the customer app.

Start product remotes before opening their corresponding routes:

```bash
pnpm --filter @apps/trevista dev
pnpm --filter @apps/trevio dev
pnpm --filter @apps/trehub dev
```

Additional workflows use:

```bash
pnpm --filter @apps/admin dev
pnpm --filter @apps/partner dev
pnpm --filter @apps/booking-engine dev
pnpm --filter @apps/payment-app dev
```

Each command above is a long-running process; use separate terminals. Once every application's environment is prepared, `pnpm apps` starts the apps workspace through Turbo. `pnpm dev` is broader and also starts other packages/websites with dev scripts; it is not the minimal customer-app setup.

## 7. Verify and troubleshoot

- Check that backend requests such as `/api/tenant-config` respond, and that the requested remote's `/remoteEntry.js` loads from its configured local port.
- Verify Sign in opens port **3013**, and test the return to the original app after authentication.
- Test the startup loader at [localhost:3006/?startupDelay=30000](http://localhost:3006/?startupDelay=30000). It holds the loading view for 30 seconds and switches to wake-up messaging after 10 seconds. This preview only applies in localhost development; remove the parameter for normal loading. It does not simulate a successful backend or repair missing services.

| Symptom | Check/fix |
| --- | --- |
| `Missing BASE_URL` | Create the backend development file; use `BASE_URL=http://localhost:5000`. |
| Missing JWT/admin secret | Fill the required backend private values, then restart. Do not weaken validation. |
| `REDIS_URL is required` | Set `REDIS_URL=redis://127.0.0.1:6379` and verify `PONG`. |
| Redis connection refused | Start Redis or correct its configured host/port/credentials. |
| MongoDB connection/authentication failure | Check the development URI, database service, credentials, and Atlas network access where applicable. |
| Sign in shows COB Universe | A stale auth URL still targets 3003. Update that app's local `REACT_APP_AUTH_APP_URL` to 3013 and restart its dev server. |
| Remote unavailable / `remoteEntry.js` failure | Start that remote and confirm the configured URL and port. |
| Login does not retain session | Clear production cookie-domain settings locally; verify matching hostnames and API/CORS URLs. |
| Loader eventually shows connection error | Startup recovery is bounded; inspect the backend terminal and failed network requests. |
| Env edit has no effect | Check higher-priority local/process overrides and restart the relevant process. |

Environment setup is complete only when the services connect and the intended browser workflow succeeds; a frontend compiling is not sufficient.
