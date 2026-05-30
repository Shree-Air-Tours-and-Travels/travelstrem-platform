export const BOOKING_CURRENCY = "INR";
export const BOOKING_LOCALE = "en-IN";

export const STATUS_TONE_MAP = {
    COMPLETED: "green",
    CONFIRMED: "green",
    PAID: "green",
    TRAVEL_READY: "green",
    CANCELLED: "red",
    REFUNDED: "red",
    CUSTOMER_REJECTED: "red",
    QUOTE_REQUESTED: "olive",
    UNDER_REVIEW: "olive",
    QUOTE_READY: "olive",
    QUOTE_SENT: "olive",
    PAYMENT_PENDING: "olive",
};

export const STATUS_TONE_DEFAULT = "neutral";

export const statusLabel = (status = "") =>
    String(status)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

export const statusTone = (status = "") =>
    STATUS_TONE_MAP[String(status || "").toUpperCase()] || STATUS_TONE_DEFAULT;

export const BOOKING_COLUMN_BASE = [
    { id: "id", label: "ID", accessor: "id", minWidth: 180, emphasis: "strong" },
    { id: "tour", label: "Tour & Type", type: "mediaText", titleAccessor: "tour", subtitleAccessor: "type", minWidth: 240 },
    { id: "travellers", label: "Travellers", accessor: "travellers", minWidth: 120 },
    { id: "days", label: "Days", accessor: "days", minWidth: 100 },
    { id: "price", label: "Price", accessor: "price", minWidth: 110 },
    { id: "date", label: "Date", accessor: "date", minWidth: 120 },
    { id: "status", label: "Status", accessor: "status", type: "status", minWidth: 120 },
];

export const FALLBACK_BOOKING_TOUR_TITLE = "Tour booking";
export const FALLBACK_BOOKING_TOUR_TYPE = "tour";
