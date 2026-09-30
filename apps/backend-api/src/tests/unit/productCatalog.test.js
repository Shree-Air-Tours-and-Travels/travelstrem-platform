import { normalizeProductKeys } from "../../modules/tenancy/productCatalog.js";

describe("platform product catalogue", () => {
    test("normalizes and de-duplicates administrator product assignments", () => {
        expect(normalizeProductKeys([" Trevio ", "trevio", "TREVISTA", ""])).toEqual([
            "trevio",
            "trevista",
        ]);
    });

    test("rejects non-array assignment input", () => {
        expect(normalizeProductKeys("trevio")).toEqual([]);
    });
});
