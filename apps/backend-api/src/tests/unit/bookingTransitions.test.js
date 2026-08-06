import Booking from "../../modules/bookings/models/Booking.js";

describe("booking lifecycle rules", () => {
  test("allows the supported quote-to-payment journey", () => {
    expect(Booking.canTransition("DRAFT", "QUOTE_REQUESTED")).toBe(true);
    expect(Booking.canTransition("QUOTE_SENT", "CUSTOMER_ACCEPTED")).toBe(true);
    expect(Booking.canTransition("CUSTOMER_ACCEPTED", "PAYMENT_PENDING")).toBe(true);
    expect(Booking.canTransition("CONFIRMED", "COMPLETED")).toBe(true);
  });

  test("blocks unsafe and backwards transitions", () => {
    expect(Booking.canTransition("DRAFT", "COMPLETED")).toBe(false);
    expect(Booking.canTransition("COMPLETED", "DRAFT")).toBe(false);
    expect(Booking.canTransition("REFUNDED", "CONFIRMED")).toBe(false);
  });

  test("instance transition rejects an invalid mutation", () => {
    const booking = new Booking({ status: "DRAFT" });
    expect(() => booking.transitionStatus("COMPLETED")).toThrow("Invalid booking status transition");
    expect(booking.status).toBe("DRAFT");
  });
});
