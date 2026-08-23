import React from "react";
import { PlanCards } from "@packages/trem-ui";

const sampleItems = [
  {
    id: "tours",
    title: "Tours",
    description: "Explore curated tour packages",
    productName: "TravelsTREM",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
    href: "/tours",
  },
  {
    id: "hotels",
    title: "Hotels",
    description: "Book stays worldwide",
    productName: "TravelsTREM",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80",
    href: "/hotels",
  },
  {
    id: "flights",
    title: "Flights",
    description: "Find the best airfare",
    productName: "TravelsTREM",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80",
    href: "/flights",
    comingSoon: true,
    comingSoonLabel: "Coming soon",
  },
  {
    id: "visa",
    title: "Visa Assistance",
    description: "Hassle-free visa processing",
    productName: "TravelsTREM",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80",
    href: "/visa",
  },
];

export default {
  title: "Trem UI/Cards/PlanCards",
  component: PlanCards,
  tags: ["autodocs"],
  args: {
    title: "Explore travel services",
    items: sampleItems,
    columns: 4,
  },
  argTypes: {
    columns: { control: { type: "number", min: 1, max: 6 } },
    hideUnavailableOnMobile: { control: "boolean" },
  },
};

export const Default = {};

export const FewColumns = {
  args: {
    columns: 2,
    items: sampleItems.slice(0, 2),
  },
};

export const WithComingSoon = {
  args: {
    items: sampleItems,
    hideUnavailableOnMobile: true,
  },
};
