const number = (value) => Number(value || 0);

export function buildQuoteDocumentModel({ booking = {}, quote: suppliedQuote = {}, amount, currency, notes = "" } = {}) {
  const product = booking.trip || booking.tour || {};
  const contact = booking.primaryContact || {};
  const source = { ...(booking.currentQuote || {}), ...suppliedQuote };
  const items = Array.isArray(source.items) ? source.items.filter((item) => item?.label && item.selected !== false) : [];
  const fixed = [
    ["basePrice", "Base tour/package cost"], ["flightPrice", "Flight cost"], ["hotelPrice", "Hotel cost"], ["transferPrice", "Transfers"], ["activitiesPrice", "Activities / experiences"], ["mealsPrice", "Meals"], ["visaFee", "Visa"], ["insuranceFee", "Travel insurance"], ["platformFee", "TravelsTREM platform fee"], ["serviceFee", "Agent/service fee"],
  ].map(([key, label]) => ({ label, amount: number(source[key]), category: key.includes("Fee") ? "fee" : "inclusion" })).filter((item) => item.amount > 0);
  const additions = [...fixed, ...items].reduce((sum, item) => sum + number(item.amount ?? item.unitAmount), 0);
  const discount = number(source.discount);
  const resolvedAmount = number(amount ?? source.finalAmount ?? Math.max(0, additions - discount) ?? booking.priceSnapshot?.total);

  return {
    quoteNumber: source.quoteRef || `DRAFT-${booking.bookingRef || "QUOTE"}`,
    version: source.version || "Draft",
    bookingReference: booking.bookingRef || booking.enquiryRef || "Pending",
    title: product.title || booking.tripSelection?.packageId || "Custom travel quote",
    customerName: contact.name || booking.user?.name || "Traveller",
    customerEmail: contact.email || booking.user?.email || "",
    startDate: booking.startDate || booking.travelWindow?.startDate || null,
    endDate: booking.endDate || booking.travelWindow?.endDate || null,
    guests: number(booking.guestsCount || booking.guests || 1),
    amount: resolvedAmount,
    currency: currency || source.currency || booking.priceSnapshot?.currency || "INR",
    lines: [...fixed, ...items], discount, amountPayableNow: number(source.amountPayableNow), balanceDueDate: source.balanceDueDate || null,
    expirationDate: source.expirationDate || null, notes: notes || source.notes || "", terms: source.terms || "",
  };
}

export default buildQuoteDocumentModel;
