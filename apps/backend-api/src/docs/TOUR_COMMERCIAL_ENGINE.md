# Tour commercial builder and booking snapshot architecture

## Outcome

Tour pricing now has one backend authority. New tours define reusable supplier-cost components, an agent fee policy, GST on that fee, and Base/Standard/Premium packages. `FinancialEngine` derives the customer amount, financial breakdown, quote, and immutable booking snapshots. A displayed `₹34,000` is an output, never a package-total input.

Legacy tours continue to read and edit their historic `price` range until migrated. New component-priced tours store a derived legacy range solely so existing cards and search indexes keep working.

## Audit findings

Before this change:

- agent and master-admin Tour CRUD were separate seven-step forms with duplicated manual `price.min`/`price.max` logic;
- hotel stays, hotel upgrades, itinerary activities, extras, departures, and flights used incompatible amount fields and units;
- both form containers discarded all flight fields except `included` and `inventoryManaged` during submit;
- booking-detail card headings used different components between portals, producing oversized and inconsistently aligned headings;
- Booking V2 already stored quote pricing, configuration, and financial snapshots, but did not persist an explicit package/component selection snapshot on the booking;
- `CustomTourRequest` exists as a schema but has no registered controller or route. The operational custom-enquiry workflow currently runs through Booking + versioned `BookingQuote`; do not introduce a second calculator for it;
- customer checkout correctly creates a backend quote before booking, but legacy tours still use compatibility hotel/add-on adapters.

## Canonical tour contract

`Tour.commercial.version` selects the pricing path:

- `LEGACY`: historic manual range and adapters remain available.
- `COMPONENTS_V1`: all prices are calculated from `commercial.components` and `commercial.packages`.

Every component has a stable `componentKey`, type, status, explicit pricing unit, and supplier cost in paise. `sellingAmountMinor` remains a compatibility field for older tours; the new builder neither renders nor trusts it. Upgrades may use `replacesComponentKey`; when selected as an option, only the positive cost difference from the included component is charged.

Supported units are `FIXED`, `PER_BOOKING`, `PER_PERSON`, `PER_ADULT`, `PER_CHILD`, `PER_INFANT`, `PER_ROOM`, `PER_NIGHT`, `PER_ROOM_PER_NIGHT`, `PER_PERSON_PER_NIGHT`, `PER_VEHICLE`, `PER_TRIP`, `PER_DAY`, and `PER_GROUP`.

Component types cover accommodation, flights, activities, transfers, meals, sightseeing, visa, insurance, guides, tax, agent charges, and miscellaneous charges. Flight status can be `ESTIMATED`, `CONFIRMED`, or `REPRICE_REQUIRED`; any estimated line marks the package as requiring repricing.

Each enabled package has a stable key, one of `BASIC`, `STANDARD`, or `PREMIUM` (displayed as Base, Standard, Premium), included component keys, and optional component keys. The new flow configures all three.

## Calculation flow

```text
Tour component definitions
  + selected package
  + adults / children / infants
  + rooms / nights / vehicles / days
  + selected optional components
        ↓
FinancialEngine.calculateBookingFinancials()
        ↓
supplier component total + agent fee + GST on agent fee
        ↓
commission + platform GST + gateway/route responsibility
        ↓
customer payable + agent settlement + platform margin
```

All money arithmetic is integer paise. Percentage inputs are converted to integer basis points on the backend. Fixed-departure tours with flights publish three final package prices; custom tours expose the minimum as “starting from”; other or reprice-required configurations remain estimated. Departure price ranges are backend projections of the package totals.

## API and snapshots

- `POST /tours/:id/calculate` recalculates a package through `FinancialEngine`. Authenticated owners/admins receive cost and margin; other authenticated users receive selling values only.
- Booking quote creation accepts `packageKey` and `optionalComponentKeys` (or `selectedComponentKeys`).
- `BookingQuote.selections`, `.pricing`, `.configSnapshot`, and `.financialSnapshot` are the quote-time evidence.
- Quote consumption copies selection, pricing, configuration, and financial snapshots onto Booking. Later Tour edits cannot alter the accepted booking price.
- Commercial booking changes must be represented as append-only adjustments with a reason and actor. Reversals reference the original adjustment; never rewrite the accepted snapshot.

For custom travel, continue using the versioned `BookingQuote` workflow: request/enquiry → agent quote draft → new quote version → customer acceptance → booking snapshot. A revised quote supersedes rather than mutates an earlier quote.

## CRUD usage

The shared `CommercialPackageBuilder` from `@packages/trem-ui` is used by both agent and admin forms. It separates reusable components from package composition and provides a two-package default with an optional third package. Existing `LEGACY` tours still show their manual range inside a clearly labelled migration-only section; changing the shared builder converts them to `COMPONENTS_V1`.

Do not add product totals, commission, GST, fees, settlement, or margin calculations to these forms. UI values are previews only.

## Migration

First audit without writes:

```bash
pnpm --filter @apps/backend-api migrate:tour-commercial-pricing
```

Then explicitly mark old records as legacy:

```bash
pnpm --filter @apps/backend-api migrate:tour-commercial-pricing -- --apply
```

The migration deliberately does not invent supplier costs or package composition. Convert each important tour through CRUD, verify its components and margins, then publish it. Keep the compatibility `price` projection until every customer/search consumer reads `commercial.derived`.

## Production checklist

- Run the commercial migration audit and review every published legacy tour.
- Require confirmed supplier costs and at least two valid packages before publication.
- Verify FinancialEngine global, agency, tour, and booking configuration precedence.
- Configure Razorpay variables listed in `.env.example`: key ID, key secret, webhook secret, API base URL, and timeout. Merchant route accounts belong in `AgencyMerchantConfig`, not environment variables.
- Register the exact production webhook URL in Razorpay and enable payment/refund events used by the backend.
- Keep webhook raw-body signature verification enabled and rotate secrets through the deployment secret manager.
- Run financial-engine indexes and quote indexes migrations.
- Test quote expiry, replay/idempotency, partial/full refund, settlement deductions, route responsibility, estimated-flight repricing, package upgrade difference, and concurrent inventory reservation.
- Reconcile gateway reports against immutable ledger entries and settlements before enabling automated payouts.
- Restrict cost/margin fields to authorised agency staff and master admins.
- Monitor quote-to-payment conversion, webhook failures, ledger imbalance, settlement failures, refund reversals, and negative component margin.

## Safe rollout

1. Deploy additive schemas and calculation endpoint.
2. Mark historic tours `LEGACY`; do not infer cost data.
3. Create and test new tours with `COMPONENTS_V1` in development.
4. Convert a small set of published tours and compare quote totals to supplier contracts.
5. Enable package selection in customer UI by consuming `commercial.packages`; always request a backend quote.
6. Move remaining tours in batches, then remove migration-only manual price controls after usage reaches zero.
