/**
 * Central registry for every realtime room and event name.
 * Never scatter literal room strings or event names across the codebase.
 */

export const REALTIME_ENVELOPE_VERSION = 1;

const ROOM_PREFIX = Object.freeze({
    USER: "user",
    AGENCY: "agency",
    ADMIN: "admin",
    BOOKING: "booking",
    PAYMENT: "payment",
    QUOTE: "quote",
    TOUR: "tour",
    TRIP: "trip",
    SUPPORT: "support",
    CATALOG: "catalog",
});

/** Backend-controlled room builders. Clients can never join rooms directly. */
export const room = Object.freeze({
    user: (userId) => `${ROOM_PREFIX.USER}:${userId}`,
    agency: (agencyId) => `${ROOM_PREFIX.AGENCY}:${agencyId}`,
    admin: () => ROOM_PREFIX.ADMIN,
    booking: (bookingId) => `${ROOM_PREFIX.BOOKING}:${bookingId}`,
    payment: (paymentId) => `${ROOM_PREFIX.PAYMENT}:${paymentId}`,
    quote: (quoteId) => `${ROOM_PREFIX.QUOTE}:${quoteId}`,
    tour: (tourId) => `${ROOM_PREFIX.TOUR}:${tourId}`,
    trip: (tripId) => `${ROOM_PREFIX.TRIP}:${tripId}`,
    support: (ticketId) => `${ROOM_PREFIX.SUPPORT}:${ticketId}`,
    catalog: () => ROOM_PREFIX.CATALOG,
});

/** Server -> client business events. */
export const REALTIME_EVENTS = Object.freeze({
    SYSTEM_CONNECTED: "system:connected",

    BOOKING_QUOTE_CREATED: "booking:quote-created",

    ENQUIRY_CREATED: "enquiry:created",
    ENQUIRY_CLAIMED: "enquiry:claimed",

    PAYMENT_CREATED: "payment:created",
    PAYMENT_PENDING: "payment:pending",
    PAYMENT_SUCCESS: "payment:success",
    PAYMENT_FAILED: "payment:failed",
    PAYMENT_REFUNDED: "payment:refunded",

    TOUR_CREATED: "tour:created",
    TOUR_UPDATED: "tour:updated",
    TOUR_PUBLISHED: "tour:published",
    TOUR_PRICE_CHANGED: "tour:price-changed",
    TOUR_AVAILABILITY_CHANGED: "tour:availability-changed",

    TRIP_UPDATED: "trip:updated",
    TRIP_AVAILABILITY_CHANGED: "trip:availability-changed",

    NOTIFICATION_CREATED: "notification:created",

    SUPPORT_TICKET_CREATED: "support:ticket-created",
    SUPPORT_MESSAGE_CREATED: "support:message-created",
    SUPPORT_CONVERSATION_UPDATED: "support:conversation-updated",

    ADMIN_BOOKING_QUOTE_CREATED: "admin:booking-quote-created",
    ADMIN_SUPPORT_REQUEST_CREATED: "admin:support-request-created",
});

/** Client -> server commands. Every command is validated + authorized server-side. */
export const REALTIME_COMMANDS = Object.freeze({
    SUBSCRIBE_BOOKING: "booking:subscribe",
    SUBSCRIBE_TOUR: "tour:subscribe",
    SUBSCRIBE_TRIP: "trip:subscribe",
    SUBSCRIBE_SUPPORT: "support:subscribe",
    UNSUBSCRIBE_BOOKING: "booking:unsubscribe",
    UNSUBSCRIBE_TOUR: "tour:unsubscribe",
    UNSUBSCRIBE_TRIP: "trip:unsubscribe",
    UNSUBSCRIBE_SUPPORT: "support:unsubscribe",
});

/** Resources a client may request subscriptions for. */
export const REALTIME_RESOURCES = Object.freeze(["booking", "tour", "trip", "support"]);

/** Standardized socket error codes surfaced to clients. */
export const REALTIME_ERROR_CODES = Object.freeze({
    UNAUTHORIZED: "REALTIME_UNAUTHORIZED",
    FORBIDDEN: "REALTIME_FORBIDDEN",
    INVALID_PAYLOAD: "REALTIME_INVALID_PAYLOAD",
    NOT_FOUND: "REALTIME_NOT_FOUND",
    RATE_LIMITED: "REALTIME_RATE_LIMITED",
    INTERNAL_ERROR: "REALTIME_INTERNAL_ERROR",
});

/** Standardized socket error shape: { code, message }. */
export function realtimeError(code, message) {
    return { code, message };
}

/**
 * Backend-authored toast payload attached to envelopes (opts.notify) or HTTP
 * responses (response.notify). Clients render it verbatim via trem-events —
 * copy, status and dedupeKey are always owned by the server.
 *
 * realtimeNotify("Enquiry received", "ENQ-ABC123 · Kashmir Escape", "success", "enquiry:ENQ-ABC123")
 */
export function realtimeNotify(title, subtitle = "", status = "info", dedupeKey = null) {
    if (!title || typeof title !== "string") {
        throw new TypeError("realtimeNotify requires a non-empty title string");
    }
    return {
        title,
        ...(subtitle ? { subtitle: String(subtitle) } : {}),
        status,
        ...(dedupeKey ? { dedupeKey } : {}),
    };
}
