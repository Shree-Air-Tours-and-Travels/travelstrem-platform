export const PRODUCT_TYPE = Object.freeze({
  TREVIO: "trevio",
  TREVISTA: "trevista",
});

export const BOOKING_JOURNEY_ACTION = Object.freeze({
  REQUEST_QUOTATION: Object.freeze({
    id: "request-quotation",
    type: "request-quotation",
  }),
  SAVE_TRAVELLERS: Object.freeze({
    id: "save-travellers",
    type: "save-travellers",
  }),
  VIEW_QUOTATION_STATUS: Object.freeze({
    id: "view-quotation-status",
    type: "navigate-step",
  }),
  COMPLETE_TRAVELLERS_FOR_QUOTATION: Object.freeze({
    id: "complete-travellers-for-quotation",
    type: "status",
  }),
});
