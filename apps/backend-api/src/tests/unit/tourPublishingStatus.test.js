import Tour from "../../modules/tours/models/Tour.js";
import buildTourSearchPipeline from "../../modules/tours/search/tourSearch.pipeline.js";

const emptySearch = {
    query: "",
    filters: {
        originCityIds: [],
        destinationCityIds: [],
        countryIds: [],
        agencyIds: [],
        price: { min: null, max: null },
        duration: { minDays: null, maxDays: null },
        travellers: null,
        departureDate: null,
        returnDate: null,
        tagIds: [],
        featured: null,
    },
    sort: "RECOMMENDED",
    page: 1,
    pageSize: 8,
};

describe("tour publishing status", () => {
    test("uses status alone for public tour search", () => {
        const [firstStage] = buildTourSearchPipeline(emptySearch);

        expect(firstStage.$match.status).toBe("published");
        expect(firstStage.$match).not.toHaveProperty("isPublished");
    });

    test("derives the legacy boolean from status during document validation", async () => {
        const tour = new Tour({
            title: "Publishing invariant",
            city: { from: "Delhi", to: "Jaipur" },
            address: { city: "Jaipur", country: "India" },
            distance: 250,
            period: { days: 2, nights: 1 },
            desc: "Test tour",
            price: { min: 100, max: 200 },
            maxGroupSize: 10,
            status: "published",
            isPublished: false,
        });

        await tour.validate();
        expect(tour.isPublished).toBe(true);

        tour.status = "unpublished";
        await tour.validate();
        expect(tour.isPublished).toBe(false);
    });
});
