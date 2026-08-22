import { describe, expect, it } from "vitest";
import { validateValue, validateWidgets } from "../src/utils/validation.js";

const req = { type: "REQUIRED", message: "Required field" };

describe("validateValue", () => {
    it("flags empty values only for required widgets", () => {
        const widget = { key: "t", path: "title", label: "Title", validation: [req] };
        expect(validateValue(widget, "", {})).toEqual(["Required field"]);
        expect(validateValue({ ...widget, validation: [] }, "")).toEqual([]);
        expect(validateValue({ ...widget, validation: [], required: true }, "")).toEqual(["Title is required"]);
    });

    it("ignores null and malformed backend rules without crashing", () => {
        const widget = { key: "t", path: "title", label: "Title", required: true, validation: [null, false, "REQUIRED"] };
        expect(validateValue(widget, "", {})).toEqual(["Title is required"]);
        expect(validateValue({ ...widget, required: false }, "", {})).toEqual([]);
    });

    it("enforces length, range, integer and pattern rules", () => {
        const widget = (rule) => ({ key: "w", path: "p", label: "P", validation: [rule] });
        expect(validateValue(widget({ type: "MIN_LENGTH", value: 3, message: "too short" }), "ab", {})).toEqual(["too short"]);
        expect(validateValue(widget({ type: "MAX_LENGTH", value: 2, message: "too long" }), "abc", {})).toEqual(["too long"]);
        expect(validateValue(widget({ type: "MIN", value: 1, message: "too low" }), 0, {})).toEqual(["too low"]);
        expect(validateValue(widget({ type: "MAX", value: 10, message: "too high" }), 11, {})).toEqual(["too high"]);
        expect(validateValue(widget({ type: "INTEGER_MIN", value: 0, message: "bad int" }), -1.5, {})).toEqual(["bad int"]);
        expect(validateValue(widget({ type: "PATTERN", value: "^[a-z]+$", message: "lowercase only" }), "ABC", {})).toEqual(["lowercase only"]);
    });

    it("validates list sizes and cross-field comparisons", () => {
        const widget = (rule) => ({ key: "w", path: "p", label: "P", validation: [rule] });
        expect(validateValue(widget({ type: "MIN_ITEMS", value: 1, message: "need one" }), [], {})).toEqual(["need one"]);
        expect(validateValue(widget({ type: "MAX_ITEMS", value: 1, message: "too many" }), [{}, {}], {})).toEqual(["too many"]);
        const gte = { key: "max", path: "max", label: "Max", validation: [{ type: "GTE_PATH", path: "min", message: "max < min" }] };
        expect(validateValue(gte, 5, { min: 7 })).toEqual(["max < min"]);
        expect(validateValue(gte, 9, { min: 7 })).toEqual([]);
    });

    it("checks enabled-package counts and day sequencing", () => {
        const packages = [
            { tier: "BASIC", enabled: true },
            { tier: "STANDARD", enabled: false },
            { tier: "PREMIUM", enabled: true },
        ];
        const rule = { type: "ENABLED_COUNT", min: 2, max: 3, message: "enable two or three" };
        expect(validateValue({ key: "pk", path: "packages", label: "Packages", validation: [rule] }, packages, {})).toEqual([]);
        expect(validateValue(
            { key: "pk", path: "packages", label: "Packages", validation: [{ ...rule, min: 3 }] },
            packages,
            {},
        )).toEqual(["enable two or three"]);

        const days = { key: "it", path: "itinerary", label: "Itinerary", validation: [{ type: "DAY_SEQUENCE", message: "days must be sequential" }] };
        expect(validateValue(days, [{ day: 1 }, { day: 2 }], {})).toEqual([]);
        expect(validateValue(days, [{ day: 2 }, { day: 3 }], {})).toEqual(["days must be sequential"]);
    });
});

describe("validateWidgets", () => {
    it("keys errors by absolute path including nested objects and repeaters", () => {
        const definition = [
            { key: "title", type: "TEXT", path: "title", label: "Title", required: true },
            {
                key: "pricing",
                type: "OBJECT",
                path: "pricing",
                widgets: [{ key: "currency", type: "SELECT", path: "currency", label: "Currency", required: true }],
            },
            {
                key: "items",
                type: "REPEATER",
                path: "items",
                label: "Items",
                itemWidgets: [{ key: "name", type: "TEXT", path: "name", label: "Name", required: true }],
            },
            {
                key: "departures",
                type: "COLLECTION_REPEATER",
                path: "departures",
                itemWidgets: [{ key: "status", type: "SELECT", path: "status", label: "Status", required: true }],
            },
        ];
        const values = {
            pricing: { currency: "" },
            items: [{ name: "ok" }, { name: "" }],
            departures: [{ status: null }],
        };
        const errors = validateWidgets(definition, values);
        expect(Object.keys(errors).sort()).toEqual([
            "departures.0.status",
            "items.1.name",
            "pricing.currency",
            "title",
        ]);
    });

    it("skips read-only widgets entirely", () => {
        const errors = validateWidgets([
            { key: "ro", type: "TEXT", path: "ro", readOnly: true, required: true },
        ], {});
        expect(errors).toEqual({});
    });

    it("validates nested object values and skips backend-hidden fields", () => {
        const definition = [{
            key: "policy",
            type: "OBJECT",
            path: "commercial.pricingPolicy",
            widgets: [
                { key: "percent", type: "NUMBER", path: "feePercent", validation: [{ type: "MAX", value: 100, message: "too high" }], visibleWhen: { field: "commercial.pricingPolicy.feeType", operator: "EQUALS", value: "PERCENTAGE" } },
                { key: "fixed", type: "NUMBER", path: "feeAmountMinor", required: true, visibleWhen: { field: "commercial.pricingPolicy.feeType", operator: "EQUALS", value: "FIXED" } },
            ],
        }];
        const values = { commercial: { pricingPolicy: { feeType: "PERCENTAGE", feePercent: 101, feeAmountMinor: "" } } };
        expect(validateWidgets(definition, values)).toEqual({ "commercial.pricingPolicy.feePercent": ["too high"] });
    });
});
