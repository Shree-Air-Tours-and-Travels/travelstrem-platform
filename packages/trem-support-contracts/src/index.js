export const SUPPORT_ACTION_TYPE = Object.freeze({
  NAVIGATE: "NAVIGATE",
  CONTACT: "CONTACT",
  CREATE_TICKET: "CREATE_TICKET",
  CANCELLATION: "CANCELLATION",
  REFUND: "REFUND",
  RESCHEDULE: "RESCHEDULE",
  DOWNLOAD: "DOWNLOAD",
  DISABLED: "DISABLED",
});

export const SUPPORT_ACTION_TYPE_LIST = Object.freeze(Object.values(SUPPORT_ACTION_TYPE));

export const SUPPORT_CONTACT_TYPE = Object.freeze({
  CHAT: "CHAT",
  CALL: "CALL",
  EMAIL: "EMAIL",
  CALLBACK: "CALLBACK",
  AGENCY: "AGENCY",
});

export const SUPPORT_CONTACT_TYPE_LIST = Object.freeze(Object.values(SUPPORT_CONTACT_TYPE));

export const SUPPORT_CONTACT_AVAILABILITY = Object.freeze({
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
  LIMITED: "LIMITED",
});

export const SUPPORT_CONTACT_AVAILABILITY_LIST = Object.freeze(
  Object.values(SUPPORT_CONTACT_AVAILABILITY),
);

export const SUPPORT_TICKET_STATUS = Object.freeze({
  OPEN: "OPEN",
  AWAITING_CUSTOMER: "AWAITING_CUSTOMER",
  AWAITING_SUPPORT: "AWAITING_SUPPORT",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
});

export const SUPPORT_TICKET_STATUS_LIST = Object.freeze(Object.values(SUPPORT_TICKET_STATUS));

export const SUPPORT_TICKET_PRIORITY = Object.freeze({
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
});

export const SUPPORT_TICKET_PRIORITY_LIST = Object.freeze(Object.values(SUPPORT_TICKET_PRIORITY));

export const SUPPORT_CHANNEL = Object.freeze({
  WEB: "WEB",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  CHAT: "CHAT",
});

export const SUPPORT_CHANNEL_LIST = Object.freeze(Object.values(SUPPORT_CHANNEL));

export const SUPPORT_ENTITY_TYPE = Object.freeze({
  BOOKING: "BOOKING",
  SERVICE: "SERVICE",
  TOPIC: "TOPIC",
  ARTICLE: "ARTICLE",
  TICKET: "TICKET",
});

export const SUPPORT_ENTITY_TYPE_LIST = Object.freeze(Object.values(SUPPORT_ENTITY_TYPE));

export const SUPPORT_REQUEST_TYPE = Object.freeze({
  CANCELLATION: "CANCELLATION",
  REFUND: "REFUND",
  RESCHEDULE: "RESCHEDULE",
});

export const SUPPORT_REQUEST_TYPE_LIST = Object.freeze(Object.values(SUPPORT_REQUEST_TYPE));

export const SUPPORT_REQUEST_STATUS = Object.freeze({
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  COMPLETED: "COMPLETED",
});

export const SUPPORT_REQUEST_STATUS_LIST = Object.freeze(Object.values(SUPPORT_REQUEST_STATUS));

export const SUPPORT_ELIGIBILITY_STATUS = Object.freeze({
  ELIGIBLE: "ELIGIBLE",
  INELIGIBLE: "INELIGIBLE",
  UNAVAILABLE: "UNAVAILABLE",
});

export const SUPPORT_ELIGIBILITY_STATUS_LIST = Object.freeze(
  Object.values(SUPPORT_ELIGIBILITY_STATUS),
);

export const SUPPORT_SENDER_TYPE = Object.freeze({
  CUSTOMER: "customer",
  SUPPORT: "support",
  SYSTEM: "system",
});

export const SUPPORT_SENDER_TYPE_LIST = Object.freeze(Object.values(SUPPORT_SENDER_TYPE));

export const SUPPORT_ANALYTICS_EVENT = Object.freeze({
  HELP_CENTER_VIEWED: "help_center_viewed",
  BOOKING_SELECTED: "support_booking_selected",
  TOPIC_OPENED: "support_topic_opened",
  CONTACT_SELECTED: "support_contact_selected",
  TICKET_STARTED: "support_ticket_started",
  TICKET_CREATED: "support_ticket_created",
  REFUND_STARTED: "refund_flow_started",
  REFUND_REQUESTED: "refund_requested",
  RESCHEDULE_STARTED: "reschedule_started",
  CANCELLATION_STARTED: "cancellation_started",
});

export const isSupportTicketTerminal = (status) =>
  status === SUPPORT_TICKET_STATUS.RESOLVED || status === SUPPORT_TICKET_STATUS.CLOSED;
