import React from "react";
import { DestinationCard } from "@packages/trem-ui";

const sampleCard = {
  id: "jaipur",
  title: "Jaipur",
  location: "Rajasthan, India",
  image: {
    src: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80",
    alt: "Jaipur cityscape",
    fallbackSrc: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=60",
  },
  description: "The Pink City — a royal tapestry of forts, palaces, bazaars, and heritage hotels.",
  duration: { days: 5, nights: 4 },
  rating: 4.6,
  reviewCount: 124,
  price: { amount: 19000, currency: "INR" },
};

export default {
  title: "Trem UI/Cards/DestinationCard",
  component: DestinationCard,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["default", "compact", "wide", "featured", "minimal", "overlay", "interactive"] },
    size: { control: "select", options: ["small", "medium", "large"] },
    aspectRatio: { control: "select", options: ["portrait", "square", "landscape"] },
    overlay: { control: "select", options: ["light", "medium", "strong"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    ...sampleCard,
    onClick: () => {},
  },
};

export const Default = {
  args: sampleCard,
};

export const Compact = {
  args: {
    ...sampleCard,
    variant: "compact",
  },
};

export const Wide = {
  args: {
    ...sampleCard,
    variant: "wide",
  },
};

export const Featured = {
  args: {
    ...sampleCard,
    variant: "featured",
    badges: [{ label: "Most booked" }],
  },
};

export const Overlay = {
  args: {
    ...sampleCard,
    variant: "overlay",
    aspectRatio: "landscape",
    size: "large",
    badges: [{ label: "Trending" }],
    ctaLabel: "Explore",
  },
};

export const Interactive = {
  args: {
    ...sampleCard,
    variant: "interactive",
    favorite: true,
    onFavorite: () => {},
    ctaLabel: "View tours",
  },
};

export const Minimal = {
  args: {
    ...sampleCard,
    variant: "minimal",
  },
};

export const Portrait = {
  args: {
    ...sampleCard,
    aspectRatio: "portrait",
    ctaLabel: "Explore",
  },
};

export const Loading = {
  args: {
    ...sampleCard,
    loading: true,
  },
};

export const Disabled = {
  args: {
    ...sampleCard,
    disabled: true,
    badges: [{ label: "Sold out" }],
  },
};
