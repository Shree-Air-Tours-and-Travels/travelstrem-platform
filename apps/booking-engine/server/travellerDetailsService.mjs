import { validateFormFields } from "@packages/trem-form-engine";
import { readFileSync } from "node:fs";

const productDefinitions = JSON.parse(
  readFileSync(new URL("./config/bookingJourneyProducts.json", import.meta.url), "utf8"),
);

const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "United Arab Emirates", "Other"]
  .map((value) => ({ value, label: value }));
const genders = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];
const meals = ["Vegetarian", "Non-vegetarian", "Vegan", "Jain", "No preference"].map((label) => ({ value: label.toLowerCase().replace(/[^a-z]+/g, "_"), label }));
const drinks = ["Non-alcoholic", "Alcoholic", "No preference"].map((label) => ({ value: label.toLowerCase().replace(/[^a-z]+/g, "_"), label }));
const rooms = [
  { value: "couple_double", label: "Double bed with partner" },
  { value: "friends_shared", label: "Share with my friends" },
  { value: "stranger_allowed", label: "Can share with another traveller" },
  { value: "private_room", label: "Private room only" },
];
const insurance = [
  { value: "required", label: "Add travel insurance" },
  { value: "not_required", label: "Travel insurance not required" },
  { value: "already_covered", label: "Already insured" },
];
const travellerOptionSets = { meals, drinks, rooms, insurance };

const field = (name, type, label, extra = {}) => ({ name, path: name, type, label, ...extra });

export const buildTravellerDetailsForm = ({ count = 1, requiresPassport = false, product = "trevista", includeTripPreferences, optionSets = {}, typeCounts = {}, saved = null } = {}) => {
  const travellerCount = Math.max(1, Math.min(50, Number(count) || 1));
  const resolvedOptionSets = {
    countries: optionSets.countries?.length ? optionSets.countries : countries,
    genders: optionSets.genders?.length ? optionSets.genders : genders,
    meals: optionSets.meals?.length ? optionSets.meals : meals,
    drinks: optionSets.drinks?.length ? optionSets.drinks : drinks,
    rooms: optionSets.rooms?.length ? optionSets.rooms : rooms,
    insurance: optionSets.insurance?.length ? optionSets.insurance : insurance,
  };
  const configuredExtraFields = productDefinitions[product]?.traveller?.extraFields || [];
  const extraFields = includeTripPreferences === true && !configuredExtraFields.length
    ? productDefinitions.trevio.traveller.extraFields
    : includeTripPreferences === false ? [] : configuredExtraFields;
  const sections = Array.from({ length: travellerCount }, (_, index) => {
    const prefix = `traveller_${index}`;
    return {
      id: prefix,
      title: `Traveller ${index + 1}${index === 0 ? " · Primary traveller" : ""}`,
      description: requiresPassport
        ? "This is an international journey. Enter names exactly as they appear on each passport."
        : "Enter the traveller's identity details for reservations and vouchers.",
      collapsible: true,
      defaultExpanded: index === 0,
      fields: [
        field(`${prefix}_firstName`, "text", "First name", { required: true, minLength: 2, maxLength: 80 }),
        field(`${prefix}_lastName`, "text", "Last name", { required: true, minLength: 1, maxLength: 80 }),
        field(`${prefix}_type`, "select", "Traveller type", { required: true, width: "full", options: [
          { value: "adult", label: "Adult" }, { value: "child", label: "Child" }, { value: "infant", label: "Infant" },
        ] }),
        field(`${prefix}_dob`, "date", "Date of birth", { required: true, mode: "birthdate" }),
        field(`${prefix}_gender`, "select", "Gender", { required: true, width: "full", options: resolvedOptionSets.genders }),
        field(`${prefix}_nationality`, "select", "Nationality", { required: true, width: "full", options: resolvedOptionSets.countries }),
        ...extraFields.map(({ name, optionsRef, ...configured }) =>
          field(`${prefix}_${name}`, configured.type, configured.label, {
            ...configured,
            ...(optionsRef ? { options: resolvedOptionSets[optionsRef] || travellerOptionSets[optionsRef] || [] } : {}),
          })),
        ...(requiresPassport ? [
          field(`${prefix}_passportNumber`, "text", "Passport number", { required: true, minLength: 5, maxLength: 20, pattern: "^[A-Za-z0-9]{5,20}$" }),
          field(`${prefix}_passportCountry`, "select", "Passport issuing country", { required: true, width: "full", options: resolvedOptionSets.countries }),
          field(`${prefix}_passportExpiry`, "date", "Passport expiry", { required: true, minDate: "today" }),
        ] : []),
      ],
    };
  });
  const adults = Math.max(0, Number(typeCounts.adults || 0));
  const children = Math.max(0, Number(typeCounts.children || 0));
  const defaultTypes = Object.fromEntries(
    Array.from({ length: travellerCount }, (_, index) => [
      `traveller_${index}_type`,
      index < adults ? "adult" : index < adults + children ? "child" : "infant",
    ]),
  );
  return {
    title: "Traveller details",
    description: requiresPassport
      ? "Flight details are included in this quotation, so passport information is required for every traveller."
      : "Add the names and identity details needed for confirmed reservations.",
    config: {
      layout: { columns: 2, columnsMobile: 1, controlSize: "medium", expandable: true, defaultExpanded: false, showExpandAll: true },
      sections,
    },
    values: { ...defaultTypes, ...(saved?.values || {}) },
    completedAt: saved?.completedAt || null,
    requiresPassport,
  };
};

export const validateTravellerDetails = ({ count, requiresPassport, product = "trevista", includeTripPreferences, optionSets, values }) => {
  const form = buildTravellerDetailsForm({ count, requiresPassport, product, includeTripPreferences, optionSets });
  const fields = form.config.sections.flatMap((section) => section.fields);
  const result = validateFormFields(fields, values || {});
  Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => index).forEach((index) => {
    const path = `traveller_${index}_dob`;
    const dob = result.data[path] ? new Date(`${result.data[path]}T00:00:00.000Z`) : null;
    if (dob && (!Number.isFinite(dob.getTime()) || dob >= new Date())) result.errors[path] = "Date of birth must be in the past";
  });
  return { ...result, valid: Object.keys(result.errors).length === 0 };
};

const resolveEnquiryFields = (definition, context) => definition.fields.flatMap((configuredField) => {
  if (configuredField.slot === "travelDates") {
    if (context.packageType === "fixed_departure" && context.departureOptions.length) {
      return [field("preferredTravelDate", "select", "Available departure", {
        required: true,
        options: context.departureOptions,
        width: "full",
      })];
    }
    return [
      field("preferredStartDate", "date", "Suitable start date", {
        required: true,
        minDate: context.earliestDeparture || "today",
      }),
      field("preferredEndDate", "date", "Suitable end date", {
        required: true,
        maxDate: context.latestReturn || undefined,
      }),
    ];
  }
  if (configuredField.slot === "customQuestions") {
    return context.allowCustomization
      ? context.customizationQuestions.map((label, index) =>
          field(`customQuestion_${index}`, "textarea", label, { required: false, maxLength: 1000, rows: 3, colSpan: 2 }))
      : [];
  }
  if (configuredField.slot === "hotelPreferences") {
    return context.hotelGroups.flatMap((group) => [
      field(
        `hotelPreference_${group.key}`,
        "select",
        group.location ? `Hotel preference in ${group.location}` : "Hotel preference",
        { required: false, options: group.hotelOptions, width: "full" },
      ),
      field(
        `roomPreference_${group.key}`,
        "select",
        group.location ? `Room preference in ${group.location}` : "Room preference",
        { required: false, options: group.roomOptions, width: "full" },
      ),
    ]);
  }
  if (configuredField.slot === "addOns") {
    return context.addOnOptions.map((addOn) =>
      field(`addOn_${addOn.key}`, "checkbox", addOn.label, {
        required: false,
        checkboxLabel: addOn.description
          ? `${addOn.label} — ${addOn.description}`
          : addOn.label,
        colSpan: 2,
      }));
  }
  if (configuredField.name === "customizationPreference" && !context.allowCustomization) return [];
  if (configuredField.name === "flightPreference" && context.packageOptions.length) return [];
  const options = configuredField.optionsRef
    ? context[`${configuredField.optionsRef.slice(0, -1)}Options`] || []
    : configuredField.options;
  if (configuredField.optionsRef === "packages" && !options.length) return [];
  const { optionsRef: _optionsRef, requiredWhenOptions, ...resolved } = configuredField;
  return [{
    ...resolved,
    ...(options ? { options } : {}),
    ...(requiredWhenOptions ? { required: options.length > 0 } : {}),
    path: resolved.name,
  }];
});

export const buildProductEnquiryDetailsForm = ({
  product = "trevista",
  saved = {},
  packageOptions = [],
  departureOptions = [],
  packageType = "fixed_departure",
  allowCustomization = false,
  customizationQuestions = [],
  hotelGroups = [],
  addOnOptions = [],
  earliestDeparture = "",
  latestReturn = "",
  defaultFlightPreference = "",
} = {}) => {
  const productDefinition = productDefinitions[product] || productDefinitions.trevista;
  const context = {
    packageOptions,
    departureOptions,
    packageType,
    allowCustomization,
    customizationQuestions,
    hotelGroups,
    addOnOptions,
    earliestDeparture,
    latestReturn,
  };
  const resolvedFields = resolveEnquiryFields(productDefinition.enquiry, context);
  const partyFields = resolvedFields.filter((item) => ["adultCount", "childCount", "infantCount"].includes(item.name));
  const requestFields = resolvedFields.filter((item) => !partyFields.includes(item));
  return {
  title: productDefinition.enquiry.title,
  description: productDefinition.enquiry.description,
  config: {
    layout: { columns: 2, columnsMobile: 1, controlSize: "medium" },
    sections: [{
      id: `${product}-party`,
      title: "Travellers",
      description: "Set the group size first. Individual forms are created after you save this step.",
      columns: 3,
      columnsMobile: 1,
      fields: partyFields,
    }, {
      id: `${product}-request`,
      title: productDefinition.enquiry.sectionTitle,
      description: productDefinition.enquiry.sectionDescription,
      columns: 2,
      columnsMobile: 1,
      fields: requestFields,
    }],
  },
  values: {
    adultCount: Number(saved.adultCount || 1),
    childCount: Number(saved.childCount || 0),
    infantCount: Number(saved.infantCount || 0),
    packageKey: saved.packageKey || "",
    customizationPreference: saved.customizationPreference || "package",
    flightPreference: saved.flightPreference || defaultFlightPreference || "",
    preferredTravelDate: saved.preferredTravelDate || "",
    preferredStartDate: saved.preferredStartDate || "",
    preferredEndDate: saved.preferredEndDate || "",
    message: saved.message || "",
    ...Object.fromEntries(customizationQuestions.map((_, index) => [
      `customQuestion_${index}`,
      saved[`customQuestion_${index}`] || "",
    ])),
    ...Object.fromEntries(hotelGroups.map((group) => [
      `hotelPreference_${group.key}`,
      saved[`hotelPreference_${group.key}`] || "",
    ])),
    ...Object.fromEntries(hotelGroups.map((group) => [
      `roomPreference_${group.key}`,
      saved[`roomPreference_${group.key}`] || "",
    ])),
    ...Object.fromEntries(addOnOptions.map((addOn) => [
      `addOn_${addOn.key}`,
      saved[`addOn_${addOn.key}`] === true || saved[`addOn_${addOn.key}`] === "true",
    ])),
  },
  product,
  };
};

export const buildTripEnquiryDetailsForm = (options = {}) =>
  buildProductEnquiryDetailsForm({ ...options, product: "trevio" });

export const validateProductEnquiryDetails = ({ product = "trevista", values, ...context }) => {
  const form = buildProductEnquiryDetailsForm({ product, ...context });
  const fields = form.config.sections.flatMap((section) => section.fields);
  const result = validateFormFields(fields, values || {});
  const adults = Number(result.data.adultCount || 0);
  const children = Number(result.data.childCount || 0);
  const infants = Number(result.data.infantCount || 0);
  const total = adults + children + infants;
  if (![adults, children, infants].every(Number.isInteger)) result.errors.adultCount = "Traveller counts must be whole numbers";
  if (adults < 1) result.errors.adultCount = "At least one adult is required";
  if (total < 1 || total > 50) result.errors.adultCount = "Total travellers must be between 1 and 50";
  if (context.packageOptions?.length && !context.packageOptions.some((item) => item.value === result.data.packageKey)) result.errors.packageKey = "Choose an available package";
  if (context.departureOptions?.length && context.packageType === "fixed_departure" && !context.departureOptions.some((item) => item.value === result.data.preferredTravelDate)) result.errors.preferredTravelDate = "Choose an available departure";
  if (result.data.preferredStartDate && result.data.preferredEndDate && result.data.preferredEndDate < result.data.preferredStartDate) result.errors.preferredEndDate = "End date must be after the start date";
  if (result.data.customizationPreference && !["package", "customize"].includes(result.data.customizationPreference)) result.errors.customizationPreference = "Choose an available tour preference";
  (context.hotelGroups || []).forEach((group) => {
    const hotelPath = `hotelPreference_${group.key}`;
    const roomPath = `roomPreference_${group.key}`;
    const hotelValue = result.data[hotelPath];
    const roomValue = result.data[roomPath];
    if (hotelValue && !roomValue) result.errors[roomPath] = "Choose a room for the selected hotel";
    if (roomValue && !hotelValue) result.errors[hotelPath] = "Choose the hotel for this room";
    if (hotelValue && roomValue && String(roomValue).split("|")[0] !== String(hotelValue)) {
      result.errors[roomPath] = "Choose a room available at the selected hotel";
    }
  });
  return { ...result, travellerCount: total, valid: Object.keys(result.errors).length === 0 };
};

export const validateTripEnquiryDetails = (options = {}) =>
  validateProductEnquiryDetails({ ...options, product: "trevio" });
