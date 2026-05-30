import React from "react";
import { BookingSummaryCard } from "@packages/trem-ui";
import { sampleTour } from "./sampleData";

export default {
  title: "Trem UI/Data Display/Booking Summary Card",
  component: BookingSummaryCard,
  tags: ["autodocs"],
  argTypes: {
    startDate: { control: "date" },
    endDate: { control: "date" },
    guests: { control: { type: "number", min: 1, max: 20 } },
    priceSnapshot: { control: "object" },
  },
  args: {
    tour: sampleTour,
    startDate: "2026-06-12",
    endDate: "2026-06-16",
    guests: 3,
    priceSnapshot: { perPerson: 24999, total: 74997, currency: "INR" },
  },
};

export const Playground = {
  name: "Booking Summary Card / Playground",
  render: (args) => (
    <div className="trem-storybook-column" style={{ maxWidth: 400 }}>
      <BookingSummaryCard {...args} />
    </div>
  ),
};

export const Default = {
  name: "Booking Summary Card / Default",
  render: () => (
    <div className="trem-storybook-column" style={{ maxWidth: 400 }}>
      <BookingSummaryCard
        tour={sampleTour}
        startDate="2026-06-12"
        endDate="2026-06-16"
        guests={3}
        priceSnapshot={{ perPerson: 24999, total: 74997, currency: "INR" }}
      />
    </div>
  ),
};

export const SoloTraveller = {
  name: "Booking Summary Card / Solo Traveller",
  render: () => (
    <div className="trem-storybook-column" style={{ maxWidth: 400 }}>
      <BookingSummaryCard
        tour={sampleTour}
        startDate="2026-07-01"
        endDate="2026-07-05"
        guests={1}
        priceSnapshot={{ perPerson: 32999, total: 32999, currency: "INR" }}
      />
    </div>
  ),
};
