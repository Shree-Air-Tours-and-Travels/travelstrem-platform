import React from "react";
import { TrevioTripCard } from "@packages/trem-ui";

const sampleTrip = {
  _id: "trip-1",
  title: "Himalayan Escape to Manali",
  desc: "A calm mountain itinerary with scenic drives, local food, pine trails.",
  photo:
    "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519381/travelstrem/site-assets/81cf5655c4354115342ad404.jpg",
  priceInfo: { min: 24999, currency: "INR" },
  address: { city: "Manali" },
  period: { days: 5, nights: 4 },
  avgRating: 4.8,
  tags: ["adventure", "hiking", "culture"],
};

export default {
  title: "Trem UI/Cards/TrevioTripCard",
  component: TrevioTripCard,
  tags: ["autodocs"],
};

export const Default = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <TrevioTripCard trip={sampleTrip} onFavorite={() => {}} onView={() => {}} />
    </div>
  ),
};

export const Favorited = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <TrevioTripCard trip={sampleTrip} favorited onFavorite={() => {}} onView={() => {}} />
    </div>
  ),
};

export const SoldOut = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <TrevioTripCard
        trip={{
          ...sampleTrip,
          _id: "trip-2",
          title: "Goa Beach Retreat",
          availability: { seatsAvailable: 0 },
        }}
        onFavorite={() => {}}
        onView={() => {}}
      />
    </div>
  ),
};
