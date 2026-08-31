# TravelsTREM Financial Engine

This document describes the architecture, operating model, development workflow, and production-readiness requirements for the TravelsTREM Financial Engine.

## Purpose

The engine is the backend financial kernel for TravelsTREM. All pricing, commission, tax, gateway fees, route fees, quotes, payments, refunds, settlements, ledger entries, and margin calculations must flow through:

```js
import FinancialEngine from "../core/financial-engine/index.js";
```

Controllers and product modules must not calculate percentages or monetary totals themselves. Reusable quote and payment services are adapters into the engine. Do not add financial rules to those adapters.

The engine is independent of Express, request/response objects, and product controllers. Database repositories and payment providers are dependency-injected by `src/bootstrap/financialEngine.js`.

## Public API

The supported application-facing API is:

```js
FinancialEngine.calculateBookingFinancials(input);
FinancialEngine.calculateQuote(input);
FinancialEngine.createQuote(input);
FinancialEngine.createPayment(input);
FinancialEngine.processPayment(input);
FinancialEngine.calculateSettlement(input);
FinancialEngine.createSettlement(input);
FinancialEngine.calculateRefund(input);
FinancialEngine.processRefund(input);
FinancialEngine.resolveConfig(input);
FinancialEngine.ledger.record(entry);
```

Product modules should not import financial persistence models to bypass these methods.

## Framework layout

```text
src/core/financial-engine/
├── index.js
├── constants/
├── engine/
│   ├── calculator.js
│   ├── orchestrator.js
│   └── resolver.js
├── models/
│   ├── PaymentConfig.js
│   ├── AgencyMerchantConfig.js
│   ├── PaymentProviderConfig.js
│   ├── FinancialLedgerEntry.js
│   └── FinancialSettlement.js
├── providers/
│   ├── payment.provider.interface.js
│   └── razorpay.provider.js
├── services/
└── utils/
```

## Money and percentage rules

- All amounts inside the engine are safe integers in paise.
- `₹1` is `100` paise.
- Percentages are integer basis points: `1000` is 10%, `1800` is 18%.
- Floating-point amounts are rejected at the engine boundary.
- Conversion to or from legacy rupee fields happens only in compatibility adapters.
- Rounding uses deterministic integer half-up arithmetic.
- A persisted financial snapshot is never recalculated using newer configuration.

Example:

```js
const result = await FinancialEngine.calculateBookingFinancials({
  agentAmountMinor: 10_000_000,
  config: {},
});
```

With the default 10% commission and 18% GST-on-commission configuration:

```text
Agent amount          ₹1,00,000
Commission              ₹10,000
Platform GST              ₹1,800
Customer payable       ₹1,11,800
Agent settlement       ₹1,00,000
Platform margin          ₹10,000
```

`calculateBookingFinancials()` always returns these top-level sections:

```js
{
  (agent, platform, customer, gateway, route, settlement);
}
```

## Configuration resolution

Configuration is deep-merged. More specific values override less specific values without discarding unrelated fields.

The effective precedence, from lowest to highest, is:

1. built-in defaults
2. global configuration (`GLOBAL:default`)
3. payment-provider overrides
4. agency merchant-route overrides
5. agency configuration
6. tour configuration
7. booking configuration
8. explicit trusted server-side overrides

External modules must call `FinancialEngine.resolveConfig()` instead of reading configuration collections directly.

Every quote stores:

- `configSnapshot`
- `financialSnapshot`
- `pricingSnapshot`
- `moneyUnit: "PAISE"`
- an idempotency key

Payments, refunds, settlements, and ledger entries use the stored snapshot. Changing a global commission or tax rate affects new quotes only.

## Financial lifecycle

```text
Master configuration
        ↓
Agent/product amount
        ↓
FinancialEngine.calculateQuote()
        ↓
FinancialEngine.createQuote() — immutable snapshots stored
        ↓
Customer accepts quote
        ↓
FinancialEngine.createPayment()
        ↓
Razorpay order / manual payment workflow
        ↓
Verified webhook → FinancialEngine.processPayment()
        ↓
Idempotent ledger entries
        ↓
Pending settlement record
        ↓
Refund/reversal adjustments when applicable
```

### Quote rules

- Client-supplied monetary totals are not authoritative.
- Selected inventory and stored configuration produce the quote.
- Creating a quote stores configuration and financial snapshots.
- Historic quotes are not recalculated after a configuration change.
- Quote expiry is controlled by `BOOKING_QUOTE_TTL_MINUTES`.

### Payment rules

- Online payment amounts come from the accepted quote or booking balance.
- `X-Idempotency-Key` is required when creating an online payment.
- Reusing the same idempotency key returns the existing payment.
- Non-manual providers must be configured before an order can be created.
- A captured webhook amount must exactly match the pending payment amount.
- Browser callbacks are not considered proof of payment; the verified webhook is authoritative.

### Ledger rules

The ledger is append-only and supports:

```text
CUSTOMER_PAYMENT
PLATFORM_COMMISSION
PLATFORM_GST
GATEWAY_FEE
ROUTE_FEE
AGENT_SETTLEMENT
REFUND
REVERSAL
```

Ledger idempotency keys are based on the payment or refund identity. A webhook retry cannot duplicate entries. Retrying after a process interruption also recreates any missing idempotent ledger or settlement records.

### Settlement rules

Payment processing creates a `FinancialSettlement` in `PENDING` state. Its snapshot records agent payable, platform margin, route cost, and gateway cost. Refunds mark pending settlements as adjusted and append reversal entries.

Important: the current engine calculates and persists settlement instructions. Actual bank payout/RazorpayX transfer execution and payout reconciliation require a separately configured payout provider and operational approval before automatic agent payouts can be enabled.

### Refund rules

- Full and partial refund amounts are supported.
- A refund cannot exceed the remaining refundable balance.
- Commission, platform GST, gateway fees, and route fees are reversed according to the snapshotted refund policy.
- Refund ledger entries are immutable and idempotent.
- Online-provider refund behavior must be tested in Razorpay Test Mode before live refunds are enabled.

## Backend routes

The engine routes are mounted under `/api/engine`.

```text
POST /api/engine/quotes
POST /api/engine/:id/payments/online
POST /api/engine/payments/webhooks/razorpay
POST /api/engine/:id/payments/token-proof
GET  /api/engine/:id/detail
GET  /api/engine/:id/status
```

The Razorpay webhook endpoint must remain unauthenticated at the HTTP/session layer because Razorpay calls it directly. Authenticity is enforced using the raw request body and `X-Razorpay-Signature`.

Only `payment.captured` and `order.paid` events advance a payment. Other events are acknowledged without changing financial state.

## Environment variables

Never commit real values to `.env.example`, source files, frontend bundles, logs, tickets, or documentation. Production values must come from the deployment platform's encrypted secret store.

### Required application runtime variables

| Variable                | Required | Secret | Purpose                                                                         |
| ----------------------- | -------- | ------ | ------------------------------------------------------------------------------- |
| `NODE_ENV=production`   | Yes      | No     | Enables production behavior.                                                    |
| `BASE_URL`              | Yes      | No     | Public HTTPS backend origin.                                                    |
| `MONGO_URI`             | Yes      | Yes    | Production MongoDB connection. Use a least-privilege database user.             |
| `JWT_ACCESS_SECRET`     | Yes      | Yes    | Signs access tokens. `JWT_SECRET` is accepted only as a compatibility fallback. |
| `JWT_REFRESH_SECRET`    | Yes      | Yes    | Signs refresh tokens; must differ from the access secret.                       |
| `ADMIN_CREATION_SECRET` | Yes      | Yes    | Protects privileged admin provisioning.                                         |
| `MASTER_ADMIN_PIN`      | Yes      | Yes    | Six-digit production master-admin PIN.                                          |
| `FRONTENDS`             | Yes      | No     | Exact allowed frontend origins.                                                 |

### Required for Razorpay online payments

| Variable                    | Required    | Exposure                | Purpose                                                                                       |
| --------------------------- | ----------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `RAZORPAY_KEY_ID`           | Yes         | May be sent to checkout | Razorpay account identifier. Production must use a live-mode key.                             |
| `RAZORPAY_KEY_SECRET`       | Yes         | Backend only            | Authenticates server-to-server Razorpay API requests.                                         |
| `RAZORPAY_WEBHOOK_SECRET`   | Yes         | Backend only            | Verifies webhook HMAC signatures. This is configured independently when creating the webhook. |
| `RAZORPAY_API_BASE_URL`     | Recommended | Backend only            | Razorpay API root; defaults to the production API URL.                                        |
| `RAZORPAY_TIMEOUT_MS`       | Recommended | Backend only            | Server request timeout; defaults to 15000 ms.                                                 |
| `BOOKING_QUOTE_TTL_MINUTES` | Recommended | Backend config          | Quote lifetime; defaults to 20 minutes.                                                       |

Test and live Razorpay credentials are separate. Development keys normally start with `rzp_test_`; production must use the separately generated live credentials. Never copy test secrets into production or live secrets into developer machines.

`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` must never be returned to the frontend. Only `RAZORPAY_KEY_ID` is included in the checkout-order response.

### Strongly recommended production variables

| Variable                     | Reason                                                                    |
| ---------------------------- | ------------------------------------------------------------------------- |
| `REDIS_URL`                  | Shared rate limiting, CSRF/session state, and multi-instance consistency. |
| `PII_ENCRYPTION_KEY`         | Protects sensitive stored fields where encryption is enabled.             |
| `AUTH_COOKIE_DOMAIN`         | Correct secure-cookie scope across production applications.               |
| `RATE_WINDOW_MS`, `RATE_MAX` | Production abuse controls.                                                |
| SMTP variables               | Required if payment receipts and transactional email are enabled.         |
| R2 or Cloudinary variables   | Required for the selected production document/proof storage provider.     |

Production must keep the following disabled:

```env
DEV_OTP_BYPASS=false
MOBILE_AUTH_DEV_MODE=false
ENABLE_DEBUG_LOGS=false
```

Example placeholders are maintained in `apps/backend-api/.env.example`:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_API_BASE_URL=https://api.razorpay.com/v1
RAZORPAY_TIMEOUT_MS=15000
BOOKING_QUOTE_TTL_MINUTES=20
```

## Razorpay setup

### Development/staging

1. Enable Razorpay Test Mode.
2. Generate test API credentials.
3. Store them in `.env.development.local` or the staging secret store.
4. Configure a test webhook pointing to:

   ```text
   https://staging-api.example.com/api/engine/payments/webhooks/razorpay
   ```

5. Subscribe to `payment.captured` and `order.paid`.
6. Set a strong webhook secret and store the same value as `RAZORPAY_WEBHOOK_SECRET`.
7. Verify successful payments, invalid signatures, incorrect amounts, duplicate webhook events, refunds, and interrupted/retried processing.

### Production

1. Complete Razorpay account activation/KYC and confirm the production merchant entity.
2. Switch the Razorpay Dashboard to Live Mode.
3. Generate a new live key pair. Do not reuse test keys.
4. Store the key ID and secrets in the production secret manager.
5. Create a separate live webhook with the production HTTPS URL.
6. Subscribe only to required events.
7. Verify TLS, firewall rules, rate limits, and webhook reachability.
8. Perform a controlled low-value live payment and refund.
9. Reconcile the Razorpay payment, TravelsTREM payment record, ledger entries, and settlement record before opening general traffic.

## Development verification

From `apps/backend-api`:

```bash
npm test -- --runTestsByPath \
  src/tests/unit/financialEngine.test.js \
  src/tests/unit/bookingPricingV2.test.js
```

Run the complete backend suite:

```bash
npm test
npm run build
```

Smoke-test the default business example:

```bash
node --input-type=module -e 'import FinancialEngine from "./src/core/financial-engine/index.js"; const result=await FinancialEngine.calculateBookingFinancials({agentAmountMinor:10000000,config:{}}); console.log(JSON.stringify(result,null,2));'
```

Create an online order for an authenticated payable booking:

```bash
curl -X POST \
  "http://localhost:5000/api/engine/BOOKING_ID/payments/online" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: dev-payment-001" \
  -d '{}'
```

The browser checkout must use the returned `checkoutKeyId`, Razorpay order ID, integer amount, and currency. The backend webhook—not the browser success callback—confirms payment.

## Database preparation

The financial models require unique idempotency indexes and query indexes. The migration command is:

```bash
npm run migrate:financial-engine-indexes
```

Run it first against a backup/restorable staging database. The script uses Mongoose `syncIndexes()`, which may remove indexes that are not declared in the current schemas. Review the index diff and take a database backup before running it against production.

After migration, verify indexes for:

- payment configuration scopes and versions
- agency/provider configuration uniqueness
- quote and payment idempotency keys
- provider event IDs
- immutable ledger idempotency keys
- settlement idempotency keys

## Production rollout plan

1. Deploy the schema/index changes with online payments disabled at the traffic layer.
2. Seed and review global, agency, provider, and merchant configuration.
3. Confirm GST rules with finance/legal owners.
4. Confirm who bears gateway and route fees.
5. Confirm refundability rules for commission, GST, gateway fees, and route fees.
6. Configure test-mode Razorpay and complete staging certification.
7. Confirm the frontend uses only server-generated orders and amounts.
8. Configure live secrets and the live webhook.
9. Run a controlled live payment/refund and reconcile all records.
10. Enable online payment traffic gradually while monitoring errors and reconciliation.
11. Keep manual payment handling available as an operational fallback during initial rollout.

Do not automatically enable agent bank payouts until payout-provider execution, beneficiary verification, payout idempotency, failure recovery, and reconciliation have been implemented and approved.

## Go-live checklist

### Financial configuration

- [ ] Commission basis points are approved.
- [ ] Platform GST basis points and taxable base are approved.
- [ ] Gateway fee and gateway GST are separate from platform GST.
- [ ] Route fee and fee responsibility are approved.
- [ ] Refundability rules are approved.
- [ ] Global, agency, tour, and booking precedence has been tested.
- [ ] Existing accepted quotes retain their original snapshots after configuration changes.

### Razorpay and security

- [ ] Live `RAZORPAY_KEY_ID` is configured.
- [ ] Live `RAZORPAY_KEY_SECRET` is stored only in the backend secret manager.
- [ ] A unique production `RAZORPAY_WEBHOOK_SECRET` is configured.
- [ ] The webhook uses HTTPS and the correct production hostname.
- [ ] `payment.captured` and `order.paid` events are enabled.
- [ ] Invalid webhook signatures cause no state changes.
- [ ] Captured amount mismatch causes no state changes.
- [ ] Duplicate events create no duplicate ledger or settlement rows.
- [ ] Secrets are redacted from logs and observability tools.
- [ ] Secret rotation owners and procedures are documented.

### Data and operations

- [ ] Production database backup exists before index migration.
- [ ] Required indexes are present.
- [ ] Ledger mutation attempts are rejected.
- [ ] Partial and full refunds are tested.
- [ ] Payment-to-ledger-to-settlement reconciliation is tested.
- [ ] Alerts exist for webhook signature failures, payment processing failures, unmatched payments, and settlement failures.
- [ ] Finance has a process for daily reconciliation and exception handling.
- [ ] Automatic agent payouts remain disabled until a payout provider is production-approved.

## Monitoring and reconciliation

At minimum, monitor:

- Razorpay API latency and errors
- invalid webhook signatures
- duplicate webhook event counts
- pending payments older than the expected checkout window
- captured provider payments without a `CUSTOMER_PAYMENT` ledger entry
- ledger entries without a corresponding payment/refund
- pending or failed settlements
- negative platform margins
- refunds awaiting provider confirmation

Daily reconciliation should compare:

```text
Razorpay captured/refunded amounts
        ↕
BookingPayment records
        ↕
FinancialLedgerEntry totals
        ↕
FinancialSettlement allocations
```

Differences must be investigated; financial records should never be edited manually. Corrections must use new reversal or adjustment entries.

## Secret rotation

For API-key rotation:

1. Generate a new live key pair.
2. Update the secret manager and deploy/restart the backend.
3. Verify order creation with the new key.
4. Revoke the old key only after verification.

For webhook-secret rotation, account for retrying events signed with the previous secret. Prefer a controlled maintenance window or temporary dual-secret verification before retiring the old secret. Never silently accept unsigned webhooks.

## Ownership

Changes to calculation rules require:

1. a versioned configuration change or engine code change
2. unit tests with exact paise expectations
3. finance/tax approval where applicable
4. staging payment and refund verification
5. a reconciliation plan

Do not patch financial outcomes directly in controllers, database scripts, or frontend code.
