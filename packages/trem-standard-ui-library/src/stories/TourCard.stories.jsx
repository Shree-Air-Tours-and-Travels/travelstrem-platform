import React from "react";
import { TourCard } from "@packages/trem-ui";

const sampleTour = {
  _id: "tour-1",
  title: "Himalayan Escape to Manali",
  photo:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
  photos: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
  ],
  desc: "Embark on a breathtaking journey through the Himalayas. Experience pristine mountain views, lush valleys, and serene rivers.",
  avgRating: 4.5,
  reviewCount: 128,
  priceInfo: { min: 25000, max: 45000, currency: "INR" },
  period: { days: 5, nights: 4 },
  maxGroupSize: 15,
  city: { from: "Delhi", to: "Manali" },
  address: { city: "Manali", country: "India" },
  tags: ["adventure", "himalayas", "trekking"],
  highlights: [{ icon: "mountain", short: "Scenic trails" }],
  inclusions: ["Hotel", "Meals", "Transport"],
  reviews: [{ rating: 5 }, { rating: 4 }],
  availability: { seatsAvailable: 8 },
};

export default {
  title: "Trem UI/Cards/TourCard",
  component: TourCard,
  tags: ["autodocs"],
};

export const List = {
  args: {
    tour: sampleTour,
    variant: "list",
    onView: () => {},
    showActions: true,
  },
};

export const Grid = {
  args: {
    tour: sampleTour,
    variant: "grid",
    onView: () => {},
  },
};

export const Compact = {
  args: {
    tour: sampleTour,
    variant: "compact",
    showActions: false,
  },
};

export const Favorited = {
  args: {
    tour: sampleTour,
    variant: "list",
    favorited: true,
    onFavorite: () => {},
    onView: () => {},
  },
};

export const WithAgency = {
  args: {
    tour: sampleTour,
    variant: "list",
    withAgency: true,
    agencyLogo:
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=80&q=80",
    ownerAgentName: "Priya Sharma",
    showOwner: true,
    onView: () => {},
  },
};

export const Admin = {
  args: {
    tour: sampleTour,
    variant: "list",
    isAdmin: true,
    onView: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const ManagementPublished = {
  args: {
    tour: { ...sampleTour, status: "published" },
    variant: "management",
    isAdmin: true,
    onView: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const CustomerListing = {
  args: {
    tour: {
      id: "public-tour-1",
      title: "Himalayan Escape to Manali",
      coverImage: { url: sampleTour.photo },
      shortDescription: sampleTour.desc,
      pricing: sampleTour.priceInfo,
      duration: sampleTour.period,
      route: { origin: { name: "Delhi" }, destination: { name: "Manali" } },
      location: sampleTour.address,
      group: { max: sampleTour.maxGroupSize },
      rating: { average: sampleTour.avgRating, count: sampleTour.reviewCount },
      tags: sampleTour.tags,
      availability: { availableSeats: 8 },
      agency: { name: "Mountain Trails" },
      featured: true,
      tremVerified: true,
    },
    variant: "management",
    favorited: false,
    onFavorite: () => {},
    onView: () => {},
    ownershipMode: "agency",
  },
};

export const ManagementDraft = {
  args: {
    tour: { ...sampleTour, status: "draft", featured: false },
    variant: "management",
    isAdmin: true,
    onView: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const FeaturedTrending = {
  args: {
    tour: { ...sampleTour, status: "published", featured: true, trending: true },
    variant: "management",
    isAdmin: true,
    onView: () => {},
    onEdit: () => {},
  },
};

export const TremVerified = {
  args: {
    tour: { ...sampleTour, status: "published", featured: false, tremVerified: true },
    variant: "management",
    isAdmin: true,
    onView: () => {},
    onEdit: () => {},
  },
};

export const Archived = {
  args: {
    tour: { ...sampleTour, status: "archived", featured: false },
    variant: "management",
    isAdmin: true,
    onView: () => {},
    onEdit: () => {},
  },
};

export const AllBadges = {
  args: {
    tour: {
      ...sampleTour,
      status: "published",
      featured: true,
      trending: true,
      tremVerified: true,
    },
    variant: "management",
    isAdmin: true,
    onView: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const AwaitingVerification = {
  args: {
    tour: { ...sampleTour, status: "published", featured: false, tremVerified: false },
    variant: "management",
    isAdmin: true,
    onView: () => {},
    onEdit: () => {},
    onVerify: () => {},
  },
};

export const Featured = {
  args: {
    tour: { ...sampleTour, featured: true },
    variant: "featured",
    onView: () => {},
  },
};
