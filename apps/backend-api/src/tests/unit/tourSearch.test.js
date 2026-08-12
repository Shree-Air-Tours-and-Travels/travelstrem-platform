import { getEligibleDeparturePrices, getLegacyTourPrice } from "../../modules/tours/search/tourSearch.eligibility.js";
import { buildTourSearchPipeline } from "../../modules/tours/search/tourSearch.pipeline.js";
import { mapTourSearchResult } from "../../modules/tours/search/tourSearch.mapper.js";
import { normalizeTourSearchRequest } from "../../modules/tours/validators/search.validation.js";

const baseTour = { maxGroupSize: 30, group: { min: 1, max: 30 }, price: { min: 89999, max: 89999, currency: "INR" } };

describe("tour discovery search rules", () => {
  test("rejects malformed paging, dates, prices, and arbitrary sort fields", () => {
    const result = normalizeTourSearchRequest({
      filters: { minPrice: -1, departureDate: "20/12/2026" },
      sort: "$where",
      pageSize: 500,
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(expect.objectContaining({
      "filters.price.min": expect.any(String),
      "filters.departureDate": expect.any(String),
      sort: expect.any(String),
      pageSize: expect.any(String),
    }));
  });

  test("normalizes legacy filter names into the canonical contract", () => {
    const result = normalizeTourSearchRequest({ filters: { originCity: "Delhi", agency: "agency-north", groupSize: 4, arrivalDate: "2026-12-20", tags: ["Burj Khalifa"] }, sort: "price_asc", limit: 8 });
    expect(result.ok).toBe(true);
    expect(result.value).toEqual(expect.objectContaining({
      sort: "PRICE_ASC",
      pageSize: 8,
      filters: expect.objectContaining({ originCityIds: ["delhi"], agencyIds: ["agency-north"], travellers: 4, departureDate: "2026-12-20", tagIds: ["burj khalifa"] }),
    }));
  });

  test("date-specific price excludes a tour whose matching departure exceeds max price", () => {
    const departures = [
      { status: "active", departureDate: "2026-10-10", returnDate: "2026-10-15", availableSeats: 20, pricing: { min: 89999, max: 89999 } },
      { status: "active", departureDate: "2026-12-20", returnDate: "2026-12-25", availableSeats: 20, pricing: { min: 129999, max: 129999 } },
      { status: "active", departureDate: "2027-02-05", returnDate: "2027-02-10", availableSeats: 20, pricing: { min: 94999, max: 94999 } },
    ];
    const prices = getEligibleDeparturePrices(baseTour, departures, { departureDate: "2026-12-20", returnDate: "2026-12-25", price: { max: 100000 } });
    expect(prices).toEqual([]);
  });

  test("remaining seats override the configured group maximum", () => {
    const departures = [{ status: "active", departureDate: "2026-10-10", returnDate: "2026-10-15", availableSeats: 3, pricing: { min: 89999, max: 89999 } }];
    expect(getEligibleDeparturePrices(baseTour, departures, { travellers: 4, price: {} })).toEqual([]);
  });

  test("builds one database aggregation ending in a combined facet", () => {
    const normalized = normalizeTourSearchRequest({ filters: { destinationCityIds: ["dubai"], travellers: 2 }, sort: "recommended" }).value;
    const pipeline = buildTourSearchPipeline(normalized);
    expect(pipeline.at(-1)).toHaveProperty("$facet");
    expect(pipeline.filter((stage) => stage.$lookup)).toHaveLength(2);
    expect(pipeline.at(-1).$facet).toEqual(expect.objectContaining({ items: expect.any(Array), total: expect.any(Array), origins: expect.any(Array), agencies: expect.any(Array), tags: expect.any(Array) }));
  });

  test("builds published text, origin, destination, country, tag, featured, duration, and price filters", () => {
    const search = normalizeTourSearchRequest({
      query: "desert",
      filters: {
        originCityIds: ["delhi"], destinationCityIds: ["dubai"], countryIds: ["uae"], agencyIds: ["agency-north"], tagIds: ["family"],
        featured: true, price: { min: 50000, max: 150000 }, duration: { minDays: 4, maxDays: 8 }, travellers: 2,
        departureDate: "2026-12-20", returnDate: "2026-12-25",
      },
    }).value;
    const pipeline = buildTourSearchPipeline(search);
    const serialized = JSON.stringify(pipeline);
    expect(pipeline[0].$match).toEqual(expect.objectContaining({ status: "published", $text: { $search: "desert" } }));
    ["delhi", "dubai", "uae", "agency-north", "family", "2026-12-20T00:00:00.000Z", "2026-12-25T00:00:00.000Z"].forEach((value) => expect(serialized).toContain(value));
    expect(serialized).toContain('"featured":true');
    expect(serialized).toContain('"_durationDays":{"$gte":4,"$lte":8}');
    expect(serialized).toContain('"_priceMin":{"$gte":50000}');
    expect(serialized).toContain('"_priceMax":{"$lte":150000}');
  });

  test.each([
    ["PRICE_ASC", { _priceMin: 1 }],
    ["PRICE_DESC", { _priceMin: -1 }],
    ["RECOMMENDED", { featured: -1, trending: -1 }],
  ])("uses the approved %s database sort", (sort, expected) => {
    const search = normalizeTourSearchRequest({ sort, page: 2, pageSize: 5 }).value;
    const facet = buildTourSearchPipeline(search).at(-1).$facet;
    expect(facet.items[0].$sort).toEqual(expect.objectContaining(expected));
    expect(facet.items[1]).toEqual({ $skip: 5 });
    expect(facet.items[2]).toEqual({ $limit: 5 });
  });

  test("filters departure and return dates and rejects unavailable departures", () => {
    const departures = [
      { status: "cancelled", departureDate: "2026-12-20", returnDate: "2026-12-25", availableSeats: 20, pricing: { min: 90000, max: 90000 } },
      { status: "active", departureDate: "2026-12-21", returnDate: "2026-12-26", availableSeats: 20, pricing: { min: 90000, max: 90000 } },
    ];
    expect(getEligibleDeparturePrices(baseTour, departures, { departureDate: "2026-12-20", returnDate: "2026-12-25", price: {} })).toEqual([]);
  });

  test("applies the seasonal price for legacy records", () => {
    const tour = {
      price: { min: 89999, max: 89999 },
      seasonalPricing: [{ seasonName: "Christmas", startDate: "2026-12-15", endDate: "2026-12-31", min: 129999, max: 149999 }],
    };
    expect(getLegacyTourPrice(tour, "2026-12-20")).toEqual(expect.objectContaining({ min: 129999, max: 149999 }));
  });

  test("maps empty aggregation results into a stable paginated DTO", () => {
    const search = normalizeTourSearchRequest({ page: 3, pageSize: 8 }).value;
    expect(mapTourSearchResult({}, search)).toEqual(expect.objectContaining({
      items: [],
      pagination: expect.objectContaining({ page: 3, pageSize: 8, totalItems: 0, totalPages: 0, hasNext: false }),
      facets: expect.objectContaining({ origins: [], destinations: [], countries: [], agencies: [], tags: [] }),
    }));
  });

  test("normalizes legacy object-shaped place labels before they reach React", () => {
    const search = normalizeTourSearchRequest({ page: 1, pageSize: 8 }).value;
    const result = mapTourSearchResult({
      items: [{
        id: "legacy-tour",
        title: "Legacy tour",
        route: { destination: { name: { city: "Dubai", country: "UAE" } } },
        location: { city: { city: "Dubai", country: "UAE" }, country: "UAE" },
        tags: [{ id: "dubai", name: { city: "Dubai", country: "UAE" } }],
      }],
      total: [{ count: 1 }],
      destinations: [{ _id: "dubai", name: { city: "Dubai", country: "UAE" }, count: 1 }],
    }, search);

    expect(result.items[0].route.destination.name).toBe("Dubai, UAE");
    expect(result.items[0].location.city).toBe("Dubai, UAE");
    expect(result.items[0].tags[0].name).toBe("Dubai, UAE");
    expect(result.facets.destinations[0].label).toBe("Dubai, UAE");
  });
});
