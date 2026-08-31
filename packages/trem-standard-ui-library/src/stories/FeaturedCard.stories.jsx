import React from "react";
import { FeaturedCard } from "@packages/trem-ui";

const featuredTrip = {
  title: "Jaipur Junction",
  image:
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=85",
  location: "India",
  type: "Curated trip",
  price: 19000,
  currency: "INR",
};

export default {
  title: "Trem UI/Cards/FeaturedCard",
  component: FeaturedCard,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    image: { control: "text" },
    price: { control: "number" },
    currency: { control: "text" },
    ctaLabel: { control: "text" },
    metaItems: { control: "object" },
  },
  args: {
    title: featuredTrip.title,
    image: featuredTrip.image,
    price: featuredTrip.price,
    currency: featuredTrip.currency,
    ctaLabel: "View trip",
    metaItems: [
      { icon: "mapPin", label: featuredTrip.location },
      { icon: "calendar", label: featuredTrip.type },
    ],
  },
};

export const TrevioHeroCard = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <FeaturedCard
        title={featuredTrip.title}
        image={featuredTrip.image}
        metaItems={[
          { icon: "mapPin", label: featuredTrip.location },
          { icon: "calendar", label: featuredTrip.type },
        ]}
        price={featuredTrip.price}
        currency={featuredTrip.currency}
        ctaLabel="View trip"
        onCtaClick={() => {}}
      />
    </div>
  ),
};

export const WithoutImage = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <FeaturedCard
        title="Your next story starts here"
        metaItems={[
          { icon: "mapPin", label: "India" },
          { icon: "calendar", label: "Curated trip" },
        ]}
        price={12999}
        ctaLabel="Explore"
        onCtaClick={() => {}}
      />
    </div>
  ),
};
