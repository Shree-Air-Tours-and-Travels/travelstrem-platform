import { allowedCustomerQuoteActions } from "./quote-builder/customerQuoteActions.mjs";
import { buildTravellerDetailsForm } from "./travellerDetailsService.mjs";

const OPERATOR_ROLES = new Set(["agent", "admin", "super_admin"]);

const asReadOnlyForm = (form, collapseSections = false) => form ? ({
  ...form,
  config: {
    ...form.config,
    layout: { ...(form.config?.layout || {}), expandable: true },
    sections: (form.config?.sections || []).map((section) => ({
      ...section,
      ...(collapseSections ? { defaultExpanded: false } : {}),
      fields: (section.fields || []).map((field) => ({ ...field, disabled: true })),
    })),
  },
}) : null;

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
  const travellerDetailsSaved = Boolean(booking.travellerDetails?.completedAt);
  const awaitingTravellerDetails =
    ["trevista", "trevio"].includes(booking.product) &&
    !travellerDetailsSaved;
  return {
    data: { bookingId: booking.id, ...(booking.record ? { record: booking.record } : {}) },
    labels: {
      ...baseLabels(booking),
      operatorEyebrow: "Quote management",
      operatorTitle: booking.title || "Tour booking",
      operatorDescription: awaitingTravellerDetails
        ? "The traveller must complete their details and request a quotation before pricing begins."
        : "Create and manage the traveller's quote from this booking.",
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
          disabled: awaitingTravellerDetails,
        },
      ],
    },
  };
};

const customerJourney = (booking, quote, requestedStep = "") => {
  const isTrevio = booking.product === "trevio";
  const isFlight = booking.product === "trehub";
  const isHotel = isFlight && booking.journeyType === "hotel";
  const selectionName = isHotel ? "hotel" : "flight";
  const isCancelled = String(booking.status || "").toLowerCase() === "cancelled";
  const quoteRequestedWithoutQuote =
    String(booking.status || "").toLowerCase() === "quote_requested";
  const status = String(quote?.status || "").toUpperCase();
  const hasChangeRequest = Boolean(quote?.changeRequest?.requestedAt);
  const state = status === "CANCELLED" || isCancelled ? "cancelled"
    : hasChangeRequest ? "changes"
      : status === "ACCEPTED" ? "accepted"
        : status === "REJECTED" ? "rejected" : quote?.id ? "ready" : "pending";
  const states = {
    ready: ["Your quotation is ready", "Review the complete itemized quotation and choose what you would like to do.", "Quote received", "success"],
    accepted: ["Quotation accepted", "Download the accepted quote or continue to payment when the booking is ready.", "Accepted", "success"],
    rejected: ["Quotation rejected", "Your response is saved. You can still request a revised quotation.", "Rejected", "danger"],
    changes: ["Changes requested", "Your travel specialist has received your request and will prepare an updated quotation.", "Update requested", "warning"],
    cancelled: ["Booking request cancelled", isFlight ? `This ${selectionName} enquiry has been cancelled. You can return to search for updated availability.` : "This request is closed. The quotation remains available for your records.", "Cancelled", "danger"],
    pending: quoteRequestedWithoutQuote
      ? ["Your quotation is being prepared", "Your trip captain will price the selected package using every traveller's saved preferences.", "In preparation", "info"]
      : [
          isFlight ? `Your ${selectionName} enquiry has been created` : isTrevio ? "Your trip enquiry has been created" : "Your tour enquiry has been created",
          isFlight ? `Review the selected ${selectionName}, then continue to individual traveller information.` : "Complete the enquiry details to continue to individual traveller information.",
          "Enquiry created",
          "success",
        ],
  };
  const [stateTitle, stateDescription, stateBadge, stateTone] = states[state];
  const actionLabelRefs = {
    ACCEPT: "acceptQuote",
    REJECT: "rejectQuote",
    REQUEST_CHANGES: "requestChanges",
    CANCEL: "cancelBooking",
  };
  const decisionModalByAction = {
    ACCEPT: {
      titleRef: "acceptDecisionTitle",
      descriptionRef: "decisionDescription",
      confirmLabelRef: "confirmDecision",
      cancelLabelRef: "keepReviewing",
    },
    REJECT: {
      titleRef: "rejectDecisionTitle",
      descriptionRef: "decisionDescription",
      confirmLabelRef: "confirmDecision",
      cancelLabelRef: "keepReviewing",
      tone: "danger",
    },
    REQUEST_CHANGES: {
      titleRef: "changeDecisionTitle",
      descriptionRef: "changeDecisionDescription",
      confirmLabelRef: "sendChangeRequest",
      cancelLabelRef: "keepReviewing",
      field: {
        type: "textarea",
        labelRef: "changesRequired",
        maxLength: 1200,
        minLength: 5,
        rows: 4,
        required: true,
      },
    },
    CANCEL: {
      titleRef: "cancelDecisionTitle",
      descriptionRef: "decisionDescription",
      confirmLabelRef: "confirmDecision",
      cancelLabelRef: "keepReviewing",
      tone: "danger",
    },
  };
  const quoteAccepted = status === "ACCEPTED";
  const quoteVersion = Number(quote?.version || 1);
  const travellerSaved = Boolean(booking.travellerDetails?.completedAt);
  const enquiryCreated = isFlight || String(booking.status || "").toLowerCase() !== "new";
  const quotationRequested = Boolean(quote?.id) || ["quote_requested", "quote_sent", "accepted", "rejected", "change_requested"].includes(String(booking.status || "").toLowerCase());
  const canRequestQuotation = !isFlight && travellerSaved && !quotationRequested;
  const enquiryEditable = !quotationRequested && !isFlight;
  const travellerEditable = !quotationRequested && !isCancelled;
  const currentStepId = isFlight
    ? travellerSaved ? "review" : "enquiry"
    : !enquiryCreated
    ? "enquiry"
    : !travellerSaved || !quotationRequested
      ? "travellers"
      : !quoteAccepted ? "quote" : "payment";
  const flightStepOrder = ["enquiry", "travellers", "review", "payment"];
  const currentFlightStepIndex = flightStepOrder.indexOf(currentStepId);
  const flightStepStatus = (id) => {
    const index = flightStepOrder.indexOf(id);
    return index < currentFlightStepIndex ? "completed" : index === currentFlightStepIndex ? "current" : "pending";
  };
  let timelineSteps = isFlight ? [
    { id: "enquiry", labelRef: "enquiryStep", descriptionRef: "enquiryStepDescription", status: flightStepStatus("enquiry") },
    { id: "travellers", labelRef: "travellerStep", descriptionRef: travellerSaved ? "travellerSavedDescription" : "travellerStepDescription", status: flightStepStatus("travellers"), disabled: isCancelled },
    { id: "review", labelRef: "reviewStep", descriptionRef: "reviewStepDescription", status: flightStepStatus("review"), disabled: isCancelled || !travellerSaved },
    { id: "payment", labelRef: "paymentStep", descriptionRef: "paymentStepDescription", status: "pending", disabled: true },
  ] : [
    { id: "enquiry", labelRef: "enquiryStep", descriptionRef: "enquiryStepDescription", status: enquiryCreated ? "completed" : "current" },
    { id: "travellers", labelRef: "travellerStep", descriptionRef: travellerSaved ? "travellerSavedDescription" : "travellerStepDescription", status: enquiryCreated ? quotationRequested ? "completed" : "current" : "pending", disabled: !enquiryCreated },
    { id: "quote", labelRef: "quoteStep", descriptionRef: "quoteStepDescription", status: quoteAccepted ? "completed" : quotationRequested ? "current" : "pending", disabled: !quotationRequested },
    { id: "payment", labelRef: "paymentStep", descriptionRef: "paymentStepDescription", status: quoteAccepted ? "current" : "pending", disabled: !quoteAccepted },
  ];
  const requestedTimelineStep = timelineSteps.find((step) => step.id === requestedStep);
  const activeStepId = requestedTimelineStep && !requestedTimelineStep.disabled
    ? requestedTimelineStep.id
    : currentStepId;
  if (isFlight) {
    const selectedIndex = flightStepOrder.indexOf(activeStepId);
    timelineSteps = timelineSteps.map((item, index) => ({
      ...item,
      status: index < selectedIndex ? "completed" : index === selectedIndex ? "current" : "pending",
    }));
  }
  const activeStepIndex = timelineSteps.findIndex((step) => step.id === activeStepId);
  const previousStep = timelineSteps
    .slice(0, Math.max(0, activeStepIndex))
    .reverse()
    .find((step) => !step.disabled);
  const travellerStepActions = isCancelled ? [] : activeStepId === "review" && isFlight
    ? [{ id: "proceed-payment", type: "status", labelRef: "proceedPayment", variant: "primary", align: "right", disabled: true }]
    : activeStepId === "travellers"
    ? [
        ...(isFlight && travellerSaved ? [{
          id: "book-flight",
          type: "navigate-step",
          targetStepId: "review",
          labelRef: "bookNow",
          variant: "primary",
          align: "right",
        }] : quotationRequested ? [{
          id: "view-quotation-status",
          type: "navigate-step",
          targetStepId: "quote",
          labelRef: "viewQuotationStatus",
          variant: "primary",
          align: "right",
        }] : canRequestQuotation ? [{
          id: "request-quotation",
          type: "request-quotation",
          labelRef: "requestQuotation",
          variant: "primary",
          align: "right",
        }] : travellerEditable ? [{
          id: "save-travellers",
          type: "save-travellers",
          labelRef: "saveTravellers",
          variant: "primary",
          align: "right",
        }] : [{
          id: "complete-travellers-for-quotation",
          type: "status",
          labelRef: "completeTravellersForQuotation",
          variant: "primary",
          align: "right",
          disabled: true,
        }]),
      ]
    : [];
  const travellerForm = activeStepId === "travellers"
    ? buildTravellerDetailsForm({
        count: booking.travellerCount,
        requiresPassport: booking.requiresPassport,
        product: booking.product,
        optionSets: booking.travellerOptionSets,
        typeCounts: booking.travellerTypeCounts,
        saved: booking.travellerDetails,
      })
    : null;
  const pendingTravellerForm = (activeStepId === "quote" && !quote?.id || activeStepId === "review" && isFlight)
    ? buildTravellerDetailsForm({
        count: booking.travellerCount,
        requiresPassport: booking.requiresPassport,
        product: booking.product,
        optionSets: booking.travellerOptionSets,
        typeCounts: booking.travellerTypeCounts,
        saved: booking.travellerDetails,
      })
    : null;
  return {
  data: {
    bookingId: booking.id,
    enquiryId: booking.enquiryId || booking.id,
    ...(activeStepId === "enquiry" && booking.record ? { record: booking.record } : {}),
    ...(activeStepId === "enquiry" && booking.enquiryDetailsForm
      ? { enquiryForm: enquiryEditable ? booking.enquiryDetailsForm : asReadOnlyForm(booking.enquiryDetailsForm) }
      : {}),
    ...(activeStepId === "quote" && quote ? { quote } : {}),
    ...(travellerForm ? { travellerForm: travellerEditable ? travellerForm : asReadOnlyForm(travellerForm, true) } : {}),
    ...((activeStepId === "quote" && !quote?.id || activeStepId === "review" && isFlight) && booking.enquiryDetailsForm
      ? { enquirySummaryForm: asReadOnlyForm(booking.enquiryDetailsForm) }
      : {}),
    ...((pendingTravellerForm || activeStepId === "review" && isFlight && booking.travellerDetails)
      ? { travellerSummaryForm: asReadOnlyForm(pendingTravellerForm, true) }
      : {}),
    product: booking.product || "trevista",
    canRequestQuotation,
    canEditEnquiry: enquiryEditable,
    canEditTravellers: travellerEditable,
    quotationRequested,
    paymentEnabled: !isFlight && quoteAccepted && travellerSaved && Boolean(booking.paymentUrl),
    paymentUrl: !isFlight && quoteAccepted ? booking.paymentUrl || "" : "",
  },
  labels: {
    ...baseLabels(booking),
    customerEyebrow: isHotel ? "Hotel booking" : isFlight ? "Flight booking" : isTrevio ? "Trip enquiry" : "Quote update",
    customerTitle: booking.title || (isHotel ? "Hotel booking" : isFlight ? "Flight booking" : "Tour booking"),
    quoteStateTitle: isFlight && activeStepId === "review" ? `Review your ${selectionName} booking` : stateTitle,
    quoteStateDescription: isFlight && activeStepId === "review"
      ? `Check the selected ${selectionName}, price and every traveller before payment becomes available.`
      : stateDescription,
    quoteStateBadge: isFlight && activeStepId === "review" ? "Ready for review" : stateBadge,
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
    acceptDecisionTitle: "Accept this quotation?",
    rejectDecisionTitle: "Reject this quotation?",
    changeDecisionTitle: "What should we change?",
    cancelDecisionTitle: "Cancel this booking request?",
    decisionDescription: "This response will be shared with your travel specialist immediately.",
    changeDecisionDescription:
      "Describe the exact hotel, room, flight, activity, date, or price change you need.",
    changesRequired: "Changes required",
    keepReviewing: "Keep reviewing",
    confirmDecision: "Confirm",
    sendChangeRequest: "Send change request",
    savingDecision: "Saving…",
    enquiryStep: "Enquiry",
    enquiryStepDescription: isFlight ? `Review the selected ${selectionName}, price and traveller count.` : isTrevio ? "Choose your fixed departure and trip preferences." : "Choose your tour package, dates and preferences.",
    quoteStep: "Quotation",
    quoteStepDescription: quoteAccepted ? "Review your accepted quotation." : "Review the itemized quotation and accept, reject, or request changes.",
    travellerStep: "Traveller details",
    travellerStepDescription: isFlight ? "Add the identity and travel-document details required to book every traveller." : isTrevio ? "Add identity, meal, drink, room-sharing and insurance preferences for every traveller." : "Add identity and reservation details for every traveller.",
    travellerSavedDescription: isFlight ? "Traveller details saved. Continue to review the booking." : isTrevio ? "Traveller details saved. Ask your trip captain for an accurate quotation when ready." : "Traveller details saved. Ask your travel specialist for an accurate quotation when ready.",
    requestQuotation: "Ask for quotation",
    quotationRequested: "Quotation requested",
    paymentStep: "Payment",
    paymentStepDescription: isFlight ? "Payment will be enabled after the booking review is confirmed." : "Proceed to payment after accepting the final quotation.",
    reviewStep: "Review & travel updates",
    reviewStepDescription: isFlight ? `Review the selected ${selectionName}, price and traveller information.` : "Tickets, vouchers and brochures will appear here through live updates.",
    viewQuote: "View quotation",
    viewQuotationStatus: "View quotation status",
    addTravellers: "Add traveller details",
    continueTravellerDetails: "Continue to traveller details",
    saveEnquiryDetails: "Save and continue",
    saveTravellers: "Save traveller details",
    completeTravellersForQuotation: "Save details to request quotation",
    backToPreviousStep: "Back",
    proceedPayment: "Proceed to payment",
    bookNow: "Book now",
    backToFlights: isHotel ? "Back to hotels" : "Back to flights",
    cancelFlightEnquiry: "Cancel enquiry",
    cancelFlightTitle: `Cancel this ${selectionName} enquiry?`,
    cancelFlightDescription: `The enquiry will be closed. Your ${selectionName} search will stay filled so you can review updated results.`,
    confirmCancellation: "Cancel enquiry",
    keepFlightEnquiry: "Keep enquiry",
    paymentPending: "Payment session pending",
  },
  structure: {
    ...baseStructure(booking),
    header: { eyebrowRef: "customerEyebrow", titleRef: "customerTitle" },
    live: { resource: "booking", events: ["booking:quote-created", "booking:quote-updated"] },
    timeline: { currentStepId, activeStepId, steps: timelineSteps },
    navigation: previousStep ? {
      previous: {
        id: "previous-step",
        type: "navigate-step",
        targetStepId: previousStep.id,
        labelRef: "backToPreviousStep",
        iconLeft: "chevronLeft",
        variant: "outline",
        align: "left",
      },
    } : {},
    stepActions: travellerStepActions,
    contextActions: isFlight ? [
      {
        id: "back-to-flights",
        type: "navigate",
        labelRef: "backToFlights",
        iconLeft: "chevronLeft",
        variant: "outline",
        align: "left",
        href: booking.flightSearchUrl || "/trehub/flights",
      },
      ...(!isCancelled ? [{
        id: "cancel-flight-enquiry",
        type: "cancel-enquiry",
        labelRef: "cancelFlightEnquiry",
        variant: "text",
        color: "danger",
        align: "left",
        modal: {
          titleRef: "cancelFlightTitle",
          descriptionRef: "cancelFlightDescription",
          confirmLabelRef: "confirmCancellation",
          cancelLabelRef: "keepFlightEnquiry",
          tone: "danger",
        },
      }] : []),
    ] : [],
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
    blocks: activeStepId === "enquiry" || activeStepId === "quote" || activeStepId === "review" || activeStepId === "payment" ? [
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
        actions: allowedCustomerQuoteActions(status, hasChangeRequest, quoteVersion).map((id) => ({
          id,
          labelRef: actionLabelRefs[id],
          modal: decisionModalByAction[id],
        })),
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
