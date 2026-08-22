import { describe, expect, it } from "vitest";
import { componentsByGroup, enabledPackages, formatMinor, resolveTierLabel, toDecimalMajor } from "../src/utils/money.js";

describe("money helpers", () => {
    it("formats minor units as currency with graceful fallbacks", () => {
        expect(formatMinor(125000, "INR")).toContain("1,250");
        expect(formatMinor(undefined, "INR")).toBe("—");
        expect(formatMinor(100)).toBe("100 minor units");
    });

    it("converts between minor and major units", () => {
        expect(toDecimalMajor(25050)).toBeCloseTo(250.5);
        expect(toDecimalMajor("bad")).toBe(0);
    });

    it("maps stored tiers to backend-supplied display labels", () => {
        const labels = { BASIC: "Standard", STANDARD: "Premium", PREMIUM: "Advance" };
        expect(resolveTierLabel("BASIC", labels)).toBe("Standard");
        expect(resolveTierLabel("PREMIUM", labels)).toBe("Advance");
        expect(resolveTierLabel("BASIC")).toBe("Basic");
        expect(resolveTierLabel(undefined)).toBe("");
    });

    it("filters enabled packages and groups active components by type", () => {
        const packages = [
            { tier: "BASIC", enabled: true },
            { tier: "STANDARD", enabled: false },
            { tier: "PREMIUM" },
        ];
        expect(enabledPackages(packages).map((pkg) => pkg.tier)).toEqual(["BASIC", "PREMIUM"]);

        const groups = componentsByGroup([
            { componentKey: "h1", type: "HOTEL", active: true },
            { componentKey: "f1", type: "FLIGHT" },
            { componentKey: "h2", type: "HOTEL", active: false },
        ]);
        expect(groups.HOTEL).toHaveLength(1);
        expect(groups.FLIGHT).toHaveLength(1);
    });
});
