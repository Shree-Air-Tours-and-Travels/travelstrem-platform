import {
  selectStepErrors,
  TOUR_BUILDER_OPTION_KEYS,
  validateTourBuilderCollections,
} from "../data/useTourBuilderContract.js";
import { describe, expect, test } from "vitest";

describe("tour builder contract utilities", () => {
  test("loads the shared backend option-set keys", () => {
    expect(TOUR_BUILDER_OPTION_KEYS).toContain("trevista.tourBuilderSteps");
    expect(TOUR_BUILDER_OPTION_KEYS).toContain("trevista.tourBuilderRequiredFields");
  });

  test("selects only validation errors owned by the active step", () => {
    const contract = [
      { value: "title", metadata: { step: "basic" } },
      { value: "desc", metadata: { step: "content" } },
    ];
    expect(selectStepErrors({ title: "Required", desc: "Required" }, contract, "basic")).toEqual({
      title: "Required",
    });
  });

  test("does not validate hidden fixed departures for a flexible tour", () => {
    const errors = validateTourBuilderCollections({
      packageType: "flexible",
      departures: [{ departureDate: "", returnDate: "" }],
    });
    expect(errors.departures).toBeUndefined();
  });

  test("names the exact invalid departure", () => {
    const errors = validateTourBuilderCollections({
      packageType: "fixed_departure",
      departures: [
        { departureDate: "2026-10-01", returnDate: "2026-10-05", pricing: { min: 100, max: 200 } },
        { departureDate: "", returnDate: "", pricing: {} },
      ],
    });
    expect(errors.departures).toContain("Departure 2");
  });
});
