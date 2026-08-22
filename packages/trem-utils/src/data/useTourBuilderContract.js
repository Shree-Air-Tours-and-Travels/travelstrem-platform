import useMasterOptions from "./useMasterOptions.js";

export const TOUR_BUILDER_OPTION_KEYS = Object.freeze([
  "trevista.tourBuilderSteps",
  "trevista.tourBuilderRequiredFields",
  "trevista.packageTypeOptions",
  "trevista.departureStatusOptions",
  "trevista.tourStatusOptions",
  "trevista.extraCategoryOptions",
  "trevista.flexiblePricingModelOptions",
  "trevista.stayTierOptions",
  "common.currencyOptions",
  "trevista.tourOperationsSectionOptions",
  "trevista.priceSourceOptions",
]);

export default function useTourBuilderContract() {
  const state = useMasterOptions(TOUR_BUILDER_OPTION_KEYS);
  return {
    ...state,
    steps: state.options["trevista.tourBuilderSteps"] || [],
    requiredFields: state.options["trevista.tourBuilderRequiredFields"] || [],
    packageTypes: state.options["trevista.packageTypeOptions"] || [],
    departureStatuses: state.options["trevista.departureStatusOptions"] || [],
    tourStatuses: state.options["trevista.tourStatusOptions"] || [],
    extraCategories: state.options["trevista.extraCategoryOptions"] || [],
    flexiblePricingModels: state.options["trevista.flexiblePricingModelOptions"] || [],
    stayTiers: state.options["trevista.stayTierOptions"] || [],
    currencies: state.options["common.currencyOptions"] || [],
    operationSections: state.options["trevista.tourOperationsSectionOptions"] || [],
    priceSources: state.options["trevista.priceSourceOptions"] || [],
  };
}

export function selectStepErrors(allErrors, requiredFields, stepKey) {
  const names = new Set(requiredFields.filter((field) => field.metadata?.step === stepKey).map((field) => field.value));
  return Object.fromEntries(Object.entries(allErrors).filter(([name]) => names.has(name)));
}

export function validateTourBuilderCollections(form = {}) {
  const errors = {};
  const commercial = form.commercial || {};

  if (commercial.version === "COMPONENTS_V1") {
    if (![2, 3].includes((commercial.packages || []).length)) errors.commercial = "Add two or three packages";
    if (!(commercial.components || []).length) errors.commercial = "Add at least one priced component";

    const componentIndex = (commercial.components || []).findIndex((item) =>
      !item.componentKey || !item.name?.trim() || !item.type || !item.pricing?.unit
      || item.pricing?.costAmountMinor == null || Number(item.pricing.costAmountMinor) < 0
      || item.pricing?.sellingAmountMinor == null || Number(item.pricing.sellingAmountMinor) < 0);
    if (componentIndex >= 0) errors.commercial = `Component ${componentIndex + 1}: complete its name, type, pricing unit, supplier cost and selling amount`;

    const packageIndex = (commercial.packages || []).findIndex((item) => !item.packageKey || !item.name?.trim() || !item.tier);
    if (packageIndex >= 0) errors.commercial = `Package ${packageIndex + 1}: complete its display name and tier`;
  }

  if (form.packageType === "fixed_departure") {
    const departureIndex = (form.departures || []).findIndex((item) => {
      const min = item.pricing?.min ?? item.min;
      const max = item.pricing?.max ?? item.max;
      return !item.departureDate || !item.returnDate || min == null || Number(min) < 0 || max == null || Number(max) < 0 || Number(min) > Number(max);
    });
    if (departureIndex >= 0) errors.departures = `Departure ${departureIndex + 1}: complete its departure date, return date, minimum price and maximum price`;
  }

  const itineraryIndex = (form.itinerary || []).findIndex((item) => !item.day || Number(item.day) < 1);
  if (itineraryIndex >= 0) errors.itinerary = `Itinerary item ${itineraryIndex + 1}: enter a valid day number`;
  return errors;
}
