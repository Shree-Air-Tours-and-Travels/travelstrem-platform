import React from "react";
import { BookingSummaryCard } from "@packages/trem-ui";

const sampleTour = {
  title: "Himalayan Escape to Manali",
  city: { from: "Delhi", to: "Manali" },
  _id: "tour-123",
};

export default {
  title: "Trem UI/Cards/BookingSummaryCard",
  component: BookingSummaryCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export const Default = {
  args: {
    tour: sampleTour,
    startDate: "2026-08-12",
    endDate: "2026-08-16",
    guests: 2,
    priceSnapshot: {
      perPerson: 35000,
      total: 70000,
      currency: "INR",
    },
  },
};

export const WithoutPrice = {
  args: {
    tour: sampleTour,
    startDate: "2026-08-12",
    endDate: "2026-08-16",
    guests: 1,
  },
};
