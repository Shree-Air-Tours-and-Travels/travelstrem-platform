import React from "react";
import QuoteDisplay from "@packages/trem-ui/components/QuoteDisplay/QuoteDisplay.jsx";

const sampleQuote = {
  items: [
    { _id: "1", label: "Tour Package", amount: 50000 },
    { _id: "2", label: "Hotel", amount: 15000 },
    { _id: "3", label: "Flights", amount: 25000 },
  ],
  basePrice: 50000,
  hotelPrice: 15000,
  flightPrice: 25000,
  taxes: 5000,
  serviceFee: 2000,
  discount: 3000,
  finalAmount: 94000,
  quoteRef: "Q-2026-0042",
  version: 1,
  expirationDate: "2026-08-15",
};

export default {
  title: "Trem UI/Data Display/QuoteDisplay",
  component: QuoteDisplay,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export const Sent = {
  args: {
    quote: sampleQuote,
    status: "SENT",
    showActions: true,
    onAccept: () => {},
    onReject: () => {},
  },
};

export const Accepted = {
  args: {
    quote: { ...sampleQuote, finalAmount: 94000 },
    status: "ACCEPTED",
    showActions: true,
  },
};

export const Rejected = {
  args: {
    quote: sampleQuote,
    status: "REJECTED",
    showActions: false,
  },
};
