import React from "react";
import { OverviewRail } from "@packages/trem-ui";

const sampleWidgets = [
  {
    id: "upcoming",
    type: "upcomingTrip",
    title: "Upcoming Trip",
    detailsLabel: "View details",
    detailsHref: "/trip/trip-1",
    trip: {
      id: "trip-1",
      title: "Himalayan Escape to Manali",
      image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
      dateRange: "12 Jun – 16 Jun 2026",
      duration: "5 Days",
      productName: "TravelsTREM",
    },
    emptyState: {
      title: "No upcoming trips",
      description: "Plan your next adventure to see it here.",
      actionLabel: "Browse tours",
      actionHref: "/tours",
    },
  },
  {
    id: "quick",
    type: "quickActions",
    title: "Quick Actions",
    items: [
      { id: "request-quote", title: "Request a quote", description: "Ask an agent to plan a tour", icon: "plus", href: "/support" },
      { id: "find-tours", title: "Find Tours", description: "Search available tours", icon: "search", href: "/tours" },
    ],
  },
  {
    id: "offer",
    type: "exclusiveOffer",
    title: "Exclusive Offer",
    headline: "Summer Special",
    description: "20% off on all Himalayan packages. Book before July 31!",
    codeLabel: "Use code",
    code: "SUMMER20",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
    href: "/offers/summer",
    available: true,
  },
];

export default {
  title: "Trem UI/Data Display/OverviewRail",
  component: OverviewRail,
  tags: ["autodocs"],
};

export const Default = {
  args: {
    widgets: sampleWidgets,
  },
};

export const Empty = {
  args: {
    widgets: [],
  },
};
