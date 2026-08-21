import { jest } from "@jest/globals";
import { BOOKING_STATUS } from "../../constants/enums.js";
import { SUPPORT_ELIGIBILITY_STATUS, SUPPORT_REQUEST_TYPE } from "@packages/trem-support-contracts";

jest.unstable_mockModule("../../config/index.js", () => ({ default: { SMTP: {}, MAIL: {}, SUPPORT_RECENTLY_COMPLETED_DAYS: 30, SUPPORT_EMERGENCY_WINDOW_HOURS: 24 } }));
const { buildEligibility, categoriesForBooking, rankBooking, serializeSupportBooking } = await import("../../modules/support/support.service.js");

const booking = (overrides = {}) => ({
  id: "507f1f77bcf86cd799439011",
  bookingRef: "TREM-BOOKING",
  product: "trevista",
  status: BOOKING_STATUS.CONFIRMED,
  travelWindow: { startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 172800000) },
  tour: { title: "Configured tour", photo: "tour.jpg" },
  paymentSummary: { paid: 1000, refunded: 0 },
  priceSnapshot: { currency: "INR" },
  ...overrides,
});

test("serializes booking context and actions from backend configuration", () => {
  const value = serializeSupportBooking(booking());
  expect(value).toMatchObject({ title: "Configured tour", service: { id: "trevista" }, status: { id: BOOKING_STATUS.CONFIRMED } });
  expect(value.supportActions.length).toBeGreaterThan(0);
  expect(value.supportActions.every((action) => action.action?.type)).toBe(true);
});

test("provider support is exposed only when a provider snapshot is available", () => {
  expect(categoriesForBooking(booking()).some((item) => item.id === "provider")).toBe(true);
  expect(categoriesForBooking(booking({ product: "trevio" })).some((item) => item.id === "provider")).toBe(false);
  expect(categoriesForBooking(booking({ product: "trevio", agencySnapshot: { displayName: "Provider" } })).some((item) => item.id === "provider")).toBe(true);
});

test("refund eligibility and amounts are decided by the server domain", () => {
  const eligible = buildEligibility(booking(), SUPPORT_REQUEST_TYPE.REFUND);
  expect(eligible.status).toBe(SUPPORT_ELIGIBILITY_STATUS.ELIGIBLE);
  expect(eligible.impact).toMatchObject({ paidAmount: 1000, currency: "INR", calculatedBy: "support-team-review" });
  const ineligible = buildEligibility(booking({ paymentSummary: { paid: 0, refunded: 0 } }), SUPPORT_REQUEST_TYPE.REFUND);
  expect(ineligible.status).toBe(SUPPORT_ELIGIBILITY_STATUS.INELIGIBLE);
});

test("active bookings rank before upcoming and recently completed bookings", () => {
  const active = booking({ travelWindow: { startDate: new Date(Date.now() - 3600000), endDate: new Date(Date.now() + 3600000) } });
  const upcoming = booking();
  const completed = booking({ status: BOOKING_STATUS.COMPLETED, travelWindow: { startDate: new Date(Date.now() - 172800000), endDate: new Date(Date.now() - 86400000) } });
  expect(rankBooking(active)).toBeLessThan(rankBooking(upcoming));
  expect(rankBooking(upcoming)).toBeLessThan(rankBooking(completed));
});
