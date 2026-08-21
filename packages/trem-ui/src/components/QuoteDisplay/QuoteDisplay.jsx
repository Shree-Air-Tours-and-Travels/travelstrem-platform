import React from "react";
import CardWithSubEntity from "../CardWithSubEntity/CardWithSubEntity.jsx";
import "./QuoteDisplay.styles.scss";

const FIELD_ROWS = [
  ["basePrice", "Base tour/package cost"],
  ["flightPrice", "Flight cost"],
  ["hotelPrice", "Hotel cost"],
  ["transferPrice", "Transfers"],
  ["activitiesPrice", "Activities"],
  ["mealsPrice", "Meals"],
  ["visaFee", "Visa"],
  ["insuranceFee", "Insurance"],
  ["platformFee", "TravelsTREM platform fee"],
  ["serviceFee", "Agent/service fee"],
  ["agentMarkup", "Agent markup"],
  ["taxes", "Taxes & fees"],
];

const normalizeKey = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "");

const formatMoney = (value, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: Number(value || 0) % 1 ? 2 : 0,
    }).format(Number(value || 0));
  } catch {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  }
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const lineAmount = (item = {}) => Number(item.amount ?? item.unitAmount ?? 0) || 0;

const normalizeQuoteRows = (quote = {}) => {
  const itemRows = (quote.items || [])
    .filter((item) => item && item.selected !== false && lineAmount(item) !== 0)
    .map((item, index) => ({
      id: item._id || item.id || item.code || `${item.label}-${index}`,
      codeKey: normalizeKey(item.code),
      labelKey: normalizeKey(item.label),
      label: item.label || "Quote item",
      value: formatMoney(lineAmount(item), item.currency || quote.currency),
      rawAmount: lineAmount(item),
    }));

  const itemKeys = new Set(itemRows.flatMap((row) => [row.codeKey, row.labelKey]).filter(Boolean));
  const fieldRows = FIELD_ROWS
    .filter(([field, label]) => Number(quote[field] || 0) !== 0 && !itemKeys.has(normalizeKey(field)) && !itemKeys.has(normalizeKey(label)))
    .map(([field, label]) => ({
      id: field,
      label,
      value: formatMoney(quote[field], quote.currency),
      rawAmount: Number(quote[field] || 0),
    }));

  return [...fieldRows, ...itemRows].map((row) => ({
    id: row.id,
    label: row.label,
    value: row.value,
    tone: row.rawAmount < 0 ? "negative" : undefined,
  }));
};

export default function QuoteDisplay({
  quote = {},
  status = "SENT",
  onAccept,
  onReject,
  onRequestChanges,
  showActions = true,
  className = "",
}) {
  const statusValue = String(status || "").toUpperCase();
  const isPending = ["SENT", "READY"].includes(statusValue);
  const isAccepted = statusValue === "ACCEPTED";
  const isRejected = statusValue === "REJECTED";
  const currency = quote.currency || "INR";
  const rows = normalizeQuoteRows(quote);
  const adjustments = [
    Number(quote.discount || 0) > 0 ? {
      id: "discount",
      label: "Discount",
      value: `-${formatMoney(quote.discount, currency)}`,
      tone: "negative",
    } : null,
    Number(quote.couponDiscount || 0) > 0 ? {
      id: "coupon",
      label: "Coupon",
      value: `-${formatMoney(quote.couponDiscount, currency)}`,
      tone: "negative",
    } : null,
  ].filter(Boolean);

  const footerActions = showActions && isPending ? [
    { id: "decline", label: "Decline", onClick: onReject },
    { id: "changes", label: "Request Changes", onClick: onRequestChanges },
    { id: "accept", label: "Accept Quote", variant: "primary", onClick: onAccept },
  ] : showActions && isRejected ? [
    { id: "changes", label: "Request Changes", onClick: onRequestChanges },
  ] : [];

  const hasChangeRequest = quote.changeRequest && quote.changeRequest.requestedAt;
  const statusBanner = isAccepted
    ? { label: "Quote Accepted", tone: "success" }
    : isRejected
      ? { label: "Quote Declined", tone: "danger" }
      : hasChangeRequest
        ? { label: "Changes Requested", tone: "warning" }
        : null;

  const totals = [];
  if (Number(quote.amountPayableNow || 0) > 0) {
    totals.push({
      id: "amountPayableNow",
      label: "Amount Due Now",
      value: formatMoney(quote.amountPayableNow, currency),
      tone: "highlight",
    });
  }
  totals.push({
    id: "total",
    label: totals.length ? "Total" : "Total",
    value: formatMoney(quote.finalAmount, currency),
    tone: totals.length ? undefined : "highlight",
  });

  return (
    <CardWithSubEntity
      className={`quote-display ${className}`}
      title={quote.quoteRef || "Quote"}
      badge={`Version ${quote.version || 1}`}
      headerMeta={quote.expirationDate ? `Valid until ${formatDate(quote.expirationDate)}` : ""}
      items={rows}
      sections={adjustments.length ? [{ id: "adjustments", title: "Adjustments", items: adjustments }] : []}
      totals={totals}
      text={quote.notes || ""}
      footerActions={footerActions}
      status={statusBanner}
    />
  );
}
