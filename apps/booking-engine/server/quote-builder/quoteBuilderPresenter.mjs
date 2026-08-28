import { getProcessSnapshot } from "@packages/trem-process-engine";
import { getPath, setPath } from "@packages/trem-form-engine";
import { getQuoteStage, quoteProcessLabels } from "./quoteProcessDefinition.mjs";

const stepValues = (stage, data) => {
  const values = {};
  (stage?.fields || []).forEach((field) => {
    const value = getPath(data, field.path);
    setPath(values, field.path, field.type === "checkbox" && value == null ? false : value);
  });
  return values;
};

const previewRows = (pricing) => {
  if (!pricing) return [];
  const byCode = new Map((pricing.breakdown || []).map((row) => [row.code, row.amountMinor]));
  const composition = pricing.quoteComposition || {};
  return [
    { id: "package", labelRef: "packageCost", amountMinor: composition.packageCostMinor || 0 },
    { id: "addons", labelRef: "customAddons", amountMinor: composition.addonsMinor || 0 },
    { id: "agent", labelRef: "agentPrice", amountMinor: composition.agentQuoteMinor ?? pricing.baseAmountMinor ?? 0 },
    { id: "fee", labelRef: "tremFee", amountMinor: byCode.get("TREM_FEE") || 0 },
    { id: "gst", labelRef: "tremFeeGst", amountMinor: byCode.get("TREM_FEE_GST") || 0 },
    { id: "total", labelRef: "customerTotal", amountMinor: pricing.finalPayableMinor || 0, total: true },
  ].filter((row) => row.total || row.id === "agent" || row.amountMinor > 0);
};

const priceBasisLabel = (value) => ({
  FIXED: "Fixed price",
  PER_BOOKING: "Per booking",
  PER_PERSON: "Per person",
  PER_ROOM: "Per room",
  PER_NIGHT: "Per night",
  PER_ROOM_PER_NIGHT: "Per room per night",
  PER_VEHICLE: "Per vehicle",
  PER_DAY: "Per day",
}[value] || value);

const sectionItemText = (item) => typeof item === "object" && item
  ? [item.title, item.name, item.details, item.description].filter(Boolean).join(" — ")
  : String(item || "");

const displayDate = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value || "");
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00.000Z`));
};

const dateSummary = (fields = {}) => {
  const fixed = String(fields.preferredTravelDate || "").split("|").filter(Boolean);
  const dates = fixed.length > 1 ? fixed : [fields.preferredStartDate, fields.preferredEndDate].filter(Boolean);
  if (dates.length > 1) return `${displayDate(dates[0])} – ${displayDate(dates[1])}`;
  return displayDate(dates[0] || fields.preferredTravelDate || fields.travelWindow || "Flexible");
};

const readableKey = (key) => String(key || "")
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/[_-]+/g, " ")
  .replace(/^./, (value) => value.toUpperCase());

const readableValue = (value) => {
  if (Array.isArray(value)) return value.map(readableValue).filter(Boolean).join(", ");
  if (value && typeof value === "object") return Object.entries(value).map(([key, item]) => `${readableKey(key)}: ${readableValue(item)}`).filter((item) => !item.endsWith(": ")).join(" · ");
  return String(value ?? "").trim();
};

const hotelChoice = (name, room) => [name, room].filter(Boolean).join(" — ") || "Not specified";
const isGenericQuoteMessage = (value) => /^(please\s+)?(give|send|share|provide)(\s+me)?\s+(the\s+|a\s+)?(quote|quotation)(\s+for\s+this\s+tour)?[.!]?$/i.test(String(value || "").trim());

const buildRequestSections = (enquiry = {}) => {
  const fields = enquiry.fields || {};
  const selection = enquiry.selection || {};
  const snapshot = enquiry.customizationSnapshot || {};
  const packageBaseline = snapshot.packageBaseline || {};
  const flightRequest = snapshot.flightRequest || "";
  const extraItems = [];
  if (flightRequest === "ADD" || (!flightRequest && fields.flightPreference === "with_flights"))
    extraItems.push({ id: "flights", label: "Add to package · Flights", value: "Customer requested flights in addition to the selected package." });
  if (flightRequest === "UNSPECIFIED" || fields.flightPreference === "agent_recommendation")
    extraItems.push({ id: "flights", label: "Flight request", value: "Agent recommendation requested." });
  (snapshot.hotels || []).filter((hotel) => hotel.included === false).forEach((hotel, index) => {
    const savedBaseline = (packageBaseline.hotels || []).find((item) => item.stayKey === hotel.stayKey);
    const includedName = hotel.includedOptionName || savedBaseline?.hotelName;
    const includedRoom = hotel.includedRoomName || savedBaseline?.roomName;
    extraItems.push(includedName || includedRoom ? {
      id: `hotel-upgrade-${index}`,
      label: `Replace included hotel · ${hotel.location || hotel.stayKey || index + 1}`,
      value: `${hotelChoice(includedName, includedRoom)} → ${hotelChoice(hotel.optionName, hotel.roomName)}`,
    } : {
      id: `hotel-upgrade-${index}`,
      label: `Hotel request · ${hotel.location || hotel.stayKey || index + 1}`,
      value: `${hotelChoice(hotel.optionName, hotel.roomName)} · The older enquiry did not capture the package hotel being replaced.`,
    });
  });
  ((selection.hotelRequests || []).length ? selection.hotelRequests : snapshot.hotelRequests || []).forEach((request, index) => {
    const budget = request.budgetPerNightMinor == null ? "" : `${request.currency || "INR"} ${(Number(request.budgetPerNightMinor) / 100).toLocaleString("en-IN")} per room / night`;
    extraItems.push({
      id: `hotel-request-${index}`,
      label: `Hotel request · ${request.location || request.stayKey || index + 1}`,
      value: [request.propertyClass, request.roomType, budget, request.requirements].filter(Boolean).join(" · ") || "Agent recommendation requested",
    });
  });
  Object.entries(enquiry.customizationAnswers || {}).forEach(([question, answer], index) => {
    const value = readableValue(answer);
    if (value) extraItems.push({ id: `custom-answer-${index}`, label: readableKey(question), value });
  });
  if ((fields.message || fields.notes) && !isGenericQuoteMessage(fields.message || fields.notes))
    extraItems.push({ id: "message", label: "Additional message", value: readableValue(fields.message || fields.notes) });
  if (!extraItems.length)
    extraItems.push({ id: "none", label: "Customization", value: "No additional request beyond the selected package." });
  return [
    {
      id: "selection",
      title: "Selected tour and package",
      items: [
        { id: "tour", label: "Tour", value: enquiry.tourTitle || "Custom journey" },
        { id: "package", label: "Package selected", value: selection.packageName || selection.packageKey || "To be confirmed" },
        { id: "request-type", label: "Request type", value: snapshot.quoteMode === "CUSTOMIZED" || selection.customizationPreference === "customize" ? "Customized quotation" : "Package quotation" },
        {
          id: "package-flights",
          label: "Flights in selected package",
          value: packageBaseline.includesFlights === true
            ? `Included${packageBaseline.includedFlightNames?.length ? ` · ${packageBaseline.includedFlightNames.join(", ")}` : ""}`
            : packageBaseline.includesFlights === false ? "Not included" : "Not captured in this older enquiry",
        },
        ...(packageBaseline.hotels || []).map((hotel, index) => ({
          id: `package-hotel-${index}`,
          label: `Included hotel · ${hotel.location || hotel.stayKey || index + 1}`,
          value: hotelChoice(hotel.hotelName, hotel.roomName),
        })),
      ],
    },
    { id: "demand", titleRef: "customerDemand", items: extraItems },
    {
      id: "request-facts",
      title: "Traveller requirements",
      items: [
        { id: "travellers", label: "Travellers", value: fields.travellerCount ? `${fields.travellerCount} traveller(s)` : "Not specified" },
        { id: "dates", label: "Travel dates", value: dateSummary(fields) },
      ],
    },
  ];
};

export function presentQuoteBuilder({ enquiry, persisted = {}, definition, context = {}, pricing = null, errors = {} }) {
  const snapshot = getProcessSnapshot(definition, persisted);
  const stage = getQuoteStage(definition, snapshot.currentNodeId) || definition.steps[0];
  const sent = Boolean(persisted.sentQuoteId);
  const showPricing = ["customizations", "agent-pricing", "review-send"].includes(stage.id);
  const rows = showPricing ? previewRows(pricing) : [];
  const fallbackSections = context.sourceSections || [];
  const tourSections = [...(context.tourSections || fallbackSections.filter((section) => section.id !== "demand"))];
  if ((context.source?.inclusions || []).length && !tourSections.some((section) => section.id === "inclusions"))
    tourSections.push({ id: "inclusions", titleRef: "sourceInclusions", items: context.source.inclusions.map(sectionItemText).filter(Boolean) });
  if ((context.source?.exclusions || []).length && !tourSections.some((section) => section.id === "exclusions"))
    tourSections.push({ id: "exclusions", titleRef: "sourceExclusions", items: context.source.exclusions.map(sectionItemText).filter(Boolean) });
  const requestSections = buildRequestSections(enquiry);
  const sourceSections = ["quote-details", "customizations"].includes(stage.id)
    ? requestSections
    : stage.id === "tour-composition"
      ? tourSections
      : stage.id === "review-send" ? fallbackSections : [];
  const labelRefs = new Set([
    "builderEyebrow", "builderTitle", "builderDescription",
    ...(sent ? ["sent", "edit", "done", "sentDescription"] : ["draft", "save", "back", stage.id === "review-send" ? "send" : "next"]),
    ...(rows.length ? ["previewTitle", "previewDescription"] : []),
    ...definition.steps.flatMap((item) => [item.titleRef, item.descriptionRef]),
    ...stage.fields.flatMap((item) => [item.labelRef, item.emptyTextRef, ...(item.options || []).map((option) => option.labelRef)]),
    ...(["customizations", "agent-pricing"].includes(stage.id) ? ["calculate"] : []),
    ...(rows.length ? ["includedPricing", "customPricing"] : []),
    ...rows.map((row) => row.labelRef),
    ...sourceSections.map((section) => section.titleRef),
  ]);
  const labels = Object.fromEntries([...labelRefs].filter(Boolean).map((ref) => [ref, quoteProcessLabels[ref]]));
  if (sent && persisted.delivery?.emailStatus === "SENT")
    labels.sentDescription = "Quote generated, emailed to the traveller and added to My Bookings.";
  else if (sent && persisted.delivery?.emailStatus === "FAILED")
    labels.sentDescription = "Quote generated and added to My Bookings. Email delivery failed, but the traveller can download it from their account.";
  return {
    data: {
      enquiryId: String(enquiry.id || enquiry._id),
      enquiryRef: enquiry.enquiryRef || "",
      values: stepValues(stage, persisted.data || {}),
      errors,
      preview: pricing && showPricing ? {
        currency: pricing.currency,
        moneyUnit: "PAISE",
        rows,
        items: (pricing.quoteItems || []).map((item, index) => ({
          id: item.code || `quote-item-${index}`,
          name: item.label,
          category: item.category,
          description: item.description,
          details: (item.detailRows || []).map((row) => ({ label: row.label, value: row.value })),
          pricingType: item.pricingType,
          pricingTypeLabel: priceBasisLabel(item.pricingType),
          unitAmountMinor: item.unitAmountMinor,
          quantity: item.quantity,
          amountMinor: item.amountMinor,
          packageComponent: item.packageComponent === true,
          groupRef: item.packageComponent === true ? "includedPricing" : "customPricing",
        })),
      } : null,
      sourceSections,
      sentQuoteId: persisted.sentQuoteId || null,
    },
    labels,
    structure: {
      type: "quote-builder",
      header: { eyebrowRef: "builderEyebrow", titleRef: "builderTitle", descriptionRef: "builderDescription" },
      process: {
        status: sent ? "SENT" : snapshot.status,
        currentStepId: stage.id,
        completedStepIds: snapshot.completedStageIds,
        progress: snapshot.progress.percentage,
        steps: definition.steps.map((item) => ({
          id: item.id,
          titleRef: item.titleRef,
          descriptionRef: item.descriptionRef,
          disabled: item.id !== stage.id && !snapshot.completedStageIds.includes(item.id),
        })),
      },
      form: { fields: stage.fields },
      actions: sent
        ? { edit: { id: "edit", labelRef: "edit" }, exit: { id: "exit", labelRef: "done" } }
        : {
            back: snapshot.navigation.previousNodeId ? { id: "back", labelRef: "back" } : null,
            save: { id: "save", labelRef: "save" },
            calculate: ["customizations", "agent-pricing"].includes(stage.id) ? { id: "calculate", labelRef: "calculate" } : null,
            primary: stage.id === "review-send" ? { id: "send", labelRef: "send" } : { id: "next", labelRef: "next" },
          },
    },
  };
}

export default presentQuoteBuilder;
