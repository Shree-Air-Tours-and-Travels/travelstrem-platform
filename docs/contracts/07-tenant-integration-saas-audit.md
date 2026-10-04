# Tenant integration SaaS audit — 4 October 2026

## Verdict

A reusable integration foundation exists, but production SaaS readiness is incomplete. Supported tenants should be configured using the existing integration profile, deployment secrets, products and themes. Unsupported providers require an adapter. This review covers the principal configuration/runtime paths, not a certification of every file or deployed infrastructure permission.

The current isolation model is one physical database and backend process per tenant. Database resolution occurs at deployment/provisioning time; browser requests never select database credentials. Requests resolve tenant/products, load the environment-specific integration profile, enter integration context and invoke existing factories. Keep this model rather than introducing an unrelated database router.

## Existing implementation retained

| Area                  | Implementation                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Tenant configuration  | Platform Client registry; restricted tenantconfigurations snapshot; products/modules, domains, roles, theme, branding and versions |
| Database isolation    | tenantDatabase.service, tenancy runtime middleware, collection role generation and effective-grant checks                          |
| App Shell             | tenantDeployment selects standalone for one supported product, shell for multiple products                                         |
| Travel                | Existing provider contracts, flight/hotel factories, governor and Hotelbeds/StayingAPI/Trekko adapters                             |
| Payment               | FinancialEngine, Razorpay adapter, payment sessions, signature validation and webhook idempotency                                  |
| Storage               | Existing DocumentStorageService with S3/R2, private objects and signed URLs                                                        |
| Email                 | Existing Nodemailer provider and email service                                                                                     |
| Integration lifecycle | modules/integrations profile, capability registry, secret references, validate/test/activate routes and request context            |
| Audit                 | Existing AuditLog service, extended rather than replaced                                                                           |

## Findings and fixes

| Severity | Gap                                                                                | Status                                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Critical | Draft/suspended profile lookup could silently fall back to environment credentials | Fixed: load the profile regardless of state; deny inactive entries and suspended profiles.                                                                         |
| Critical | Tenant options could redirect managed credentials to another endpoint              | Fixed: public options allow only bounded timeouts; endpoints stay deployment-controlled. Cloud egress restrictions remain necessary.                               |
| High     | Missing tenant hotel credentials could borrow managed credential fields            | Fixed: profile credentials no longer fall back field-by-field.                                                                                                     |
| High     | Secret references could select unrelated environment secrets                       | Fixed current env resolver to require TENANT_INTEGRATION_* references. Supply only this tenant's secrets to its runtime.                                           |
| High     | Update queries bypassed duplicate-entry document validation                        | Fixed: validate a candidate profile document before persistence.                                                                                                   |
| High     | Activation trusted an earlier validation after secrets changed                     | Fixed: revalidate the current materialized entry during activation. Live connection testing remains adapter-dependent.                                             |
| High     | Configuration mutation could precede any audit record                              | Added audited change/activation intent before mutation; completion records remain separate, not an atomic outbox.                                                  |
| High     | Payment provider argument could disagree with tenant selection                     | Fixed: reject the mismatch before using credentials.                                                                                                               |
| High     | Logger and audit sanitization missed API/access keys                               | Added shared logger redaction, URI credential redaction and known environment-secret removal; extended audit key sanitization. Legacy direct console calls remain. |
| Medium   | Public readiness exposed database name                                             | Removed physical database name from public health response.                                                                                                        |

## Remaining gaps

| Severity | Gap and required follow-up                                                                                                                                                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Background jobs may run without request integration context. Fixed for the current booking-clock timer with explicit capture/restore and fail-closed helpers; future queues, schedules and exports must use the same contract.                                                      |
| High     | At-rest encryption of deployment secrets is infrastructure-owned. Production env-secret resolution now fails closed without an explicit encrypted-store declaration; provider-console/KMS release evidence is still required. Profiles store references, not plaintext credentials. |
| High     | Only env JSON secret resolution is currently implemented; AWS/GCP/Vault secret-store adapters are not complete.                                                                                                                                                                     |
| High     | Fixed: activation requires and reruns a bounded adapter live test. Hotel supplier status/search, SMTP authentication, S3/R2 bucket access and Razorpay read-only order listing are supported. Live credentials are still required to produce deployment acceptance evidence.        |
| High     | Production checkout remains explicitly disabled by existing backend policy. Keys alone do not enable production payments.                                                                                                                                                           |
| High     | The only registered flight implementation is mock. Live flights require a contracted supplier adapter.                                                                                                                                                                              |
| Medium   | Stripe, GCS and direct SES/SendGrid adapters are absent. Existing supported paths are Razorpay, S3/R2 and SMTP-compatible mail.                                                                                                                                                     |
| Medium   | External tour-provider orchestration is incomplete despite an existing TourProvider contract. Preserve owned inventory flows.                                                                                                                                                       |
| Medium   | TreCare, all admin aliases and App Shell resource paths need an exhaustive entitlement matrix and second-tenant acceptance. Existing middleware is not proof of every route.                                                                                                        |
| Medium   | Secret rotation/cache invalidation and retries/circuit breakers are not uniform. Revalidate/version or restart after rotation.                                                                                                                                                      |
| Medium   | Environment aliases are not normalized everywhere. Use exact development/test/staging/production profile values.                                                                                                                                                                    |
| Medium   | Managed defaults remain legacy environment defaults where no profile entry exists. Make managed ownership explicit for newly onboarded tenants. Invalid configured entries must never fall back.                                                                                    |
| Low      | Legacy branding and direct logging consumers remain outside the converted runtime paths.                                                                                                                                                                                            |

## Migration and environment requirements

1. Refresh the collection-scoped tenant runtime role to include tenantintegrationprofiles. Keep provisioning credentials off tenant runtimes. No destructive migration was executed.
2. Put each client's JSON credential object in an encrypted deployment secret environment variable named TENANT_INTEGRATION_<NAME>. Reference it as env:TENANT_INTEGRATION_<NAME>; never put credentials in options, frontend variables or committed files.
3. Use the client-master API /api/tenant-management/integration-profile. Save entries with capability/provider/ownership/secretRef; validate, test where supported, then activate the capability. Ownership is travelstrem or tenant.
4. Options accept only integer timeoutMs/requestTimeoutMs from 1000 to 60000. Move existing endpoint or credential options to trusted deployment configuration before saving an older profile.
5. No separate TENANT_INTEGRATIONS manifest is required. The overlapping draft approach was removed in favour of the existing profile architecture.
6. Existing deployments without a profile retain legacy deployment settings. No production secrets, cloud grants or live webhooks were changed during this audit.

## Validation and changed files

Focused backend checks covered draft/disabled/suspended denial, unenrolled capabilities, restricted secret references, options and duplicate validation, and logger redaction. No browser or full repository suite/build was run. An optional route import stopped at the existing Missing BASE_URL environment requirement; that was not a successful runtime check.

Principal files changed: modules/integrations/runtime.js, secretStores.js, routes.js and models/TenantIntegrationProfile.js; hotel provider.config.js; payment providers/registry.js; core/logger/index.js and redact.js; tenancy/audit.service.js; config/mail.js; bootstrap/routes.js; client integrationReadiness.js. Existing integration wiring and pre-existing user edits were preserved.

## Recommended next improvement

Run the provider tests with each client's real sandbox credentials and retain redacted evidence, then complete the second-tenant acceptance matrix across requests, webhooks and background jobs. Do not introduce another configuration or adapter system.

## Follow-up validation hardening

- Fixed adapter error responses that could expose arbitrary provider messages/codes in API or audit results.
- Added explicit validation scope to results and persisted profile validation metadata. An additive field requires no data rewrite; older validations default to configuration-only.
- Added bounded read-only S3/R2 bucket connection tests through the existing registry and AWS SDK; no extra dependency. Temporary clients/transports are closed.
- Removed the successful no-op mock-flight connection test. Configuration-only support is not presented as credential verification.
- Focused error-redaction and scope checks passed without external requests. Actual cloud/SMTP tests require the configured client credentials and were not executed here.

## Background-context follow-up

Booking-clock execution now refreshes captured tenant/profile state, preventing continued use of a stale snapshot after suspension or configuration changes. Enquiry cleanup and startup SMTP verification use the same context helper. Platform/tenant deployment mismatches are rejected. These paths use the shared redacting logger for worker failures.

Focused checks passed for missing/cross-tenant contexts, platform execution and async context cleanup. Database-backed revocation checks and other external workers remain unverified. No database migration or new environment variable is required for this change.
