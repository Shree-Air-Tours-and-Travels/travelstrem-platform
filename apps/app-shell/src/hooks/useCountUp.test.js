import { parseStatValue } from "./useCountUp";

describe("parseStatValue", () => {
  test("splits a numeric value from its suffix", () => {
    expect(parseStatValue("15000+")).toEqual({ value: 15000, suffix: "+", text: "15000+" });
  });

  test("handles small values and plain numbers", () => {
    expect(parseStatValue("12+")).toEqual({ value: 12, suffix: "+", text: "12+" });
    expect(parseStatValue("98")).toEqual({ value: 98, suffix: "", text: "98" });
  });

  test("returns a zero value for non-numeric input", () => {
    expect(parseStatValue("N/A")).toEqual({ value: 0, suffix: "", text: "N/A" });
    expect(parseStatValue("")).toEqual({ value: 0, suffix: "", text: "" });
    expect(parseStatValue(null)).toEqual({ value: 0, suffix: "", text: "" });
  });
});