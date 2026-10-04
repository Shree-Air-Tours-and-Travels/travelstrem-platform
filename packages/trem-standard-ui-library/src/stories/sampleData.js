export const sampleTour = {
  _id: "storybook-tour-1",
  title: "Himalayan Escape to Manali",
  photo:
    "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519375/travelstrem/site-assets/970378c505dccdf23c4c9113.jpg",
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
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519383/travelstrem/site-assets/4eb716145c78f8b1bc32925a.jpg",
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
  "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519375/travelstrem/site-assets/970378c505dccdf23c4c9113.jpg",
  "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519383/travelstrem/site-assets/4e7ac80c13474f74e8af0ce7.jpg",
  "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519384/travelstrem/site-assets/74768412652acd6e65f71989.jpg",
  "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519384/travelstrem/site-assets/b761d34970384ba8f447acf2.jpg",
  "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519384/travelstrem/site-assets/04b1643ed9df56b961bb879c.jpg",
  "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519384/travelstrem/site-assets/2025e99d86bbe8a27f9ba2d2.jpg",
  "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519384/travelstrem/site-assets/59de32de50c7d7ea6c0221f9.jpg",
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
