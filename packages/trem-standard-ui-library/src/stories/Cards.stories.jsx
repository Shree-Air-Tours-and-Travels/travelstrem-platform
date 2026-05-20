import React, { useState } from "react";
import { BookingSummaryCard, TourCard } from "@packages/trem-ui";
import { sampleTour } from "./sampleData";

export default {
  title: "Trem UI/Data Display/Cards",
  tags: ["autodocs"],
};

export const Tour = {
  render: () => {
    const [favorited, setFavorited] = useState(false);
    return (
      <div className="trem-storybook-column">
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

export const BookingSummary = {
  render: () => (
    <div className="trem-storybook-column">
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
