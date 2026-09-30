import React from "react";
import { InternationalTripCard } from "@packages/trem-ui";

const sampleTrip = {
  _id: "int-1",
  title: "Swiss Alps Adventure",
  country: "Switzerland",
  location: "Interlaken",
  duration: "7 Days",
  coverImage:
    "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519382/travelstrem/site-assets/4bb38492a8f0e35290ce2ac4.jpg",
  price: { amount: 129999, currency: "INR" },
  avgRating: 4.9,
  tag: "Premium",
};

export default {
  title: "Trem UI/Cards/InternationalTripCard",
  component: InternationalTripCard,
  tags: ["autodocs"],
};

export const Default = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <InternationalTripCard trip={sampleTrip} onView={() => {}} />
    </div>
  ),
};

export const WithoutImage = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <InternationalTripCard
        trip={{
          ...sampleTrip,
          _id: "int-2",
          title: "Bali Wellness Retreat",
          country: "Indonesia",
          coverImage: undefined,
          price: { amount: 89999, currency: "INR" },
        }}
        onView={() => {}}
      />
    </div>
  ),
};
