import BookingQuote from "../../../models/BookingQuote.js";

export function computeQuoteFinalAmount(quote = {}) {
  const additions = ["basePrice", "hotelPrice", "flightPrice", "visaFee", "insuranceFee", "taxes", "serviceFee", "agentMarkup"]
    .reduce((sum, key) => sum + Number(quote[key] || 0), 0);
  const reductions = Number(quote.discount || 0) + Number(quote.couponDiscount || 0);
  const itemTotal = Array.isArray(quote.items) ? quote.items.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
  return Math.max(0, Math.round(additions + itemTotal - reductions));
}

export const QuoteService = {
  async create(booking, payload = {}, actor = {}, options = {}) {
    const version = (booking.currentQuoteVersion || 0) + 1;
    const quote = {
      bookingId: booking._id,
      version,
      quoteRef: `${booking.bookingRef}-Q${version}`,
      basePrice: Number(payload.basePrice || 0),
      hotelPrice: Number(payload.hotelPrice || 0),
      flightPrice: Number(payload.flightPrice || 0),
      visaFee: Number(payload.visaFee || 0),
      insuranceFee: Number(payload.insuranceFee || 0),
      taxes: Number(payload.taxes || 0),
      serviceFee: Number(payload.serviceFee || 0),
      discount: Number(payload.discount || 0),
      agentMarkup: Number(payload.agentMarkup || 0),
      couponDiscount: Number(payload.couponDiscount || 0),
      currency: payload.currency || booking.priceSnapshot?.currency || "INR",
      expirationDate: payload.expirationDate ? new Date(payload.expirationDate) : null,
      items: Array.isArray(payload.items) ? payload.items : [],
      notes: payload.notes || "",
      status: payload.sendNow ? "SENT" : "READY",
      createdBy: actor.id || null,
      sentAt: payload.sendNow ? new Date() : null,
    };
    quote.finalAmount = payload.finalAmount != null ? Number(payload.finalAmount) : computeQuoteFinalAmount(quote);
    const [doc] = await BookingQuote.create([quote], options);
    return doc;
  },

  async latest(bookingId) {
    return BookingQuote.findOne({ bookingId }).sort({ version: -1 });
  },

  async list(bookingId) {
    return BookingQuote.find({ bookingId }).sort({ version: -1 });
  },

  async markSent(bookingId, version, options = {}) {
    return BookingQuote.findOneAndUpdate(
      { bookingId, version },
      { $set: { status: "SENT", sentAt: new Date() } },
      { new: true, ...options },
    );
  },

  async markDecision(bookingId, version, decision, options = {}) {
    const status = decision === "accept" ? "ACCEPTED" : "REJECTED";
    const dateField = decision === "accept" ? "acceptedAt" : "rejectedAt";
    return BookingQuote.findOneAndUpdate(
      { bookingId, version },
      { $set: { status, [dateField]: new Date() } },
      { new: true, ...options },
    );
  },
};

export default QuoteService;
