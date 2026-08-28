import { PROCESS_ACTION, applyProcessAction, createProcessState } from "@packages/trem-process-engine";
import { validateFormFields } from "@packages/trem-form-engine";
import { buildQuoteTermsDefaults, createQuoteProcessDefinition, getQuoteStage, quoteProcessLabels } from "./quoteProcessDefinition.mjs";
import { presentQuoteBuilder } from "./quoteBuilderPresenter.mjs";

const legacyMoneyPaths = [
  ["baseAmount", "PACKAGE", "Package cost"],
  ["flightAmount", "FLIGHT", "Flight customization"],
  ["hotelAmount", "HOTEL", "Hotel customization"],
  ["transferAmount", "TRANSFER", "Transfer customization"],
  ["activityAmount", "ACTIVITY", "Activity customization"],
  ["otherAmount", "OTHER", "Other custom add-ons"],
];

const amountToMinor = (value) => {
  const text = String(value ?? "0").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new TypeError("Invalid money amount");
  const [whole, fraction = ""] = text.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount)) throw new TypeError("Money amount is outside the safe range");
  return amount;
};

const merge = (current, patch) => {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return patch;
  return Object.fromEntries(
    [...new Set([...Object.keys(current || {}), ...Object.keys(patch)])].map((key) => [
      key,
      patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key])
        ? merge(current?.[key], patch[key])
        : key in patch && patch[key] !== undefined ? patch[key] : current?.[key],
    ]),
  );
};

const legacyPricingItems = (pricing = {}) => legacyMoneyPaths
  .filter(([key]) => Number(pricing[key] || 0) > 0)
  .map(([key, category, name]) => ({ name, category, description: "", pricingType: "FIXED", unitAmount: pricing[key], quantity: 1 }));

const migrateEntityList = (items = []) => items.map((item) =>
  typeof item === "string" ? { title: item, details: "" } : item,
);

const migrateCompositionList = (items = [], type) => items.map((item, index) => {
  const priceDefaults = { changeType: ["activities", "flights"].includes(type) ? "ADD" : type === "itinerary" ? "MODIFY" : "REPLACE", pricingType: ["activities", "flights"].includes(type) ? "PER_PERSON" : type === "hotels" ? "PER_ROOM_PER_NIGHT" : type === "transfers" ? "PER_VEHICLE" : "FIXED", unitAmount: 0, priceQuantity: 1 };
  if (typeof item !== "string") return { ...priceDefaults, ...item };
  if (type === "itinerary") return { day: index + 1, title: "Itinerary change", location: "", summary: item, activities: [], meals: [], accommodation: "", notes: "", ...priceDefaults };
  if (type === "hotels") return { propertyName: item, location: "To be confirmed", propertyClass: "", roomType: "To be confirmed", nights: 1, meals: [], amenities: [], notes: "", ...priceDefaults };
  if (type === "transfers") return { name: item, transferType: "PRIVATE", vehicle: "", route: "To be confirmed", quantity: 1, notes: "", ...priceDefaults };
  if (type === "flights") return { name: item, origin: "", destination: "", airline: "", cabinClass: "Economy", notes: "", ...priceDefaults };
  return { name: item, day: index + 1, location: "", duration: "", included: true, description: "", ...priceDefaults };
});

const migrateData = (data = {}) => ({
  ...data,
  composition: {
    ...(data.composition || {}),
    itinerary: migrateCompositionList(data.composition?.itinerary || [], "itinerary"),
    hotels: migrateCompositionList(data.composition?.hotels || [], "hotels"),
    flights: migrateCompositionList(data.composition?.flights || [], "flights"),
    transfers: migrateCompositionList(data.composition?.transfers || [], "transfers"),
    activities: migrateCompositionList(data.composition?.activities || [], "activities"),
    inclusions: migrateEntityList(data.composition?.inclusions || data.itinerary?.inclusions || []),
    exclusions: migrateEntityList(data.composition?.exclusions || data.itinerary?.exclusions || []),
  },
  pricing: {
    ...(data.pricing || {}),
    manualItems: data.pricing?.manualItems || [],
    items: data.pricing
      ? data.pricing.items?.length
        ? data.pricing.items
        : legacyPricingItems({
            ...data.pricing,
            baseAmount: data.pricing?.baseAmount ?? data.pricing?.packageAmount,
          })
      : undefined,
  },
  terms: {
    ...(data.terms || {}),
    paymentPlan: data.terms?.paymentPlan ?? data.terms?.paymentTerms,
    cancellationPolicy: data.terms?.cancellationPolicy ?? data.terms?.cancellationTerms,
    paymentSchedule: data.terms?.paymentSchedule || (data.terms?.paymentPlan || data.terms?.paymentTerms ? [{
      milestone: "Booking payment",
      dueWhen: data.terms?.paymentPlan || data.terms?.paymentTerms,
      amountType: "PERCENTAGE",
      amount: 100,
    }] : undefined),
    cancellationTiers: data.terms?.cancellationTiers,
  },
});

const persistedState = (record = {}, definition, context) => {
  const termsDefaults = buildQuoteTermsDefaults(context);
  const defaults = merge(context.defaults || {}, { terms: termsDefaults });
  const data = merge(defaults, migrateData(record?.data || {}));
  const legacyPolicy = record?.data?.terms?.cancellationPolicy || record?.data?.terms?.cancellationTerms;
  if (legacyPolicy && legacyPolicy !== context.source?.cancellationPolicy && !record?.data?.terms?.cancellationTiers)
    data.terms.policyNotes = legacyPolicy;
  return {
    definitionKey: definition.key,
    definitionVersion: definition.version,
    currentNodeId: record?.currentNodeId,
    completedNodeIds: record?.completedNodeIds || [],
    completedStageIds: record?.completedStageIds || [],
    nodeStates: record?.nodeStates || {},
    data,
    contextSnapshot: record?.contextSnapshot || context,
    revision: Number(record?.revision || 0),
    sentQuoteId: record?.sentQuoteId || null,
    sentAt: record?.sentAt || null,
    pricingSnapshot: record?.pricingSnapshot || null,
    delivery: record?.delivery || null,
  };
};

const fieldsForValidation = (stage) =>
  (stage?.fields || []).map((field) => ({
    ...field,
    label: quoteProcessLabels[field.labelRef] || field.path,
  }));

const stageBusinessErrors = (stage, data, context = {}) => {
  if (stage?.id !== "customizations") return {};
  const sourceHotels = context.source?.hotelSnapshot || [];
  const errors = {};
  (data.composition?.hotels || []).forEach((item, index) => {
    if (["MODIFY", "REPLACE", "REMOVE"].includes(item.changeType) && sourceHotels.length && !sourceHotels.some((hotel) => hotel.sourceKey === item.sourceRef))
      errors[`composition.hotels.${index}.sourceRef`] = "Select the included package hotel being changed.";
  });
  return errors;
};

const changedValue = (before, after, changeType) =>
  `${before || "Not included"} → ${changeType === "REMOVE" ? "Removed" : after || "To be confirmed"}`;

const pricedCustomizationItems = (composition = {}, context = {}) => [
  ...(composition.itinerary || []).map((item) => ({ ...item, name: item.title || `Day ${item.day || ""} itinerary change`, category: "OTHER", description: [item.changeType, item.summary || item.notes || "Itinerary customization"].filter(Boolean).join(" · ") })),
  ...(composition.hotels || []).map((item) => {
    const included = (context.source?.hotelSnapshot || []).find((hotel) => hotel.sourceKey === item.sourceRef) || {};
    const detailRows = [
      { label: "Hotel", value: changedValue(included.propertyName, item.propertyName, item.changeType) },
      { label: "Room", value: changedValue(included.roomType, item.roomType, item.changeType) },
      { label: "Stay", value: `${item.location || included.location || "Location to be confirmed"} · ${Number(item.nights || included.nights || 1)} night(s)` },
    ];
    return {
      ...item,
      name: `${item.location || included.location || "Hotel"} stay change`,
      category: "HOTEL",
      detailRows,
      description: [...detailRows.map((row) => `${row.label}: ${row.value}`), item.notes].filter(Boolean).join(" · "),
    };
  }),
  ...(composition.flights || []).map((item) => {
    const includedFlights = context.source?.flightSnapshot?.includedNames || [];
    const detailRows = [
      { label: "Flight", value: changedValue(includedFlights.join(", "), item.name, item.changeType) },
      { label: "Route", value: [item.origin, item.destination].filter(Boolean).join(" → ") || "To be confirmed" },
      { label: "Cabin", value: item.cabinClass || "To be confirmed" },
    ];
    return { ...item, name: item.name || "Flight addition", category: "FLIGHT", detailRows, description: [...detailRows.map((row) => `${row.label}: ${row.value}`), item.airline, item.notes].filter(Boolean).join(" · ") };
  }),
  ...(composition.transfers || []).map((item) => ({ ...item, name: item.name || "Transfer customization", category: "TRANSFER", description: [item.changeType, item.route, item.vehicle, item.notes].filter(Boolean).join(" · ") })),
  ...(composition.activities || []).map((item) => ({ ...item, name: item.name || `Day ${item.day || ""} activity`, category: "ACTIVITY", description: [item.changeType, item.day ? `Day ${item.day}` : "", item.location, item.description].filter(Boolean).join(" · ") })),
].filter((item) => Number(item.unitAmount || 0) > 0)
  .map((item) => ({ ...item, quantity: item.priceQuantity || 1, packageComponent: false }));

const pricingInput = (enquiry, data, context = {}) => {
  const pricing = data.pricing || {};
  const sourceItems = context.source?.pricingItems?.length ? context.source.pricingItems : pricing.items || [];
  const items = [...sourceItems, ...pricedCustomizationItems(data.composition, context), ...(pricing.manualItems || [])];
  const lines = items.map((item, index) => {
    const quantity = Number(item.quantity || 0);
    if (!Number.isSafeInteger(quantity) || quantity < 1)
      throw Object.assign(new Error(`Quotation item ${index + 1} has an invalid quantity.`), { status: 422 });
    const unitAmountMinor = amountToMinor(item.unitAmount || 0);
    const amountMinor = unitAmountMinor * quantity;
    if (!Number.isSafeInteger(amountMinor)) throw new TypeError("Quotation item amount is outside the safe range");
    return {
      code: `${String(item.category || "OTHER").toUpperCase()}_${index + 1}`,
      category: String(item.category || "OTHER").toUpperCase(),
      label: String(item.name || `Quotation item ${index + 1}`),
      description: String(item.description || ""),
      detailRows: Array.isArray(item.detailRows) ? item.detailRows : [],
      pricingType: item.pricingType || "FIXED",
      packageComponent: item.packageComponent === true || item.category === "PACKAGE",
      unitAmountMinor,
      quantity,
      amountMinor,
    };
  }).filter((line) => line.amountMinor > 0);
  const baseAmountMinor = lines.reduce((total, line) => total + line.amountMinor, 0);
  if (!Number.isSafeInteger(baseAmountMinor) || baseAmountMinor <= 0)
    throw Object.assign(new Error("Enter an agent price greater than zero."), { status: 422 });
  const packageCostMinor = lines.filter((line) => line.packageComponent).reduce((sum, line) => sum + line.amountMinor, 0);
  return {
    productType: enquiry.journeyType || "tour",
    baseAmountMinor,
    currency: pricing.currency || "INR",
    bookingId: String(enquiry.id || enquiry._id),
    tourId: enquiry.tourId || null,
    agencyId: enquiry.agencyId || null,
    context: { productType: enquiry.journeyType || "tour" },
    lines,
    quoteComposition: {
      packageCostMinor,
      addonsMinor: baseAmountMinor - packageCostMinor,
      agentQuoteMinor: baseAmountMinor,
    },
  };
};

export function createQuoteBuilderService({ findAuthorizedEnquiry, loadQuoteContext, saveProcess, calculateQuote, finalizeQuote }) {
  if (![findAuthorizedEnquiry, loadQuoteContext, saveProcess, calculateQuote, finalizeQuote].every((item) => typeof item === "function"))
    throw new TypeError("QuoteBuilder persistence, context, pricing and document adapters are required");

  const initialize = async (enquiry, actor) => {
    const context = enquiry.quoteBuilder?.contextSnapshot || await loadQuoteContext(enquiry, actor);
    const definition = createQuoteProcessDefinition(context);
    const process = persistedState(enquiry.quoteBuilder, definition, context);
    if (!enquiry.quoteBuilder?.contextSnapshot) await saveProcess(enquiry, process, actor);
    return { context, definition, process };
  };

  const calculate = async (enquiry, data, context) => {
    try {
      const input = pricingInput(enquiry, data, context);
      const result = await calculateQuote(input);
      result.pricing = { ...result.pricing, quoteComposition: input.quoteComposition, quoteItems: input.lines };
      return result;
    } catch (error) {
      if (error?.status === 422) return null;
      throw error;
    }
  };

  const view = async (enquiry, process, definition, context, errors = {}) => {
    const calculated = process.sentQuoteId ? { pricing: process.pricingSnapshot } : await calculate(enquiry, process.data, context);
    return presentQuoteBuilder({ enquiry, persisted: process, definition, context, pricing: calculated?.pricing || null, errors });
  };

  return Object.freeze({
    async load(enquiryId, actor) {
      const enquiry = await findAuthorizedEnquiry(enquiryId, actor);
      const initialized = await initialize(enquiry, actor);
      return view(enquiry, initialized.process, initialized.definition, initialized.context);
    },

    async preview(enquiryId, actor, payload = {}) {
      const enquiry = await findAuthorizedEnquiry(enquiryId, actor);
      const { context, definition, process } = await initialize(enquiry, actor);
      const state = createProcessState(definition, process);
      const stage = getQuoteStage(definition, state.currentNodeId);
      const validated = validateFormFields(fieldsForValidation(stage), payload.data || {});
      const data = merge(process.data, validated.data);
      const businessErrors = validated.valid ? stageBusinessErrors(stage, data, context) : {};
      if (!validated.valid || Object.keys(businessErrors).length)
        return { status: 422, componentData: await view(enquiry, { ...process, data }, definition, context, { ...validated.errors, ...businessErrors }) };
      const calculated = await calculate(enquiry, data, context);
      if (!calculated)
        throw Object.assign(new Error("Add at least one priced tour or customization item before calculating."), { status: 422 });
      const next = {
        ...process,
        data: merge(data, { approval: { confirmed: false } }),
        revision: process.revision + 1,
        pricingSnapshot: calculated.pricing,
      };
      await saveProcess(enquiry, next, actor);
      return { status: 200, componentData: presentQuoteBuilder({ enquiry, persisted: next, definition, context, pricing: calculated.pricing }) };
    },

    async transition(enquiryId, actor, payload = {}) {
      const enquiry = await findAuthorizedEnquiry(enquiryId, actor);
      const { context, definition, process } = await initialize(enquiry, actor);
      const state = createProcessState(definition, process);
      const stage = getQuoteStage(definition, state.currentNodeId);
      const action = String(payload.action || "NEXT").toUpperCase();

      if (action === "EDIT") {
        if (!process.sentQuoteId) throw Object.assign(new Error("This quote is already editable."), { status: 409 });
        const next = { ...process, revision: process.revision + 1, data: merge(process.data, { approval: { confirmed: false } }), sentQuoteId: null, sentAt: null, pricingSnapshot: null };
        await saveProcess(enquiry, next, actor);
        return { status: 200, componentData: await view(enquiry, next, definition, context) };
      }

      if (action === "BACK" || action === "GO_TO") {
        if (action === "GO_TO" && payload.targetStepId !== state.currentNodeId && !state.completedStageIds.includes(payload.targetStepId))
          throw Object.assign(new Error("Complete earlier steps before opening this step."), { status: 409 });
        const result = applyProcessAction(definition, process, {
          nodeId: state.currentNodeId,
          action: action === "BACK" ? PROCESS_ACTION.BACK : PROCESS_ACTION.GO_TO,
          targetNodeId: payload.targetStepId,
          data: process.data,
        });
        const next = { ...process, ...result.process };
        await saveProcess(enquiry, next, actor);
        return { status: 200, componentData: await view(enquiry, next, definition, context) };
      }

      const validated = validateFormFields(fieldsForValidation(stage), payload.data || {});
      const data = merge(process.data, validated.data);
      const businessErrors = validated.valid ? stageBusinessErrors(stage, data, context) : {};
      if (!validated.valid || Object.keys(businessErrors).length)
        return { status: 422, componentData: await view(enquiry, { ...process, data }, definition, context, { ...validated.errors, ...businessErrors }) };
      const result = applyProcessAction(definition, process, {
        nodeId: state.currentNodeId,
        action: action === "SAVE" ? PROCESS_ACTION.SAVE : PROCESS_ACTION.SUBMIT_AND_NEXT,
        data,
      });
      if (!result.ok)
        return { status: 422, componentData: await view(enquiry, { ...process, data }, definition, context, result.errors) };
      const next = { ...process, ...result.process, data, revision: process.revision + 1, sentQuoteId: null, sentAt: null, pricingSnapshot: null };
      await saveProcess(enquiry, next, actor);
      return { status: 200, componentData: await view(enquiry, next, definition, context) };
    },

    async send(enquiryId, actor, payload = {}) {
      const enquiry = await findAuthorizedEnquiry(enquiryId, actor);
      const { context, definition, process } = await initialize(enquiry, actor);
      if (process.sentQuoteId)
        return { status: 200, quoteId: process.sentQuoteId, componentData: await view(enquiry, process, definition, context) };
      const state = createProcessState(definition, process);
      const prerequisitesComplete = definition.steps.slice(0, -1).every((step) => state.completedStageIds.includes(step.id));
      if (state.currentNodeId !== "review-send" || !prerequisitesComplete)
        throw Object.assign(new Error("Complete every quote step before sending."), { status: 409 });
      const validated = validateFormFields(fieldsForValidation(getQuoteStage(definition, "review-send")), payload.data || {});
      const data = merge(process.data, validated.data);
      if (!validated.valid)
        return { status: 422, componentData: await view(enquiry, { ...process, data }, definition, context, validated.errors) };
      const completed = applyProcessAction(definition, process, { nodeId: "review-send", action: PROCESS_ACTION.SUBMIT_AND_NEXT, data });
      if (!completed.ok)
        return { status: 422, componentData: await view(enquiry, { ...process, data }, definition, context, completed.errors) };
      const input = pricingInput(enquiry, data, context);
      const calculation = await calculateQuote(input);
      calculation.pricing = { ...calculation.pricing, quoteComposition: input.quoteComposition, quoteItems: input.lines };
      const idempotencyKey = `quote-builder:${String(enquiry.id || enquiry._id)}:${process.revision}`;
      const finalized = await finalizeQuote({ enquiry, actor, context, data, input, calculation, idempotencyKey });
      const next = {
        ...process,
        ...completed.process,
        data,
        sentQuoteId: String(finalized.quote.id || finalized.quote._id),
        sentAt: new Date().toISOString(),
        pricingSnapshot: calculation.pricing,
        delivery: finalized.delivery || null,
      };
      await saveProcess(enquiry, next, actor);
      return {
        status: 200,
        quoteId: next.sentQuoteId,
        documentId: finalized.document?.id || finalized.document?._id || null,
        componentData: await view(enquiry, next, definition, context),
      };
    },
  });
}

export default createQuoteBuilderService;
