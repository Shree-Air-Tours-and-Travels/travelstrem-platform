const CUSTOMER_QUOTE_ACTIONS = Object.freeze({
  ACCEPT: "ACCEPT",
  REJECT: "REJECT",
  REQUEST_CHANGES: "REQUEST_CHANGES",
  CANCEL: "CANCEL",
});

const customerCanRequestChanges = (version) => {
  const numericVersion = Number(version || 1);
  return Number.isFinite(numericVersion) && numericVersion < 3;
};

export const allowedCustomerQuoteActions = (status, hasChangeRequest = false, version = 1) => {
  const value = String(status || "").toUpperCase();
  if (["CANCELLED", "EXPIRED"].includes(value)) return [];
  if (value === "ACCEPTED") return [CUSTOMER_QUOTE_ACTIONS.CANCEL];
  if (value === "REJECTED")
    return [
      ...(customerCanRequestChanges(version) ? [CUSTOMER_QUOTE_ACTIONS.REQUEST_CHANGES] : []),
      CUSTOMER_QUOTE_ACTIONS.CANCEL,
    ];
  if (hasChangeRequest) return [CUSTOMER_QUOTE_ACTIONS.CANCEL];
  return [
    CUSTOMER_QUOTE_ACTIONS.ACCEPT,
    CUSTOMER_QUOTE_ACTIONS.REJECT,
    ...(customerCanRequestChanges(version) ? [CUSTOMER_QUOTE_ACTIONS.REQUEST_CHANGES] : []),
    CUSTOMER_QUOTE_ACTIONS.CANCEL,
  ];
};

export const resolveCustomerQuoteDecision = ({ status, action, notes = "", hasChangeRequest = false, version = 1 }) => {
  const normalizedAction = String(action || "").toUpperCase();
  if (normalizedAction === CUSTOMER_QUOTE_ACTIONS.REQUEST_CHANGES && !customerCanRequestChanges(version))
    throw Object.assign(new Error("Quote change requests are locked after V3. Contact your travel specialist for further changes."), { status: 409 });
  if (!allowedCustomerQuoteActions(status, hasChangeRequest, version).includes(normalizedAction))
    throw Object.assign(new Error("This action is not available for the current quote status."), { status: 409 });
  const normalizedNotes = String(notes || "").trim().slice(0, 1200);
  if (normalizedAction === CUSTOMER_QUOTE_ACTIONS.REQUEST_CHANGES && normalizedNotes.length < 5)
    throw Object.assign(new Error("Tell the travel specialist what should be changed."), { status: 422 });
  return {
    action: normalizedAction,
    quoteStatus: normalizedAction === CUSTOMER_QUOTE_ACTIONS.ACCEPT ? "ACCEPTED"
      : normalizedAction === CUSTOMER_QUOTE_ACTIONS.REJECT ? "REJECTED"
        : normalizedAction === CUSTOMER_QUOTE_ACTIONS.CANCEL ? "CANCELLED" : "SENT",
    enquiryStatus: normalizedAction === CUSTOMER_QUOTE_ACTIONS.ACCEPT ? "accepted"
      : normalizedAction === CUSTOMER_QUOTE_ACTIONS.REJECT ? "rejected"
        : normalizedAction === CUSTOMER_QUOTE_ACTIONS.CANCEL ? "cancelled" : "change_requested",
    notes: normalizedNotes,
  };
};
