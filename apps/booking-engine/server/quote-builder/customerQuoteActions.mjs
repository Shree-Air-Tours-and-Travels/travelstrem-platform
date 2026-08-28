const CUSTOMER_QUOTE_ACTIONS = Object.freeze({
  ACCEPT: "ACCEPT",
  REJECT: "REJECT",
  REQUEST_CHANGES: "REQUEST_CHANGES",
  CANCEL: "CANCEL",
});

export const allowedCustomerQuoteActions = (status, hasChangeRequest = false) => {
  const value = String(status || "").toUpperCase();
  if (["CANCELLED", "EXPIRED"].includes(value)) return [];
  if (value === "ACCEPTED") return [CUSTOMER_QUOTE_ACTIONS.CANCEL];
  if (value === "REJECTED") return [CUSTOMER_QUOTE_ACTIONS.REQUEST_CHANGES, CUSTOMER_QUOTE_ACTIONS.CANCEL];
  if (hasChangeRequest) return [CUSTOMER_QUOTE_ACTIONS.CANCEL];
  return Object.values(CUSTOMER_QUOTE_ACTIONS);
};

export const resolveCustomerQuoteDecision = ({ status, action, notes = "", hasChangeRequest = false }) => {
  const normalizedAction = String(action || "").toUpperCase();
  if (!allowedCustomerQuoteActions(status, hasChangeRequest).includes(normalizedAction))
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
