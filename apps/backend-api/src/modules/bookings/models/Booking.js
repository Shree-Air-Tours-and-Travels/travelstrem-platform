import mongoose from "mongoose";
import {
  createBookingReference,
  toPublicBookingReference,
} from "../utils/bookingReference.js";
import {
  BOOKING_FLOW,
  BOOKING_FLOW_LIST,
  BOOKING_PRIORITY,
  BOOKING_PRIORITY_LIST,
  BOOKING_STATUS,
  BOOKING_STATUS_LIST,
  BOOKING_STATUS_TRANSITIONS as BOOKING_STATUS_TRANSITIONS_BY_STATUS,
  EDITABLE_TRAVELLER_STATUSES as EDITABLE_TRAVELLER_STATUS_LIST,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LIST,
  PRICE_SOURCE,
} from "../../../constants/enums.js";

const { Schema } = mongoose;
const SOURCE_ATTRIBUTION = Object.freeze({
  WEBSITE: "website",
});

export const BOOKING_STATUSES = BOOKING_STATUS_LIST;
export const PAYMENT_STATUSES = PAYMENT_STATUS_LIST;
export const BOOKING_STATUS_TRANSITIONS = BOOKING_STATUS_TRANSITIONS_BY_STATUS;
export const EDITABLE_TRAVELLER_STATUSES = EDITABLE_TRAVELLER_STATUS_LIST;

const primaryContactSchema = new Schema({
  name: { type: String, trim: true, default: "" },
  email: { type: String, trim: true, lowercase: true, default: "" },
  phone: { type: String, trim: true, default: "" },
}, { _id: false });

const tripSelectionSchema = new Schema({
  packageId: { type: String, trim: true, default: "" },
  roomType: { type: String, trim: true, default: "" },
  adultCount: { type: Number, min: 0, default: 1 },
  childCount: { type: Number, min: 0, default: 0 },
  infantCount: { type: Number, min: 0, default: 0 },
  currency: { type: String, trim: true, default: "INR" },
  pickupCity: { type: String, trim: true, default: "" },
  specialRequirements: { type: String, trim: true, default: "" },
}, { _id: false });

const travelWindowSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { _id: false });

const tripPreferencesSchema = new Schema({
  airportTransferNeeded: { type: Boolean, default: false },
  roomSharingPreference: { type: String, trim: true, default: "" },
  bedType: { type: String, trim: true, default: "" },
  transport: { type: String, trim: true, default: "" },
  addFlights: { type: String, trim: true, default: "" },
  smokingPreference: { type: String, trim: true, default: "" },
  mealPreference: { type: String, trim: true, default: "" },
  extraActivities: { type: [String], default: [] },
  specialRequests: { type: String, trim: true, default: "" },
}, { _id: false });

const priceSnapshotSchema = new Schema({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 0 },
  currency: { type: String, default: "INR" },
  isFinal: { type: Boolean, default: false },
  source: { type: String, default: PRICE_SOURCE.MANUAL },
  matchedSeason: { type: String, default: null },
  note: { type: String, default: "" },
  perPerson: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const paymentSummarySchema = new Schema({
  total: { type: Number, default: 0 },
  paid: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  refunded: { type: Number, default: 0 },
}, { _id: false });

const sourceAttributionSchema = new Schema({
  source: { type: String, trim: true, default: SOURCE_ATTRIBUTION.WEBSITE },
  campaign: { type: String, trim: true, default: "" },
  utmSource: { type: String, trim: true, default: "" },
  utmMedium: { type: String, trim: true, default: "" },
  utmCampaign: { type: String, trim: true, default: "" },
  referrer: { type: String, trim: true, default: "" },
}, { _id: false });

const bookingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tour: { type: Schema.Types.ObjectId, ref: "Tour", default: null },
  trip: { type: Schema.Types.ObjectId, ref: "TrevioTrip", default: null },
  product: { type: String, enum: BOOKING_FLOW_LIST, default: BOOKING_FLOW.TREVISTA, index: true },
  assignedAgent: { type: Schema.Types.ObjectId, ref: "User", default: null },
  assignedAgentRef: { type: String, trim: true, default: "", index: true },
  assignedAgencyRef: { type: String, trim: true, default: "", index: true },
  assignedPartnerAgencyRef: { type: String, trim: true, default: "", index: true },
  bookingRef: { type: String },
  idempotencyKey: { type: String, trim: true, default: "" },

  status: { type: String, enum: BOOKING_STATUSES, default: BOOKING_STATUS.DRAFT, index: true },
  paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: PAYMENT_STATUS.UNPAID, index: true },

  travelWindow: { type: travelWindowSchema, required: true },
  tripSelection: { type: tripSelectionSchema, default: () => ({}) },
  primaryContact: { type: primaryContactSchema, default: () => ({}) },
  tripPreferences: { type: tripPreferencesSchema, default: () => ({}) },
  priceSnapshot: { type: priceSnapshotSchema, default: () => ({}) },
  paymentSummary: { type: paymentSummarySchema, default: () => ({}) },
  tokenAmount: { type: Number, min: 0, default: 0 },
  paymentRejectionReason: { type: String, trim: true, default: "" },

  latestQuoteId: { type: Schema.Types.ObjectId, ref: "BookingQuote", default: null },
  currentQuoteVersion: { type: Number, default: 0 },
  seatsReserved: { type: Number, default: 1 },
  guestsCount: { type: Number, required: true, min: 1 },

  priority: { type: String, enum: BOOKING_PRIORITY_LIST, default: BOOKING_PRIORITY.MEDIUM, index: true },
  responseDueAt: { type: Date, default: null },
  quoteDueAt: { type: Date, default: null },
  followupAt: { type: Date, default: null },

  sourceAttribution: { type: sourceAttributionSchema, default: () => ({}) },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  organizationId: { type: Schema.Types.ObjectId, default: null },
  tenantId: { type: Schema.Types.ObjectId, default: null },
  agencyId: { type: Schema.Types.ObjectId, ref: "PartnerAgency", default: null, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "AgencyCustomer", default: null, index: true },
  agencySnapshot: { type: Schema.Types.Mixed, default: null },
  assignedAgentSnapshot: { type: Schema.Types.Mixed, default: null },

  termsAccepted: { type: Boolean, default: false },
  cancellationPolicyAccepted: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true,
  optimisticConcurrency: true,
});

bookingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingSchema.virtual("startDate").get(function () {
  return this.travelWindow?.startDate || null;
});

bookingSchema.virtual("endDate").get(function () {
  return this.travelWindow?.endDate || null;
});

bookingSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    delete ret._id;
    if (ret.bookingRef) ret.bookingRef = toPublicBookingReference(ret.bookingRef);
  },
});

bookingSchema.pre("validate", function (next) {
  if (this.product === BOOKING_FLOW.TREVIO && !this.trip) {
    return next(new Error("Trevio bookings require a trip reference"));
  }
  if (this.product === BOOKING_FLOW.TREVISTA && !this.tour) {
    return next(new Error("Trevista bookings require a tour reference"));
  }
  if (!this.bookingRef) {
    this.bookingRef = createBookingReference();
  }
  if (!this.guestsCount || this.guestsCount < 1) this.guestsCount = 1;
  if (this.product === "trevio") {
    if (this.seatsReserved == null) this.seatsReserved = 0;
  } else {
    if (!this.seatsReserved || this.seatsReserved < 1) this.seatsReserved = this.guestsCount;
  }
  if (this.priceSnapshot?.total && !this.paymentSummary?.total) {
    this.paymentSummary = {
      total: this.priceSnapshot.total,
      paid: this.paymentSummary?.paid || 0,
      remaining: Math.max(0, this.priceSnapshot.total - (this.paymentSummary?.paid || 0)),
      refunded: this.paymentSummary?.refunded || 0,
    };
  }
  next();
});

bookingSchema.index({ bookingRef: 1 }, { unique: true, partialFilterExpression: { bookingRef: { $exists: true, $type: "string" } } });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ tour: 1, "travelWindow.startDate": 1 });
bookingSchema.index({ trip: 1, "travelWindow.startDate": 1 });
bookingSchema.index({ assignedAgent: 1, status: 1 });
bookingSchema.index({ tenantId: 1 });
bookingSchema.index({ agencyId: 1, assignedAgent: 1, status: 1 });
bookingSchema.index(
  { idempotencyKey: 1, user: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true, $type: "string", $gt: "" } } }
);

bookingSchema.statics.normalizeStatus = function (status) {
  const aliases = {
    pending: BOOKING_STATUS.QUOTE_REQUESTED,
    upcoming: BOOKING_STATUS.QUOTE_REQUESTED,
    recommended: BOOKING_STATUS.QUOTE_REQUESTED,
    confirmed: BOOKING_STATUS.CONFIRMED,
    cancelled: BOOKING_STATUS.CANCELLED,
    completed: BOOKING_STATUS.COMPLETED,
    draft: BOOKING_STATUS.DRAFT,
  };
  const normalized = String(status || "").trim();
  return aliases[normalized.toLowerCase()] || normalized.toUpperCase();
};

bookingSchema.statics.canTransition = function (from, to) {
  const normalizedFrom = this.normalizeStatus(from);
  const normalizedTo = this.normalizeStatus(to);
  return (BOOKING_STATUS_TRANSITIONS[normalizedFrom] || []).includes(normalizedTo);
};

bookingSchema.methods.canEditTravellers = function () {
  return EDITABLE_TRAVELLER_STATUSES.includes(this.constructor.normalizeStatus(this.status));
};

bookingSchema.methods.transitionStatus = function (nextStatus) {
  const to = this.constructor.normalizeStatus(nextStatus);
  const from = this.constructor.normalizeStatus(this.status);
  if (from !== to && !this.constructor.canTransition(from, to)) {
    throw new Error(`Invalid booking status transition: ${from} -> ${to}`);
  }
  this.status = to;
  return { from, to, changed: from !== to };
};

bookingSchema.statics.buildPriceSnapshot = function (tourDoc, targetDate, travellerCount = 1) {
  const season = typeof tourDoc.getCurrentPrice === "function"
    ? tourDoc.getCurrentPrice(targetDate)
    : (tourDoc.price || { min: 0, max: 0, currency: "INR", isFinal: false, source: PRICE_SOURCE.MANUAL });

  const perPerson = Math.round(season.min || 0);
  const total = perPerson * travellerCount;

  return {
    min: season.min || 0,
    max: season.max || 0,
    currency: season.currency || "INR",
    isFinal: !!season.isFinal,
    source: season.source || PRICE_SOURCE.MANUAL,
    matchedSeason: season.matchedSeason || null,
    note: season.note || "",
    perPerson,
    total,
  };
};

const Booking = mongoose.models?.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
