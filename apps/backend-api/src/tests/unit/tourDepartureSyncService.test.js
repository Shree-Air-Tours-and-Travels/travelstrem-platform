import { buildDerivedTourDeparture } from "../../modules/tours/services/tourDepartureSyncService.js";

describe("derived tour departure synchronization", () => {
    const tour = {
        _id: "tour-1",
        city: { from: "New Delhi", to: "Udaipur" },
        address: { country: "India" },
        startDate: new Date("2026-10-02T00:00:00.000Z"),
        endDate: new Date("2026-10-04T00:00:00.000Z"),
        status: "published",
        price: { min: 8999, max: 13999, currency: "INR", isFinal: false, source: "manual" },
        availability: { totalSeats: 20, seatsAvailable: 14 },
    };

    it("maps a published tour to active searchable departure inventory", () => {
        expect(buildDerivedTourDeparture(tour)).toEqual(
            expect.objectContaining({
                tourId: "tour-1",
                status: "active",
                capacity: 20,
                availableSeats: 14,
                origin: {
                    cityId: "new-delhi",
                    cityName: "New Delhi",
                    countryId: "india",
                    countryName: "India",
                },
                pricing: {
                    min: 8999,
                    max: 13999,
                    currency: "INR",
                    isFinal: false,
                    source: "manual",
                },
                legacyDerived: true,
            }),
        );
    });

    it("marks zero-seat and cancelled tours unavailable", () => {
        expect(
            buildDerivedTourDeparture({
                ...tour,
                availability: { totalSeats: 20, seatsAvailable: 0 },
            }).status,
        ).toBe("sold_out");
        expect(buildDerivedTourDeparture({ ...tour, status: "cancelled" }).status).toBe(
            "cancelled",
        );
    });

    it("does not create inventory without a complete date range", () => {
        expect(buildDerivedTourDeparture({ ...tour, endDate: null })).toBeNull();
    });
});
