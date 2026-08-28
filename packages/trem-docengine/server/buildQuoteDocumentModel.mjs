const platformRows = (pricing = {}) => {
  const labels = {
    TREM_FEE: "TravelsTREM fee",
    TREM_FEE_GST: "GST on TravelsTREM fee",
  };
  return (pricing.breakdown || [])
    .filter((line) => labels[line.code] && Number(line.amountMinor) > 0)
    .map((line) => ({
      code: line.code,
      label: labels[line.code],
      amountMinor: Number(line.amountMinor),
      category: "fee",
    }));
};

const paymentText = (value) => Array.isArray(value)
  ? value.map((item) => `${item.milestone}: ${item.amountType === "PERCENTAGE" ? `${item.amount}%` : item.amount} due ${item.dueWhen}`).join("\n")
  : String(value || "");

const cancellationText = (value) => Array.isArray(value)
  ? value.map((item) => `${item.label}: ${item.refundPercent}% refund — ${item.description}`).join("\n")
  : value && typeof value === "object"
    ? [...(value.tiers || []).map((item) => `${item.label}: ${item.refundPercent}% refund — ${item.description}`), value.notes].filter(Boolean).join("\n")
    : String(value || "");

/** Builds an immutable, renderer-neutral document snapshot from server-finalized pricing. */
export function buildServerQuoteDocumentModel({
  enquiry,
  data,
  pricing,
  lines = [],
  quoteRef,
  version,
  snapshots = {},
  generatedAt = new Date(),
}) {
  if (!pricing || pricing.moneyUnit !== "PAISE")
    throw new TypeError("Final FinancialEngine pricing in paise is required");
  const fields = enquiry.fields || {};
  return {
    schema: "TREM_QUOTE_DOCUMENT_V2",
    quoteRef,
    version,
    generatedAt: new Date(generatedAt).toISOString(),
    validUntil: data.terms.validUntil,
    enquiryRef: enquiry.enquiryRef || "",
    title: data.details.title,
    summary: data.details.summary,
    traveller: {
      name: fields.name || "Traveller",
      email: fields.email || "",
      phone: fields.phone || "",
    },
    travel: {
      dates: fields.preferredTravelDate || "Flexible",
      travellers: fields.travellerCount || "",
      packageName: enquiry.selection?.packageName || "",
    },
    variant: snapshots.variant || data.composition?.variant || "CUSTOM",
    itinerarySnapshot: snapshots.itinerarySnapshot || null,
    hotelSnapshot: snapshots.hotelSnapshot || null,
    flightSnapshot: snapshots.flightSnapshot || null,
    transferSnapshot: snapshots.transferSnapshot || null,
    activitySnapshot: snapshots.activitySnapshot || null,
    inclusions: snapshots.inclusions || data.composition?.inclusions || [],
    exclusions: snapshots.exclusions || data.composition?.exclusions || [],
    pricing: {
      currency: pricing.currency,
      moneyUnit: "PAISE",
      lines: [...lines, ...platformRows(pricing)],
      totalMinor: pricing.finalPayableMinor,
    },
    terms: {
      payment: paymentText(snapshots.paymentPlan || data.terms.paymentSchedule || data.terms.paymentPlan),
      cancellation: cancellationText(snapshots.cancellationPolicy || data.terms.cancellationTiers || data.terms.cancellationPolicy),
      notes: data.terms.notes || "",
    },
  };
}

export default buildServerQuoteDocumentModel;
