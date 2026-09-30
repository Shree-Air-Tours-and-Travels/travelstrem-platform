import { PaymentSession } from "../modules/payments/models.js";
import { publishToUser } from "../realtime/realtime.publisher.js";
import { REALTIME_EVENTS } from "../realtime/realtime.constants.js";
import FlightBooking from "../modules/flights/models/FlightBooking.js";
import ContactLead from "../modules/forms/models/ContactLead.js";

const settled = ["PROCESSING", "PAID", "REFUNDED", "PARTIALLY_REFUNDED"];
const watches = new Map();
export function bookingClock(expiresAt, status = "") {
    if (!expiresAt || settled.includes(status)) return { remainingSeconds: null, expired: false, serverTime: new Date().toISOString() };
    const deadline = new Date(expiresAt).getTime();
    const remainingSeconds = Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0;
    return { remainingSeconds, expired: remainingSeconds === 0 || status === "EXPIRED", serverTime: new Date().toISOString() };
}
export function assertBookingOpen(expiresAt) {
    if (bookingClock(expiresAt).expired) throw Object.assign(new Error("Your booking session has ended. Start a new search to check current prices and availability."), { status: 410, code: "BOOKING_SESSION_EXPIRED" });
}
export function watchBookingClock({ userId, enquiryId, enquiryMongoId, paymentSessionId, expiresAt, status }) {
    const key = `${userId}:${enquiryId || paymentSessionId}`;
    if (!expiresAt || settled.includes(status)) { watches.delete(key); return; }
    watches.set(key, { userId, enquiryId, enquiryMongoId, paymentSessionId, expiresAt });
}
let ticking = false;
const timer = setInterval(async () => {
    if (ticking || !watches.size) return;
    ticking = true;
    try {
        for (const [key, watch] of watches) {
            let status = "";
            if (!watch.paymentSessionId && watch.enquiryMongoId) {
                const enquiry = await ContactLead.findById(watch.enquiryMongoId).select("bookingId status").lean();
                if (!enquiry || ["cancelled", "closed"].includes(enquiry.status)) { watches.delete(key); continue; }
                const booking = enquiry.bookingId ? { _id: enquiry.bookingId } : await FlightBooking.findOne({ sourceEnquiryId: watch.enquiryMongoId }).select("_id").lean();
                if (booking) {
                    const session = await PaymentSession.findOne({ bookingId: booking._id }).select("sessionId").lean();
                    if (session) watch.paymentSessionId = session.sessionId;
                }
            }
            if (watch.paymentSessionId) {
                await PaymentSession.updateOne({ sessionId: watch.paymentSessionId, status: { $in: ["CREATED", "PENDING", "FAILED"] }, expiresAt: { $lte: new Date() } }, { $set: { status: "EXPIRED" } });
                const session = await PaymentSession.findOne({ sessionId: watch.paymentSessionId }).select("status expiresAt").lean();
                if (!session) { watches.delete(key); continue; }
                status = session.status;
                watch.expiresAt = session.expiresAt;
            }
            const clock = bookingClock(watch.expiresAt, status);
            await publishToUser(watch.userId, REALTIME_EVENTS.BOOKING_CLOCK, { enquiryId: watch.enquiryId, paymentSessionId: watch.paymentSessionId, ...clock });
            if (clock.expired || clock.remainingSeconds === null) watches.delete(key);
        }
    } catch (error) {
        // No tick is safer than publishing an unverified payment state.
        console.error("[BookingClock] sync failed:", error.message);
    } finally { ticking = false; }
}, 1000);
timer.unref();
