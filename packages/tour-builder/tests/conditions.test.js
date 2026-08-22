import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../src/utils/conditions.js";

describe("evaluateCondition", () => {
    it("returns true when there is no condition", () => {
        expect(evaluateCondition({}, undefined)).toBe(true);
        expect(evaluateCondition({}, null)).toBe(true);
    });

    it("supports single-field rules with every operator", () => {
        const values = { packageType: "fixed_departure", count: 3, tags: ["a"] };
        expect(evaluateCondition(values, { field: "packageType", operator: "EQUALS", value: "fixed_departure" })).toBe(true);
        expect(evaluateCondition(values, { field: "packageType", operator: "NOT_EQUALS", value: "custom" })).toBe(true);
        expect(evaluateCondition(values, { field: "packageType", operator: "IN", value: ["fixed_departure", "custom"] })).toBe(true);
        expect(evaluateCondition(values, { field: "packageType", operator: "NOT_IN", value: ["custom"] })).toBe(true);
        expect(evaluateCondition(values, { field: "tags", operator: "EXISTS" })).toBe(true);
        expect(evaluateCondition(values, { field: "missing", operator: "NOT_EXISTS" })).toBe(true);
        expect(evaluateCondition(values, { field: "count", operator: "GREATER_THAN", value: 2 })).toBe(true);
        expect(evaluateCondition(values, { field: "count", operator: "LESS_THAN", value: 2 })).toBe(false);
    });

    it("resolves nested field paths", () => {
        const values = { pricing: { currency: "INR" } };
        expect(evaluateCondition(values, { field: "pricing.currency", operator: "EQUALS", value: "INR" })).toBe(true);
    });

    it("evaluates all/any groups and arrays of rules", () => {
        const values = { a: 1, b: 2 };
        expect(evaluateCondition(values, { all: [
            { field: "a", operator: "EQUALS", value: 1 },
            { field: "b", operator: "EQUALS", value: 2 },
        ] })).toBe(true);
        expect(evaluateCondition(values, { any: [
            { field: "a", operator: "EQUALS", value: 9 },
            { field: "b", operator: "EQUALS", value: 2 },
        ] })).toBe(true);
        expect(evaluateCondition(values, [
            { field: "a", operator: "EQUALS", value: 1 },
            { field: "b", operator: "EQUALS", value: 3 },
        ])).toBe(false);
    });

    it("defaults unknown operators to EQUALS and never throws", () => {
        expect(evaluateCondition({ a: 1 }, { field: "a", operator: "MYSTERY", value: 1 })).toBe(true);
        expect(evaluateCondition(null, { field: "a.b.c", operator: "GREATER_THAN", value: 1 })).toBe(false);
    });
});
