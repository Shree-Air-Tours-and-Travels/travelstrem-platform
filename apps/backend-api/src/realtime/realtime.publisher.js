import { randomUUID } from "crypto";
import { REALTIME_ENVELOPE_VERSION, room } from "./realtime.constants.js";

/**
 * The realtime publisher is the ONLY way business modules emit realtime
 * events. It holds the Socket.IO server instance (set once by the gateway at
 * boot) so business modules never import the gateway — this also keeps the
 * dependency graph free of cycles:
 *
 *   business modules -> realtime.publisher -> socket.io (io)
 *   bootstrap/server.js -> realtime.gateway -> setRealtimeServer(io)
 */

let ioInstance = null;

export function setRealtimeServer(io) {
    ioInstance = io;
}

export function isRealtimeActive() {
    return Boolean(ioInstance);
}

export function getRealtimeServer() {
    return ioInstance;
}

/** Standard backend-generated event envelope. */
function buildEnvelope(event, data, metadata = {}, notify = null) {
    return {
        eventId: randomUUID(),
        event,
        timestamp: new Date().toISOString(),
        version: REALTIME_ENVELOPE_VERSION,
        data,
        ...(Object.keys(metadata).length ? { metadata } : {}),
        ...(notify && typeof notify === "object" && notify.title ? { notify } : {}),
    };
}

function normalizeRooms(rooms) {
    const list = (Array.isArray(rooms) ? rooms : [rooms]).filter(Boolean);
    return [...new Set(list)];
}

/**
 * Publish an envelope to explicit rooms. Safe DTOs only — never raw models.
 * opts.correlationId propagates request/correlation ids when provided.
 * opts.notify carries the backend-authored toast payload rendered by clients.
 */
export async function publish(targetRooms, event, data, { correlationId, notify } = {}) {
    if (!ioInstance || !event || data === undefined || data === null) return false;
    const rooms = normalizeRooms(targetRooms);
    if (rooms.length === 0) return false;
    try {
        ioInstance
            .to(rooms)
            .emit(event, buildEnvelope(event, data, correlationId ? { correlationId } : {}, notify));
        return true;
    } catch {
        // Realtime is best-effort. A missing/stopping adapter must never fail
        // the HTTP transaction that already persisted the business record.
        return false;
    }
}

const publishToRoom = (roomValue) => (id, event, data, opts) =>
    publish(roomValue(id), event, data, opts);

export const publishToUser = (userId, ...rest) => publishToRoom(room.user)(userId, ...rest);
export const publishToAgency = (agencyId, ...rest) => publishToRoom(room.agency)(agencyId, ...rest);
export const publishToAdmins = (...rest) => publish(room.admin(), ...rest);
export const publishToBooking = (bookingId, ...rest) =>
    publishToRoom(room.booking)(bookingId, ...rest);
export const publishToPayment = (paymentId, ...rest) =>
    publishToRoom(room.payment)(paymentId, ...rest);
export const publishToQuote = (quoteId, ...rest) => publishToRoom(room.quote)(quoteId, ...rest);
export const publishToTour = (tourId, ...rest) => publishToRoom(room.tour)(tourId, ...rest);
export const publishToTrip = (tripId, ...rest) => publishToRoom(room.trip)(tripId, ...rest);
export const publishToSupportTicket = (ticketId, ...rest) =>
    publishToRoom(room.support)(ticketId, ...rest);
/** Broadcast to every connected socket via the shared catalog room. */
export const publishToCatalog = (...rest) => publish(room.catalog(), ...rest);

/**
 * Fan out to a customer + agency + admins at once. Common shape for
 * checkout/booking flows where all three audiences care about a state change.
 */
export function publishFanOut(
    { userId = null, agencyId = null, includeAdmins = true },
    event,
    data,
    opts = {},
) {
    const rooms = [
        userId ? room.user(userId) : null,
        agencyId ? room.agency(agencyId) : null,
        includeAdmins && !opts.skipAdmins ? room.admin() : null,
    ];
    return publish(rooms, event, data, opts);
}

export default {
    setRealtimeServer,
    isRealtimeActive,
    getRealtimeServer,
    publish,
    publishToUser,
    publishToAgency,
    publishToAdmins,
    publishToBooking,
    publishToPayment,
    publishToQuote,
    publishToTour,
    publishToTrip,
    publishToSupportTicket,
    publishFanOut,
};
