import {
    normalizeMongoId,
    resolveDepartureOption,
} from "../../modules/forms/services/departureOptionService.js";

describe("departure option resolution", () => {
    const options = [
        {
            value: "2026-09-06|2026-09-13",
            label: "06 Sept 2026 – 13 Sept 2026",
        },
    ];

    it("accepts the stable option value", () => {
        expect(resolveDepartureOption(options, "2026-09-06|2026-09-13")).toEqual(options[0]);
    });

    it("accepts the displayed option label", () => {
        expect(resolveDepartureOption(options, "06 Sept 2026 – 13 Sept 2026")).toEqual(options[0]);
    });

    it("normalizes equivalent date-range formatting", () => {
        expect(resolveDepartureOption(options, "2026-09-06 to 2026-09-13")).toEqual(options[0]);
    });

    it("rejects a departure that is not in the current options", () => {
        expect(resolveDepartureOption(options, "2026-10-01|2026-10-08")).toBeNull();
    });

    it("recovers an ObjectId serialized as a buffer object", () => {
        expect(
            normalizeMongoId({
                buffer: {
                    0: 106,
                    1: 133,
                    2: 203,
                    3: 249,
                    4: 128,
                    5: 110,
                    6: 39,
                    7: 61,
                    8: 205,
                    9: 84,
                    10: 11,
                    11: 207,
                },
            }),
        ).toBe("6a85cbf9806e273dcd540bcf");
    });
});
