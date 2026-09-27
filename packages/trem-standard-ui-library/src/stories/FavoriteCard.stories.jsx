import React from "react";
import { FavoriteCard } from "@packages/trem-ui";

const sampleTour = {
  _id: "fav-1",
  title: "Himalayan Escape to Manali",
  photo:
    "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519381/travelstrem/site-assets/81cf5655c4354115342ad404.jpg",
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
            "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519381/travelstrem/site-assets/04b15c92b9ccc1fce935026a.jpg",
          avgRating: undefined,
        }}
        onView={() => {}}
        onRemove={() => {}}
      />
    </div>
  ),
};
