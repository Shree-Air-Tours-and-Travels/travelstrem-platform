import config from "../../config/index.js";
import {
  SUPPORT_ACTION_TYPE,
  SUPPORT_CONTACT_AVAILABILITY,
  SUPPORT_CONTACT_TYPE,
  SUPPORT_TICKET_PRIORITY,
} from "@packages/trem-support-contracts";

const routeAction = (target) => ({ type: SUPPORT_ACTION_TYPE.NAVIGATE, target });

export const SUPPORT_UI = Object.freeze({
  header: {
    title: "Help & Support",
    subtitle: "Get quick help for your trips, tours and bookings.",
    searchPlaceholder: "Search for help, bookings, refunds...",
  },
  sections: {
    bookings: { title: "Get help with a booking" },
    services: { title: "Choose a service" },
    topics: { title: "Popular help topics" },
    contact: { title: "Need urgent help?" },
  },
  emptyStates: {
    bookings: { icon: "calendar", title: "No bookings need support", description: "Your eligible bookings will appear here." },
    tickets: { icon: "support", title: "No support requests", description: "Requests you create will appear here." },
    search: { icon: "search", title: "No help found", description: "Try another search or contact support." },
    articles: { icon: "document", title: "No articles available", description: "Support content for this topic is being prepared." },
    contacts: { icon: "support", title: "No contact options available", description: "Create a support request and the team will follow up." },
  },
});

export const SUPPORT_SERVICES = Object.freeze({
  trevio: {
    id: "trevio",
    hide: true,
    name: "Trevio",
    description: "Trips & Adventures",
    icon: "mountain",
    tone: "primary",
    pageTitle: "Trevio support",
    pageDescription: "Help for your trips and adventures.",
    categoryIds: ["booking-issue", "trip-details", "traveller-changes", "cancellation", "refund", "payment", "emergency"],
  },
  trevista: {
    id: "trevista",
    name: "Trevista",
    description: "Tours & Packages",
    icon: "globe",
    tone: "secondary",
    pageTitle: "Trevista support",
    pageDescription: "Help for your tours and packages.",
    categoryIds: ["booking-issue", "itinerary", "traveller-changes", "reschedule", "cancellation", "refund", "payment", "provider"],
  },
  trehub: {
    id: "trehub",
    hide: true,
    name: "TreHub",
    description: "Flights, Hotels & Transport",
    icon: "plane",
    tone: "tertiary",
    pageTitle: "TreHub support",
    pageDescription: "Help for flights, stays and transport.",
    categoryIds: ["booking-issue", "booking-changes", "cancellation", "refund", "payment"],
  },
  trecare: {
    id: "trecare",
    hide: true,
    name: "TreCare",
    description: "Visa, Insurance & Documents",
    icon: "passport",
    tone: "neutral",
    pageTitle: "TreCare support",
    pageDescription: "Help for visas, insurance and travel documents.",
    categoryIds: ["documents", "booking-issue", "payment", "report-issue"],
  },
});

export const SUPPORT_CATEGORIES = Object.freeze([
  { id: "booking-issue", type: "BOOKING_ISSUE", label: "Booking issue", icon: "support", description: "Get help with a booking problem." },
  { id: "trip-details", type: "TRIP_DETAILS", label: "Trip details", icon: "map", description: "Meeting, coordination and trip information." },
  { id: "itinerary", type: "ITINERARY", label: "Itinerary", icon: "route", description: "Questions about your itinerary." },
  { id: "traveller-changes", type: "TRAVELLER_CHANGES", label: "Traveller changes", icon: "user", description: "Request a change to traveller details." },
  { id: "booking-changes", type: "BOOKING_CHANGES", label: "Booking changes", icon: "calendar", description: "Change an existing reservation." },
  { id: "reschedule", type: "RESCHEDULE", label: "Reschedule", icon: "calendar", description: "Review available reschedule options." },
  { id: "cancellation", type: "CANCELLATION", label: "Cancellation", icon: "x", description: "Review cancellation eligibility and impact." },
  { id: "refund", type: "REFUND", label: "Refund", icon: "payment", description: "Review refund eligibility and status." },
  { id: "payment", type: "PAYMENT", label: "Payments", icon: "payment", description: "Get help with a payment." },
  { id: "documents", type: "DOCUMENTS", label: "Documents", icon: "document", description: "Get help with travel documents." },
  { id: "provider", type: "PROVIDER", label: "Travel provider", icon: "building", description: "Contact or report a provider issue." },
  { id: "report-issue", type: "REPORT_ISSUE", label: "Report an issue", icon: "alert", description: "Tell the support team what went wrong." },
  { id: "emergency", type: "EMERGENCY", label: "Emergency help", icon: "alert", tone: "danger", priority: SUPPORT_TICKET_PRIORITY.URGENT, description: "Urgent help for an active eligible booking." },
]);

export const SUPPORT_TOPICS = Object.freeze([
  { id: "payments-refunds", type: "PAYMENTS_REFUNDS", title: "Payments & refunds", description: "Payment, refund and charge support.", icon: "payment", action: routeAction("/help/topic/payments-refunds"), categoryIds: ["payment", "refund"] },
  { id: "booking-changes", type: "BOOKING_CHANGES", title: "Booking changes", description: "Traveller, date and booking changes.", icon: "calendar", action: routeAction("/help/topic/booking-changes"), categoryIds: ["traveller-changes", "booking-changes", "reschedule", "cancellation"] },
  { id: "documents-visa", type: "DOCUMENTS_VISA", title: "Documents & visa help", description: "Support with documents and visas.", icon: "document", action: routeAction("/help/topic/documents-visa"), categoryIds: ["documents"] },
  { id: "report-issue", type: "REPORT_ISSUE", title: "Report an issue", description: "Create a support request.", icon: "alert", action: routeAction("/help/new-request?category=report-issue"), categoryIds: ["report-issue"] },
  { id: "contact-support", type: "CONTACT_SUPPORT", title: "Contact support", description: "See available ways to reach the team.", icon: "support", action: routeAction("/help/contact"), categoryIds: [] },
]);

// Article records can move to a CMS without changing the API contract. Empty is
// intentional: the client renders the backend-provided empty state, never fake copy.
export const SUPPORT_ARTICLES = Object.freeze([]);

export const PLATFORM_CONTACT_OPTIONS = Object.freeze([
  ...(config.SUPPORT_PHONE ? [{
    id: "platform-call",
    type: SUPPORT_CONTACT_TYPE.CALL,
    label: "Call TravelsTREM support",
    description: "Call the configured support line.",
    availability: SUPPORT_CONTACT_AVAILABILITY.AVAILABLE,
    icon: "phoneCall",
    action: { type: SUPPORT_ACTION_TYPE.CONTACT, target: `tel:${String(config.SUPPORT_PHONE).replace(/[^+\d]/g, "")}` },
    metadata: {},
  }] : []),
  ...(config.SUPPORT_EMAIL ? [{
    id: "platform-email",
    type: SUPPORT_CONTACT_TYPE.EMAIL,
    label: "Email TravelsTREM support",
    description: "Open your email app to contact the configured support inbox.",
    availability: SUPPORT_CONTACT_AVAILABILITY.AVAILABLE,
    icon: "support",
    action: { type: SUPPORT_ACTION_TYPE.CONTACT, target: `mailto:${config.SUPPORT_EMAIL}` },
    metadata: {},
  }] : []),
  {
    id: "platform-request",
    type: SUPPORT_CONTACT_TYPE.CALLBACK,
    label: "Send a support request",
    description: "Send a support request and receive updates by email.",
    availability: SUPPORT_CONTACT_AVAILABILITY.AVAILABLE,
    icon: "support",
    action: { type: SUPPORT_ACTION_TYPE.CREATE_TICKET, target: "/help/new-request" },
    metadata: { channel: "ticket" },
  },
]);

export const SUPPORT_ELIGIBILITY_CONFIG = Object.freeze({
  recentlyCompletedDays: Number(config.SUPPORT_RECENTLY_COMPLETED_DAYS || 30),
  activeEmergencyWindowHours: Number(config.SUPPORT_EMERGENCY_WINDOW_HOURS || 24),
  cancellationExecution: "REQUEST",
  refundExecution: "REQUEST",
  rescheduleExecution: "REQUEST",
});

export const categoryById = (id) => SUPPORT_CATEGORIES.find((item) => item.id === id) || null;
export const topicById = (id) => SUPPORT_TOPICS.find((item) => item.id === id) || null;
export const serviceById = (id) => SUPPORT_SERVICES[String(id || "").toLowerCase()] || null;
