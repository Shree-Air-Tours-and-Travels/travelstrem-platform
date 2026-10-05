# Client development and deployment

This runbook covers a client tenant from TravelsTREM master configuration through local development and production handover. Each client uses its own backend process, database credentials, integration secrets, domains and frontend deployment. Browser input must never select a tenant database.

## Local development

Every deployable app contains a committed `.env.example` listing only that app's deployment variables. Its ignored `.env.development` uses the same key set with local real values. Copy the example when preparing a new environment, then provide values through the deployment platform; do not commit `.env.development` or create separate `.env.production` and `.env.test` files.

### First client setup

1. Install the existing workspace dependencies with `pnpm install`.
2. Configure the platform backend development environment and database.
3. In the platform admin, register the client, products, modules, local domains and client master administrator.
4. Put the provisioning database URI and the collection-scoped runtime URI in the local uncommitted environment files described by `scripts/local/tenant.mjs`.
5. Provision the tenant once:

   ```bash
   node scripts/local/tenant.mjs <client-slug> --invite-admin
   ```

6. Start the tenant:

   ```bash
   node scripts/local/tenant.mjs <client-slug>
   ```

   for ex: node scripts/local/tenant.mjs shree-air

The launcher reads the registered client configuration, verifies local-only origins, selects a standalone product or App Shell, starts only the required portals/remotes, and writes generated JWT secrets to `.env.tenant-<client-slug>.local` with owner-only permissions. Add client-specific sandbox provider values only to that uncommitted file.

Use `--backend-only` when frontend processes are not needed. Do not reuse platform provisioning credentials in the tenant runtime.

### Multiple clients in development

Register a separate local domain/port set and runtime database credential for every client. Then run one launcher per client in a separate terminal:

```bash
node scripts/local/tenant.mjs client-a
node scripts/local/tenant.mjs client-b
```

Each process must have a unique API port and frontend ports. Keep one `.env.tenant-<slug>.local` file per client. Do not combine clients in one backend process, share JWT secrets, or add a client switcher to browser requests. If machine capacity is limited, run only the client under development and use `--backend-only` for another client used in API isolation checks.

## End-to-end deployment from TravelsTREM infrastructure

1. **Register** — create the client in the platform master, assign products/modules, client master, branding and production domains.
2. **Provision data** — create the dedicated database and collection-scoped runtime role. Store provisioning credentials only in TravelsTREM operations; deploy the runtime with the restricted URI.
3. **Create secrets** — create environment-specific JWT, cookie, PII, Redis, SMTP, storage, supplier and payment secrets in the deployment provider's encrypted secret store. Never copy them into client records or frontend variables.
4. **Record encryption evidence** — verify encryption at rest in the provider console, record the provider/resource, KMS key or provider-managed encryption mode, environment, verifier and date in the release evidence, then set `DEPLOYMENT_SECRET_STORE_PROVIDER` and `DEPLOYMENT_SECRET_STORE_ENCRYPTED_AT_REST=true` on the backend. Production tenant secrets fail closed without this declaration.
5. **Configure integration profiles** — store only `env:TENANT_INTEGRATION_*` references in the tenant profile. Run configuration validation and the adapter's non-destructive live test. Activation reruns the live test; adapters without one cannot be activated.
6. **Deploy backend** — deploy one tenant backend with `TENANT_CLIENT_ID`, the restricted database URI, exact `PORTAL_ENV`, tenant URLs, CORS/cookie settings and backend-only secrets.
7. **Deploy frontends** — use the standalone product for exactly one supported product; otherwise deploy App Shell plus the enrolled remotes. Treat `REACT_APP_*` values as build-time public values.
8. **Configure edge** — add DNS and TLS, then verify cookie domain/SameSite, CORS origins, remote-entry content types and SPA fallback rules.
9. **Accept integrations** — with sandbox/live acceptance accounts, verify supplier search and booking lifecycle, payment signature and duplicate webhooks, private document upload/download, signed URL expiry, and SMTP identity/delivery. Retain redacted timestamps, correlation IDs and provider request IDs as release evidence.
10. **Accept tenancy** — test tenant and platform scope rejection, disabled product APIs, background booking-clock work, and a second client with different credentials. Confirm no cache, realtime event, document or database record crosses tenants.
11. **Handover** — document owners, rotation/revocation, backups, restore drill, monitoring, incident contacts and rollback. Production payment remains governed by the backend environment policy.

No destructive data migration is required. Existing clients can be configured incrementally; regenerate the runtime database role when a newly required collection is introduced.
