/**
 * TravelsTREM realtime module.
 *
 * Business modules should import ONLY from here:
 *   import { RealtimeService } from "../realtime/index.js";
 *
 * The gateway itself is attached by bootstrap/server.js.
 */
export {
    REALTIME_EVENTS,
    REALTIME_COMMANDS,
    REALTIME_RESOURCES,
    REALTIME_ERROR_CODES,
    REALTIME_ENVELOPE_VERSION,
    room,
    realtimeError,
    realtimeNotify,
} from "./realtime.constants.js";
export { realtimeConfig } from "./realtime.config.js";
export { attachRealtime } from "./realtime.gateway.js";
export {
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
    publishToCatalog,
    publishFanOut,
    isRealtimeActive,
} from "./realtime.publisher.js";
export * as RealtimeDto from "./realtime.dto.js";
export {
    bookingPaymentDto,
    bookingQuoteDto,
    enquiryDto,
    tourDto,
    departureAvailabilityDto,
    tripDto,
    notificationDto,
    supportTicketDto,
    supportMessageDto,
} from "./realtime.dto.js";
export { authorizeSubscription } from "./realtime.subscriptions.js";
export { authenticateHandshake } from "./realtime.auth.js";
export { getUserConnectionCount } from "./realtime.connection-manager.js";

import * as publisher from "./realtime.publisher.js";
import * as dto from "./realtime.dto.js";

/** Facade consumed by business services/controllers. */
export const RealtimeService = Object.freeze({
    ...publisher,
    dto,
});
