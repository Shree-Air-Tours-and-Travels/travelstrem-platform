# TravelsTrem Product Ecosystem Architecture

TravelsTrem is the parent company and shared platform. It is not a booking product.

The active customer-facing products are:

- Trevio — community trips, adventures, treks, expeditions, events, and travel communities.
- Trevista — holiday packages, itineraries, customized planning, and package booking.

No other customer-facing products are part of the active launcher for now. Do not add flights, hotels, cabs, visa, passport, insurance, or documentation flows to the active customer shell until those products are intentionally restored.

## Parent website

`apps/customer-shell` currently behaves as the TravelsTrem parent website.

Responsibilities:

- Company homepage
- Product discovery
- About/contact/dashboard
- Authentication entry points
- Shared platform messaging

The parent site should not mount product apps through module federation. Product cards and product menu items launch Trevio or Trevista in a new browser tab.

## Active product apps

Each product owns its own routing, header, footer, branding, and UX:

- Trevio: `apps/trevio-remote`
- Trevista: `apps/trevista-remote`

They can continue to share packages and backend services, but product UI should stay inside the owning product app.

## Shared backend

The backend remains a single source of truth. Trevio and Trevista should use the same booking journey contracts wherever possible so the booking backend can remain shared.

Shared backend domains include:

- Auth
- Users
- Trips/packages
- Bookings
- Payments
- Wallet
- Support
- Notifications
- Media
- Analytics

## Direction

Move from “one customer app with many travel features” to:

TravelsTrem parent platform → independent product apps → shared backend and shared packages.
