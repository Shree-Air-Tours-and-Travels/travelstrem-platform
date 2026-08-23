import useResourceRealtime from "./useResourceRealtime.js";
import { useRealtimeEvent } from "./useRealtimeEvent.js";
import { REALTIME_EVENTS } from "./realtime-types.js";

/** Live updates for one booking (payments, status transitions). */
export const useBookingRealtime = (bookingId) => useResourceRealtime("booking", bookingId);

/** Live updates for one tour catalog entry (price/availability changes). */
export const useTourRealtime = (tourId) => useResourceRealtime("tour", tourId);

/** Live updates for one Trevio trip. */
export const useTripRealtime = (tripId) => useResourceRealtime("trip", tripId);

/** Live updates for one support ticket conversation. */
export const useSupportRealtime = (ticketId) => useResourceRealtime("support", ticketId);

/**
 * Enquiry inbox updates. New and claimed enquiries are routed through the
 * caller's identity rooms (user / agency / admin), which every socket joins
 * automatically at connect — so this is event-only, no subscription needed.
 * Fires for both operators (admin/partner dashboards) and customers.
 *
 * useEnquiryRealtime((envelope) => reloadInbox());
 */
export const useEnquiryRealtime = (handler) => {
  useRealtimeEvent(REALTIME_EVENTS.ENQUIRY_CREATED, handler);
  useRealtimeEvent(REALTIME_EVENTS.ENQUIRY_CLAIMED, handler);
};

/**
 * Tour catalog feed for listing pages. tour:published is broadcast by the
 * backend to the shared catalog room (joined automatically at connect), so
 * every open listing refreshes the moment a new tour goes live — no reload.
 * Draft edits intentionally do not fire this; only publish transitions do.
 *
 * useTourCatalogRealtime(() => refetchListing());
 */
export const useTourCatalogRealtime = (handler) => {
  useRealtimeEvent(REALTIME_EVENTS.TOUR_PUBLISHED, handler);
};
