import {
  createDefaultTourSearchState,
  applyTourDiscoveryChip,
  getApiSort,
  mergeFlatFiltersIntoSearch,
  parseTourSearchUrl,
  removeTourFilter,
  serializeTourSearchUrl,
} from "../features/tours/search/tourSearchState";

describe("Trevista canonical tour search state", () => {
  test("round-trips shareable URL state", () => {
    const state = parseTourSearchUrl(
      "?origin=delhi&destination=abu-dhabi&agency=agency-north&tags=burj-khalifa,cultural-tour&maxPrice=150000&minDays=5&sort=price_asc&page=2",
    );
    expect(state.filters).toEqual(
      expect.objectContaining({
        originCityIds: ["delhi"],
        destinationCityIds: ["abu-dhabi"],
        agencyIds: ["agency-north"],
        tagIds: ["burj-khalifa", "cultural-tour"],
      }),
    );
    expect(parseTourSearchUrl(`?${serializeTourSearchUrl(state)}`)).toEqual(state);
  });

  test("filter updates reset pagination and create the API contract", () => {
    const state = { ...createDefaultTourSearchState(), page: 4 };
    const next = mergeFlatFiltersIntoSearch(state, {
      query: "Dubai",
      originCityIds: ["delhi"],
      destinationCityIds: [],
      countryIds: [],
      agencyIds: ["agency-north"],
      minPrice: "",
      maxPrice: 100000,
      minDays: 5,
      maxDays: 7,
      travellers: 4,
      departureDate: "2026-12-20",
      returnDate: "2026-12-25",
      tagIds: [],
      featured: "true",
    });
    expect(next.page).toBe(1);
    expect(next.filters).toEqual(
      expect.objectContaining({
        agencyIds: ["agency-north"],
        price: { min: null, max: 100000 },
        duration: { minDays: 5, maxDays: 7 },
        travellers: 4,
        featured: true,
      }),
    );
  });

  test("removing one chip preserves unrelated filters", () => {
    const state = parseTourSearchUrl(
      "?origin=delhi&minPrice=1&tags=desert-safari,family&travellers=4",
    );
    const next = removeTourFilter(state, "tag:family");
    expect(next.filters.tagIds).toEqual(["desert-safari"]);
    expect(next.filters.originCityIds).toEqual(["delhi"]);
    expect(next.filters.travellers).toBe(4);
  });

  test("maps only approved sort identifiers", () => {
    expect(getApiSort("rating")).toBe("RATING");
    expect(getApiSort("$where")).toBe("RECOMMENDED");
  });

  test("discovery chips update the same canonical filters as the sidebar", () => {
    const state = { ...createDefaultTourSearchState(), page: 3 };
    const origin = applyTourDiscoveryChip(state, { type: "ORIGIN", value: "delhi" });
    expect(origin.filters.originCityIds).toEqual(["delhi"]);
    expect(origin.page).toBe(1);

    const tag = applyTourDiscoveryChip(origin, { type: "TAG", value: "burj-khalifa" });
    expect(tag.filters.tagIds).toEqual(["burj-khalifa"]);
    const secondTag = applyTourDiscoveryChip(tag, { type: "TAG", value: "family" });
    expect(secondTag.filters.tagIds).toEqual(["burj-khalifa", "family"]);
    const toggledTag = applyTourDiscoveryChip(secondTag, { type: "TAG", value: "burj-khalifa" });
    expect(toggledTag.filters.tagIds).toEqual(["family"]);
    const featured = applyTourDiscoveryChip(toggledTag, { type: "FEATURED", value: true });
    expect(featured.filters.featured).toBe(true);
    expect(featured.filters.tagIds).toEqual(["family"]);
    const cleared = applyTourDiscoveryChip(featured, { type: "ALL", value: null });
    expect(cleared.filters.originCityIds).toEqual([]);
    expect(cleared.filters.tagIds).toEqual([]);
    expect(cleared.filters.featured).toBeNull();
  });

  test("keeps domestic and international as additive choices", () => {
    const state = createDefaultTourSearchState();
    const domestic = applyTourDiscoveryChip(state, { type: "TAG", value: "domestic" });
    const both = applyTourDiscoveryChip(domestic, { type: "TAG", value: "international" });

    expect(both.filters.tagIds).toEqual(["domestic", "international"]);
    expect(parseTourSearchUrl(`?${serializeTourSearchUrl(both)}`).filters.tagIds).toEqual([
      "domestic",
      "international",
    ]);
  });
});
