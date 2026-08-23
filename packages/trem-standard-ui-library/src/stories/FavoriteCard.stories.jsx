import React from "react";
import { FavoriteCard } from "@packages/trem-ui";

const sampleTour = {
  _id: "fav-1",
  title: "Himalayan Escape to Manali",
  photo:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
  price: 24999,
  priceInfo: { min: 24999, currency: "INR" },
  address: { city: "Manali" },
  period: { days: 5, nights: 4 },
  avgRating: 4.8,
};

export default {
  title: "Trem UI/Cards/FavoriteCard",
  component: FavoriteCard,
  tags: ["autodocs"],
};

export const Default = {
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <FavoriteCard tour={sampleTour} onView={() => {}} onRemove={() => {}} />
    </div>
  ),
};

export const WithoutRating = {
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <FavoriteCard
        tour={{
          ...sampleTour,
          _id: "fav-2",
          title: "Goa Beach Retreat",
          photo:
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80",
          avgRating: undefined,
        }}
        onView={() => {}}
        onRemove={() => {}}
      />
    </div>
  ),
};
