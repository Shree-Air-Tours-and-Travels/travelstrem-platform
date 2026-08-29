import { allowedCustomerQuoteActions } from "./quote-builder/customerQuoteActions.mjs";
import { buildTravellerDetailsForm } from "./travellerDetailsService.mjs";

const OPERATOR_ROLES = new Set(["agent", "admin", "super_admin"]);

const baseLabels = (booking) => ({
  bookings: "Bookings",
  booking: booking.reference || "Booking",
  bookingJourney: "Booking journey",
  quote: "Quote",
});

const baseStructure = (booking) => ({
  contentLabelRef: "bookingJourney",
  breadcrumbs: [
    { labelRef: "bookings", path: "/bookings" },
    { labelRef: "booking", path: `/bookings/${booking.id}` },
  ],
  blocks: [],
  actions: [],
});

const quoteWorkspace = (booking) => ({
  data: { bookingId: booking.id, enquiryId: booking.enquiryId || booking.id },
  labels: baseLabels(booking),
  structure: {
    ...baseStructure(booking),
    breadcrumbs: [
      ...baseStructure(booking).breadcrumbs,
      { labelRef: "quote" },
    ],
    component: {
      type: "quote-builder",
      enquiryId: booking.enquiryId || booking.id,
    },
  },
});

const operatorJourney = (booking) => {
  return {
    data: { bookingId: booking.id, ...(booking.record ? { record: booking.record } : {}) },
    labels: {
      ...baseLabels(booking),
      operatorEyebrow: "Quote management",
      operatorTitle: booking.title || "Tour booking",
      operatorDescription: "Create and manage the traveller's quote from this booking.",
      manageQuote: "Create / edit quote",
    },
    structure: {
      ...baseStructure(booking),
      header: {
        eyebrowRef: "operatorEyebrow",
        titleRef: "operatorTitle",
        descriptionRef: "operatorDescription",
      },
      actions: [
        {
          id: "manage-quote",
          type: "navigate",
          labelRef: "manageQuote",
          icon: "itinerary",
          href: `/bookings/${booking.id}/quotebuilder`,
          page: quoteWorkspace(booking),
        },
      ],
    },
  };
};

const customerJourney = (booking, quote, requestedStep = "") => {
  const status = String(quote?.status || "").toUpperCase();
  const hasChangeRequest = Boolean(quote?.changeRequest?.requestedAt);
  const state = status === "CANCELLED" ? "cancelled"
    : hasChangeRequest ? "changes"
      : status === "ACCEPTED" ? "accepted"
        : status === "REJECTED" ? "rejected" : quote?.id ? "ready" : "pending";
  const states = {
    ready: ["Your quotation is ready", "Review the complete itemized quotation and choose what you would like to do.", "Quote received", "success"],
    accepted: ["Quotation accepted", "Your acceptance is saved. Your travel specialist can now continue the booking.", "Accepted", "success"],
    rejected: ["Quotation rejected", "Your response is saved. You can still request a revised quotation.", "Rejected", "danger"],
    changes: ["Changes requested", "Your travel specialist has received your request and will prepare an updated quotation.", "Update requested", "warning"],
    cancelled: ["Booking request cancelled", "This request is closed. The quotation remains available for your records.", "Cancelled", "danger"],
    pending: ["Your quotation is being prepared", "Your travel specialist will create your quotation here. You will receive the update automatically.", "In preparation", "info"],
  };
  const [stateTitle, stateDescription, stateBadge, stateTone] = states[state];
  const actionLabelRefs = {
    ACCEPT: "acceptQuote",
    REJECT: "rejectQuote",
    REQUEST_CHANGES: "requestChanges",
    CANCEL: "cancelBooking",
  };
  const quoteAccepted = status === "ACCEPTED";
  const travellerSaved = Boolean(booking.travellerDetails?.completedAt);
  const currentStepId = !quote?.id ? "enquiry" : !quoteAccepted ? "quote" : "travellers";
  const timelineSteps = [
    { id: "enquiry", labelRef: "enquiryStep", descriptionRef: "enquiryStepDescription", status: quote?.id ? "completed" : "current" },
    { id: "quote", labelRef: "quoteStep", descriptionRef: "quoteStepDescription", status: quoteAccepted ? "completed" : quote?.id ? "current" : "pending", disabled: !quote?.id },
    { id: "travellers", labelRef: "travellerStep", descriptionRef: travellerSaved ? "travellerSavedDescription" : "travellerStepDescription", status: quoteAccepted ? "current" : "pending", disabled: !quoteAccepted },
    { id: "review", labelRef: "reviewStep", descriptionRef: "reviewStepDescription", status: "pending", disabled: true },
  ];
  const requestedTimelineStep = timelineSteps.find((step) => step.id === requestedStep);
  const activeStepId = requestedTimelineStep && !requestedTimelineStep.disabled
    ? requestedTimelineStep.id
    : currentStepId;
  const travellerForm = activeStepId === "travellers" && quoteAccepted
    ? buildTravellerDetailsForm({
        count: booking.travellerCount,
        requiresPassport: booking.requiresPassport,
        saved: booking.travellerDetails,
      })
    : null;
  return {
  data: {
    bookingId: booking.id,
    enquiryId: booking.enquiryId || booking.id,
    ...(activeStepId === "enquiry" && booking.record ? { record: booking.record } : {}),
    ...(activeStepId === "quote" && quote ? { quote } : {}),
    ...(travellerForm ? { travellerForm } : {}),
  },
  labels: {
    ...baseLabels(booking),
    customerEyebrow: "Quote update",
    customerTitle: booking.title || "Tour booking",
    quoteStateTitle: stateTitle,
    quoteStateDescription: stateDescription,
    quoteStateBadge: stateBadge,
    live: "Live",
    connecting: "Connecting…",
    reconnecting: "Reconnecting…",
    offline: "Offline",
    connectionError: "Connection error",
    downloadQuote: "Download quote",
    acceptQuote: "Accept quote",
    rejectQuote: "Reject quote",
    requestChanges: "Request changes",
    cancelBooking: "Cancel booking",
    enquiryStep: "Enquiry",
    enquiryStepDescription: "Your submitted tour request and preferences.",
    quoteStep: "Quotation",
    quoteStepDescription: "Review the itemized quotation and accept, reject, or request changes.",
    travellerStep: "Traveller details",
    travellerStepDescription: "Add the traveller information required for reservations.",
    travellerSavedDescription: "Traveller details saved. Payment will unlock when a payment session is ready.",
    reviewStep: "Review & travel updates",
    reviewStepDescription: "Tickets, vouchers and brochures will appear here through live updates.",
    viewQuote: "View quotation",
    addTravellers: "Add traveller details",
    saveTravellers: "Save traveller details",
    proceedPayment: "Proceed to payment",
  },
  structure: {
    ...baseStructure(booking),
    header: { eyebrowRef: "customerEyebrow", titleRef: "customerTitle" },
    live: { resource: "booking", events: ["booking:quote-created", "booking:quote-updated"] },
    timeline: { currentStepId, activeStepId, steps: timelineSteps },
    actions: activeStepId === "quote" && quote?.id
      ? [
          {
            id: "download-quote",
            type: "download",
            labelRef: "downloadQuote",
            icon: "download",
            href: `/quotes/${quote.id}/pdf`,
          },
        ]
      : [],
    blocks: activeStepId === "enquiry" || activeStepId === "quote" || activeStepId === "review" ? [
      {
            id: quote?.id ? "quote-state" : "quote-pending",
            type: "notice",
            tone: stateTone,
            icon: "itinerary",
            titleRef: "quoteStateTitle",
            descriptionRef: "quoteStateDescription",
            badgeRef: "quoteStateBadge",
            badgeTone: stateTone,
            liveStatus: {
              labelRefs: {
                connected: "live",
                connecting: "connecting",
                reconnecting: "reconnecting",
                disconnected: "offline",
                error: "connectionError",
              },
            },
          },
      ...(activeStepId === "quote" && quote?.id ? [{
        id: "quote",
        type: "quote",
        dataPath: "quote",
        actions: allowedCustomerQuoteActions(status, hasChangeRequest).map((id) => ({ id, labelRef: actionLabelRefs[id] })),
      }] : []),
    ] : [],
  },
};
};

export function presentBookingJourney({ booking, quote = null, actor, pathname = "", step = "" }) {
  const role = String(actor?.role || "").toLowerCase();
  const isOperator = OPERATOR_ROLES.has(role);

  if (isOperator && pathname.endsWith("/quotebuilder")) return quoteWorkspace(booking);
  if (isOperator) return operatorJourney(booking);
  return customerJourney(booking, quote, step);
}

export default presentBookingJourney;
