# Plan: Three Linked Issues — Quote Amount, Timeline, Post-Acceptance Flow

## Issue 1: Surface `amountPayableNow` in Customer Quote Card

### Changes

1. **`packages/trem-ui/src/components/QuoteDisplay/QuoteDisplay.jsx`** — Add a second `totals` entry when `quote.amountPayableNow > 0`:
   - First total: "Amount Due Now" (the token/deposit amount)
   - Second total: "Total" (the full `finalAmount`)
   - This makes the component reusable for any caller that passes `amountPayableNow` on the quote object.

2. **`apps/app-shell/src/features/bookingDetail/BookingDetail.jsx`** — In the sidebar Trip Details card (lines ~456-468):
   - Replace `booking.paymentSummary?.total` with `latestQuote.amountPayableNow` when `latestQuote?.amountPayableNow > 0`, labelled "Amount Due Now"
   - Add a "Total" row showing `booking.paymentSummary?.total` or `latestQuote.finalAmount`
   - Keep "Remaining" row showing `booking.paymentSummary?.remaining`

---

## Issue 2: Unify Timeline Across Admin/Agent/Customer

### Approach

Define a fixed set of milestone steps (matching the Trevista lifecycle) and derive progress from `booking.status`. Replace the custom `STATUS_PHASES` progress bars in admin/agent with the shared `TimelineStepper` component.

### Milestone Steps

```
1. Enquiry Sent     — statuses: DRAFT, QUOTE_REQUESTED
2. Quote Received   — statuses: UNDER_REVIEW, QUOTE_READY, QUOTE_SENT
3. Quote Accepted   — statuses: CUSTOMER_ACCEPTED, CUSTOMER_REJECTED
4. Payment          — statuses: AWAITING_TOKEN_PAYMENT, PAYMENT_PENDING, PARTIALLY_PAID, PAID
5. Confirmed        — statuses: CONFIRMED, TICKETING, TICKETED, TRAVEL_READY
6. Completed        — statuses: COMPLETED
```

### Changes

1. **`apps/admin-shell/src/features/tours/BookingDetail/view/BookingDetail.view.jsx`** — Replace the custom `.bd-progress` section with `<TimelineStepper steps={milestoneSteps} />`, computed from `booking.status` using a helper. Import `TimelineStepper` from `@packages/trem-ui`.

2. **`apps/agent-shell/src/features/bookings/tours/BookingDetail/view/BookingDetail.view.jsx`** — Same replacement as admin.

3. **`apps/admin-shell/src/features/tours/BookingDetail/BookingDetail.scss`** — Add `.bd-journey-card` wrapper style inside `.bd-grid` for vertical stepper layout. Remove or deprecate old `.bd-progress` styles.

4. **`apps/agent-shell/src/features/bookings/tours/BookingDetail/BookingDetail.scss`** — Same SCSS addition as admin.

---

## Issue 3: Add "Add Traveller Details" After Quote Acceptance

### Decisions (per real-world standards)

- **Fields**: name, age, nationality, passport number (standard international booking fields; gender and dateOfBirth optional)
- **Multiple travellers**: Yes — customer can add one traveller at a time with an "Add another" button, and a "Done" button to finish
- **Visual**: Prominent CTA card with a primary button, shown after acceptance (status `CUSTOMER_ACCEPTED` or `PAYMENT_PENDING`), before the payment section
- **Backend**: Add `CUSTOMER_ACCEPTED` to `EDITABLE_TRAVELLER_STATUSES` so editing is allowed during that window

### Changes

1. **`apps/backend-api/src/constants/enums.js`** — Add `"CUSTOMER_ACCEPTED"` to `EDITABLE_TRAVELLER_STATUSES`.

2. **`apps/backend-api/src/modules/bookings/engineRoutes.js`** — Add route:
   - `PUT /:id/travellers` → `updateTravellers` controller
   - Uses customer auth middleware (same as other engine routes)

3. **`apps/backend-api/src/modules/bookings/controllers/bookingEngineController.js`** — Implement `updateTravellers`:
   - Verify booking belongs to authenticated user
   - Verify status is in `EDITABLE_TRAVELLER_STATUSES`
   - Validate each traveller object (name required, age required, passport optional, nationality optional)
   - Replace `booking.travellers` array with the submitted array
   - Return updated booking

4. **`apps/app-shell/src/features/bookingDetail/BookingDetail.jsx`** — Add a new card section that renders when `["CUSTOMER_ACCEPTED", "PAYMENT_PENDING"].includes(booking.status)`:
   - Shows existing travellers (if any) as a summary list
   - Shows an inline form to add a new traveller (name, age, nationality, passport fields)
   - "Add traveller" button submits the form and appends to the list
   - "Done" button dismisses the form
   - On submit, calls `PUT /engine/${bookingId}/travellers` with the full travellers array

5. **`apps/app-shell/src/features/bookingDetail/BookingDetail.scss`** — Add styles for the traveller form card (`.bd__travellers-card`, `.bd__traveller-form`, `.bd__traveller-list`).

---

## Implementation Order

1. **Issue 1** — QuoteDisplay amountPayableNow + sidebar summary (smallest scope, unblocks customer clarity)
2. **Issue 3** — Traveller details form + backend route (independent of timeline, needed for post-acceptance flow)
3. **Issue 2** — Timeline unification (largest scope, touches admin/agent views)

## Verification

- Run `pnpm --filter @packages/trem-ui build` to verify QuoteDisplay changes compile
- Run `pnpm --filter @packages/trem-docengine build` to verify any downstream impact
- Run backend tests: `cd apps/backend-api && npm test`
- Run lint/typecheck across affected packages
