# Flights provider integration

TravelsTREM owns the public flight contract. Controllers call `FlightService`, which calls the provider selected by `flight-provider.factory.js`. A provider must return the normalized models defined in `flight.types.js`; provider payloads and credentials must never leave its adapter.

## Mock mode

```env
FLIGHT_PROVIDER=mock
MOCK_FLIGHT_MIN_LATENCY_MS=300
MOCK_FLIGHT_MAX_LATENCY_MS=1200
MOCK_FLIGHT_FORCE_ERROR=
```

`MOCK_FLIGHT_FORCE_ERROR` is development-only and accepts `PRICE_CHANGED`, `SEAT_UNAVAILABLE`, `FARE_UNAVAILABLE`, `FLIGHT_UNAVAILABLE`, `PROVIDER_TIMEOUT`, or `BOOKING_FAILED`.

## Adding a production provider

1. Add an adapter under `apps/backend-api/src/modules/flights/providers/<provider>/` that implements `FlightProvider`.
2. Keep the supplier SDK, authentication, request mapping, and response mapping inside that folder.
3. Register the adapter in `flight-provider.factory.js`.
4. Set `FLIGHT_PROVIDER` to the registered provider name.
5. Add adapter contract tests using recorded/synthetic fixtures without calling the real supplier.

Controllers, `FlightService`, Redis keys, database snapshots, and frontend components must not change when an adapter is replaced.

## Production credentials

Credentials are server-only. Exact names can be mapped inside the future adapter; expected configuration is:

```env
# Amadeus
FLIGHT_PROVIDER=amadeus
AMADEUS_API_KEY=
AMADEUS_API_SECRET=
AMADEUS_API_BASE_URL=

# Travelport
FLIGHT_PROVIDER=travelport
TRAVELPORT_CLIENT_ID=
TRAVELPORT_CLIENT_SECRET=
TRAVELPORT_ACCESS_GROUP=
TRAVELPORT_API_BASE_URL=

# Sabre
FLIGHT_PROVIDER=sabre
SABRE_CLIENT_ID=
SABRE_CLIENT_SECRET=
SABRE_PCC=
SABRE_API_BASE_URL=
```

Only the variables for the selected provider are required. Never add these values to a frontend `.env` file or expose them through page contracts.

## Public API

- `POST /api/flights/search`
- `GET /api/flights/search/:searchId/results`
- `GET /api/flights/search/:searchId/offers/:offerId`
- `POST /api/flights/revalidate`
- `GET /api/flights/offers/:offerId/seat-map`
- `POST /api/flights/bookings`
- `GET /api/flights/bookings/:bookingId`
- `GET /api/flights/bookings/pnr/:pnr`
- `POST /api/flights/bookings/:bookingId/cancel`
- `GET /api/flights/airports/search?q=`

Searches and offers expire after 15 minutes. Permanent bookings retain passenger, segment, fare, price, baggage, seat, extras, and provider-reference snapshots in the primary database.
