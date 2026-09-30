import {
    buildFullTourTemplate,
    getBuilderTemplatePayload,
} from "../../modules/tours/builder/builderTemplate.service.js";
import { cloneStepDefinition } from "../../modules/tours/builder/stepDefinitions.js";

describe("builderTemplate.service", () => {
    const full = () => {
        const { template } = buildFullTourTemplate();
        return template;
    };

    test("full tour template mirrors the Tour schema with correct scalar types", () => {
        const tour = full();
        expect(tour.title).toBe("");
        expect(tour.distance).toBe(0);
        expect(tour.featured).toBeUndefined();
        expect(tour.trending).toBeUndefined();
        expect(tour.tremVerified).toBeUndefined();
        expect(tour.reviews).toBeUndefined();
        expect(tour.featuredRequest).toEqual({ requested: false });
        expect(tour.startDate).toBe("YYYY-MM-DD");
        expect(tour.price).toEqual({
            min: 0,
            max: 0,
            currency: expect.any(String),
            isFinal: false,
            source: expect.any(String),
        });
        expect(tour.city).toEqual({ from: "", to: "" });
    });

    test("arrays of subdocuments produce a single sample element", () => {
        const tour = full();
        expect(Array.isArray(tour.itinerary)).toBe(true);
        expect(tour.itinerary).toHaveLength(1);
        expect(tour.itinerary[0]).toMatchObject({ day: 0, title: "", activities: [] });
        expect(tour.seasonalPricing[0]).toMatchObject({
            seasonName: "",
            startDate: "YYYY-MM-DD",
            min: 0,
        });
        expect(tour.commercial.components[0]).toMatchObject({
            componentKey: "",
            pricing: { unit: "FIXED", costAmountMinor: 0 },
        });
        expect(tour.departures[0]).toMatchObject({ label: "", pricing: { min: 0, max: 0 } });
    });

    test("hotel examples teach stay-scoped package and alternative mappings", () => {
        const tour = full();
        expect(tour.hotelOptions).toHaveLength(2);
        expect(tour.hotelOptions[0]).toMatchObject({
            stayKey: "destination-stay-1",
            location: "Destination",
            nights: 2,
        });
        expect(tour.hotelOptions[1]).toMatchObject({
            stayKey: "destination-stay-1",
            location: "Destination",
            nights: 2,
        });
        expect(tour.hotelOptions[0].rooms.map((room) => room.packageKeys)).toEqual([
            ["basic"],
            ["standard"],
            ["premium"],
        ]);
        expect(tour.hotelOptions[1].rooms.every((room) => room.packageKeys.length === 0)).toBe(
            true,
        );
        expect(tour.customConfig.allowCustomerCustomization).toBe(true);
    });

    test("excludes platform-managed fields", () => {
        const tour = full();
        [
            "_id",
            "__v",
            "createdAt",
            "updatedAt",
            "agencyId",
            "createdBy",
            "ownerAgent",
            "productKey",
            "builderProcess",
        ].forEach((key) => {
            expect(tour).not.toHaveProperty(key);
        });
    });

    test("does not expose nested Mongoose ids, virtuals or schema metadata", () => {
        const forbidden = new Set(["_id", "path", "getters", "setters", "options"]);
        const leaked = [];
        const visit = (value, currentPath = "") => {
            if (Array.isArray(value)) {
                value.forEach((item, index) => visit(item, `${currentPath}[${index}]`));
                return;
            }
            if (!value || typeof value !== "object") return;
            Object.entries(value).forEach(([key, child]) => {
                const childPath = currentPath ? `${currentPath}.${key}` : key;
                if (forbidden.has(key)) leaked.push(childPath);
                visit(child, childPath);
            });
        };

        visit(full());
        expect(leaked).toEqual([]);
        // searchTags.id is an intentional business identifier, not a virtual.
        expect(full().searchTags[0].id).toBe("");
    });

    test("computed commercial.derived is nulled for shape only", () => {
        expect(full().commercial.derived).toBeNull();
    });

    test("enum hints list allowed values per dotted path", () => {
        const { enums } = buildFullTourTemplate();
        expect(Array.isArray(enums.visibility)).toBe(true);
        expect(enums.visibility.length).toBeGreaterThan(1);
        expect(Array.isArray(enums["commercial.packages.tier"])).toBe(true);
        expect(Array.isArray(enums["searchTags.type"])).toBe(true);
    });

    test("step scope returns only branches the step owns", () => {
        const payload = getBuilderTemplatePayload({ stepKey: "basics" });
        expect(payload.scope).toBe("step");
        Object.keys(payload.tour).forEach((branch) => {
            expect([
                "title",
                "shortDescription",
                "agentRef",
                "providerName",
                "slug",
                "visibility",
                "city",
                "address",
                "distance",
                "period",
                "startDate",
                "endDate",
            ]).toContain(branch);
        });
        expect(payload.tour.title).toBeDefined();
        expect(payload.tour.commercial).toBeUndefined();
        expect(Object.keys(payload.enums)).toEqual(["visibility"]);
        expect(Object.keys(payload.enums)).not.toContain("commercial.packages.tier");
    });

    test("collection steps expose their backing record schema", () => {
        const departures = getBuilderTemplatePayload({ stepKey: "tour-departures" });
        expect(departures.scope).toBe("collection");
        expect(departures.recordKey).toBe("departures");
        expect(departures.records[0]).toMatchObject({
            departureDate: "YYYY-MM-DD",
            status: expect.any(String),
        });
        expect(departures.records[0]._id).toBeUndefined();
    });

    test("no stepKey returns the complete document shape", () => {
        const payload = getBuilderTemplatePayload({});
        expect(payload.scope).toBe("tour");
        expect(payload.schemaVersion).toBe("TOUR_BUILDER_V2");
        expect(payload.tour.itinerary).toHaveLength(1);
        expect(payload.enums).toBeTruthy();
        expect(payload.rules).toEqual(
            expect.arrayContaining([
                expect.stringContaining("stayKey"),
                expect.stringContaining("packageKeys"),
            ]),
        );
    });

    test("commercial creation owns fee policy and exposes Base, Standard and Premium", () => {
        const commercial = cloneStepDefinition("commercial");
        expect(commercial.ownedPaths).toContain("commercial.pricingPolicy");
        const children = commercial.substeps.flatMap((substep) => substep.children);
        const feePolicy = children
            .flatMap((child) => child.widgets)
            .find((widget) => widget.key === "pricingPolicy");
        expect(feePolicy.widgets.map((widget) => widget.key)).toEqual(
            expect.arrayContaining(["feeType", "feePercent", "feeAmountMinor", "gstPercent"]),
        );
        const packages = children
            .flatMap((child) => child.widgets)
            .find((widget) => widget.type === "PACKAGE_COMPOSER");
        expect(packages.tierLabels).toEqual({
            BASIC: "Base",
            STANDARD: "Standard",
            PREMIUM: "Premium",
        });
        expect(packages.defaultTiers).toEqual(["BASIC", "STANDARD", "PREMIUM"]);
    });
});
