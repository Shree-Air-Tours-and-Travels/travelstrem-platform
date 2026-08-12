import { calculateBookingPrice } from "../../modules/bookings/services/BookingPricingService.js";

const tour = { title: "Delhi to Udaipur", period: { nights: 2 }, price: { min: 8999, currency: "INR" }, getCurrentPrice() { return this.price; } };
const premium = { _id: "hotel", title: "Premium hotel", pricing: { unit: "PER_PERSON", amountMinor: 250000 } };
const sedan = { _id: "sedan", title: "Private sedan", pricing: { unit: "PER_BOOKING", amountMinor: 1200000 } };
const input = (count) => ({ tour, selections: { travellers: Array.from({ length: count }, () => ({ type: "ADULT" })), startDate: "2026-11-01", endDate: "2026-11-03" }, options: { hotel: premium, transport: sedan, addons: [] }, configs: {} });

describe("BookingPricingService V2", () => {
  test("calculates required one traveller example in paise", () => {
    const result = calculateBookingPrice(input(1));
    expect(result.tourSubtotalMinor).toBe(899900);
    expect(result.addonsSubtotalMinor).toBe(1450000);
    expect(result.subtotalMinor).toBe(2349900);
    expect(result.finalPayableMinor).toBe(2349900);
  });
  test("multiplies per-person items but not a booking vehicle", () => {
    const result = calculateBookingPrice(input(2));
    expect(result.tourSubtotalMinor).toBe(1799800);
    expect(result.addonsSubtotalMinor).toBe(1700000);
    expect(result.subtotalMinor).toBe(3499800);
  });
  test("does not add settlement deduction to customer payable", () => {
    const result = calculateBookingPrice({
      ...input(1),
      configs: { agency: { feeConfig: { enabled: true, type: "PERCENTAGE", value: 5, chargingMode: "SETTLEMENT_DEDUCTION" } } },
    });
    expect(result.finalPayableMinor).toBe(2349900);
    expect(result.settlement.agencyFeeDeductionMinor).toBe(117495);
  });
});
