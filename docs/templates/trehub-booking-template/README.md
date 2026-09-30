# TreHub Flights & Hotels Booking Engine — V2

This is a responsive, zero-build frontend prototype for a production-style flight and hotel booking flow.

## Hotel flow

1. Home search
2. Hotel results
3. Full hotel details
4. Room selection
5. Room details
6. Guest/contact details
7. Booking review
8. Payment
9. Payment failure/retry
10. Confirmation
11. My bookings
12. Booking management and cancellation request

## Flight flow

1. Home search
2. Flight results
3. Full outbound/return itinerary
4. Fare selection and fare rules
5. Traveller/passport details
6. Seat selection
7. Meal selection
8. Extra baggage
9. Final booking review
10. Payment
11. Payment failure/retry
12. Confirmation
13. My bookings
14. Booking management and cancellation request

## Running the template

Open `index.html` directly in a browser. No build step is needed.

## Technical notes

- Vanilla HTML, CSS, and JavaScript
- Lucide icons loaded from CDN
- Inter font loaded from Google Fonts
- Unsplash image URLs used for hotel imagery
- All navigation and state transitions are implemented in-browser
- Payment actions are simulations only

## Backend integration points

Replace local state and mock handlers with:

- Flight/hotel availability APIs
- Pricing and revalidation APIs
- Fare and cancellation-rule APIs
- Traveller/guest validation
- Seat map, meal, and baggage APIs
- Payment gateway SDK and webhook handling
- Booking creation and retrieval endpoints
- Voucher, invoice, and ticket generation
- Authentication and customer profile APIs
