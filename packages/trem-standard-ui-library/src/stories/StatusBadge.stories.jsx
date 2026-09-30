import React from "react";
import { StatusBadge } from "@packages/trem-ui";

const statusGroups = {
  "Booking Statuses": [
    "DRAFT",
    "QUOTE_REQUESTED",
    "UNDER_REVIEW",
    "QUOTE_READY",
    "QUOTE_SENT",
    "CUSTOMER_ACCEPTED",
    "CUSTOMER_REJECTED",
    "PAYMENT_PENDING",
    "PARTIALLY_PAID",
    "PAID",
    "CONFIRMED",
    "TICKETING",
    "TICKETED",
    "TRAVEL_READY",
    "COMPLETED",
    "CANCELLED",
    "REFUND_PENDING",
    "REFUNDED",
  ],
  "Payment Statuses": ["UNPAID", "PARTIAL", "PAID", "REFUND_PENDING", "REFUNDED", "FAILED"],
  "Quote Statuses": ["DRAFT", "READY", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"],
  "Document Statuses": ["PENDING", "UPLOADED", "APPROVED", "REJECTED"],
  "Document Checklist": ["PENDING", "PARTIAL", "COMPLETE"],
  "Tour Statuses": ["draft", "published", "cancelled"],
};

export default {
  title: "Trem UI/Data Display/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
  argTypes: {
    value: { control: "select", options: Object.values(statusGroups).flat() },
    tone: {
      control: "select",
      options: ["neutral", "info", "success", "warning", "danger", "secondary", undefined],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    showDot: { control: "boolean" },
  },
  args: {
    value: "CONFIRMED",
    size: "md",
  },
};

export const Sizes = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <StatusBadge value="CONFIRMED" size="sm" />
      <StatusBadge value="CONFIRMED" size="md" />
      <StatusBadge value="CONFIRMED" size="lg" />
    </div>
  ),
};

export const BookingStatuses = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {statusGroups["Booking Statuses"].map((s) => (
        <StatusBadge key={s} value={s} />
      ))}
    </div>
  ),
};

export const PaymentStatuses = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {statusGroups["Payment Statuses"].map((s) => (
        <StatusBadge key={s} value={s} />
      ))}
    </div>
  ),
};

export const QuoteStatuses = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {statusGroups["Quote Statuses"].map((s) => (
        <StatusBadge key={s} value={s} />
      ))}
    </div>
  ),
};

export const AllStatuses = {
  name: "StatusBadgeLibrary",
  render: () => (
    <div style={{ fontFamily: "sans-serif", maxWidth: 800 }}>
      {Object.entries(statusGroups).map(([group, statuses]) => (
        <div key={group} style={{ marginBottom: 24 }}>
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: 14,
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {group}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {statuses.map((s) => (
              <StatusBadge key={s} value={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const WithoutDot = {
  args: {
    value: "CONFIRMED",
    showDot: false,
  },
};

export const WithSubtitle = {
  args: {
    value: "CONFIRMED",
    subtitle: "Pending review",
  },
};

export const WithSubtitleNoDot = {
  args: {
    value: "CONFIRMED",
    subtitle: "Pending review",
    showDot: false,
  },
};
