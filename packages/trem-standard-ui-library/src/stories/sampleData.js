export const sampleTour = {
  _id: "storybook-tour-1",
  title: "Himalayan Escape to Manali",
  photo: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  photos: [],
  period: { days: 5, nights: 4 },
  desc: "A calm mountain itinerary with scenic drives, local food, pine trails, and flexible leisure time for families and small groups.",
  avgRating: 4.8,
  maxGroupSize: 12,
  featured: true,
  tags: ["adventure"],
  address: { city: "Manali", country: "India" },
  city: { from: "Delhi", to: "Manali" },
  priceInfo: { min: 24999, max: 32999, currency: "INR" },
  reviews: [
    {
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    },
  ],
};

export const dropdownItems = [
  { id: "draft", label: "Draft" },
  { id: "published", label: "Published", active: true },
  { id: "archived", label: "Archived" },
  { separator: true },
  { id: "disabled", label: "Disabled option", disabled: true },
];

export const quickFilters = [
  { id: "all", label: "All" },
  { id: "adventure", label: "Adventure" },
  { id: "family", label: "Family" },
  { id: "luxury", label: "Luxury" },
  { id: "disabled", label: "Disabled", disabled: true },
];
