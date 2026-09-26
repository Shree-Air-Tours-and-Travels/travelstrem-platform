export const sampleTour = {
  _id: "storybook-tour-1",
  title: "Himalayan Escape to Manali",
  photo:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
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
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
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

export const galleryImages = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=80",
];

export const contactFields = [
  { name: "name", label: "Full Name", type: "text", placeholder: "Enter your name" },
  { name: "email", label: "Email Address", type: "email", placeholder: "you@example.com" },
  { name: "phone", label: "Phone Number", type: "tel", placeholder: "+1 234 567 890" },
  {
    name: "message",
    label: "Message",
    type: "textarea",
    placeholder: "Tell us about your trip...",
  },
];

export const headerNavItems = [
  { id: "home", label: "Home", path: "/" },
  { id: "tours", label: "Tours", path: "/tours" },
  {
    id: "more",
    label: "More",
    type: "dropdown",
    items: [
      { id: "about", label: "About", path: "/about" },
      { id: "contact", label: "Contact", path: "/contact" },
      { id: "faq", label: "FAQ", path: "/faq" },
    ],
  },
];
