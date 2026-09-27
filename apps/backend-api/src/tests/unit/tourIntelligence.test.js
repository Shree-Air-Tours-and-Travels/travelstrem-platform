import {
    calculateTourQualityScore,
    evaluateTourIntelligence,
    rankSimilarTours,
} from "../../modules/tours/services/tourIntelligence.rules.js";
import { findStepDefinition } from "../../modules/tours/builder/stepDefinitions.js";

const richTour = (overrides = {}) => ({
    _id: "source",
    title: "Royal Rajasthan Signature Journey",
    desc: "A carefully planned and fully supported journey across Rajasthan. ".repeat(5),
    status: "published",
    productKey: "trevista",
    photo: "cover.jpg",
    photos: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
    price: { min: 30000, max: 50000 },
    period: { days: 5, nights: 4 },
    city: { from: "Delhi", to: "Jaipur" },
    address: { city: "Jaipur", country: "India" },
    itinerary: Array.from({ length: 5 }, (_, index) => ({ day: index + 1 })),
    highlights: [{}, {}, {}],
    inclusions: ["Hotel", "Guide", "Breakfast"],
    exclusions: ["Personal expenses"],
    languages: ["English"],
    cancellationPolicy: "Free cancellation until 30 days before departure.",
    meetingPoint: "Delhi airport",
    includedStays: [{}],
    tags: ["rajasthan", "heritage", "culture"],
    agencyId: "agency-1",
    rating: { average: 4.6, count: 8 },
    tremVerified: true,
    featuredRequest: { requested: true },
    metrics: {
        views: 50,
        enquiries: 6,
        bookings: 2,
        wishlists: 8,
        lastBookedAt: new Date(),
    },
    ...overrides,
});

describe("TravelsTREM tour intelligence", () => {
    test("builder exposes only the feature request and a read-only intelligence summary", () => {
        const step = findStepDefinition("audience");
        const widgets = step.substeps.flatMap((substep) =>
            substep.children.flatMap((child) => child.widgets),
        );
        expect(widgets.find((widget) => widget.path === "featuredRequest.requested")).toBeTruthy();
        expect(widgets.find((widget) => widget.type === "TOUR_INTELLIGENCE_SUMMARY")).toMatchObject(
            {
                readOnly: true,
                serverManaged: true,
                featuredPath: "featured",
                trendingPath: "trending",
                verifiedPath: "tremVerified",
            },
        );
        expect(
            widgets.some((widget) =>
                ["featured", "trending", "tremVerified"].includes(widget.path),
            ),
        ).toBe(false);
        expect(widgets.some((widget) => widget.path === "reviews")).toBe(false);
        expect(step.ownedPaths).not.toContain("reviews");
    });

    test("quality scoring rewards complete, traveller-ready details", () => {
        expect(calculateTourQualityScore(richTour())).toBeGreaterThanOrEqual(75);
        expect(calculateTourQualityScore({ title: "Thin tour" })).toBeLessThan(25);
    });

    test("only intelligence can approve requested featured placement", () => {
        const approved = evaluateTourIntelligence(richTour());
        expect(approved.featured).toBe(true);
        expect(approved.featuredRequest.status).toBe("approved");

        const unverified = evaluateTourIntelligence(richTour({ tremVerified: false }));
        expect(unverified.featured).toBe(false);
        expect(unverified.featuredRequest.status).toBe("pending");
        expect(unverified.featuredRequest.reason).toMatch(/verification/i);
    });

    test("trending requires recent views and conversion evidence", () => {
        expect(evaluateTourIntelligence(richTour()).trending).toBe(true);
        expect(
            evaluateTourIntelligence(
                richTour({ metrics: { views: 200, enquiries: 0, bookings: 0, wishlists: 0 } }),
            ).trending,
        ).toBe(false);
    });

    test("similarity returns at most three meaningful, published alternatives", () => {
        const source = richTour();
        const candidates = [
            richTour({ _id: "a", title: "A" }),
            richTour({ _id: "b", title: "B", tags: ["rajasthan", "family"] }),
            richTour({ _id: "c", title: "C", city: { from: "Delhi", to: "Jaipur" } }),
            richTour({ _id: "d", title: "D" }),
            richTour({ _id: "hidden", status: "unpublished" }),
            richTour({
                _id: "unrelated",
                tags: ["arctic"],
                city: { from: "Oslo", to: "Tromso" },
                address: { city: "Tromso", country: "Norway" },
                packageType: "custom",
                period: { days: 20, nights: 19 },
                price: { min: 500000, max: 700000 },
                tremVerified: false,
                rating: { average: 0, count: 0 },
                metrics: {},
            }),
        ];
        const ranked = rankSimilarTours(source, candidates, 3);
        expect(ranked).toHaveLength(3);
        expect(ranked.map((tour) => tour._id)).not.toContain("hidden");
        expect(ranked.map((tour) => tour._id)).not.toContain("unrelated");
        expect(ranked.every((tour) => tour.similarity.reasons.length > 0)).toBe(true);
    });

    test("commercial similarity cannot make Delhi-Leh relevant to a Rajasthan tour", () => {
        const source = richTour({
            _id: "rajasthan",
            city: { from: "Delhi", to: "Udaipur" },
            address: { city: "Udaipur", country: "India" },
            tags: ["Rajasthan", "Jaipur", "Jodhpur", "Heritage"],
        });
        const delhiLeh = richTour({
            _id: "leh",
            city: { from: "Delhi", to: "Leh" },
            address: { city: "Leh", country: "India" },
            tags: ["Leh", "Ladakh", "Delhi to Leh", "Adventure"],
        });

        expect(rankSimilarTours(source, [delhiLeh], 3)).toEqual([]);
    });
});
