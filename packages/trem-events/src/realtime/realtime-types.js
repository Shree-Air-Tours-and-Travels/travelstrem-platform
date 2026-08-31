/**
 * Shared realtime event vocabulary for TravelsTREM frontends.
 * Mirrors apps/backend-api/src/realtime/realtime.constants.js — the backend
 * remains the single source of truth for what is emitted and who may see it.
 */

export const REALTIME_EVENTS = Object.freeze({
  SYSTEM_CONNECTED: "system:connected",

  BOOKING_QUOTE_CREATED: "booking:quote-created",
  BOOKING_QUOTE_UPDATED: "booking:quote-updated",

  ENQUIRY_CREATED: "enquiry:created",
  ENQUIRY_CLAIMED: "enquiry:claimed",
  ENQUIRY_UPDATED: "enquiry:updated",

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

  PRODUCT_CATALOG_UPDATED: "product-catalog:updated",

  NOTIFICATION_CREATED: "notification:created",

  SUPPORT_TICKET_CREATED: "support:ticket-created",
  SUPPORT_MESSAGE_CREATED: "support:message-created",
  SUPPORT_CONVERSATION_UPDATED: "support:conversation-updated",

  ADMIN_BOOKING_QUOTE_CREATED: "admin:booking-quote-created",
  ADMIN_SUPPORT_REQUEST_CREATED: "admin:support-request-created",
});

/**
 * Resources a client may request subscriptions for. The backend still
 * authorizes every request; these names map to backend commands
 * (e.g. booking:subscribe).
 */
export const REALTIME_RESOURCES = Object.freeze(["booking", "tour", "trip", "support"]);

/** @typedef {"connecting"|"connected"|"reconnecting"|"disconnected"|"error"} RealtimeConnectionStatus */

export const CONNECTION_STATUS = Object.freeze({
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTED: "disconnected",
  ERROR: "error",
});

/**
 * Standard backend event envelope:
 * { eventId, event, timestamp, version, data, metadata? }
 *
 * @typedef {Object} RealtimeEvent
 * @property {string} eventId
 * @property {string} event
 * @property {string} timestamp
 * @property {number} version
 * @property {*} data
 * @property {{correlationId?: string, version?: number}=} metadata
 */

/**
 * Standardized socket error:
 * { code, message }
 *
 * @typedef {Object} RealtimeError
 * @property {"REALTIME_UNAUTHORIZED"|"REALTIME_FORBIDDEN"|"REALTIME_INVALID_PAYLOAD"|"REALTIME_NOT_FOUND"|"REALTIME_RATE_LIMITED"|"REALTIME_INTERNAL_ERROR"} code
 * @property {string} message
 */
