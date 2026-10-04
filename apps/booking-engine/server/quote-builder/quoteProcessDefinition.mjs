const field = (path, labelRef, type, options = {}) => ({ path, labelRef, type, ...options });
const itemField = (path, label, type = "text", options = {}) => ({ path, label, type, ...options });
const option = (value, label) => ({ value, label });
const entityField = (path, labelRef, options = {}) => field(path, labelRef, "entityList", options);

export const quoteProcessLabels = Object.freeze({
  builderEyebrow: "Smart quote builder",
  builderTitle: "Compose traveller quotation",
  builderDescription: "Tour details, customer customizations, itemized pricing and documents in one saved flow.",
  detailsTitle: "Customer request",
  detailsDescription: "Understand what the traveller asked for, then review the customer-facing title and summary.",
  compositionTitle: "Included tour",
  existingCompositionDescription: "Review the departure, itinerary, stays and services already included in the selected tour.",
  customCompositionDescription: "No source tour is attached. Review the customer request before building the quotation.",
  customizationsTitle: "Changes & customizations",
  customizationsDescription: "Traveller-requested changes are already added below. Select an included item to replace, edit the new details and enter its price.",
  pricingTitle: "Itemized agent quotation",
  pricingDescription: "Review included and customized items. Add only any other charge not already captured in a customization.",
  reviewTitle: "Review & send",
  reviewDescription: "Preview the complete tour and itemized customer price before generating the quotation.",
  quoteTitle: "Customer-facing title",
  quoteSummary: "Customer-facing summary",
  variant: "Quotation variant",
  requestSummary: "Customer customization summary",
  itineraryPlan: "Itinerary",
  itineraryChanges: "Itinerary changes",
  hotelPlan: "Hotels and rooms",
  hotelChanges: "Hotel and room changes",
  flightPlan: "Flights",
  flightChanges: "Flight changes",
  transferPlan: "Transfers",
  transferChanges: "Transfer changes",
  activityPlan: "Activities",
  activityChanges: "Activity changes",
  inclusions: "Additional inclusions",
  exclusions: "Additional exclusions",
  quoteItems: "Other quotation items",
  calculate: "Calculate & save quotation",
  currency: "Currency",
  currencyInr: "Indian Rupee (INR)",
  validUntil: "Quote valid until",
  paymentPlan: "Payment plan",
  cancellationPolicy: "Cancellation policy",
  policyNotes: "Policy notes",
  agentNotes: "Additional notes",
  confirmQuote: "I confirm the tour details and itemized pricing are accurate and ready to send",
  save: "Save draft",
  back: "Back",
  next: "Save & continue",
  send: "Generate & send quote",
  previewQuote: "Preview quotation PDF",
  edit: "Edit quote",
  packageCost: "Package cost",
  customAddons: "Custom add-ons",
  agentPrice: "Agent quote",
  tremFee: "TravelsTREM fee",
  tremFeeGst: "Applicable tax",
  customerTotal: "Final customer price",
  sourceTour: "Source tour",
  sourceItinerary: "Saved itinerary",
  sourceHotels: "Saved hotels",
  sourceServices: "Saved transfers & activities",
  sourceInclusions: "Tour inclusions",
  sourceExclusions: "Tour exclusions",
  customerDemand: "Extra requests beyond package",
  draft: "Draft",
  sent: "Sent",
  sentDescription: "Quote generated and sent to the traveller.",
  done: "Back to enquiries",
  previewTitle: "Final quotation summary",
  previewDescription: "Selected package, customer-specific changes, TravelsTREM fees and applicable tax.",
  includedPricing: "Included tour pricing",
  customPricing: "Traveller changes and other charges",
  noChanges: "No changes added. Use the action above only when the traveller needs something different from the included tour.",
});

const optionsForVariant = (context = {}) => {
  const supplied = (context.variantOptions || []).filter((item) => item?.value);
  return supplied.length ? supplied : ["BASIC", "STANDARD", "PREMIUM", "CUSTOM"].map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase() }));
};

const priceBasisOptions = [
  option("FIXED", "Fixed price"), option("PER_BOOKING", "Per booking"),
  option("PER_PERSON", "Per person"), option("PER_ROOM", "Per room"),
  option("PER_NIGHT", "Per night"), option("PER_ROOM_PER_NIGHT", "Per room per night"),
  option("PER_VEHICLE", "Per vehicle"), option("PER_DAY", "Per day"),
];

const customizationPriceFields = () => [
  itemField("pricingType", "Price basis", "select", { required: true, options: priceBasisOptions, help: "Choose how this customization is charged." }),
  itemField("unitAmount", "Unit price", "money", { required: true, min: 0, help: "Enter 0 only when this is a no-charge change." }),
  itemField("priceQuantity", "Price quantity", "number", { required: true, min: 1, help: "For example, number of travellers, rooms, nights or vehicles charged." }),
];

const changeTypeField = () => itemField("changeType", "Change action", "select", {
  required: true,
  options: [option("ADD", "Add new"), option("MODIFY", "Modify included item"), option("REPLACE", "Replace included item"), option("REMOVE", "Remove included item")],
  help: "State how this differs from the included tour.",
});

const itineraryField = (hasTour, context) => entityField("composition.itinerary", hasTour ? "itineraryChanges" : "itineraryPlan", {
  required: !hasTour || !(context.source?.itinerarySnapshot || []).length,
  minItems: !hasTour ? 1 : undefined,
  addLabel: "Add itinerary day",
  itemTitlePath: "title",
  emptyTextRef: "noChanges",
  defaultItem: { changeType: "MODIFY", day: 1, title: "", location: "", summary: "", activities: [], meals: [], accommodation: "", notes: "", pricingType: "FIXED", unitAmount: "", priceQuantity: 1 },
  itemFields: [
    changeTypeField(),
    itemField("day", "Day", "number", { required: true, min: 1 }),
    itemField("title", "Day title", "text", { required: true, maxLength: 120 }),
    itemField("location", "Location", "text", { maxLength: 120 }),
    itemField("summary", "Customer-facing summary", "textarea", { required: true, maxLength: 800, rows: 4 }),
    itemField("activities", "Activities (one per line)", "stringList", { rows: 4 }),
    itemField("meals", "Meals (one per line)", "stringList", { rows: 3 }),
    itemField("accommodation", "Accommodation", "text", { maxLength: 160 }),
    itemField("notes", "Agent notes", "textarea", { maxLength: 600, rows: 3 }),
    ...customizationPriceFields(),
  ],
});

const hotelField = (hasTour, context) => entityField("composition.hotels", hasTour ? "hotelChanges" : "hotelPlan", {
  required: !hasTour || !(context.source?.hotelSnapshot || []).length,
  minItems: !hasTour ? 1 : undefined,
  addLabel: "Add hotel",
  itemTitlePath: "propertyName",
  emptyTextRef: "noChanges",
  defaultItem: { changeType: hasTour ? "REPLACE" : "ADD", sourceRef: "", propertyName: "", location: "", propertyClass: "", roomType: "", nights: 1, meals: [], amenities: [], notes: "", pricingType: "PER_ROOM_PER_NIGHT", unitAmount: "", priceQuantity: Math.max(1, Number(context?.roomCount || 1)) },
  itemFields: [
    changeTypeField(),
    ...(hasTour ? [itemField("sourceRef", "Included hotel to replace", "select", {
      required: true,
      help: "Choose the package hotel. Its saved details will fill this form so you only edit the replacement.",
      visibleWhen: { field: "changeType", values: ["MODIFY", "REPLACE", "REMOVE"] },
      options: (context.source?.hotelSnapshot || []).filter((item) => item.sourceKey).map((item) => ({
        value: item.sourceKey,
        label: [item.location, item.propertyName, item.roomType].filter(Boolean).join(" · "),
        populate: {
          propertyName: item.propertyName || "",
          location: item.location || "",
          propertyClass: item.propertyClass || "",
          roomType: item.roomType || "",
          nights: Number(item.nights || 1),
          meals: item.meals || [],
          amenities: item.amenities || [],
        },
      })),
    })] : []),
    itemField("propertyName", "Hotel/property", "text", { required: true, maxLength: 160 }),
    itemField("location", "Location", "text", { required: true, maxLength: 120 }),
    itemField("propertyClass", "Property class", "text", { maxLength: 80 }),
    itemField("roomType", "Room type", "text", { required: true, maxLength: 120 }),
    itemField("nights", "Nights", "number", { required: true, min: 1 }),
    itemField("meals", "Meals (one per line)", "stringList", { rows: 3 }),
    itemField("amenities", "Amenities (one per line)", "stringList", { rows: 3 }),
    itemField("notes", "Stay notes", "textarea", { maxLength: 600, rows: 3 }),
    ...customizationPriceFields(),
  ],
});

const customizationFields = (context) => {
  const hasTour = Boolean(context?.hasTour);
  const travellerCount = Math.max(1, Number(context?.travellerCount || 1));
  return [
    itineraryField(hasTour, context),
    hotelField(hasTour, context),
    entityField("composition.flights", hasTour ? "flightChanges" : "flightPlan", {
      addLabel: "Add flight", itemTitlePath: "name", emptyTextRef: "noChanges",
      defaultItem: { changeType: "ADD", name: "", origin: "", destination: "", airline: "", cabinClass: "Economy", notes: "", pricingType: "PER_PERSON", unitAmount: "", priceQuantity: travellerCount },
      itemFields: [
        changeTypeField(),
        itemField("name", "Flight service", "text", { required: true, maxLength: 160 }),
        itemField("origin", "From", "text", { required: true, maxLength: 120 }),
        itemField("destination", "To", "text", { required: true, maxLength: 120 }),
        itemField("airline", "Airline", "text", { maxLength: 120 }),
        itemField("cabinClass", "Cabin class", "select", { required: true, options: [option("Economy", "Economy"), option("Premium economy", "Premium economy"), option("Business", "Business"), option("First", "First")] }),
        itemField("notes", "Flight details", "textarea", { maxLength: 700, rows: 3 }),
        ...customizationPriceFields(),
      ],
    }),
    entityField("composition.transfers", hasTour ? "transferChanges" : "transferPlan", {
      addLabel: "Add transfer", itemTitlePath: "name",
      emptyTextRef: "noChanges",
      defaultItem: { changeType: "REPLACE", name: "", transferType: "PRIVATE", vehicle: "", route: "", quantity: 1, notes: "", pricingType: "PER_VEHICLE", unitAmount: "", priceQuantity: 1 },
      itemFields: [
        changeTypeField(),
        itemField("name", "Transfer name", "text", { required: true, maxLength: 140 }),
        itemField("transferType", "Transfer type", "select", { required: true, options: [option("PRIVATE", "Private"), option("SHARED", "Shared"), option("SELF", "Self-arranged")] }),
        itemField("vehicle", "Vehicle", "text", { maxLength: 100 }),
        itemField("route", "Route", "text", { required: true, maxLength: 180 }),
        itemField("quantity", "Vehicles/transfers", "number", { required: true, min: 1 }),
        itemField("notes", "Transfer notes", "textarea", { maxLength: 600, rows: 3 }),
        ...customizationPriceFields(),
      ],
    }),
    entityField("composition.activities", hasTour ? "activityChanges" : "activityPlan", {
      addLabel: "Add activity", itemTitlePath: "name",
      emptyTextRef: "noChanges",
      defaultItem: { changeType: "ADD", name: "", day: 1, location: "", duration: "", included: true, description: "", pricingType: "PER_PERSON", unitAmount: "", priceQuantity: travellerCount },
      itemFields: [
        changeTypeField(),
        itemField("name", "Activity", "text", { required: true, maxLength: 160 }),
        itemField("day", "Day", "number", { min: 1 }),
        itemField("location", "Location", "text", { maxLength: 120 }),
        itemField("duration", "Duration", "text", { maxLength: 80 }),
        itemField("included", "Included in quotation", "checkbox"),
        itemField("description", "Customer-facing description", "textarea", { maxLength: 700, rows: 3 }),
        ...customizationPriceFields(),
      ],
    }),
    entityField("composition.inclusions", "inclusions", {
      addLabel: "Add inclusion", itemTitlePath: "title", defaultItem: { title: "", details: "" },
      emptyTextRef: "noChanges",
      itemFields: [itemField("title", "Inclusion", "text", { required: true, maxLength: 180 }), itemField("details", "Details", "textarea", { maxLength: 500, rows: 2 })],
    }),
    entityField("composition.exclusions", "exclusions", {
      addLabel: "Add exclusion", itemTitlePath: "title", defaultItem: { title: "", details: "" },
      emptyTextRef: "noChanges",
      itemFields: [itemField("title", "Exclusion", "text", { required: true, maxLength: 180 }), itemField("details", "Details", "textarea", { maxLength: 500, rows: 2 })],
    }),
  ];
};

const pricingItemFields = [
  itemField("name", "Item name", "text", { required: true, maxLength: 160 }),
  itemField("category", "Category", "select", { required: true, options: [option("PACKAGE", "Package"), option("FLIGHT", "Flight"), option("HOTEL", "Hotel"), option("TRANSFER", "Transfer"), option("ACTIVITY", "Activity"), option("MEAL", "Meal"), option("VISA", "Visa"), option("INSURANCE", "Insurance"), option("OTHER", "Other")] }),
  itemField("description", "Customer-facing description", "textarea", { maxLength: 700, rows: 3 }),
  itemField("pricingType", "Price basis", "select", { required: true, options: priceBasisOptions }),
  itemField("unitAmount", "Unit price", "money", { required: true, min: 0 }),
  itemField("quantity", "Quantity", "number", { required: true, min: 1 }),
];

const cancellationTiersFromPolicy = (policy = "") => String(policy)
  .split(";")
  .map((part) => part.trim())
  .filter(Boolean)
  .map((part, index) => {
    const [window = `Tier ${index + 1}`, ...descriptionParts] = part.split(":");
    const description = descriptionParts.join(":").trim() || part;
    const dayMatch = window.match(/(\d+)/);
    const refundMatch = description.match(/(\d+)\s*%\s*refund/i);
    return {
      label: window.trim(),
      daysBefore: Number(dayMatch?.[1] || 0),
      refundPercent: refundMatch ? Number(refundMatch[1]) : /eligible for refund/i.test(description) ? 100 : 0,
      description,
    };
  });

export const buildQuoteTermsDefaults = (context = {}) => {
  const sourceCancellation = context.source?.cancellation || {};
  const sourcePolicy = context.source?.cancellationPolicy || "";
  const cancellationTiers = (sourceCancellation.tiers || []).length
    ? sourceCancellation.tiers
    : cancellationTiersFromPolicy(sourcePolicy);
  const depositPercent = Number(sourceCancellation.depositPercent || 0);
  const paymentSchedule = sourceCancellation.depositRequired && depositPercent > 0
    ? [
        { milestone: "Booking confirmation", dueWhen: "At booking confirmation", amountType: "PERCENTAGE", amount: depositPercent },
        { milestone: "Balance payment", dueWhen: "Before departure as confirmed by the agent", amountType: "PERCENTAGE", amount: 100 - depositPercent },
      ]
    : [{ milestone: "Booking payment", dueWhen: "Before booking confirmation", amountType: "PERCENTAGE", amount: 100 }];
  return { paymentSchedule, cancellationTiers, policyNotes: sourceCancellation.note || sourcePolicy };
};

const termsFields = (context) => {
  const recommended = buildQuoteTermsDefaults(context);
  return [
    field("terms.validUntil", "validUntil", "date", { required: true, minDate: "today", help: "Last date on which the traveller can accept this quotation." }),
    entityField("terms.paymentSchedule", "paymentPlan", {
      required: true, minItems: 1, addLabel: "Add payment milestone", applyRecommendedLabel: "Use recommended payment plan",
      recommendedItems: recommended.paymentSchedule, itemTitlePath: "milestone",
      defaultItem: { milestone: "", dueWhen: "", amountType: "PERCENTAGE", amount: "" },
      help: "Define exactly when each payment is due. Percentage milestones must total 100%.",
      itemFields: [
        itemField("milestone", "Milestone", "text", { required: true, maxLength: 120, placeholder: "Example: Booking confirmation", help: "Customer-facing name for this payment stage." }),
        itemField("dueWhen", "When payment is due", "text", { required: true, maxLength: 180, placeholder: "Example: Within 48 hours of quote acceptance", help: "Use a precise date or event, not internal shorthand." }),
        itemField("amountType", "Amount type", "select", { required: true, options: [option("PERCENTAGE", "Percentage of quote"), option("FIXED", "Fixed amount")] }),
        itemField("amount", "Amount", "money", { required: true, min: 0, placeholder: "Example: 25", help: "Enter a percentage when Amount type is Percentage; otherwise enter the currency amount." }),
      ],
    }),
    entityField("terms.cancellationTiers", "cancellationPolicy", {
      required: true, minItems: 1, addLabel: "Add cancellation tier", applyRecommendedLabel: "Use source tour policy",
      recommendedItems: recommended.cancellationTiers, itemTitlePath: "label",
      defaultItem: { label: "", daysBefore: 0, refundPercent: 0, description: "" },
      help: "These tiers are copied from the source tour when available and can be adjusted for this quote.",
      itemFields: [
        itemField("label", "Cancellation window", "text", { required: true, maxLength: 120, placeholder: "Example: 30–44 days before departure" }),
        itemField("daysBefore", "Minimum days before departure", "number", { required: true, min: 0, placeholder: "Example: 30", help: "The minimum advance notice for this tier." }),
        itemField("refundPercent", "Refund percentage", "number", { required: true, min: 0, max: 100, placeholder: "Example: 75" }),
        itemField("description", "Customer-facing conditions", "textarea", { required: true, maxLength: 700, rows: 3, placeholder: "Explain supplier deductions and non-refundable charges." }),
      ],
    }),
    field("terms.policyNotes", "policyNotes", "textarea", { maxLength: 1200, rows: 4, help: "Additional policy conditions shown to the traveller." }),
    field("terms.notes", "agentNotes", "textarea", { maxLength: 1000, rows: 4, help: "Optional quotation notes that are not part of the cancellation rules." }),
  ];
};

export function createQuoteProcessDefinition(context = {}) {
  const stages = [
    { id: "quote-details", titleRef: "detailsTitle", descriptionRef: "detailsDescription", fields: [
      field("details.title", "quoteTitle", "text", { required: true, maxLength: 120 }),
      field("details.summary", "quoteSummary", "textarea", { required: true, minLength: 20, maxLength: 1200, rows: 6 }),
    ] },
    { id: "tour-composition", titleRef: "compositionTitle", descriptionRef: context.hasTour ? "existingCompositionDescription" : "customCompositionDescription", fields: context.hasTour ? [] : [
      field("composition.variant", "variant", "select", { required: true, options: optionsForVariant(context) }),
    ] },
    { id: "customizations", titleRef: "customizationsTitle", descriptionRef: "customizationsDescription", fields: customizationFields(context) },
    { id: "agent-pricing", titleRef: "pricingTitle", descriptionRef: "pricingDescription", fields: [
      entityField("pricing.manualItems", "quoteItems", { addLabel: "Add other charge", itemTitlePath: "name", emptyText: "No other charges added. Included tour and priced customizations are calculated automatically.", defaultItem: { name: "", category: "OTHER", description: "", pricingType: "FIXED", unitAmount: "", quantity: 1 }, itemFields: pricingItemFields }),
      field("pricing.currency", "currency", "select", { required: true, options: [{ value: "INR", labelRef: "currencyInr" }] }),
    ] },
    { id: "review-send", titleRef: "reviewTitle", descriptionRef: "reviewDescription", fields: [
      field("approval.confirmed", "confirmQuote", "checkbox", { required: true, requiredMessage: "Confirm that the quotation is ready to send" }),
    ] },
  ];
  return Object.freeze({
    key: "smart-quote-builder",
    version: 6,
    steps: stages.map((stage) => ({ ...stage, requiredFields: stage.fields.filter((item) => item.required).map((item) => ({ path: item.path, label: quoteProcessLabels[item.labelRef] })) })),
  });
}

export const getQuoteStage = (definition, stageId) => definition.steps.find((stage) => stage.id === stageId) || null;
export default createQuoteProcessDefinition;
