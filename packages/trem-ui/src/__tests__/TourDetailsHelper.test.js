import { describe, expect, it } from "vitest";
import { getCityDisplay, getDisplayText } from "../features/tourDetails/helper.js";

describe("tour detail display helpers", () => {
  it("renders structured locations as text instead of React child objects", () => {
    expect(getDisplayText({ city: "Dubai", country: "United Arab Emirates" })).toBe(
      "Dubai, United Arab Emirates",
    );
  });

  it("supports listing-shaped locations while tour details are loading", () => {
    expect(
      getCityDisplay({
        location: { city: "Dubai", country: "United Arab Emirates" },
      }),
    ).toBe("Dubai, United Arab Emirates");
  });

  it("normalizes structured route endpoints", () => {
    expect(
      getCityDisplay({
        city: {
          from: { city: "Delhi", country: "India" },
          to: { city: "Dubai", country: "United Arab Emirates" },
        },
      }),
    ).toBe("Delhi, India to Dubai, United Arab Emirates");
  });
});
