export const getLabel = (labels, ref, fallback = "") => (ref ? labels[ref] || fallback : fallback);
export const getWidgetProps = (widget) => widget?.props || {};
export const getToneClass = (tone) => ` tone-${tone || "primary"}`;
export const getMetricIcon = (icon) => ({
    coin: "payment",
    money: "payment",
    transaction: "payment",
    transactions: "payment",
    bookings: "calendar",
    average: "wallet",
}[icon] || icon || "compass");
export const statusClass = (status = "") => `status-${String(status).toLowerCase().replace(/\s+/g, "-")}`;
