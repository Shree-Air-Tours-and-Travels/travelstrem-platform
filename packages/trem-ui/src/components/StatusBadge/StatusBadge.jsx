import React from "react";
import PropTypes from "prop-types";
import "./StatusBadge.styles.scss";

const TONE_MAP = {
  DRAFT: "neutral",
  QUOTE_REQUESTED: "info",
  UNDER_REVIEW: "info",
  QUOTE_READY: "warning",
  QUOTE_SENT: "warning",
  CUSTOMER_ACCEPTED: "success",
  CUSTOMER_REJECTED: "danger",
  PAYMENT_PENDING: "warning",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  CONFIRMED: "success",
  TICKETING: "info",
  TICKETED: "success",
  TRAVEL_READY: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  REFUND_PENDING: "warning",
  REFUNDED: "secondary",
  UNPAID: "warning",
  PARTIAL: "warning",
  FAILED: "danger",
  READY: "info",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "danger",
  PENDING: "warning",
  UPLOADED: "info",
  APPROVED: "success",
  COMPLETE: "success",
  published: "success",
  draft: "neutral",
  cancelled: "danger",
};

function resolveTone(value) {
  if (!value) return "neutral";
  const key = String(value);
  return TONE_MAP[key] || TONE_MAP[key.toUpperCase()] || TONE_MAP[key.toLowerCase()] || "neutral";
}

function formatLabel(value) {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ value, tone, size = "md", className = "" }) {
  const resolvedTone = tone || resolveTone(value);

  return (
    <span className={`status-badge status-badge--${resolvedTone} status-badge--${size} ${className}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      <span className="status-badge__label">{formatLabel(value)}</span>
    </span>
  );
}

StatusBadge.propTypes = {
  value: PropTypes.string,
  tone: PropTypes.oneOf(["neutral", "info", "success", "warning", "danger", "secondary"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
};
