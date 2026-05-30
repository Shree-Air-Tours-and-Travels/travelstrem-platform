import BookingPayment from "../models/BookingPayment.js";
import { PAYMENT_STATUS, PAYMENT_TYPE } from "../../../constants/enums.js";

export const PaymentService = {
  async record(booking, payload = {}, actor = {}, options = {}) {
    const amount = Number(payload.amount ?? payload.amountPaid ?? 0);
    const [payment] = await BookingPayment.create([{
      bookingId: booking._id,
      amount,
      currency: payload.currency || booking.priceSnapshot?.currency || "INR",
      provider: payload.provider || payload.method || "",
      transactionId: payload.transactionId || payload.providerId || "",
      status: payload.status ? String(payload.status).toUpperCase() : PAYMENT_STATUS.PAID,
      paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
      receiptUrl: payload.receiptUrl || "",
      type: payload.type || PAYMENT_TYPE.PARTIAL,
      raw: payload.raw || {},
      createdBy: actor.id || null,
    }], options);
    return payment;
  },

  async summarize(bookingId, total = 0) {
    const payments = await BookingPayment.find({ bookingId });
    const paid = payments
      .filter((payment) => payment.status === PAYMENT_STATUS.PAID && payment.type !== PAYMENT_TYPE.REFUND)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const refunded = payments
      .filter((payment) => payment.type === PAYMENT_TYPE.REFUND || payment.status === PAYMENT_STATUS.REFUNDED)
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
