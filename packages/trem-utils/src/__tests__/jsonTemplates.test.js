import { describe, expect, it } from "vitest";
import { getTourJsonTemplate } from "../helpers/jsonTemplates.js";

describe("tour JSON template", () => {
  it("generates the component pricing contract without manual package totals", () => {
    const tour = JSON.parse(getTourJsonTemplate());
    expect(tour.price).toBeUndefined();
    expect(tour.seasonalPricing).toEqual([]);
    expect(tour.commercial.version).toBe("COMPONENTS_V1");
    expect(tour.commercial.components.length).toBeGreaterThan(0);
    expect(tour.commercial.packages).toHaveLength(3);
    expect(tour.commercial.components.every((item) => Number.isSafeInteger(item.pricing.costAmountMinor))).toBe(true);
    expect(tour.commercial.components.every((item) => Number.isSafeInteger(item.pricing.sellingAmountMinor))).toBe(true);
    expect(tour.status).toBe("draft");
    expect(tour.inventorySource).toBeUndefined();
    expect(tour.customConfig.allowCustomerCustomization).toBe(true);
    expect(tour.hotelOptions).toHaveLength(2);
    expect(tour.hotelOptions[0].stayKey).toBe("destination-stay-1");
    expect(tour.hotelOptions[0].rooms.map((room) => room.packageKeys)).toEqual([["basic"], ["standard"], ["premium"]]);
    expect(tour.hotelOptions[1].stayKey).toBe(tour.hotelOptions[0].stayKey);
    expect(tour.hotelOptions[1].rooms.every((room) => room.packageKeys.length === 0)).toBe(true);
  });

  it("includes only master-editable ownership fields for the master template", () => {
    const tour = JSON.parse(getTourJsonTemplate({ master: true }));
    expect(tour.visibility).toBe("public");
    expect(tour.inventorySource).toBe("platform");
    expect(tour.providerName).toBe("");
  });
});
