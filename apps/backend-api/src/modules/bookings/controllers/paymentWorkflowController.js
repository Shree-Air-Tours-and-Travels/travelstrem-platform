import fs from "fs/promises";
import path from "path";
import axios from "axios";
import asyncHandler from "../../../shared/middleware/asyncHandler.js";
import ApiError from "../../../shared/errors/ApiError.js";
import {
  BOOKING_STATUS,
  PAYMENT_RECORD_STATUS,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
} from "../../../constants/enums.js";
import Booking from "../models/Booking.js";
import BookingPayment from "../models/BookingPayment.js";
import PaymentSettings from "../models/PaymentSettings.js";
import TrevioTrip from "../../trevio/models/TrevioTrip.js";
import BookingService from "../services/BookingService.js";
import BookingTimelineService from "../services/BookingTimelineService.js";
import MessageService from "../services/MessageService.js";
import PaymentService from "../services/PaymentService.js";

const sendSuccess = (res, data, message = "OK") =>
  res.json({ status: "success", message, componentData: { data } });

function actorFromReq(req) {
  const user = req.user || {};
  const id = user.sub || user.id || user._id || user.userId || null;
  const roles = [user.role, user.userRole, ...(Array.isArray(user.roles) ? user.roles : [])]
    .filter(Boolean)
    .map((role) => String(role).toLowerCase());
  const privileged = roles.some((role) =>
    ["admin", "agent", "super_admin", "operations", "finance", "support"].includes(role));
  return { id, type: privileged ? "admin" : "customer", privileged, agencyId: user.agencyId || null, agencyRole: user.agencyRole || "none", isMaster: user.role === "admin" && user.adminLevel === "master" };
}

function proofUrl(file, req) {
  if (!file) return "";
  const url = file.secure_url || file.secureUrl || file.url || file.path || "";
  if (/^https?:\/\//i.test(url)) return url;
  const relative = `/uploads/${path.basename(url || file.filename || "")}`;
  return req ? `${req.protocol}://${req.get("host")}${relative}` : relative;
}

function resolveStoredProofUrl(value) {
  if (typeof value === "string") {
    const normalized = value.trim();
    return /^\[object Object\](?:\.html)?$/i.test(normalized) ? "" : normalized;
  }
  if (!value || typeof value !== "object") return "";
  for (const key of ["secure_url", "secureUrl", "url", "href", "path", "downloadUrl", "receiptUrl", "paymentScreenshot", "file", "asset", "data"]) {
    const resolved = resolveStoredProofUrl(value[key]);
    if (resolved) return resolved;
  }
  return "";
}

async function getAuthorizedBooking(req, { admin = false } = {}) {
  const actor = actorFromReq(req);
  if (admin && !actor.privileged) throw new ApiError(403, "Admin access required");
  const booking = await Booking.findById(req.params.id || req.params.bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (!actor.privileged && String(booking.user) !== String(actor.id)) {
    throw new ApiError(403, "Not authorized");
  }
  if (actor.privileged && !actor.isMaster) {
    if (!actor.agencyId || String(booking.agencyId || "") !== String(actor.agencyId)) throw new ApiError(403, "Not authorized");
    if (actor.agencyRole !== "partner_admin" && String(booking.assignedAgent || "") !== String(actor.id)) throw new ApiError(403, "Not authorized");
  }
  return { booking, actor };
}

async function notify(bookingId, content, event, actor, metadata = {}) {
  await Promise.all([
    BookingTimelineService.record({ bookingId, actor, action: event, metadata }),
    MessageService.send({
      bookingId,
      senderType: "system",
      senderName: "System",
      content,
      messageType: "system",
      metadata: { event, channels: ["app-shell"], ...metadata },
    }),
  ]);
}

async function reserveBookingSeats(booking) {
  if (!booking.trip || booking.seatsReserved) return;
  const seatsToReserve = booking.guestsCount || 1;
  const reservedTrip = await TrevioTrip.findOneAndUpdate(
    {
      _id: booking.trip,
      status: "listed",
      isListed: true,
      "availability.seatsAvailable": { $gte: seatsToReserve },
    },
    { $inc: { "availability.seatsAvailable": -seatsToReserve } },
    { new: true }
  );
  if (!reservedTrip) throw new ApiError(409, "The trip no longer has enough available seats");
  booking.seatsReserved = seatsToReserve;
}

async function applyVerifiedTokenState(booking) {
  booking.paymentSummary = await PaymentService.summarize(
    booking._id,
    booking.priceSnapshot?.total || booking.paymentSummary?.total || 0
  );
  booking.status = booking.paymentSummary.remaining > 0
    ? BOOKING_STATUS.CONFIRMED
    : BOOKING_STATUS.COMPLETED;
  booking.paymentStatus = booking.paymentSummary.remaining > 0
    ? PAYMENT_STATUS.TOKEN_PAID
    : PAYMENT_STATUS.FULLY_PAID;
  booking.paymentRejectionReason = "";
  await booking.save();
}

async function hydratedResponse(booking) {
  const hydrated = await BookingService.hydrate(booking);
  const settings = await PaymentSettings.findOne({ key: "default", agencyId: booking.agencyId || null }).lean();
  return {
    ...hydrated,
    bookingStatus: booking.status,
    tokenAmount: Number(booking.tokenAmount || 0),
    remainingAmount: Number(booking.paymentSummary?.remaining || 0),
    paymentConfiguration: settings || { methods: [], instructions: "" },
  };
}

export const getPaymentSettings = asyncHandler(async (req, res) => {
  const actor = actorFromReq(req);
  const agencyId = actor.isMaster ? (req.query.agencyId || null) : actor.agencyId;
  const settings = await PaymentSettings.findOneAndUpdate(
    { key: "default", agencyId },
    { $setOnInsert: { key: "default", agencyId } },
    { new: true, upsert: true }
  );
  return sendSuccess(res, settings);
});

export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const actor = actorFromReq(req);
  if (!actor.isMaster && actor.agencyRole !== "partner_admin") throw new ApiError(403, "Partner Admin access required");
  const methods = Array.isArray(req.body?.methods)
    ? req.body.methods.map((method) => ({
        code: String(method.code || "").toUpperCase(),
        label: String(method.label || method.code || "").trim(),
        enabled: method.enabled !== false,
        instructions: String(method.instructions || "").trim(),
        upiId: String(method.upiId || "").trim(),
        qrImage: String(method.qrImage || "").trim(),
        accountHolder: String(method.accountHolder || "").trim(),
        bankAccount: String(method.bankAccount || "").trim(),
        bankName: String(method.bankName || "").trim(),
        ifsc: String(method.ifsc || "").trim().toUpperCase(),
      })).filter((method) => method.code && method.label)
    : [];
  const agencyId = actor.isMaster ? (req.body.agencyId || null) : actor.agencyId;
  const settings = await PaymentSettings.findOneAndUpdate(
    { key: "default", agencyId },
    {
      $set: {
        methods,
        instructions: String(req.body?.instructions || "").trim(),
        merchantProvider: req.body?.merchantProvider === "razorpay" ? "razorpay" : "manual",
        merchantAccountId: String(req.body?.merchantAccountId || "").trim(),
        updatedBy: actor.id,
      },
      $setOnInsert: { key: "default", agencyId },
    },
    { new: true, upsert: true, runValidators: true }
  );
  return sendSuccess(res, settings, "Payment settings updated");
});

export const submitTokenProof = asyncHandler(async (req, res) => {
  const { booking, actor } = await getAuthorizedBooking(req);
  if (![BOOKING_STATUS.AWAITING_TOKEN_PAYMENT, BOOKING_STATUS.PAYMENT_PENDING].includes(booking.status)) {
    throw new ApiError(409, "This booking is not awaiting a token payment");
  }
  if (booking.paymentStatus === PAYMENT_STATUS.TOKEN_VERIFICATION) {
    throw new ApiError(409, "Payment proof is already awaiting verification");
  }

  const paymentScreenshot = proofUrl(req.file, req) || String(req.body?.paymentScreenshot || "").trim();
  const settings = await PaymentSettings.findOneAndUpdate(
    { key: "default", agencyId: booking.agencyId || null },
    { $setOnInsert: { key: "default", agencyId: booking.agencyId || null } },
    { new: true, upsert: true }
  );
  const requestedMethod = String(req.body?.paymentMethod || "").toUpperCase();
  const allowedMethod = settings.methods.find((method) => method.enabled && method.code === requestedMethod)
    || settings.methods.find((method) => method.enabled);
  const paymentMethod = allowedMethod?.code || "UPI";
  if (Number(booking.tokenAmount || 0) <= 0) {
    booking.tokenAmount = Math.round(Number(booking.paymentSummary?.total || booking.priceSnapshot?.total || 0) * 0.15);
  }
  if (Number(booking.tokenAmount || 0) <= 0) throw new ApiError(409, "Token amount is not configured for this booking");
  if (!paymentScreenshot) throw new ApiError(400, "Payment screenshot is required");

  const payment = await PaymentService.submitTokenProof(booking, {
    paymentScreenshot,
    paymentMethod,
  }, actor);

  booking.paymentStatus = PAYMENT_STATUS.TOKEN_VERIFICATION;
  booking.status = BOOKING_STATUS.AWAITING_TOKEN_PAYMENT;
  booking.paymentRejectionReason = "";
  await booking.save();
  await notify(
    booking._id,
    "Your payment proof has been submitted and is awaiting admin verification.",
    "token_payment_submitted",
    actor,
    { paymentId: payment.id, amount: payment.amount }
  );
  return sendSuccess(res, await hydratedResponse(booking), "Payment proof submitted");
});

export const downloadPaymentProof = asyncHandler(async (req, res) => {
  const { booking } = await getAuthorizedBooking(req, { admin: true });
  const payment = await PaymentService.findForBooking(booking._id, req.params.paymentId);
  const paymentScreenshot = resolveStoredProofUrl(payment?.paymentScreenshot)
    || resolveStoredProofUrl(payment?.receiptUrl)
    || resolveStoredProofUrl(payment?.raw?.paymentScreenshot)
    || resolveStoredProofUrl(payment?.raw?.receiptUrl);
  if (!payment) throw new ApiError(404, "Payment record not found for this booking");
  if (!paymentScreenshot) throw new ApiError(404, "Payment record does not contain a proof URL");

  let parsed;
  try {
    parsed = new URL(paymentScreenshot, `${req.protocol}://${req.get("host")}`);
  } catch {
    throw new ApiError(400, "Payment proof URL is invalid");
  }

  const sourceExtension = path.extname(parsed.pathname).toLowerCase();
  const extension = [".png", ".jpg", ".jpeg", ".webp"].includes(sourceExtension) ? sourceExtension : ".jpg";
  const safeReference = String(booking.bookingRef || booking._id).replace(/[^a-z0-9_-]/gi, "-");
  const filename = `payment-proof-${safeReference}${extension}`;

  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  const isCurrentServerUpload = parsed.pathname.startsWith("/uploads/")
    && parsed.origin === requestOrigin;

  if (isCurrentServerUpload) {
    const localFile = path.resolve("uploads", path.basename(parsed.pathname));
    try {
      await fs.access(localFile);
    } catch {
      throw new ApiError(404, `Payment proof file is no longer available: ${path.basename(parsed.pathname)}`);
    }
    return res.download(localFile, filename);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new ApiError(400, "Payment proof URL is invalid");
  }

  const response = await axios.get(parsed.toString(), {
    responseType: "arraybuffer",
    timeout: 15000,
    maxContentLength: 12 * 1024 * 1024,
  });
  const contentType = String(response.headers["content-type"] || "image/jpeg");
  if (!contentType.startsWith("image/")) throw new ApiError(415, "Payment proof is not an image");

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-store");
  return res.send(Buffer.from(response.data));
});

export const listPaymentVerifications = asyncHandler(async (req, res) => {
  const actor = actorFromReq(req);
  if (!actor.privileged) throw new ApiError(403, "Admin access required");
  const bookingScope = actor.isMaster ? {} : { agencyId: actor.agencyId, ...(actor.agencyRole === "partner_admin" ? {} : { assignedAgent: actor.id }) };
  const visibleBookingIds = await Booking.find(bookingScope).distinct("_id");
  const payments = await BookingPayment.find({
    bookingId: { $in: visibleBookingIds },
    type: PAYMENT_TYPE.TOKEN,
    status: PAYMENT_RECORD_STATUS.VERIFICATION,
  })
    .sort({ submittedAt: 1, createdAt: 1 })
    .populate({
      path: "bookingId",
      populate: [
        { path: "trip", select: "title slug location image" },
        { path: "tour", select: "title slug city photo" },
        { path: "user", select: "name email phone" },
      ],
    });
  return sendSuccess(res, payments);
});

export const approveTokenProof = asyncHandler(async (req, res) => {
  const { booking, actor } = await getAuthorizedBooking(req, { admin: true });
  const payment = await PaymentService.findForBooking(booking._id, req.params.paymentId);
  if (!payment || payment.status !== PAYMENT_RECORD_STATUS.VERIFICATION) {
    throw new ApiError(404, "Pending payment proof not found");
  }

  await reserveBookingSeats(booking);
  await PaymentService.verify(payment, actor.id);
  await applyVerifiedTokenState(booking);

  await notify(
    booking._id,
    "Token payment approved. Your booking is confirmed.",
    "token_payment_approved",
    actor,
    { paymentId: payment.id, verifiedAt: payment.verifiedAt }
  );
  return sendSuccess(res, await hydratedResponse(booking), "Token payment approved");
});

export const markTokenPaid = asyncHandler(async (req, res) => {
  const { booking, actor } = await getAuthorizedBooking(req, { admin: true });
  const allowedBookingStatuses = [BOOKING_STATUS.AWAITING_TOKEN_PAYMENT, BOOKING_STATUS.PAYMENT_PENDING];
  const allowedPaymentStatuses = [PAYMENT_STATUS.TOKEN_PENDING, PAYMENT_STATUS.UNPAID];
  if (!allowedBookingStatuses.includes(booking.status) || !allowedPaymentStatuses.includes(booking.paymentStatus)) {
    throw new ApiError(409, "This booking is not awaiting a token payment");
  }

  const tokenAmount = Number(
    req.body?.amount
    || booking.tokenAmount
    || Math.round(Number(booking.paymentSummary?.total || booking.priceSnapshot?.total || 0) * 0.15)
  );
  if (tokenAmount <= 0) throw new ApiError(409, "Token amount is not configured for this booking");
  if (tokenAmount > Number(booking.paymentSummary?.remaining || booking.priceSnapshot?.total || 0)) {
    throw new ApiError(400, "Token amount cannot exceed the remaining booking amount");
  }
  const paymentMethod = String(req.body?.paymentMethod || "CASH").toUpperCase();
  if (!["UPI", "BANK", "CASH"].includes(paymentMethod)) {
    throw new ApiError(400, "Payment method must be UPI, BANK, or CASH");
  }

  await reserveBookingSeats(booking);
  booking.tokenAmount = tokenAmount;
  const payment = await PaymentService.record(booking, {
    amount: tokenAmount,
    currency: booking.priceSnapshot?.currency,
    paymentMethod,
    transactionId: String(req.body?.transactionId || `ADMIN-TOKEN-${Date.now()}`).trim(),
    remarks: String(req.body?.remarks || "Token payment recorded by admin").trim(),
    status: PAYMENT_RECORD_STATUS.PAID,
    type: PAYMENT_TYPE.TOKEN,
    verifiedBy: actor.id,
    verifiedAt: new Date(),
    paymentDate: req.body?.paymentDate,
  }, actor);
  await applyVerifiedTokenState(booking);
  await notify(
    booking._id,
    "Token payment received. Your booking is confirmed.",
    "token_payment_recorded_by_admin",
    actor,
    { paymentId: payment.id, amount: tokenAmount, paymentMethod, transactionId: payment.transactionId }
  );
  return sendSuccess(res, await hydratedResponse(booking), "Token marked paid");
});

export const rejectTokenProof = asyncHandler(async (req, res) => {
  const { booking, actor } = await getAuthorizedBooking(req, { admin: true });
  const reason = String(req.body?.reason || "").trim();
  if (!reason) throw new ApiError(400, "A rejection reason is required");
  const payment = await PaymentService.findForBooking(booking._id, req.params.paymentId);
  if (!payment || payment.status !== PAYMENT_RECORD_STATUS.VERIFICATION) {
    throw new ApiError(404, "Pending payment proof not found");
  }

  await PaymentService.reject(payment, reason, actor.id);
  booking.status = BOOKING_STATUS.AWAITING_TOKEN_PAYMENT;
  booking.paymentStatus = PAYMENT_STATUS.TOKEN_PENDING;
  booking.paymentRejectionReason = reason;
  await booking.save();
  await notify(
    booking._id,
    `Payment verification failed: ${reason}`,
    "token_payment_rejected",
    actor,
    { paymentId: payment.id, reason }
  );
  return sendSuccess(res, await hydratedResponse(booking), "Token payment rejected");
});

export const markBalancePaid = asyncHandler(async (req, res) => {
  const { booking, actor } = await getAuthorizedBooking(req, { admin: true });
  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(409, "Only a confirmed booking can be marked fully paid");
  }
  const remaining = Number(booking.paymentSummary?.remaining || 0);
  if (remaining <= 0) throw new ApiError(409, "No balance is pending");
  await PaymentService.record(booking, {
    amount: remaining,
    currency: booking.priceSnapshot?.currency,
    paymentMethod: req.body?.paymentMethod || "CASH",
    transactionId: req.body?.transactionId,
    remarks: req.body?.remarks,
    status: PAYMENT_RECORD_STATUS.PAID,
    type: PAYMENT_TYPE.BALANCE,
    verifiedBy: actor.id,
    verifiedAt: new Date(),
  }, actor);
  booking.paymentSummary = await PaymentService.summarize(
    booking._id,
    booking.priceSnapshot?.total || booking.paymentSummary?.total || 0
  );
  booking.paymentStatus = PAYMENT_STATUS.FULLY_PAID;
  booking.status = BOOKING_STATUS.COMPLETED;
  await booking.save();
  await notify(
    booking._id,
    "Balance paid. Your booking payment is complete.",
    "balance_payment_completed",
    actor,
    { amount: remaining }
  );
  return sendSuccess(res, await hydratedResponse(booking), "Balance marked paid");
});

export const refundPayment = asyncHandler(async (req, res) => {
  const { booking, actor } = await getAuthorizedBooking(req, { admin: true });
  const amount = Number(req.body?.amount || booking.paymentSummary?.paid || 0);
  if (amount <= 0) throw new ApiError(400, "Refund amount is required");
  await PaymentService.record(booking, {
    amount,
    currency: booking.priceSnapshot?.currency,
    paymentMethod: req.body?.paymentMethod || "BANK",
    transactionId: req.body?.transactionId,
    remarks: req.body?.reason,
    status: PAYMENT_RECORD_STATUS.REFUNDED,
    type: PAYMENT_TYPE.REFUND,
    verifiedBy: actor.id,
    verifiedAt: new Date(),
  }, actor);
  booking.paymentSummary = await PaymentService.summarize(
    booking._id,
    booking.priceSnapshot?.total || booking.paymentSummary?.total || 0
  );
  booking.paymentStatus = PAYMENT_STATUS.REFUNDED;
  await booking.save();
  await notify(booking._id, "Your booking payment has been refunded.", "payment_refunded", actor, { amount });
  return sendSuccess(res, await hydratedResponse(booking), "Payment refunded");
});
