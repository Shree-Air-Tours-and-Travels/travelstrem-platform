import BookingPayment from "../models/BookingPayment.js";
import {
  PAYMENT_RECORD_STATUS,
  PAYMENT_TYPE,
} from "../../../constants/enums.js";

const normalizeRecordStatus = (value) => {
  const status = String(value || "").toUpperCase();
  if (["PAID", "REFUNDED"].includes(status)) return status;
  if (["VERIFICATION", "PENDING", "REJECTED"].includes(status)) return status;
  return PAYMENT_RECORD_STATUS.PENDING;
};

export const PaymentService = {
  async record(booking, payload = {}, actor = {}, options = {}) {
    const amount = Number(payload.amount ?? payload.amountPaid ?? 0);
    const [payment] = await BookingPayment.create([{
      bookingId: booking._id,
      amount,
      currency: payload.currency || booking.priceSnapshot?.currency || "INR",
      paymentMethod: String(payload.paymentMethod || payload.method || "UPI").toUpperCase(),
      provider: payload.provider || "manual",
      transactionId: payload.transactionId || payload.providerId || "",
      status: normalizeRecordStatus(payload.status || PAYMENT_RECORD_STATUS.PAID),
      paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
      submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : null,
      receiptUrl: payload.receiptUrl || payload.paymentScreenshot || "",
      paymentScreenshot: payload.paymentScreenshot || payload.receiptUrl || "",
      remarks: payload.remarks || "",
      rejectionReason: payload.rejectionReason || "",
      verifiedBy: payload.verifiedBy || null,
      verifiedAt: payload.verifiedAt ? new Date(payload.verifiedAt) : null,
      type: payload.type || PAYMENT_TYPE.TOKEN,
      raw: payload.raw || {},
      createdBy: actor.id || null,
    }], options);
    return payment;
  },

  submitTokenProof(booking, payload = {}, actor = {}) {
    return this.record(booking, {
      ...payload,
      amount: booking.tokenAmount,
      type: PAYMENT_TYPE.TOKEN,
      status: PAYMENT_RECORD_STATUS.VERIFICATION,
      submittedAt: new Date(),
      provider: "manual",
    }, actor);
  },

  async findForBooking(bookingId, paymentId) {
    return BookingPayment.findOne({ _id: paymentId, bookingId });
  },

  async verify(payment, actorId) {
    payment.status = PAYMENT_RECORD_STATUS.PAID;
    payment.rejectionReason = "";
    payment.verifiedBy = actorId || null;
    payment.verifiedAt = new Date();
    await payment.save();
    return payment;
  },

  async reject(payment, reason, actorId) {
    payment.status = PAYMENT_RECORD_STATUS.REJECTED;
    payment.rejectionReason = reason;
    payment.verifiedBy = actorId || null;
    payment.verifiedAt = new Date();
    await payment.save();
    return payment;
  },

  async summarize(bookingId, total = 0) {
    const payments = await BookingPayment.find({ bookingId });
    const paid = payments
      .filter((payment) => payment.status === PAYMENT_RECORD_STATUS.PAID && payment.type !== PAYMENT_TYPE.REFUND)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const refunded = payments
      .filter((payment) => payment.type === PAYMENT_TYPE.REFUND || payment.status === PAYMENT_RECORD_STATUS.REFUNDED)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return {
      total: Number(total || 0),
      paid,
      remaining: Math.max(0, Number(total || 0) - paid),
      refunded,
    };
  },

  list(bookingId) {
    return BookingPayment.find({ bookingId }).sort({ createdAt: -1 });
  },
};

export default PaymentService;
