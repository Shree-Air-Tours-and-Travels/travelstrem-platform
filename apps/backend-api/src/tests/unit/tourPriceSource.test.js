import Tour from "../../modules/tours/models/Tour.js";
import { PRICE_SOURCE, PRICE_SOURCE_LIST } from "../../constants/enums.js";

describe("Tour price source compatibility", () => {
    it("accepts calculated and component-calculation snapshots", () => {
        expect(PRICE_SOURCE_LIST).toContain(PRICE_SOURCE.CALCULATED);
        expect(PRICE_SOURCE_LIST).toContain(PRICE_SOURCE.COMPONENT_CALCULATION);

        for (const source of [PRICE_SOURCE.CALCULATED, PRICE_SOURCE.COMPONENT_CALCULATION]) {
            const tour = new Tour({
                title: "Price source validation",
                desc: "A valid tour description",
                city: { from: "Delhi", to: "Jaipur" },
                distance: 250,
                period: { days: 2, nights: 1 },
                price: { min: 10000, max: 12000, currency: "INR", source },
                seasonalPricing: [
                    {
                        seasonName: "Peak",
                        startDate: "2026-10-01",
                        endDate: "2026-10-31",
                        min: 11000,
                        max: 13000,
                        currency: "INR",
                        source,
                    },
                ],
            });
            const errors = tour.validateSync()?.errors || {};
            expect(errors["price.source"]).toBeUndefined();
            expect(errors["seasonalPricing.0.source"]).toBeUndefined();
        }
    });
});
