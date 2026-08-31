import React from "react";
import PropTypes from "prop-types";
import "./StatusBadge.styles.scss";

const TONE_MAP = {
  DRAFT: "neutral",
  QUOTE_REQUESTED: "info",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  ADDITIONAL_INFORMATION_REQUIRED: "warning",
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
  CONVERTED: "success",
  COMPLETE: "success",
  TRENDING: "success",
  published: "success",
  draft: "neutral",
  cancelled: "danger",
  active: "success",
  invited: "info",
  suspended: "warning",
  deactivated: "danger",
  anonymized: "neutral",
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

export default function StatusBadge({
  value,
  subtitle,
  tone,
  size = "md",
  showDot = true,
  className = "",
}) {
  const resolvedTone = tone || resolveTone(value);

  return (
    <span
      className={`status-badge status-badge--${resolvedTone} status-badge--${size}${subtitle ? " status-badge--with-subtitle" : ""} ${className}`}
    >
      {showDot && <span className="status-badge__dot" aria-hidden="true" />}
      <span className="status-badge__label">{formatLabel(value)}</span>
      {subtitle && <span className="status-badge__subtitle">{subtitle}</span>}
    </span>
  );
}

StatusBadge.propTypes = {
  value: PropTypes.string,
  subtitle: PropTypes.string,
  tone: PropTypes.oneOf(["neutral", "info", "success", "warning", "danger", "secondary"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  showDot: PropTypes.bool,
  className: PropTypes.string,
};
