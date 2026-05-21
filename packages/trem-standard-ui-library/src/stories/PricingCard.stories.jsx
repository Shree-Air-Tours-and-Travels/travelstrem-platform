import React from "react";
import { PricingCard } from "@packages/trem-ui";
import { sampleTour } from "./sampleData";

export default {
  title: "Trem UI/Data Display/PricingCard",
  component: PricingCard,
  tags: ["autodocs"],
  argTypes: {
    priceText: { control: "text" },
    cityDisplay: { control: "text" },
  },
  args: {
    tour: sampleTour,
    priceText: "₹24,999 - ₹32,999",
    cityDisplay: "Delhi → Manali",
    labels: {
      pricingTitle: "Trip actions",
      startingFrom: "Starting from",
      bookNow: "Book now",
      contactAgent: "Enquire",
      save: "Save",
      saved: "Saved",
      route: "Route",
      distance: "Distance",
      kmUnit: "km",
      flexible: "Flexible",
    },
  },
};

export const Playground = {};

export const Default = {
  name: "Default",
  render: () => (
    <div style={{ maxWidth: 340 }}>
      <PricingCard
        tour={sampleTour}
        priceText="₹24,999 - ₹32,999"
        cityDisplay="Delhi → Manali"
        onBook={() => {}}
        onContact={() => {}}
        onShare={() => {}}
        isFavorited={() => false}
        onFavorite={() => {}}
      />
    </div>
  ),
};

export const Favorited = {
  name: "Favorited",
  render: () => (
    <div style={{ maxWidth: 340 }}>
      <PricingCard
        tour={sampleTour}
        priceText="₹24,999 - ₹32,999"
        cityDisplay="Delhi → Manali"
        onBook={() => {}}
        onContact={() => {}}
        onShare={() => {}}
        isFavorited={() => true}
        onFavorite={() => {}}
      />
    </div>
  ),
};

export const FinalPrice = {
  name: "Final Confirmed Price",
  render: () => (
    <div style={{ maxWidth: 340 }}>
      <PricingCard
        tour={{ ...sampleTour, priceInfo: { min: 24999, max: 24999, currency: "INR", isFinal: true }, distance: 580 }}
        priceText="₹24,999"
        cityDisplay="Delhi → Manali"
        labels={{
          startingFrom: "Total price",
          confirmedRate: "Confirmed rate",
          bookNow: "Book now",
          contactAgent: "Enquire",
          route: "Route",
          distance: "Distance",
          flexible: "Flexible",
        }}
        onBook={() => {}}
        onContact={() => {}}
        onShare={() => {}}
        isFavorited={() => false}
        onFavorite={() => {}}
      />
    </div>
  ),
};

export const Sticky = {
  name: "Within Layout Context",
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, maxWidth: 900 }}>
      <div className="trem-storybook-panel" style={{ minHeight: 400 }}>
        <p style={{ color: "var(--text-secondary)" }}>Main content area</p>
      </div>
      <PricingCard
        tour={sampleTour}
        priceText="₹24,999 - ₹32,999"
        cityDisplay="Delhi → Manali"
        onBook={() => {}}
        onContact={() => {}}
        onShare={() => {}}
        isFavorited={() => false}
        onFavorite={() => {}}
      />
    </div>
  ),
};
