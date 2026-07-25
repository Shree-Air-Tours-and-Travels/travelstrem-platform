# TravelsTREM Product Architecture

TravelsTREM is the parent platform, not a customer-facing travel product. It provides shared capabilities used by the product ecosystem:

- Authentication and accounts
- Wallet, rewards, payments, and notifications
- AI services, support, analytics, CRM, documents, media, maps, and shared APIs/UI

## Products

| Product | Domain | Ownership | Current state |
| --- | --- | --- | --- |
| Trevio | `trevio.travelstrem.in` | Community trips, adventures, treks, expeditions, events, and communities | Active product app |
| Trevista | `trevista.travelstrem.in` | Holiday packages, itineraries, and customized planning | Active product app |

## Implementation rules

Product metadata is centralized in `apps/customer-shell/src/products/productCatalog.js`. During the migration the folder remains `apps/customer-shell`, but the package identity is `@apps/travelstrem` and the app behaves as the TravelsTrem parent website.

The parent website owns company pages, product discovery, shared navigation, authentication entry points, support, and platform widgets. Product-specific capabilities belong inside product applications and should not be added to the parent website.

The existing tour/package APIs remain available internally for compatibility, but product UI belongs in the product applications. TravelsTrem should launch Trevio and Trevista in their own tabs instead of mounting them through customer-shell federation.

Trevio and Trevista are the active product boundaries. Do not add flights, hotels, cabs, visa, passport, insurance, or documentation services to the active customer launcher until those products are intentionally restored.

## Target monorepo direction

Future product frontends should converge on:

```text
apps/
  travelstrem/
  trevio/
  trevista/
  admin/
  partner/
  auth/

packages/
  auth/
  wallet/
  rewards/
  notifications/
  ai/
  payment/
  booking-engine/
  trip-engine/
  package-engine/
  customer-support/
  analytics/
  shared/
```

The existing workspace package names are retained until their APIs are migrated, avoiding a breaking bulk rename. New reusable business logic should be added to shared packages, while product UI and workflows stay in their owning app.
