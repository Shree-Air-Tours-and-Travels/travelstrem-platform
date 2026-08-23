export const BOOKING_STATUS = Object.freeze({
    AWAITING_TOKEN_PAYMENT: "AWAITING_TOKEN_PAYMENT",
    DRAFT: "DRAFT",
    QUOTE_REQUESTED: "QUOTE_REQUESTED",
    UNDER_REVIEW: "UNDER_REVIEW",
    QUOTE_READY: "QUOTE_READY",
    QUOTE_SENT: "QUOTE_SENT",
    CUSTOMER_ACCEPTED: "CUSTOMER_ACCEPTED",
    CUSTOMER_REJECTED: "CUSTOMER_REJECTED",
    PAYMENT_PENDING: "PAYMENT_PENDING",
    PARTIALLY_PAID: "PARTIALLY_PAID",
    PAID: "PAID",
    CONFIRMED: "CONFIRMED",
    TICKETING: "TICKETING",
    TICKETED: "TICKETED",
    TRAVEL_READY: "TRAVEL_READY",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    REFUND_PENDING: "REFUND_PENDING",
    REFUNDED: "REFUNDED",
});

export const BOOKING_STATUS_LIST = Object.values(BOOKING_STATUS);

export const BOOKING_STATUS_TRANSITIONS = Object.freeze({
    DRAFT: [
        "QUOTE_REQUESTED",
        "AWAITING_TOKEN_PAYMENT",
        "PAYMENT_PENDING",
        "CONFIRMED",
        "CANCELLED",
    ],
    AWAITING_TOKEN_PAYMENT: ["CONFIRMED", "CANCELLED"],
    QUOTE_REQUESTED: ["UNDER_REVIEW", "CANCELLED"],
    UNDER_REVIEW: ["QUOTE_READY", "QUOTE_SENT", "CANCELLED"],
    QUOTE_READY: ["QUOTE_SENT", "UNDER_REVIEW", "CANCELLED"],
    QUOTE_SENT: ["CUSTOMER_ACCEPTED", "CUSTOMER_REJECTED", "QUOTE_READY", "CANCELLED"],
    CUSTOMER_ACCEPTED: ["PAYMENT_PENDING", "CANCELLED"],
    CUSTOMER_REJECTED: ["QUOTE_READY", "CANCELLED"],
    PAYMENT_PENDING: ["PARTIALLY_PAID", "PAID", "CANCELLED"],
    PARTIALLY_PAID: ["PAID", "REFUND_PENDING", "CANCELLED"],
    PAID: ["CONFIRMED", "REFUND_PENDING"],
    CONFIRMED: ["PARTIALLY_PAID", "PAID", "TICKETING", "TRAVEL_READY", "COMPLETED", "CANCELLED"],
    TICKETING: ["TICKETED", "CANCELLED"],
    TICKETED: ["TRAVEL_READY", "COMPLETED", "REFUND_PENDING"],
    TRAVEL_READY: ["COMPLETED", "REFUND_PENDING"],
    COMPLETED: [],
    CANCELLED: ["REFUND_PENDING", "REFUNDED"],
    REFUND_PENDING: ["REFUNDED"],
    REFUNDED: [],
});

export const PAYMENT_STATUS = Object.freeze({
    TOKEN_PENDING: "TOKEN_PENDING",
    TOKEN_VERIFICATION: "TOKEN_VERIFICATION",
    TOKEN_PAID: "TOKEN_PAID",
    BALANCE_PENDING: "BALANCE_PENDING",
    FULLY_PAID: "FULLY_PAID",
    UNPAID: "UNPAID",
    PARTIAL: "PARTIAL",
    PAID: "PAID",
    REFUND_PENDING: "REFUND_PENDING",
    REFUNDED: "REFUNDED",
    FAILED: "FAILED",
});

export const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUS);

export const PAYMENT_TYPE = Object.freeze({
    TOKEN: "TOKEN",
    BALANCE: "BALANCE",
    REFUND: "REFUND",
    // Read compatibility for payment records created before the offline workflow.
    DEPOSIT: "deposit",
    PARTIAL: "partial",
    REMAINING: "remaining",
});

export const PAYMENT_TYPE_LIST = Object.values(PAYMENT_TYPE);

export const PAYMENT_RECORD_STATUS = Object.freeze({
    PENDING: "PENDING",
    VERIFICATION: "VERIFICATION",
    PAID: "PAID",
    REJECTED: "REJECTED",
    REFUNDED: "REFUNDED",
});

export const PAYMENT_RECORD_STATUS_LIST = Object.values(PAYMENT_RECORD_STATUS);

export const PAYMENT_METHOD = Object.freeze({
    UPI: "UPI",
    BANK: "BANK",
    CASH: "CASH",
});

export const PAYMENT_METHOD_LIST = Object.values(PAYMENT_METHOD);

export const QUOTE_STATUS = Object.freeze({
    DRAFT: "DRAFT",
    READY: "READY",
    SENT: "SENT",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    EXPIRED: "EXPIRED",
});

export const QUOTE_STATUS_LIST = Object.values(QUOTE_STATUS);

export const DOCUMENT_STATUS = Object.freeze({
    PENDING: "PENDING",
    UPLOADED: "UPLOADED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
});

export const DOCUMENT_STATUS_LIST = Object.values(DOCUMENT_STATUS);

export const DOCUMENT_TYPE = Object.freeze({
    PASSPORT: "passport",
    VISA: "visa",
    GOVERNMENT_ID: "government_id",
    PHOTO: "photo",
    INSURANCE: "insurance",
    VACCINATION: "vaccination",
    TICKET: "ticket",
    VOUCHER: "voucher",
    QUOTE: "quote",
    INVOICE: "invoice",
    OTHER: "other",
});

export const DOCUMENT_TYPE_LIST = Object.values(DOCUMENT_TYPE);

export const TRAVELLER_TYPE = Object.freeze({
    ADULT: "adult",
    CHILD: "child",
    INFANT: "infant",
});

export const TRAVELLER_TYPE_LIST = Object.values(TRAVELLER_TYPE);

export const GENDER = Object.freeze({
    MALE: "male",
    FEMALE: "female",
    OTHER: "other",
    PREFER_NOT_SAY: "prefer_not_say",
});

export const GENDER_LIST = Object.values(GENDER);

export const DOCUMENT_CHECKLIST_STATUS = Object.freeze({
    PENDING: "PENDING",
    PARTIAL: "PARTIAL",
    COMPLETE: "COMPLETE",
});

export const DOCUMENT_CHECKLIST_STATUS_LIST = Object.values(DOCUMENT_CHECKLIST_STATUS);

export const BOOKING_PRIORITY = Object.freeze({
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    URGENT: "URGENT",
});

export const BOOKING_PRIORITY_LIST = Object.values(BOOKING_PRIORITY);

export const TIMELINE_ACTOR_TYPE = Object.freeze({
    CUSTOMER: "customer",
    ADMIN: "admin",
    AGENT: "agent",
    SUPPORT: "support",
    SYSTEM: "system",
});

export const TIMELINE_ACTOR_TYPE_LIST = Object.values(TIMELINE_ACTOR_TYPE);

export const TOUR_STATUS = Object.freeze({
    DRAFT: "draft",
    PENDING_APPROVAL: "pending_approval",
    PUBLISHED: "published",
    UNPUBLISHED: "unpublished",
    ARCHIVED: "archived",
    CANCELLED: "cancelled",
});

export const TOUR_STATUS_LIST = Object.values(TOUR_STATUS);

export const PRICE_SOURCE = Object.freeze({
    MANUAL: "manual",
    AI: "ai",
    AGENT: "agent",
    CALCULATED: "calculated",
    COMPONENT_CALCULATION: "component_calculation",
});

export const PRICE_SOURCE_LIST = Object.values(PRICE_SOURCE);

export const USER_ROLE = Object.freeze({
    PUBLIC: "public",
    MEMBER: "member",
    USER: "user",
    AGENT: "agent",
    ADMIN: "admin",
});

export const USER_ROLE_LIST = Object.values(USER_ROLE);

export const EDITABLE_TRAVELLER_STATUSES = Object.freeze([
    "DRAFT",
    "QUOTE_REQUESTED",
    "UNDER_REVIEW",
    "CUSTOMER_ACCEPTED",
    "AWAITING_TOKEN_PAYMENT",
    "PAYMENT_PENDING",
]);

export const BOOKING_FLOW = Object.freeze({
    TREVIO: "trevio",
    TREVISTA: "trevista",
});

export const BOOKING_FLOW_LIST = Object.values(BOOKING_FLOW);

export const PACKAGE_TYPE = Object.freeze({
    FIXED_DEPARTURE: "fixed_departure",
    FLEXIBLE: "flexible",
    CUSTOM: "custom",
});

export const PACKAGE_TYPE_LIST = Object.values(PACKAGE_TYPE);

export const DEPARTURE_STATUS = Object.freeze({
    SCHEDULED: "scheduled",
    ACTIVE: "active",
    SOLD_OUT: "sold_out",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
});

export const DEPARTURE_STATUS_LIST = Object.values(DEPARTURE_STATUS);

export const CUSTOM_TOUR_REQUEST_STATUS = Object.freeze({
    REQUESTED: "requested",
    REVIEWING: "reviewing",
    QUOTED: "quoted",
    ACCEPTED: "accepted",
    CONVERTED_TO_BOOKING: "converted_to_booking",
    REJECTED: "rejected",
    EXPIRED: "expired",
});

export const CUSTOM_TOUR_REQUEST_STATUS_LIST = Object.values(CUSTOM_TOUR_REQUEST_STATUS);

export const MESSAGE_TYPE = Object.freeze({
    TEXT: "text",
    QUOTE_UPDATE: "quote_update",
    DOCUMENT: "document",
    SYSTEM: "system",
});

export const MESSAGE_TYPE_LIST = Object.values(MESSAGE_TYPE);

export const MESSAGE_ACTOR_TYPE = Object.freeze({
    CUSTOMER: "customer",
    AGENT: "agent",
    SYSTEM: "system",
});

export const MESSAGE_ACTOR_TYPE_LIST = Object.values(MESSAGE_ACTOR_TYPE);
