/**
 * Backend-driven Tour Builder definition registry.
 *
 * Every step / substep / child / widget of the shared tour builder is declared
 * here as data. The frontend renders this JSON generically and contains no
 * tour-specific form logic. Field paths map 1:1 onto the Tour schema (plus the
 * standalone TourDeparture collection).
 *
 * Widget contract
 *   key          stable id inside the step
 *   type         registry key resolved by the frontend WidgetRegistry
 *   path         value path relative to the step payload root ("")
 *   label/help   presentation copy owned by the backend
 *   options      [{ value, label }] static choices
 *   optionsSource { type: "STATIC" | "OPTION_SET" | "API" | "COMPONENTS", ... }
 *   validation   [{ type, value?, message?, path? }] interpreted by the frontend engine
 *   visibleWhen  { field, operator, value } | { all: [] } | { any: [] }
 *   readOnly / permissions  capability gates enforced again server-side
 *   itemWidgets  child widget list for REPEATER / OBJECT composites
 */

const REQUIRED = (message = "This field is required") => ({ type: "REQUIRED", message });

const CURRENCY_OPTIONS_SOURCE = { type: "OPTION_SET", key: "common.currencyOptions" };
const PRICE_SOURCES = {
    type: "OPTION_SET",
    key: "trevista.priceSourceOptions",
};
const STAY_UNITS = ["PER_PERSON", "PER_BOOKING", "PER_ROOM", "PER_NIGHT", "PER_ROOM_PER_NIGHT", "PER_VEHICLE", "PER_PERSON_PER_NIGHT"];
const HOTEL_UNITS = STAY_UNITS.filter((unit) => unit !== "PER_VEHICLE");

const pricingObjectWidgets = ({ units, amountLabel, unitDefault }) => [
    { key: "unit", type: "SELECT", path: "unit", label: "Pricing unit", options: units.map((value) => ({ value, label: value.replaceAll("_", " ").toLowerCase() })), validation: [REQUIRED] },
    { key: "amountMinor", type: "NUMBER", path: "amountMinor", label: amountLabel, help: "Integer minor units (paise)", validation: [{ type: "MIN", value: 0, message: "Must be zero or more" }] },
    { key: "currency", type: "SELECT", path: "currency", label: "Currency", optionsSource: CURRENCY_OPTIONS_SOURCE },
].map((widget) => ({ ...widget, metadata: { ...(widget.metadata || {}), unitDefault } }));

const destinationWidgets = (prefixLabel) => [
    { key: "destinationId", type: "TEXT", path: "destinationId", label: `${prefixLabel} destination id` },
    { key: "name", type: "TEXT", path: "name", label: "Name" },
    { key: "cityId", type: "TEXT", path: "cityId", label: "City id" },
    { key: "cityName", type: "TEXT", path: "cityName", label: "City name" },
    { key: "countryId", type: "TEXT", path: "countryId", label: "Country id" },
    { key: "countryName", type: "TEXT", path: "countryName", label: "Country name" },
];

export const TOUR_BUILDER_KEY = "trevista.tour-builder";
export const TOUR_BUILDER_VERSION = 1;

export const BUILDER_STEPS = Object.freeze([
    /* ------------------------------------------------------------------ */
    {
        stepKey: "basics",
        title: "Core",
        description: "Identity, route and duration of the tour.",
        icon: "compass",
        order: 1,
        ownedPaths: ["title", "shortDescription", "agentRef", "providerName", "slug", "visibility", "city", "address", "distance", "period", "startDate", "endDate"],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "identity",
                title: "Tour identity",
                children: [
                    {
                        childKey: "identity-fields",
                        title: "How travellers will see this tour",
                        widgets: [
                            { key: "title", type: "TEXT", path: "title", label: "Tour title", required: true, validation: [REQUIRED, { type: "MIN_LENGTH", value: 3, message: "Enter at least 3 characters." }, { type: "MAX_LENGTH", value: 120 }] },
                            { key: "shortDescription", type: "TEXTAREA", path: "shortDescription", label: "Short description", rows: 2, validation: [{ type: "MAX_LENGTH", value: 240 }] },
                            { key: "agentRef", type: "TEXT", path: "agentRef", label: "Agent reference", help: "Internal code shown in operations lists." },
                            { key: "providerName", type: "TEXT", path: "providerName", label: "Provider name", capabilities: { canEditPlatformMeta: true } },
                            { key: "slug", type: "TEXT", path: "slug", label: "URL slug", help: "Leave blank to auto-generate from the title.", capabilities: { canEditPlatformMeta: true }, validation: [{ type: "PATTERN", value: "^[a-z0-9-]*$", message: "Lowercase letters, numbers and dashes only" }] },
                            {
                                key: "visibility", type: "SELECT", path: "visibility", label: "Visibility",
                                options: [
                                    { value: "public", label: "Public" },
                                    { value: "agency", label: "Agency only" },
                                    { value: "private", label: "Private draft" },
                                ],
                                capabilities: { canEditVisibility: true },
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "route",
                title: "Route & schedule",
                children: [
                    {
                        childKey: "route-fields",
                        title: "Where from and where to",
                        widgets: [
                            { key: "from", type: "TEXT", path: "city.from", label: "Departure city", required: true, halfWidth: true, validation: [REQUIRED] },
                            { key: "to", type: "TEXT", path: "city.to", label: "Destination city", required: true, halfWidth: true, validation: [REQUIRED] },
                            { key: "line1", type: "TEXT", path: "address.line1", label: "Address line 1" },
                            { key: "line2", type: "TEXT", path: "address.line2", label: "Address line 2" },
                            { key: "addr-city", type: "TEXT", path: "address.city", label: "City", halfWidth: true },
                            { key: "addr-state", type: "TEXT", path: "address.state", label: "State", halfWidth: true },
                            { key: "addr-zip", type: "TEXT", path: "address.zip", label: "ZIP", halfWidth: true },
                            { key: "addr-country", type: "TEXT", path: "address.country", label: "Country", halfWidth: true },
                            { key: "distance", type: "NUMBER", path: "distance", label: "Distance (km)", min: 0, halfWidth: true },
                            { key: "days", type: "NUMBER", path: "period.days", label: "Days", min: 1, required: true, halfWidth: true, validation: [REQUIRED, { type: "MIN", value: 1, message: "Days must be at least 1" }] },
                            { key: "nights", type: "NUMBER", path: "period.nights", label: "Nights", min: 0, required: true, halfWidth: true, validation: [REQUIRED, { type: "MIN", value: 0, message: "Nights must be zero or more" }] },
                            { key: "startDate", type: "DATE", path: "startDate", label: "Start date", halfWidth: true },
                            { key: "endDate", type: "DATE", path: "endDate", label: "End date", halfWidth: true },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "packaging",
        title: "Packaging",
        description: "Choose how travellers can book this tour.",
        icon: "travelPackage",
        order: 2,
        ownedPaths: ["packageType", "departures", "flexibleConfig", "customConfig", "seasonalPricing"],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "type",
                title: "Package type",
                children: [
                    {
                        childKey: "package-type",
                        title: "Booking model",
                        widgets: [
                            {
                                key: "packageType", type: "SELECT", path: "packageType", label: "Package type", required: true,
                                optionsSource: { type: "OPTION_SET", key: "trevista.packageTypeOptions" },
                                validation: [REQUIRED],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "fixed-departures",
                title: "Fixed departures",
                children: [
                    {
                        childKey: "departures",
                        title: "Scheduled departures",
                        widgets: [
                            {
                                key: "departures", type: "REPEATER", path: "departures", label: "Departure",
                                addLabel: "Add departure", itemLabelPath: "label",
                                defaultItem: { status: "active", pricing: { currency: "INR", isFinal: false, source: "manual" } },
                                itemTitle: (item, index) => item?.label || `Departure ${index + 1}`,
                                visibleWhen: { field: "packageType", operator: "EQUALS", value: "fixed_departure" },
                                validation: [{ type: "MIN_ITEMS", value: 1, message: "Fixed departure tours need at least one departure", visibleWhen: { field: "packageType", operator: "EQUALS", value: "fixed_departure" } }],
                                itemWidgets: [
                                    { key: "label", type: "TEXT", path: "label", label: "Label", halfWidth: true },
                                    { key: "status", type: "SELECT", path: "status", label: "Status", halfWidth: true, optionsSource: { type: "OPTION_SET", key: "trevista.departureStatusOptions" } },
                                    { key: "departureDate", type: "DATE", path: "departureDate", label: "Departure date", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "returnDate", type: "DATE", path: "returnDate", label: "Return date", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "capacity", type: "NUMBER", path: "capacity", label: "Capacity", min: 0, halfWidth: true, help: "Leave empty for unlimited" },
                                    { key: "seatsAvailable", type: "NUMBER", path: "seatsAvailable", label: "Seats available", min: 0, halfWidth: true },
                                    { key: "min", type: "NUMBER", path: "pricing.min", label: "Min price", min: 0, required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "max", type: "NUMBER", path: "pricing.max", label: "Max price", min: 0, required: true, halfWidth: true, validation: [REQUIRED, { type: "GTE_PATH", path: "pricing.min", message: "Max must be greater than or equal to min" }] },
                                    { key: "currency", type: "SELECT", path: "pricing.currency", label: "Currency", halfWidth: true, optionsSource: CURRENCY_OPTIONS_SOURCE },
                                    { key: "isFinal", type: "CHECKBOX", path: "pricing.isFinal", label: "Final price (not approximate)", halfWidth: true },
                                    { key: "source", type: "SELECT", path: "pricing.source", label: "Price source", halfWidth: true, optionsSource: PRICE_SOURCES },
                                    { key: "bookingOpensAt", type: "DATETIME", path: "bookingOpensAt", label: "Booking opens at", halfWidth: true },
                                    { key: "bookingClosesAt", type: "DATETIME", path: "bookingClosesAt", label: "Booking closes at", halfWidth: true },
                                    { key: "notes", type: "TEXTAREA", path: "notes", label: "Notes", rows: 2 },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "flexible",
                title: "Flexible configuration",
                children: [
                    {
                        childKey: "flexible-config",
                        title: "Flexible booking window",
                        widgets: [
                            {
                                key: "flexibleWrapper", type: "OBJECT", path: "flexibleConfig",
                                visibleWhen: { field: "packageType", operator: "EQUALS", value: "flexible" },
                                widgets: [
                                    { key: "earliestDeparture", type: "DATE", path: "earliestDeparture", label: "Earliest departure", halfWidth: true },
                                    { key: "latestReturn", type: "DATE", path: "latestReturn", label: "Latest return", halfWidth: true },
                                    { key: "blackoutDates", type: "TAGS", path: "blackoutDates", label: "Blackout dates", help: "Add dates as YYYY-MM-DD" },
                                    { key: "pricingModel", type: "SELECT", path: "pricingModel", label: "Pricing model", halfWidth: true, optionsSource: { type: "OPTION_SET", key: "trevista.flexiblePricingModelOptions" } },
                                    { key: "minAdvanceBookingDays", type: "NUMBER", path: "minAdvanceBookingDays", label: "Min advance booking days", min: 0, halfWidth: true },
                                    { key: "maxAdvanceBookingDays", type: "NUMBER", path: "maxAdvanceBookingDays", label: "Max advance booking days", min: 0, halfWidth: true },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "custom",
                title: "Custom configuration",
                children: [
                    {
                        childKey: "custom-config",
                        title: "Custom trip requests",
                        widgets: [
                            {
                                key: "customWrapper", type: "OBJECT", path: "customConfig",
                                visibleWhen: { field: "packageType", operator: "EQUALS", value: "custom" },
                                widgets: [
                                    { key: "responseTimeframeHours", type: "NUMBER", path: "responseTimeframeHours", label: "Response timeframe (hours)", min: 1, halfWidth: true },
                                    { key: "requireDates", type: "SWITCH", path: "requireDates", label: "Require travel dates", halfWidth: true },
                                    { key: "requireGroupSize", type: "SWITCH", path: "requireGroupSize", label: "Require group size", halfWidth: true },
                                    { key: "allowAgentDraft", type: "SWITCH", path: "allowAgentDraft", label: "Allow agent drafts", halfWidth: true },
                                    { key: "allowCustomerCustomization", type: "SWITCH", path: "allowCustomerCustomization", label: "Allow customer customisation", halfWidth: true, help: "Shows the full customisation request only for this custom tour." },
                                    { key: "questionnaireFields", type: "TAGS", path: "questionnaireFields", label: "Questionnaire fields", help: "One question per entry" },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "seasonal-pricing",
                title: "Seasonal pricing",
                children: [
                    {
                        childKey: "seasonal-pricing",
                        title: "Seasonal price ranges",
                        widgets: [
                            {
                                key: "seasonalPricing", type: "REPEATER", path: "seasonalPricing", label: "Season",
                                addLabel: "Add season", itemLabelPath: "seasonName",
                                defaultItem: { currency: "INR", isFinal: false, source: "manual" },
                                validation: [
                                    { type: "MAX_ITEMS", value: 24, message: "Too many seasons" },
                                ],
                                itemWidgets: [
                                    { key: "seasonName", type: "TEXT", path: "seasonName", label: "Season name", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "startDate", type: "DATE", path: "startDate", label: "From", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "endDate", type: "DATE", path: "endDate", label: "To", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "min", type: "NUMBER", path: "min", label: "Min price", min: 0, required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "max", type: "NUMBER", path: "max", label: "Max price", min: 0, required: true, halfWidth: true, validation: [REQUIRED, { type: "GTE_PATH", path: "min", message: "Max must be >= min" }] },
                                    { key: "currency", type: "SELECT", path: "currency", label: "Currency", halfWidth: true, optionsSource: CURRENCY_OPTIONS_SOURCE },
                                    { key: "isFinal", type: "CHECKBOX", path: "isFinal", label: "Final price", halfWidth: true },
                                    { key: "source", type: "SELECT", path: "source", label: "Source", halfWidth: true, optionsSource: PRICE_SOURCES },
                                    { key: "notes", type: "TEXTAREA", path: "notes", label: "Notes", rows: 2 },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "commercial",
        title: "Packages & costing",
        description: "Supplier costs, selling prices and the three customer packages.",
        icon: "wallet",
        order: 3,
        ownedPaths: ["commercial.version", "commercial.currency", "commercial.defaultBasis", "commercial.pricingPolicy", "commercial.components", "commercial.packages"],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "basis",
                title: "Pricing basis",
                children: [
                    {
                        childKey: "basis-fields",
                        title: "Default costing basis",
                        widgets: [
                            { key: "currency", type: "SELECT", path: "commercial.currency", label: "Commercial currency", optionsSource: CURRENCY_OPTIONS_SOURCE },
                            {
                                key: "basis", type: "OBJECT", path: "commercial.defaultBasis",
                                widgets: [
                                    { key: "adults", type: "NUMBER", path: "adults", label: "Adults", min: 0, halfWidth: true },
                                    { key: "children", type: "NUMBER", path: "children", label: "Children", min: 0, halfWidth: true },
                                    { key: "infants", type: "NUMBER", path: "infants", label: "Infants", min: 0, halfWidth: true },
                                    { key: "rooms", type: "NUMBER", path: "rooms", label: "Rooms", min: 1, halfWidth: true },
                                    { key: "vehicles", type: "NUMBER", path: "vehicles", label: "Vehicles", min: 1, halfWidth: true },
                                    { key: "nights", type: "NUMBER", path: "nights", label: "Nights", min: 0, halfWidth: true },
                                    { key: "days", type: "NUMBER", path: "days", label: "Days", min: 1, halfWidth: true },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "fees",
                title: "Agent fee & GST",
                children: [
                    {
                        childKey: "fee-policy",
                        title: "Fees and taxes",
                        widgets: [
                            {
                                key: "pricingPolicy", type: "OBJECT", path: "commercial.pricingPolicy",
                                widgets: [
                                    {
                                        key: "feeType", type: "SELECT", path: "feeType", label: "Agent fee method", required: true, halfWidth: true,
                                        options: [
                                            { value: "PERCENTAGE", label: "Percentage of supplier cost" },
                                            { value: "FIXED", label: "Fixed amount" },
                                        ],
                                        validation: [REQUIRED],
                                    },
                                    {
                                        key: "feePercent", type: "NUMBER", path: "feePercent", label: "Agent fee (%)", min: 0, max: 100, halfWidth: true,
                                        visibleWhen: { field: "commercial.pricingPolicy.feeType", operator: "EQUALS", value: "PERCENTAGE" },
                                        validation: [
                                            { type: "MIN", value: 0, message: "Agent fee must be between 0% and 100%" },
                                            { type: "MAX", value: 100, message: "Agent fee must be between 0% and 100%" },
                                        ],
                                    },
                                    {
                                        key: "feeAmountMinor", type: "NUMBER", path: "feeAmountMinor", label: "Fixed agent fee (paise)", min: 0, step: 1, halfWidth: true,
                                        visibleWhen: { field: "commercial.pricingPolicy.feeType", operator: "EQUALS", value: "FIXED" },
                                        validation: [{ type: "INTEGER_MIN", value: 0, message: "Fixed fee must be whole paise, zero or more" }],
                                    },
                                    {
                                        key: "gstPercent", type: "NUMBER", path: "gstPercent", label: "GST on agent fee (%)", min: 0, max: 100, halfWidth: true,
                                        validation: [
                                            { type: "MIN", value: 0, message: "GST must be between 0% and 100%" },
                                            { type: "MAX", value: 100, message: "GST must be between 0% and 100%" },
                                        ],
                                    },
                                    { key: "gstOn", type: "TEXT", path: "gstOn", label: "GST applies to", readOnly: true, halfWidth: true, help: "GST is applied to the agent fee." },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "components",
                title: "Cost components",
                children: [
                    {
                        childKey: "components",
                        title: "Reusable cost & service components",
                        widgets: [
                            {
                                key: "components", type: "REPEATER", path: "commercial.components", label: "Component",
                                addLabel: "Add component", itemLabelPath: "name",
                                defaultItem: { active: true, status: "CONFIRMED", pricing: { unit: "PER_PERSON", costAmountMinor: 0, sellingAmountMinor: 0, currency: "INR" } },
                                validation: [{ type: "MIN_ITEMS", value: 1, message: "Add at least one priced component" }],
                                itemWidgets: [
                                    { key: "name", type: "TEXT", path: "name", label: "Name", required: true, halfWidth: true, validation: [REQUIRED] },
                                    {
                                        key: "type", type: "SELECT", path: "type", label: "Type", required: true, halfWidth: true,
                                        optionsSource: { type: "OPTION_SET", key: "trevista.commercialComponentTypeOptions" },
                                        validation: [REQUIRED],
                                    },
                                    { key: "description", type: "TEXTAREA", path: "description", label: "Description", rows: 2 },
                                    { key: "supplierRef", type: "TEXT", path: "supplierRef", label: "Supplier reference", halfWidth: true, capabilities: { viewCosts: true } },
                                    { key: "status", type: "SELECT", path: "status", label: "Status", halfWidth: true, optionsSource: { type: "OPTION_SET", key: "trevista.commercialStatusOptions" } },
                                    { key: "active", type: "SWITCH", path: "active", label: "Active", halfWidth: true },
                                    {
                                        key: "upgrade", type: "SELECT", path: "replacesComponentKey", label: "Replaces component (upgrade)",
                                        optionsSource: { type: "SIBLING_COMPONENTS" }, clearable: true,
                                        help: "Optional components priced as a difference against this component.",
                                    },
                                    {
                                        key: "pricing", type: "OBJECT", path: "pricing",
                                        widgets: [
                                            { key: "unit", type: "SELECT", path: "unit", label: "Pricing unit", required: true, halfWidth: true, optionsSource: { type: "OPTION_SET", key: "trevista.commercialPricingUnitOptions" }, validation: [REQUIRED] },
                                            { key: "costAmountMinor", type: "NUMBER", path: "costAmountMinor", label: "Supplier cost (paise)", min: 0, required: true, halfWidth: true, capabilities: { viewCosts: true }, validation: [{ type: "INTEGER_MIN", value: 0, message: "Whole paise, zero or more" }] },
                                        ],
                                    },
                                    { key: "details", type: "JSON", path: "details", label: "Extra details (JSON)", help: "Arbitrary structured details preserved verbatim.", height: 140 },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "packages",
                title: "Customer packages",
                children: [
                    {
                        childKey: "packages",
                        title: "Base · Standard · Premium",
                        widgets: [
                            {
                                key: "packages", type: "PACKAGE_COMPOSER", path: "commercial.packages", label: "Packages",
                                componentsPath: "commercial.components",
                                tierLabels: { BASIC: "Base", STANDARD: "Standard", PREMIUM: "Premium" },
                                defaultTiers: ["BASIC", "STANDARD", "PREMIUM"],
                                validation: [
                                    { type: "ENABLED_COUNT", min: 2, max: 3, message: "Enable two or three packages before continuing" },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "derived",
                title: "Package prices",
                children: [
                    {
                        childKey: "derived",
                        title: "Price summary",
                        widgets: [
                            {
                                key: "derived", type: "DERIVED_PRICING", path: "commercial.derived", readOnly: true, label: "Package totals",
                                copy: {
                                    finalMode: { label: "Final package prices" },
                                    startingMode: { label: "Starting-from package prices" },
                                    estimatedMode: { label: "Estimated package prices" },
                                    preview: { label: "Updated price preview" },
                                    updated: { label: "Updated" },
                                    addItems: { label: "Add package items to see prices" },
                                    updating: { label: "Updating…" },
                                    ready: { label: "Up to date" },
                                    waiting: { label: "Waiting for package details" },
                                    repricing: { label: "Repricing required" },
                                    customerPrice: { label: "Customer price" },
                                    supplierComponents: { label: "Supplier components" },
                                    agentFee: { label: "Agent fee" },
                                    gst: { label: "GST on agent fee" },
                                    finalAmount: { label: "Final amount" },
                                    empty: { label: "Assign items to an enabled package to see its total." },
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "itinerary",
        title: "Itinerary",
        description: "Build the complete day-wise itinerary.",
        icon: "itinerary",
        order: 4,
        ownedPaths: ["itinerary"],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "days",
                title: "Day-wise itinerary",
                children: [
                    {
                        childKey: "itinerary-days",
                        title: "Days",
                        widgets: [
                            {
                                key: "itinerary", type: "REPEATER", path: "itinerary", label: "Day",
                                addLabel: "Add day", itemLabelPath: "title", numbered: true,
                                defaultItem: { day: null, activities: [], structuredActivities: [], meals: [] },
                                itemTitle: (item, index) => `Day ${item?.day ?? index + 1}${item?.title ? ` — ${item.title}` : ""}`,
                                validation: [{ type: "DAY_SEQUENCE", message: "Day numbers must be sequential starting at 1" }],
                                itemWidgets: [
                                    { key: "day", type: "NUMBER", path: "day", label: "Day number", min: 1, required: true, halfWidth: true, validation: [REQUIRED, { type: "MIN", value: 1 }] },
                                    { key: "location", type: "TEXT", path: "location", label: "Location", halfWidth: true },
                                    { key: "title", type: "TEXT", path: "title", label: "Title", halfWidth: true },
                                    { key: "accommodation", type: "TEXT", path: "accommodation", label: "Accommodation", halfWidth: true },
                                    { key: "summary", type: "TEXTAREA", path: "summary", label: "Summary", rows: 3 },
                                    {
                                        key: "structuredActivities", type: "REPEATER", path: "structuredActivities", label: "Structured activity",
                                        addLabel: "Add activity", itemLabelPath: "name", nested: true,
                                        defaultItem: { included: true, bookable: false, currency: "INR", price: 0 },
                                        itemTitle: (item, index) => item?.name || `Activity ${index + 1}`,
                                        itemWidgets: [
                                            { key: "name", type: "TEXT", path: "name", label: "Activity name", required: true, halfWidth: true, validation: [REQUIRED] },
                                            { key: "duration", type: "TEXT", path: "duration", label: "Duration", placeholder: "e.g. 3 hours", halfWidth: true },
                                            { key: "price", type: "NUMBER", path: "price", label: "Price", min: 0, halfWidth: true, help: "0 means included" },
                                            { key: "currency", type: "SELECT", path: "currency", label: "Currency", halfWidth: true, optionsSource: CURRENCY_OPTIONS_SOURCE },
                                            { key: "included", type: "CHECKBOX", path: "included", label: "Included in package", halfWidth: true },
                                            { key: "bookable", type: "CHECKBOX", path: "bookable", label: "Bookable as add-on", halfWidth: true },
                                            { key: "description", type: "TEXTAREA", path: "description", label: "Description", rows: 2 },
                                        ],
                                    },
                                    { key: "activities", type: "TAGS", path: "activities", label: "Legacy activities", help: "Free-text activity lines kept for older consumers." },
                                    { key: "meals", type: "TAGS", path: "meals", label: "Meals", help: "e.g. Breakfast, Lunch, Dinner" },
                                    { key: "notes", type: "TEXTAREA", path: "notes", label: "Notes", rows: 2 },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "stays",
        title: "Stays & upgrades",
        description: "Included accommodation and hotel upgrade options.",
        icon: "hotel",
        order: 5,
        ownedPaths: ["includedStays", "hotelOptions"],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "included-stays",
                title: "Stay overview",
                children: [
                    {
                        childKey: "stays",
                        title: "Fallback accommodation summary",
                        widgets: [
                            {
                                key: "includedStays", type: "REPEATER", path: "includedStays", label: "Stay",
                                addLabel: "Add stay", itemLabelPath: "propertyName",
                                defaultItem: { nights: 1, meals: [], pricing: { currency: "INR" } },
                                itemTitle: (item, index) => item?.propertyName || `Stay ${index + 1}`,
                                itemWidgets: [
                                    { key: "propertyName", type: "TEXT", path: "propertyName", label: "Property name", halfWidth: true },
                                    { key: "propertyClass", type: "TEXT", path: "propertyClass", label: "Property class", placeholder: "e.g. 4-star", halfWidth: true },
                                    { key: "roomType", type: "TEXT", path: "roomType", label: "Room type", halfWidth: true },
                                    { key: "nights", type: "NUMBER", path: "nights", label: "Nights", min: 0, halfWidth: true },
                                    {
                                        key: "tier", type: "SELECT", path: "tier", label: "Tier", halfWidth: true, clearable: true,
                                        optionsSource: { type: "OPTION_SET", key: "trevista.stayTierOptions" },
                                    },
                                    { key: "location", type: "TEXT", path: "location", label: "Location", halfWidth: true },
                                    { key: "meals", type: "TAGS", path: "meals", label: "Meals", halfWidth: true },
                                    { key: "amenities", type: "TAGS", path: "amenities", label: "Amenities", halfWidth: true },
                                    { key: "photos", type: "IMAGE_UPLOAD", path: "photos", label: "Hotel photos", maxFiles: 12, coverPath: null },
                                    { key: "description", type: "TEXTAREA", path: "description", label: "Description", rows: 2 },
                                    {
                                        key: "pricing", type: "OBJECT", path: "pricing",
                                        widgets: pricingObjectWidgets({ units: HOTEL_UNITS, amountLabel: "Supplement (paise)" }),
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "hotel-options",
                title: "Hotels and package rooms",
                children: [
                    {
                        childKey: "hotels",
                        title: "Hotels, rooms and package assignments",
                        widgets: [
                            {
                                key: "hotelOptions", type: "REPEATER", path: "hotelOptions", label: "Hotel option",
                                addLabel: "Add hotel option", itemLabelPath: "title",
                                defaultItem: { active: true, recommended: false, nights: 1, costLabel: "Upgrade cost", stayKey: "", photos: [], amenities: [], packageKeys: [], rooms: [], pricing: { currency: "INR" } },
                                itemTitle: (item, index) => item?.title || `Hotel option ${index + 1}`,
                                itemWidgets: [
                                    { key: "optionKey", type: "TEXT", path: "optionKey", label: "Option key", required: true, halfWidth: true, validation: [REQUIRED, { type: "PATTERN", value: "^[a-z0-9-]+$", message: "Use lowercase letters, numbers and dashes." }] },
                                    { key: "stayKey", type: "TEXT", path: "stayKey", label: "Stay key", required: true, halfWidth: true, help: "Use the same key for interchangeable hotels in one destination, for example leh-stay.", validation: [REQUIRED, { type: "PATTERN", value: "^[a-z0-9-]+$", message: "Use lowercase letters, numbers and dashes." }] },
                                    { key: "title", type: "TEXT", path: "title", label: "Option title", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "propertyName", type: "TEXT", path: "propertyName", label: "Hotel name", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "propertyClass", type: "TEXT", path: "propertyClass", label: "Hotel category", placeholder: "e.g. 4-star", halfWidth: true },
                                    { key: "location", type: "TEXT", path: "location", label: "Location", halfWidth: true },
                                    { key: "address", type: "TEXT", path: "address", label: "Address", halfWidth: true },
                                    { key: "nights", type: "NUMBER", path: "nights", label: "Nights at this hotel", min: 0, halfWidth: true },
                                    {
                                        key: "tier", type: "SELECT", path: "tier", label: "Tier", halfWidth: true, clearable: true,
                                        optionsSource: { type: "OPTION_SET", key: "trevista.stayTierOptions" },
                                    },
                                    { key: "recommended", type: "CHECKBOX", path: "recommended", label: "Recommended", halfWidth: true },
                                    { key: "active", type: "SWITCH", path: "active", label: "Active", halfWidth: true },
                                    { key: "packageKeys", type: "TAGS", path: "packageKeys", label: "Included in package keys", help: "Package keys where this hotel choice is already included." },
                                    { key: "amenities", type: "TAGS", path: "amenities", label: "Hotel amenities" },
                                    { key: "photos", type: "IMAGE_UPLOAD", path: "photos", label: "Hotel photos", maxFiles: 20, coverPath: null },
                                    { key: "description", type: "TEXTAREA", path: "description", label: "Description", rows: 2 },
                                    {
                                        key: "pricing", type: "OBJECT", path: "pricing",
                                        widgets: pricingObjectWidgets({ units: HOTEL_UNITS, amountLabel: "Supplier upgrade cost (paise)" }),
                                    },
                                    {
                                        key: "rooms", type: "REPEATER", path: "rooms", label: "Room option",
                                        addLabel: "Add room", itemLabelPath: "name", nested: true,
                                        defaultItem: { available: true, maxAdults: 2, maxChildren: 0, meals: [], amenities: [], photos: [], packageKeys: [], pricing: { unit: "PER_ROOM_PER_NIGHT", amountMinor: 0, currency: "INR" } },
                                        itemWidgets: [
                                            { key: "roomKey", type: "TEXT", path: "roomKey", label: "Room key", required: true, halfWidth: true, validation: [REQUIRED, { type: "PATTERN", value: "^[a-z0-9-]+$", message: "Use lowercase letters, numbers and dashes." }] },
                                            { key: "name", type: "TEXT", path: "name", label: "Room name", required: true, halfWidth: true, validation: [REQUIRED] },
                                            { key: "bedType", type: "TEXT", path: "bedType", label: "Bed type", halfWidth: true },
                                            { key: "maxAdults", type: "NUMBER", path: "maxAdults", label: "Maximum adults", min: 1, halfWidth: true },
                                            { key: "maxChildren", type: "NUMBER", path: "maxChildren", label: "Maximum children", min: 0, halfWidth: true },
                                            { key: "available", type: "SWITCH", path: "available", label: "Available", halfWidth: true },
                                            { key: "packageKeys", type: "TAGS", path: "packageKeys", label: "Included in package keys", help: "For example: base uses Standard Room and premium uses Deluxe Room. Assign only one room per hotel to each package." },
                                            { key: "meals", type: "TAGS", path: "meals", label: "Meals", halfWidth: true },
                                            { key: "amenities", type: "TAGS", path: "amenities", label: "Room amenities" },
                                            { key: "photos", type: "IMAGE_UPLOAD", path: "photos", label: "Room photos", maxFiles: 12, coverPath: null },
                                            { key: "description", type: "TEXTAREA", path: "description", label: "Room description", rows: 2 },
                                            { key: "pricing", type: "OBJECT", path: "pricing", widgets: pricingObjectWidgets({ units: HOTEL_UNITS, amountLabel: "Supplier room cost (paise)" }) },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "operations",
        title: "Operations",
        description: "Cancellation policy, extras, capacity, flights and logistics.",
        icon: "settings",
        order: 6,
        ownedPaths: ["cancellation", "extras", "availability", "flights", "meetingPoint", "inclusions", "exclusions", "languages", "cancellationPolicy", "minAge", "maxAge", "maxGroupSize"],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "policy",
                title: "Cancellation & deposits",
                children: [
                    {
                        childKey: "cancellation",
                        title: "Cancellation policy",
                        widgets: [
                            {
                                key: "cancellation", type: "OBJECT", path: "cancellation",
                                widgets: [
                                    { key: "policy", type: "TEXTAREA", path: "policy", label: "Policy text", rows: 3 },
                                    { key: "freeCancellationUntil", type: "TEXT", path: "freeCancellationUntil", label: "Free cancellation until", placeholder: "e.g. 15 days before departure", halfWidth: true },
                                    { key: "refundPercent", type: "NUMBER", path: "refundPercent", label: "Default refund %", min: 0, max: 100, halfWidth: true },
                                    { key: "depositRequired", type: "SWITCH", path: "depositRequired", label: "Deposit required", halfWidth: true },
                                    { key: "depositPercent", type: "NUMBER", path: "depositPercent", label: "Deposit %", min: 0, max: 100, halfWidth: true, visibleWhen: { field: "cancellation.depositRequired", operator: "EQUALS", value: true } },
                                    { key: "depositNote", type: "TEXT", path: "depositNote", label: "Deposit note", halfWidth: true, visibleWhen: { field: "cancellation.depositRequired", operator: "EQUALS", value: true } },
                                    { key: "note", type: "TEXTAREA", path: "note", label: "Internal note", rows: 2 },
                                    {
                                        key: "tiers", type: "REPEATER", path: "tiers", label: "Cancellation tier",
                                        addLabel: "Add tier", itemLabelPath: "label", nested: true,
                                        itemTitle: (item, index) => item?.label || `Tier ${index + 1}`,
                                        itemWidgets: [
                                            { key: "label", type: "TEXT", path: "label", label: "Label", required: true, halfWidth: true, validation: [REQUIRED] },
                                            { key: "daysBefore", type: "NUMBER", path: "daysBefore", label: "Days before departure", min: 0, halfWidth: true },
                                            { key: "refundPercent", type: "NUMBER", path: "refundPercent", label: "Refund %", min: 0, max: 100, halfWidth: true },
                                            { key: "description", type: "TEXT", path: "description", label: "Description", halfWidth: true },
                                        ],
                                    },
                                ],
                            },
                            { key: "cancellationPolicy", type: "TEXTAREA", path: "cancellationPolicy", label: "Legacy cancellation policy line", rows: 2 },
                        ],
                    },
                ],
            },
            {
                substepKey: "extras",
                title: "Extras & add-ons",
                children: [
                    {
                        childKey: "extras",
                        title: "Sellable add-ons",
                        widgets: [
                            {
                                key: "extras", type: "REPEATER", path: "extras", label: "Extra",
                                addLabel: "Add extra", itemLabelPath: "title",
                                defaultItem: { included: false, active: true, currency: "INR", price: 0, pricing: { currency: "INR" } },
                                itemTitle: (item, index) => item?.title || `Extra ${index + 1}`,
                                itemWidgets: [
                                    { key: "title", type: "TEXT", path: "title", label: "Title", required: true, halfWidth: true, validation: [REQUIRED] },
                                    {
                                        key: "category", type: "SELECT", path: "category", label: "Category", halfWidth: true, clearable: true,
                                        optionsSource: { type: "OPTION_SET", key: "trevista.extraCategoryOptions" },
                                    },
                                    { key: "icon", type: "ICON", path: "icon", label: "Icon", halfWidth: true },
                                    { key: "price", type: "NUMBER", path: "price", label: "Legacy price", min: 0, halfWidth: true },
                                    { key: "currency", type: "SELECT", path: "currency", label: "Legacy currency", halfWidth: true, optionsSource: CURRENCY_OPTIONS_SOURCE },
                                    { key: "priceLabel", type: "TEXT", path: "priceLabel", label: "Price label", halfWidth: true },
                                    { key: "included", type: "CHECKBOX", path: "included", label: "Included by default", halfWidth: true },
                                    { key: "active", type: "SWITCH", path: "active", label: "Active", halfWidth: true },
                                    { key: "description", type: "TEXTAREA", path: "description", label: "Description", rows: 2 },
                                    {
                                        key: "pricing", type: "OBJECT", path: "pricing",
                                        widgets: pricingObjectWidgets({ units: STAY_UNITS, amountLabel: "Amount (paise)" }),
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "capacity-flights",
                title: "Capacity & flights",
                children: [
                    {
                        childKey: "availability",
                        title: "Seats",
                        widgets: [
                            { key: "totalSeats", type: "NUMBER", path: "availability.totalSeats", label: "Total seats", min: 0, halfWidth: true },
                            { key: "seatsAvailable", type: "NUMBER", path: "availability.seatsAvailable", label: "Seats available", min: 0, halfWidth: true },
                        ],
                    },
                    {
                        childKey: "flights",
                        title: "Flights",
                        widgets: [
                            { key: "included", type: "SWITCH", path: "flights.included", label: "Flights included" },
                            {
                                key: "flight-details", type: "OBJECT", path: "flights",
                                visibleWhen: { field: "flights.included", operator: "EQUALS", value: true },
                                widgets: [
                                    { key: "inventoryManaged", type: "SWITCH", path: "inventoryManaged", label: "Inventory managed here" },
                                    { key: "pricePerPerson", type: "NUMBER", path: "pricePerPerson", label: "Price per person", min: 0, halfWidth: true },
                                    { key: "airline", type: "TEXT", path: "airline", label: "Airline", halfWidth: true },
                                    { key: "departureCity", type: "TEXT", path: "departureCity", label: "Departure city", halfWidth: true },
                                    { key: "arrivalCity", type: "TEXT", path: "arrivalCity", label: "Arrival city", halfWidth: true },
                                    { key: "f-currency", type: "SELECT", path: "currency", label: "Currency", halfWidth: true, optionsSource: CURRENCY_OPTIONS_SOURCE },
                                    { key: "notes", type: "TEXTAREA", path: "notes", label: "Flight notes", rows: 2 },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "logistics",
                title: "Logistics & group rules",
                children: [
                    {
                        childKey: "logistics",
                        title: "Meeting point, group rules, languages",
                        widgets: [
                            { key: "meetingPoint", type: "TEXT", path: "meetingPoint", label: "Meeting point" },
                            { key: "inclusions", type: "TAGS", path: "inclusions", label: "Inclusions", variant: "list", tone: "positive", fullWidth: true, placeholder: "Describe what is included", addLabel: "Add inclusion" },
                            { key: "exclusions", type: "TAGS", path: "exclusions", label: "Exclusions", variant: "list", tone: "negative", fullWidth: true, placeholder: "Describe what is not included", addLabel: "Add exclusion" },
                            { key: "languages", type: "TAGS", path: "languages", label: "Languages" },
                            { key: "minAge", type: "NUMBER", path: "minAge", label: "Min age", min: 0, halfWidth: true },
                            { key: "maxAge", type: "NUMBER", path: "maxAge", label: "Max age", min: 0, halfWidth: true },
                            { key: "maxGroupSize", type: "NUMBER", path: "maxGroupSize", label: "Max group size", min: 1, required: true, halfWidth: true, validation: [REQUIRED, { type: "MIN", value: 1, message: "At least 1 traveller" }] },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "media",
        title: "Media & highlights",
        description: "Imagery and marketing highlights.",
        icon: "camera",
        order: 7,
        ownedPaths: ["photo", "photos", "highlights"],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "gallery",
                title: "Gallery",
                children: [
                    {
                        childKey: "photos",
                        title: "Photos",
                        widgets: [
                            { key: "photos", type: "IMAGE_UPLOAD", path: "photos", label: "Photo gallery", coverPath: "photo" },
                        ],
                    },
                ],
            },
            {
                substepKey: "highlights",
                title: "Highlights",
                children: [
                    {
                        childKey: "highlights",
                        title: "Why travellers pick this tour",
                        widgets: [
                            {
                                key: "highlights", type: "REPEATER", path: "highlights", label: "Highlight",
                                addLabel: "Add highlight", itemLabelPath: "title",
                                itemTitle: (item, index) => item?.title || `Highlight ${index + 1}`,
                                defaultItem: {},
                                itemWidgets: [
                                    { key: "title", type: "TEXT", path: "title", label: "Title", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "short", type: "TEXT", path: "short", label: "Short line", halfWidth: true },
                                    { key: "icon", type: "ICON", path: "icon", label: "Icon", halfWidth: true },
                                    { key: "order", type: "NUMBER", path: "order", label: "Sort order", halfWidth: true },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "search",
        title: "Search & discovery",
        description: "Destinations, tags and search metadata.",
        icon: "search",
        order: 8,
        ownedPaths: ["primaryDestination", "destinations", "searchTags", "tagIds", "tags"],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "destinations",
                title: "Destinations",
                children: [
                    {
                        childKey: "primary-destination",
                        title: "Primary destination",
                        widgets: [
                            { key: "primaryDestination", type: "DESTINATION", path: "primaryDestination", label: "Primary destination" },
                        ],
                    },
                    {
                        childKey: "destinations",
                        title: "All destinations",
                        widgets: [
                            {
                                key: "destinations", type: "REPEATER", path: "destinations", label: "Destination",
                                addLabel: "Add destination", itemLabelPath: "name",
                                itemTitle: (item, index) => item?.name || `Destination ${index + 1}`,
                                defaultItem: { sortOrder: 0 },
                                itemWidgets: destinationWidgets(""),
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "tags",
                title: "Tags",
                children: [
                    {
                        childKey: "tags",
                        title: "Search tags & keywords",
                        widgets: [
                            { key: "tags", type: "TAGS", path: "tags", label: "Tour themes and keywords", help: "Add useful themes such as family or adventure. Destination and travel-type tags are added automatically." },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "audience",
        title: "Audience & publishing",
        description: "Reviews, analytics and publish controls.",
        icon: "people",
        order: 9,
        ownedPaths: ["reviews", "rating", "metrics", "featured", "trending", "group", "status", "desc", "tremVerified"],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "content",
                title: "Description & reviews",
                children: [
                    {
                        childKey: "content",
                        title: "Full description",
                        widgets: [
                            { key: "desc", type: "TEXTAREA", path: "desc", label: "Full description", rows: 6, required: true, validation: [REQUIRED, { type: "MAX_LENGTH", value: 5000 }] },
                        ],
                    },
                    {
                        childKey: "reviews",
                        title: "Reviews",
                        widgets: [
                            {
                                key: "reviews", type: "REPEATER", path: "reviews", label: "Review",
                                addLabel: "Add review", itemLabelPath: "name",
                                itemTitle: (item, index) => item?.name || `Review ${index + 1}`,
                                defaultItem: { rating: 5 },
                                itemWidgets: [
                                    { key: "name", type: "TEXT", path: "name", label: "Reviewer name", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "rating", type: "NUMBER", path: "rating", label: "Rating (0–5)", min: 0, max: 5, required: true, halfWidth: true, validation: [REQUIRED, { type: "MIN", value: 0 }, { type: "MAX", value: 5 }] },
                                    { key: "comment", type: "TEXTAREA", path: "comment", label: "Comment", rows: 2 },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                substepKey: "analytics",
                title: "Analytics",
                children: [
                    {
                        childKey: "analytics",
                        title: "Rating & metrics (system-derived)",
                        widgets: [
                            { key: "rating", type: "READONLY_OBJECT", path: "rating", label: "Rating", readOnly: true },
                            { key: "metrics", type: "READONLY_OBJECT", path: "metrics", label: "Metrics", readOnly: true, capabilities: { canEditMetrics: true, readOnlyUnlessCapable: true } },
                        ],
                    },
                ],
            },
            {
                substepKey: "publishing",
                title: "Publishing",
                children: [
                    {
                        childKey: "publishing",
                        title: "Status & merchandising flags",
                        widgets: [
                            { key: "featured", type: "SWITCH", path: "featured", label: "Featured" },
                            { key: "trending", type: "SWITCH", path: "trending", label: "Trending" },
                            { key: "group-min", type: "NUMBER", path: "group.min", label: "Group min", min: 1, halfWidth: true },
                            { key: "group-max", type: "NUMBER", path: "group.max", label: "Group max", min: 1, halfWidth: true },
                            {
                                key: "status", type: "SELECT", path: "status", label: "Status",
                                optionsSource: { type: "OPTION_SET", key: "trevista.tourStatusOptions" },
                                capabilities: { canPublish: true },
                            },
                            { key: "tremVerified", type: "SWITCH", path: "tremVerified", label: "TREM verified", capabilities: { canVerify: true }, readOnly: true, help: "Set through the dedicated verification action." },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "tour-departures",
        title: "Departure inventory",
        description: "Bookable departures synced to the TourDeparture collection.",
        icon: "calendarDays",
        order: 10,
        collection: "tour-departures",
        ownedPaths: [],
        actions: { exit: true, cancel: true, back: true, next: true },
        substeps: [
            {
                substepKey: "departures",
                title: "Departure records",
                children: [
                    {
                        childKey: "records",
                        title: "TourDeparture documents",
                        widgets: [
                            {
                                key: "records", type: "COLLECTION_REPEATER", path: "$departures", label: "Departure",
                                collection: "tour-departures",
                                addLabel: "Add departure", itemLabelPath: "origin.cityName", numbered: false,
                                defaultItem: { status: "active", pricing: { currency: "INR", isFinal: false, source: "manual" }, origin: {} },
                                itemTitle: (item, index) => item?.origin?.cityName || item?._id || `Departure ${index + 1}`,
                                itemWidgets: [
                                    { key: "o-city-id", type: "TEXT", path: "origin.cityId", label: "Origin city id", halfWidth: true },
                                    { key: "o-city-name", type: "TEXT", path: "origin.cityName", label: "Origin city name", halfWidth: true },
                                    { key: "o-country-id", type: "TEXT", path: "origin.countryId", label: "Origin country id", halfWidth: true },
                                    { key: "o-country-name", type: "TEXT", path: "origin.countryName", label: "Origin country name", halfWidth: true },
                                    { key: "departureDate", type: "DATE", path: "departureDate", label: "Departure date", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "returnDate", type: "DATE", path: "returnDate", label: "Return date", required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "status", type: "SELECT", path: "status", label: "Status", halfWidth: true, options: ["scheduled", "active", "sold_out", "cancelled", "completed"].map((v) => ({ value: v, label: v.replaceAll("_", " ") })) },
                                    { key: "capacity", type: "NUMBER", path: "capacity", label: "Capacity", min: 0, halfWidth: true },
                                    { key: "availableSeats", type: "NUMBER", path: "availableSeats", label: "Available seats", min: 0, halfWidth: true },
                                    { key: "p-min", type: "NUMBER", path: "pricing.min", label: "Min price", min: 0, required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "p-max", type: "NUMBER", path: "pricing.max", label: "Max price", min: 0, required: true, halfWidth: true, validation: [REQUIRED] },
                                    { key: "p-currency", type: "SELECT", path: "pricing.currency", label: "Currency", halfWidth: true, optionsSource: CURRENCY_OPTIONS_SOURCE },
                                    { key: "p-is-final", type: "CHECKBOX", path: "pricing.isFinal", label: "Final price", halfWidth: true },
                                    { key: "p-source", type: "SELECT", path: "pricing.source", label: "Source", halfWidth: true, optionsSource: PRICE_SOURCES },
                                    { key: "bookingOpensAt", type: "DATETIME", path: "bookingOpensAt", label: "Booking opens", halfWidth: true },
                                    { key: "bookingClosesAt", type: "DATETIME", path: "bookingClosesAt", label: "Booking closes", halfWidth: true },
                                    { key: "legacyDerived", type: "SWITCH", path: "legacyDerived", label: "Legacy derived record", halfWidth: true },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    {
        stepKey: "review",
        title: "Review & publish",
        description: "Final preview of the customer-facing package cards.",
        icon: "badgeCheck",
        order: 11,
        ownedPaths: [],
        readOnlyStep: true,
        actions: { exit: true, cancel: true, back: true, next: true },
        nextActionLabel: "Finish builder",
        substeps: [
            {
                substepKey: "preview",
                title: "Customer preview",
                children: [
                    {
                        childKey: "package-preview",
                        title: "What travellers will see",
                        widgets: [
                            {
                                key: "customerPreview", type: "CUSTOMER_PREVIEW", path: "$preview", readOnly: true,
                                copy: {
                                    untitled: { label: "Untitled tour" },
                                    destinationPending: { label: "Destination pending" },
                                    durationPending: { label: "Duration pending" },
                                    day: { label: "day" },
                                    days: { label: "days" },
                                    night: { label: "night" },
                                    nights: { label: "nights" },
                                    from: { label: "From" },
                                    approximate: { label: "Approx." },
                                    pricePending: { label: "Price pending" },
                                    packagePending: { label: "Add package pricing to preview customer options." },
                                    recommended: { label: "Recommended" },
                                    included: { label: "Included" },
                                    optional: { label: "Optional extras" },
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    },
]);

export const getBuilderDefinition = () => ({
    key: TOUR_BUILDER_KEY,
    version: TOUR_BUILDER_VERSION,
    ui: {
        create: { title: "Tour builder", label: "Tour creation" },
        edit: { title: "Edit tour", label: "Tour editing", primaryAction: "Save changes", savedMessage: "Changes saved. You can continue editing or choose another step." },
        view: { title: "Review tour", label: "Tour review" },
    },
    steps: BUILDER_STEPS.map(({ stepKey, title, description, icon, order, collection, readOnlyStep }) => (
        { stepKey, title, description, icon, order, ...(collection ? { collection } : {}), ...(readOnlyStep ? { readOnlyStep } : {}) }
    )),
});

const processFieldsForWidget = (widget, prefix = "") => {
    if (!widget?.path || widget.readOnly || widget.visibleWhen) return [];
    const path = [prefix, widget.path].filter(Boolean).join(".").replace(/^\$\.?/, "");
    if (widget.type === "OBJECT") {
        return (widget.widgets || []).flatMap((child) => processFieldsForWidget(child, path));
    }
    const rules = widget.validation || [];
    const required = widget.required === true || rules.some((rule) => rule?.type === "REQUIRED");
    const minimumItems = rules.find((rule) => rule?.type === "MIN_ITEMS");
    const maximumItems = rules.find((rule) => rule?.type === "MAX_ITEMS");
    const enabledCount = rules.find((rule) => rule?.type === "ENABLED_COUNT");
    if (!required && !minimumItems && !maximumItems && !enabledCount) return [];
    return [{
        path,
        label: widget.label || widget.key,
        required,
        ...(minimumItems ? { minItems: Number(minimumItems.value), message: minimumItems.message } : {}),
        ...(maximumItems ? { maxItems: Number(maximumItems.value), message: maximumItems.message } : {}),
        ...(enabledCount ? { enabledMin: Number(enabledCount.min), enabledMax: Number(enabledCount.max), message: enabledCount.message } : {}),
    }];
};

/** Generic process definition projected from the same backend-owned UI schema. */
export const getBuilderProcessDefinition = () => ({
    key: TOUR_BUILDER_KEY,
    version: TOUR_BUILDER_VERSION,
    steps: BUILDER_STEPS.map((step) => ({
        id: step.stepKey,
        label: step.title,
        description: step.description,
        children: (step.substeps || []).map((substep) => ({
            id: `${step.stepKey}.${substep.substepKey}`,
            label: substep.title,
            requiredFields: (substep.children || []).flatMap((child) =>
                (child.widgets || []).flatMap((widget) => processFieldsForWidget(widget))),
        })),
    })),
});

export const findStepDefinition = (stepKey) =>
    BUILDER_STEPS.find((step) => step.stepKey === stepKey) || null;

export const stepNeighbours = (stepKey) => {
    const index = BUILDER_STEPS.findIndex((step) => step.stepKey === stepKey);
    return {
        previousStepKey: index > 0 ? BUILDER_STEPS[index - 1].stepKey : null,
        nextStepKey: index >= 0 && index < BUILDER_STEPS.length - 1 ? BUILDER_STEPS[index + 1].stepKey : null,
    };
};

/** Deep clone helper so callers can mutate definitions safely. */
export const cloneStepDefinition = (stepKey) => {
    const step = findStepDefinition(stepKey);
    return step ? JSON.parse(JSON.stringify(step)) : null;
};
