import config from "../../config/index.js";
import {
    SUPPORT_ACTION_TYPE,
    SUPPORT_CONTACT_AVAILABILITY,
    SUPPORT_CONTACT_TYPE,
} from "@packages/trem-support-contracts";

const routeAction = (target) => ({ type: SUPPORT_ACTION_TYPE.NAVIGATE, target });

export const SUPPORT_UI = Object.freeze({
    header: {
        title: "Help & Support",
        subtitle: "Get quick help for your trips, tours, and account.",
        searchPlaceholder: "Search for help and travel information...",
        searchingLabel: "Searching…",
    },
    sections: {
        options: { title: "What do you need help with?" },
        contact: { title: "Contact support directly" },
    },
    actions: {
        requests: "My requests",
        newRequest: "Create request",
    },
    requestForm: {
        title: "Create support request",
        subtitle: "Share the issue once and track every reply in My requests.",
        categoryLabel: "Issue category",
        categoryPlaceholder: "Choose a category",
        subjectLabel: "Subject",
        subjectPlaceholder: "Briefly describe the issue",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Include the details the support team needs to help.",
        submitLabel: "Send request",
        submittingLabel: "Sending…",
        successTitle: "Request received",
        successSubtitle: "The support team will respond in your request history.",
        successMessage: "Your support request has been created.",
        viewRequestLabel: "View request",
        backLabel: "Back to Help & Support",
    },
    requestList: {
        title: "My Support Requests",
        subtitle: "Track requests and replies from the support team.",
        newRequestLabel: "Create request",
        allLabel: "All",
        updatedPrefix: "Updated",
    },
    ticketDetail: {
        fallbackTitle: "Support request",
        statusLabel: "Status",
        categoryLabel: "Category",
        createdLabel: "Created",
        conversationTitle: "Conversation",
        replyLabel: "Reply",
        replyPlaceholder: "Write a reply",
        sendLabel: "Send reply",
        sendingLabel: "Sending…",
        closedMessage: "This request no longer accepts replies.",
    },
    supportDesk: {
        title: "Support desk",
        subtitle: "Review and respond to customer and partner support requests.",
        searchPlaceholder: "Search by reference or subject",
        allRequestersLabel: "All requesters",
        customerLabel: "Customers",
        agentLabel: "Partners and agents",
        emptyTitle: "No support requests",
        emptyDescription: "New customer and partner requests will appear here.",
        selectTitle: "Select a support request",
        selectDescription: "Choose a request to view its conversation and respond.",
        replyLabel: "Reply as TravelsTREM support",
        replyPlaceholder: "Write a helpful response",
        sendLabel: "Send response",
        sendingLabel: "Sending…",
        emailOptionLabel: "Also email this reply to the requester",
        statusLabel: "Status",
        requesterLabel: "Requester",
        categoryLabel: "Category",
        assignedLabel: "Assigned admin",
    },
    emptyStates: {
        tickets: {
            icon: "support",
            title: "No support requests",
            description: "Requests you create will appear here.",
        },
        search: {
            icon: "search",
            title: "No help found",
            description: "Try another search or contact support.",
        },
        articles: {
            icon: "document",
            title: "No articles available",
            description: "Support content for this topic is being prepared.",
        },
        contacts: {
            icon: "support",
            title: "No contact options available",
            description: "Create a support request and the team will follow up.",
        },
        categories: {
            icon: "support",
            title: "No support options available",
            description: "Support categories are being prepared. Try again later.",
        },
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
        categoryIds: ["trip-details", "report-issue"],
    },
    trevista: {
        id: "trevista",
        name: "Trevista",
        description: "Tours & Packages",
        icon: "globe",
        tone: "secondary",
        pageTitle: "Trevista support",
        pageDescription: "Help for your tours and packages.",
        categoryIds: ["itinerary", "provider", "report-issue"],
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
        categoryIds: ["provider", "report-issue"],
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
        categoryIds: ["documents", "report-issue"],
    },
});

export const SUPPORT_CATEGORIES = Object.freeze([
    {
        id: "trip-details",
        type: "TRIP_DETAILS",
        label: "Trip details",
        icon: "map",
        description: "Meeting, coordination and trip information.",
    },
    {
        id: "itinerary",
        type: "ITINERARY",
        label: "Itinerary",
        icon: "route",
        description: "Questions about your itinerary.",
    },
    {
        id: "documents",
        type: "DOCUMENTS",
        label: "Documents",
        icon: "document",
        description: "Get help with travel documents.",
    },
    {
        id: "provider",
        type: "PROVIDER",
        label: "Travel provider",
        icon: "building",
        description: "Contact or report a provider issue.",
    },
    {
        id: "report-issue",
        type: "REPORT_ISSUE",
        label: "Report an issue",
        icon: "alert",
        description: "Tell the support team what went wrong.",
    },
]);

export const AGENT_SUPPORT_CATEGORIES = Object.freeze([
    {
        id: "agency-workspace",
        type: "AGENCY_WORKSPACE",
        label: "Agency workspace",
        icon: "building2",
        description: "Team, agency profile, permissions, or workspace issues.",
    },
    {
        id: "product-publishing",
        type: "PRODUCT_PUBLISHING",
        label: "Products and publishing",
        icon: "briefcaseBusiness",
        description: "Tour, trip, pricing, publishing, or inventory issues.",
    },
    {
        id: "enquiry-customer",
        type: "ENQUIRY_CUSTOMER",
        label: "Enquiries and customers",
        icon: "messageCircle",
        description: "Help with an enquiry, assignment, booking, or customer record.",
    },
    {
        id: "account-access",
        type: "ACCOUNT_ACCESS",
        label: "Account and access",
        icon: "user",
        description: "Sign-in, profile, role, or product access issues.",
    },
    {
        id: "technical-issue",
        type: "TECHNICAL_ISSUE",
        label: "Technical issue",
        icon: "alert",
        description: "Report an error or unexpected portal behaviour.",
    },
]);

export const SUPPORT_TOPICS = Object.freeze([
    {
        id: "documents-visa",
        type: "DOCUMENTS_VISA",
        title: "Documents & visa help",
        description: "Support with documents and visas.",
        icon: "document",
        action: routeAction("/help/topic/documents-visa"),
        categoryIds: ["documents"],
    },
    {
        id: "report-issue",
        type: "REPORT_ISSUE",
        title: "Report an issue",
        description: "Create a support request.",
        icon: "alert",
        action: routeAction("/help/new-request?category=report-issue"),
        categoryIds: ["report-issue"],
    },
    {
        id: "contact-support",
        type: "CONTACT_SUPPORT",
        title: "Contact support",
        description: "See available ways to reach the team.",
        icon: "support",
        action: routeAction("/help/contact"),
        categoryIds: [],
    },
]);

// Article records can move to a CMS without changing the API contract. Empty is
// intentional: the client renders the backend-provided empty state, never fake copy.
export const SUPPORT_ARTICLES = Object.freeze([]);

export const PLATFORM_CONTACT_OPTIONS = Object.freeze([
    ...(config.SUPPORT_PHONE
        ? [
              {
                  id: "platform-call",
                  type: SUPPORT_CONTACT_TYPE.CALL,
                  label: "Call TravelsTREM support",
                  description: "Call the configured support line.",
                  availability: SUPPORT_CONTACT_AVAILABILITY.AVAILABLE,
                  icon: "phoneCall",
                  action: {
                      type: SUPPORT_ACTION_TYPE.CONTACT,
                      target: `tel:${String(config.SUPPORT_PHONE).replace(/[^+\d]/g, "")}`,
                  },
                  metadata: {},
              },
          ]
        : []),
    ...(config.SUPPORT_EMAIL
        ? [
              {
                  id: "platform-email",
                  type: SUPPORT_CONTACT_TYPE.EMAIL,
                  label: "Email TravelsTREM support",
                  description: "Open your email app to contact the configured support inbox.",
                  availability: SUPPORT_CONTACT_AVAILABILITY.AVAILABLE,
                  icon: "support",
                  action: {
                      type: SUPPORT_ACTION_TYPE.CONTACT,
                      target: `mailto:${config.SUPPORT_EMAIL}`,
                  },
                  metadata: {},
              },
          ]
        : []),
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

export const categoryById = (id) =>
    [...SUPPORT_CATEGORIES, ...AGENT_SUPPORT_CATEGORIES].find((item) => item.id === id) || null;
export const topicById = (id) => SUPPORT_TOPICS.find((item) => item.id === id) || null;
export const serviceById = (id) => SUPPORT_SERVICES[String(id || "").toLowerCase()] || null;
