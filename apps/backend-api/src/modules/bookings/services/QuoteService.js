import BookingQuote from "../models/BookingQuote.js";

export const PRICING_TYPES = ["PER_PERSON", "PER_ADULT", "PER_CHILD", "PER_ROOM", "PER_NIGHT", "PER_BOOKING", "FIXED", "PERCENTAGE"];
const FIELD_LINES = [["basePrice", "Base tour/package cost", "inclusion"], ["flightPrice", "Flight cost", "inclusion"], ["hotelPrice", "Hotel cost", "inclusion"], ["transferPrice", "Transfers", "inclusion"], ["activitiesPrice", "Activities", "inclusion"], ["mealsPrice", "Meals", "inclusion"], ["visaFee", "Visa", "inclusion"], ["insuranceFee", "Insurance", "inclusion"], ["platformFee", "TravelsTREM platform fee", "fee"], ["serviceFee", "Agent/service fee", "fee"], ["agentMarkup", "Agent markup", "fee"]];
const number = (value) => Math.max(0, Number(value) || 0);
const date = (value) => (value && !Number.isNaN(new Date(value).getTime()) ? new Date(value) : null);

function counts(booking = {}) {
  const selection = booking.tripSelection || {};
  const adults = number(selection.adultCount || booking.guestsCount || 1);
  const children = number(selection.childCount);
  const nights = booking.startDate && booking.endDate ? Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000)) : 1;
  return { adults, children, people: adults + children + number(selection.infantCount), rooms: number(selection.roomCount || 1), nights };
}

function lineAmount(line, booking, percentBase) {
  const pricingType = PRICING_TYPES.includes(line.pricingType) ? line.pricingType : "FIXED";
  const unitAmount = number(line.unitAmount ?? line.amount);
  const c = counts(booking);
  const quantity = pricingType === "PER_PERSON" ? c.people : pricingType === "PER_ADULT" ? c.adults : pricingType === "PER_CHILD" ? c.children : pricingType === "PER_ROOM" ? c.rooms : pricingType === "PER_NIGHT" ? c.nights : pricingType === "PER_BOOKING" || pricingType === "FIXED" ? 1 : number(line.quantity || 1);
  return { ...line, pricingType, unitAmount, quantity, amount: Math.round(pricingType === "PERCENTAGE" ? percentBase * unitAmount / 100 : unitAmount * quantity), selected: line.selected !== false };
}

export function calculateQuote(booking = {}, payload = {}) {
  const currency = String(payload.currency || booking.priceSnapshot?.currency || "INR").toUpperCase();
  const fixed = FIELD_LINES.map(([code, label, category]) => ({ code, label, category, pricingType: "FIXED", unitAmount: number(payload[code]), selected: true }));
  const supplied = Array.isArray(payload.items) ? payload.items.filter((item) => item?.label) : [];
  const regular = [...fixed, ...supplied.filter((item) => item.pricingType !== "PERCENTAGE")].map((line) => lineAmount(line, booking, 0));
  const base = regular.filter((line) => line.selected).reduce((sum, line) => sum + line.amount, 0);
  const items = [...regular, ...supplied.filter((item) => item.pricingType === "PERCENTAGE").map((line) => lineAmount(line, booking, base))].map((line) => ({ ...line, currency }));
  const additions = items.filter((line) => line.selected).reduce((sum, line) => sum + line.amount, 0);
  const discount = number(payload.discount);
  const couponDiscount = number(payload.couponDiscount); // Stored only for migration; coupons are not exposed yet.
  const taxes = number(payload.taxes); // Stored only for migration; GST/tax is not exposed yet.
  const finalAmount = Math.max(0, Math.round(additions + taxes - discount - couponDiscount));
  return { currency, items, discount, couponDiscount, taxes, finalAmount, amountPayableNow: Math.min(finalAmount, number(payload.amountPayableNow)) };
}

export function computeQuoteFinalAmount(quote = {}) { return calculateQuote({ tripSelection: quote.tripSelection }, quote).finalAmount; }

function quoteData(booking, payload, actor, version, status) {
  const calculated = calculateQuote(booking, payload);
  const fields = Object.fromEntries(FIELD_LINES.map(([field]) => [field, number(payload[field])]));
  return { bookingId: booking._id, version, quoteRef: `${booking.bookingRef}-Q${version}`, ...fields, discount: calculated.discount, couponDiscount: calculated.couponDiscount, taxes: calculated.taxes, currency: calculated.currency, expirationDate: date(payload.expirationDate), balanceDueDate: date(payload.balanceDueDate), amountPayableNow: calculated.amountPayableNow, items: calculated.items, notes: String(payload.notes || "").trim(), terms: String(payload.terms || "").trim(), finalAmount: calculated.finalAmount, status, createdBy: actor.id || null };
}

export const QuoteService = {
  async create(booking, payload = {}, actor = {}, options = {}) {
    const version = (booking.currentQuoteVersion || 0) + 1;
    const [doc] = await BookingQuote.create([{ ...quoteData(booking, payload, actor, version, payload.sendNow ? "SENT" : (payload.status || "READY")), sentAt: payload.sendNow ? new Date() : null }], options);
    return doc;
  },
  async saveDraft(booking, payload = {}, actor = {}) {
    const existing = await BookingQuote.findOne({ bookingId: booking._id, status: "DRAFT" }).sort({ version: -1 });
    if (existing) return BookingQuote.findByIdAndUpdate(existing._id, { $set: quoteData(booking, payload, actor, existing.version, "DRAFT") }, { new: true, runValidators: true });
    const version = (booking.currentQuoteVersion || 0) + 1;
    const [doc] = await BookingQuote.create([quoteData(booking, payload, actor, version, "DRAFT")]);
    return doc;
  },
  async latest(bookingId) { return BookingQuote.findOne({ bookingId }).sort({ version: -1 }); },
  async list(bookingId) { return BookingQuote.find({ bookingId }).sort({ version: -1 }); },
  async byId(id) { return BookingQuote.findOne({ _id: id, quoteType: "LEGACY" }); },
  async markSent(bookingId, version, options = {}) { return BookingQuote.findOneAndUpdate({ bookingId, version }, { $set: { status: "SENT", sentAt: new Date() } }, { new: true, ...options }); },
  async markDecision(bookingId, version, decision, options = {}) {
    const status = decision === "accept" ? "ACCEPTED" : "REJECTED";
    const dateField = decision === "accept" ? "acceptedAt" : "rejectedAt";
    return BookingQuote.findOneAndUpdate({ bookingId, version }, { $set: { status, [dateField]: new Date() } }, { new: true, ...options });
  },
  async saveChangeRequest(bookingId, version, changeRequest, options = {}) {
    return BookingQuote.findOneAndUpdate({ bookingId, version }, { $set: { changeRequest } }, { new: true, ...options });
  },
};

export default QuoteService;
