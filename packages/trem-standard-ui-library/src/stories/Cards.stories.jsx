import React, { useState } from "react";
import { BookingSummaryCard, TourCard } from "@packages/trem-ui";
import { sampleTour } from "./sampleData";

export default {
  title: "Trem UI/Data Display/Cards",
  tags: ["autodocs"],
};

export const TourPlayground = {
  name: "Tour Card / Playground",
  component: TourCard,
  argTypes: {
    favorited: { control: "boolean" },
  },
  args: {
    tour: sampleTour,
    favorited: false,
  },
  render: (args) => {
    const [favorited, setFavorited] = useState(args.favorited);
    const onView = () => {};
    return (
      <div className="trem-storybook-column" style={{ maxWidth: 400 }}>
        <TourCard
          tour={sampleTour}
          favorited={favorited}
          onFavorite={() => setFavorited((v) => !v)}
          onView={onView}
        />
      </div>
    );
  },
};

export const Tour = {
  name: "Tour Card / Default",
  render: () => {
    const [favorited, setFavorited] = useState(false);
    return (
      <div className="trem-storybook-column" style={{ maxWidth: 400 }}>
        <TourCard
          tour={sampleTour}
          favorited={favorited}
          onFavorite={() => setFavorited((value) => !value)}
          onView={() => {}}
        />
      </div>
    );
  },
};

export const TourFavorited = {
  name: "Tour Card / Favorited",
  render: () => (
    <div className="trem-storybook-column" style={{ maxWidth: 400 }}>
      <TourCard
        tour={sampleTour}
        favorited={true}
        onFavorite={() => {}}
        onView={() => {}}
      />
    </div>
  ),
};

export const BookingSummaryPlayground = {
  name: "Booking Summary / Playground",
  component: BookingSummaryCard,
  argTypes: {
    startDate: { control: "date" },
    endDate: { control: "date" },
    guests: { control: { type: "number", min: 1, max: 20 } },
  },
  args: {
    tour: sampleTour,
    startDate: "2026-06-12",
    endDate: "2026-06-16",
    guests: 3,
    priceSnapshot: { perPerson: 24999, total: 74997, currency: "INR" },
  },
  render: (args) => (
    <div className="trem-storybook-column" style={{ maxWidth: 400 }}>
      <BookingSummaryCard
        tour={sampleTour}
        startDate={args.startDate}
        endDate={args.endDate}
        guests={args.guests}
        priceSnapshot={{ perPerson: 24999, total: 74997, currency: "INR" }}
      />
    </div>
  ),
};

export const BookingSummary = {
  name: "Booking Summary / Default",
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

export const BookingSummarySingle = {
  name: "Booking Summary / Solo Traveller",
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
