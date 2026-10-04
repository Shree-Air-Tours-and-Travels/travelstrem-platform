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
      image:
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519382/travelstrem/site-assets/5418717827438ce5734537f2.jpg",
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
      {
        id: "request-quote",
        title: "Request a quote",
        description: "Ask an agent to plan a tour",
        icon: "plus",
        href: "/support",
      },
      {
        id: "find-tours",
        title: "Find Tours",
        description: "Search available tours",
        icon: "search",
        href: "/tours",
      },
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
    image:
      "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519383/travelstrem/site-assets/c536e8b80c4e8913c97c90a9.jpg",
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
