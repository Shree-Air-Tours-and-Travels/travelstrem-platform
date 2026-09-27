export const TOUR_PAGE_SIZE = 8;

export const TOUR_SORT = Object.freeze({
  RECOMMENDED: "RECOMMENDED",
  PRICE_ASC: "PRICE_ASC",
  PRICE_DESC: "PRICE_DESC",
  DURATION_ASC: "DURATION_ASC",
  DURATION_DESC: "DURATION_DESC",
  NEWEST: "NEWEST",
  POPULAR: "POPULAR",
  TRENDING: "TRENDING",
  RATING: "RATING",
});

const UI_SORT_TO_API = Object.freeze({
  recommended: TOUR_SORT.RECOMMENDED,
  price_asc: TOUR_SORT.PRICE_ASC,
  price_desc: TOUR_SORT.PRICE_DESC,
  duration: TOUR_SORT.DURATION_ASC,
  duration_asc: TOUR_SORT.DURATION_ASC,
  duration_desc: TOUR_SORT.DURATION_DESC,
  newest: TOUR_SORT.NEWEST,
  popular: TOUR_SORT.POPULAR,
  trending: TOUR_SORT.TRENDING,
  rating: TOUR_SORT.RATING,
});

const API_SORT_TO_UI = Object.fromEntries(
  Object.entries(UI_SORT_TO_API).map(([key, value]) => [value, key]),
);
API_SORT_TO_UI[TOUR_SORT.DURATION_ASC] = "duration";

export const createDefaultTourSearchState = () => ({
  query: "",
  filters: {
    originCityIds: [],
    destinationCityIds: [],
    countryIds: [],
    agencyIds: [],
    price: { min: null, max: null },
    duration: { minDays: null, maxDays: null },
    travellers: null,
    departureDate: null,
    returnDate: null,
    tagIds: [],
    featured: null,
  },
  sort: TOUR_SORT.RECOMMENDED,
  page: 1,
  pageSize: TOUR_PAGE_SIZE,
});

const listParam = (params, key) => [
  ...new Set(
    (params.get(key) || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  ),
];
const numberParam = (params, key) => {
  const raw = params.get(key);
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const parseTourSearchUrl = (search = "") => {
  const params = new URLSearchParams(search);
  const state = createDefaultTourSearchState();
  const featured = params.get("featured");
  return {
    ...state,
    query: (params.get("q") || "").slice(0, 120),
    filters: {
      originCityIds: listParam(params, "origin"),
      destinationCityIds: listParam(params, "destination"),
      countryIds: listParam(params, "country"),
      agencyIds: listParam(params, "agency"),
      price: { min: numberParam(params, "minPrice"), max: numberParam(params, "maxPrice") },
      duration: {
        minDays: numberParam(params, "minDays"),
        maxDays: numberParam(params, "maxDays"),
      },
      travellers: numberParam(params, "travellers"),
      departureDate: params.get("departure") || null,
      returnDate: params.get("return") || null,
      tagIds: listParam(params, "tags"),
      featured: featured === "true" ? true : featured === "false" ? false : null,
    },
    sort:
      UI_SORT_TO_API[(params.get("sort") || "recommended").toLowerCase()] || TOUR_SORT.RECOMMENDED,
    page: Math.max(1, numberParam(params, "page") || 1),
    pageSize: TOUR_PAGE_SIZE,
  };
};

export const serializeTourSearchUrl = (state) => {
  const params = new URLSearchParams();
  const set = (key, value) => {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      (!Array.isArray(value) || value.length)
    ) {
      params.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
  };
  set("q", state.query);
  set("origin", state.filters.originCityIds);
  set("destination", state.filters.destinationCityIds);
  set("country", state.filters.countryIds);
  set("agency", state.filters.agencyIds);
  set("minPrice", state.filters.price.min);
  set("maxPrice", state.filters.price.max);
  set("minDays", state.filters.duration.minDays);
  set("maxDays", state.filters.duration.maxDays);
  set("travellers", state.filters.travellers);
  set("departure", state.filters.departureDate);
  set("return", state.filters.returnDate);
  set("tags", state.filters.tagIds);
  if (state.filters.featured != null) set("featured", state.filters.featured);
  if (state.sort !== TOUR_SORT.RECOMMENDED)
    set("sort", API_SORT_TO_UI[state.sort] || state.sort.toLowerCase());
  if (state.page > 1) set("page", state.page);
  return params.toString();
};

export const flattenTourSearchState = (state) => ({
  query: state.query,
  originCityIds: state.filters.originCityIds,
  destinationCityIds: state.filters.destinationCityIds,
  countryIds: state.filters.countryIds,
  agencyIds: state.filters.agencyIds,
  minPrice: state.filters.price.min ?? "",
  maxPrice: state.filters.price.max ?? "",
  minDays: state.filters.duration.minDays ?? "",
  maxDays: state.filters.duration.maxDays ?? "",
  travellers: state.filters.travellers ?? "",
  departureDate: state.filters.departureDate || "",
  returnDate: state.filters.returnDate || "",
  tagIds: state.filters.tagIds,
  featured: state.filters.featured == null ? "" : String(state.filters.featured),
});

const nullableNumber = (value) => (value === "" || value == null ? null : Number(value));

export const mergeFlatFiltersIntoSearch = (state, values) => ({
  ...state,
  query: String(values.query || ""),
  page: 1,
  filters: {
    originCityIds: values.originCityIds || [],
    destinationCityIds: values.destinationCityIds || [],
    countryIds: values.countryIds || [],
    agencyIds: values.agencyIds || [],
    price: { min: nullableNumber(values.minPrice), max: nullableNumber(values.maxPrice) },
    duration: { minDays: nullableNumber(values.minDays), maxDays: nullableNumber(values.maxDays) },
    travellers: nullableNumber(values.travellers),
    departureDate: values.departureDate || null,
    returnDate: values.returnDate || null,
    tagIds: values.tagIds || [],
    featured: values.featured === "true" ? true : values.featured === "false" ? false : null,
  },
});

export const getUiSortId = (sort) => API_SORT_TO_UI[sort] || "recommended";
export const getApiSort = (sortId) => UI_SORT_TO_API[sortId] || TOUR_SORT.RECOMMENDED;

export const applyTourDiscoveryChip = (state, chip) => {
  if (!chip) return state;
  const next = { ...state, page: 1, filters: { ...state.filters } };
  const toggleValue = (values = [], value) =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  if (chip.type === "ALL") {
    next.filters.originCityIds = [];
    next.filters.destinationCityIds = [];
    next.filters.countryIds = [];
    next.filters.agencyIds = [];
    next.filters.tagIds = [];
    next.filters.featured = null;
  } else if (chip.type === "ORIGIN")
    next.filters.originCityIds = toggleValue(state.filters.originCityIds, chip.value);
  else if (chip.type === "DESTINATION")
    next.filters.destinationCityIds = toggleValue(state.filters.destinationCityIds, chip.value);
  else if (chip.type === "COUNTRY")
    next.filters.countryIds = toggleValue(state.filters.countryIds, chip.value);
  else if (chip.type === "TAG") next.filters.tagIds = toggleValue(state.filters.tagIds, chip.value);
  else if (chip.type === "FEATURED") {
    const value = chip.value === true || chip.value === "true";
    next.filters.featured = state.filters.featured === value ? null : value;
  }
  return next;
};

const facetLabel = (facets, group, value) => {
  const facet = facets?.[group]?.find((item) => item.value === value);
  return facet?.label || facet?.name || value;
};

const formatFilterCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const getActiveTourFilterChips = (state, facets = {}) => {
  const chips = [];
  if (state.query) chips.push({ id: "query", label: `Search: ${state.query}` });
  state.filters.originCityIds.forEach((value) =>
    chips.push({ id: `origin:${value}`, label: `From ${facetLabel(facets, "origins", value)}` }),
  );
  state.filters.destinationCityIds.forEach((value) =>
    chips.push({
      id: `destination:${value}`,
      label: `To ${facetLabel(facets, "destinations", value)}`,
    }),
  );
  state.filters.countryIds.forEach((value) =>
    chips.push({ id: `country:${value}`, label: facetLabel(facets, "countries", value) }),
  );
  state.filters.agencyIds.forEach((value) =>
    chips.push({
      id: `agency:${value}`,
      label: `Agency: ${facetLabel(facets, "agencies", value)}`,
    }),
  );
  state.filters.tagIds.forEach((value) =>
    chips.push({ id: `tag:${value}`, label: facetLabel(facets, "tags", value) }),
  );
  if (state.filters.price.min != null || state.filters.price.max != null)
    chips.push({
      id: "price",
      label: `Price ${formatFilterCurrency(state.filters.price.min)}–${
        state.filters.price.max == null
          ? "any"
          : formatFilterCurrency(state.filters.price.max)
      }`,
    });
  if (state.filters.duration.minDays != null || state.filters.duration.maxDays != null)
    chips.push({
      id: "duration",
      label: `${state.filters.duration.minDays ?? 1}–${state.filters.duration.maxDays ?? "any"} days`,
    });
  if (state.filters.travellers != null)
    chips.push({ id: "travellers", label: `${state.filters.travellers} travellers` });
  if (state.filters.departureDate)
    chips.push({ id: "departureDate", label: `Depart ${state.filters.departureDate}` });
  if (state.filters.returnDate)
    chips.push({ id: "returnDate", label: `Return ${state.filters.returnDate}` });
  if (state.filters.featured != null)
    chips.push({ id: "featured", label: state.filters.featured ? "Featured" : "Standard" });
  return chips;
};

export const removeTourFilter = (state, id) => {
  const next = { ...state, page: 1, filters: { ...state.filters } };
  const [type, value] = id.split(":");
  if (type === "query") next.query = "";
  else if (type === "origin")
    next.filters.originCityIds = state.filters.originCityIds.filter((item) => item !== value);
  else if (type === "destination")
    next.filters.destinationCityIds = state.filters.destinationCityIds.filter(
      (item) => item !== value,
    );
  else if (type === "country")
    next.filters.countryIds = state.filters.countryIds.filter((item) => item !== value);
  else if (type === "agency")
    next.filters.agencyIds = state.filters.agencyIds.filter((item) => item !== value);
  else if (type === "tag")
    next.filters.tagIds = state.filters.tagIds.filter((item) => item !== value);
  else if (type === "price") next.filters.price = { min: null, max: null };
  else if (type === "duration") next.filters.duration = { minDays: null, maxDays: null };
  else if (type === "travellers") next.filters.travellers = null;
  else if (type === "departureDate") next.filters.departureDate = null;
  else if (type === "returnDate") next.filters.returnDate = null;
  else if (type === "featured") next.filters.featured = null;
  return next;
};
