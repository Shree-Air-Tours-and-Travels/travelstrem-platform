export const DEFAULT_OPTION_SETS = Object.freeze({
  "trevio.quickChipOptions": {
    product: "trevio",
    description: "Trevio discovery shortcuts",
    options: [
      { value: "all", label: "All", sortOrder: 0 },
      { value: "weekend", label: "Weekend", sortOrder: 10 },
      { value: "mountains", label: "Mountains", sortOrder: 20 },
      { value: "roadtrips", label: "Road trips", sortOrder: 30 },
    ],
  },
  "trevista.tourFeaturedOptions": {
    product: "trevista",
    description: "Public tour featured-state filter",
    options: [
      { value: "all", label: "Any status", sortOrder: 0 },
      { value: "true", label: "Featured only", sortOrder: 10 },
      { value: "false", label: "Standard tours", sortOrder: 20 },
    ],
  },
  "trevista.discoveryChipOptions": {
    product: "trevista",
    description: "Curated high-level tour discovery shortcuts",
    options: [
      { value: "all", label: "All tours", sortOrder: 0, metadata: { type: "ALL" } },
      { value: "domestic", label: "Domestic", sortOrder: 10, metadata: { type: "TAG", filterValue: "domestic" } },
      { value: "international", label: "International", sortOrder: 20, metadata: { type: "TAG", filterValue: "international" } },
      { value: "featured", label: "Featured", sortOrder: 30, metadata: { type: "FEATURED", filterValue: true } },
      { value: "adventure", label: "Adventure", sortOrder: 40, metadata: { type: "TAG", filterValue: "adventure" } },
      { value: "family", label: "Family", sortOrder: 50, metadata: { type: "TAG", filterValue: "family" } },
      { value: "luxury", label: "Luxury", sortOrder: 60, metadata: { type: "TAG", filterValue: "luxury" } },
    ],
  },
  "trevista.tourSortOptions": {
    product: "trevista",
    description: "Public tour sorting choices",
    options: [
      { value: "recommended", label: "Recommended", sortOrder: 0 },
      { value: "price_asc", label: "Price: Low to High", sortOrder: 10 },
      { value: "price_desc", label: "Price: High to Low", sortOrder: 20 },
      { value: "duration", label: "Duration", sortOrder: 30 },
      { value: "newest", label: "Newest", sortOrder: 40 },
      { value: "popular", label: "Popular", sortOrder: 50 },
      { value: "trending", label: "Trending", sortOrder: 60 },
      { value: "rating", label: "Rating", sortOrder: 70 },
    ],
  },
  "trevista.travelMonthOptions": {
    product: "trevista",
    description: "Bookable month shortcuts maintained by operations",
    options: ["August 2026", "September 2026", "October 2026"].map((value, index) => ({ value, label: value, sortOrder: index * 10 })),
  },
  "trevista.travellerCountOptions": {
    product: "trevista",
    options: [10, 20, 30].map((value, index) => ({ value: String(value), label: `${value} travellers`, sortOrder: index * 10 })),
  },
  "booking.travellerTypeOptions": {
    product: "booking-engine",
    description: "Traveller counters and age bands used by booking journeys",
    options: [
      { value: "ADULT", label: "Adults", sortOrder: 0, metadata: { stateField: "adults", ageLabel: "12 years and above", minimum: 1, maximum: 20 } },
      { value: "CHILD", label: "Children", sortOrder: 10, metadata: { stateField: "children", ageLabel: "2–11 years", minimum: 0, maximum: 10 } },
      { value: "INFANT", label: "Infants", sortOrder: 20, metadata: { stateField: "infants", ageLabel: "Under 2 years", minimum: 0, maximum: 10 } },
    ],
  },
  "trevista.tripStyleOptions": {
    product: "trevista",
    options: ["Adventure", "Beach", "Culture", "Family", "Heritage", "Luxury", "Romance", "Wellness", "Trekking"].map((label, index) => ({ value: label.toLowerCase(), label, sortOrder: index * 10 })),
  },
  "trevista.budgetOptions": {
    product: "trevista",
    options: ["₹50k – ₹1L", "₹1L – ₹2L", "₹2L+"].map((value, index) => ({ value, label: value, sortOrder: index * 10 })),
  },
  "trevista.defaultRoomOptions": {
    product: "trevista",
    description: "Fallback room upgrades used when a tour has no agent-provided hotel options",
    options: [
      { value: "Standard Room", label: "Standard Room", sortOrder: 0, metadata: { desc: "Comfortable 4-star room with breakfast", price: 0 } },
      { value: "Deluxe Room", label: "Deluxe Room", sortOrder: 10, metadata: { desc: "Larger room with upgraded view and amenities", price: 8000 } },
      { value: "Premium Suite", label: "Premium Suite", sortOrder: 20, metadata: { desc: "Premium hotel category and suite accommodation", price: 22000 } },
    ],
  },
  "trevista.transportOptions": {
    product: "trevista",
    description: "Local-transfer choices and pricing",
    options: [
      { value: "Shared transfers", label: "Shared transfers", sortOrder: 0, metadata: { desc: "Air-conditioned shared vehicle with fixed schedule", price: 0 } },
      { value: "Private sedan", label: "Private sedan", sortOrder: 10, metadata: { desc: "Private car for airport and itinerary transfers", price: 12000 } },
      { value: "Private SUV", label: "Private SUV", sortOrder: 20, metadata: { desc: "Private SUV for extra comfort and luggage", price: 19000 } },
    ],
  },
  "booking.paymentMethodOptions": {
    product: "booking-engine",
    options: [
      { value: "card", label: "Debit / Credit Card", sortOrder: 0 },
      { value: "upi", label: "UPI", sortOrder: 10 },
      { value: "qr", label: "QR Scanner", sortOrder: 20 },
      { value: "net_banking", label: "Net Banking", sortOrder: 30 },
    ],
  },
  "common.titleOptions": {
    description: "Traveller honorifics",
    options: ["Mr", "Mrs", "Ms", "Miss", "Dr"].map((value, index) => ({ value, label: value, sortOrder: index * 10 })),
  },
  "common.countryOptions": {
    description: "Countries enabled for booking forms",
    options: [
      { value: "IN", label: "India", sortOrder: 0 },
      { value: "US", label: "United States", sortOrder: 10 },
      { value: "GB", label: "United Kingdom", sortOrder: 20 },
    ],
  },
  "common.genderOptions": {
    options: [
      { value: "male", label: "Male", sortOrder: 0 },
      { value: "female", label: "Female", sortOrder: 10 },
      { value: "non_binary", label: "Non-binary", sortOrder: 20 },
      { value: "prefer_not_to_say", label: "Prefer not to say", sortOrder: 30 },
    ],
  },
  "common.tripTypeOptions": {
    options: [
      { value: "all", label: "All types", sortOrder: 0 },
      { value: "domestic", label: "Domestic", sortOrder: 10 },
      { value: "international", label: "International", sortOrder: 20 },
    ],
  },
  "booking.mealOptions": {
    product: "booking-engine",
    options: ["Vegetarian", "Non-vegetarian", "Jain meals", "No preference"].map((value, index) => ({ value, label: value, sortOrder: index * 10 })),
  },
  "booking.bedOptions": {
    product: "booking-engine",
    options: ["Double bed", "Twin beds", "No preference"].map((value, index) => ({ value, label: value, sortOrder: index * 10 })),
  },
  "tours.preferredContactOptions": {
    description: "Customer contact channel choices",
    options: [
      { value: "whatsapp", label: "WhatsApp", sortOrder: 0 },
      { value: "phone", label: "Phone call", sortOrder: 10 },
      { value: "email", label: "Email", sortOrder: 20 },
    ],
  },
  "appShell.bookingProductOptions": {
    product: "app-shell",
    options: [
      { value: "all", label: "All products", sortOrder: 0 },
      { value: "trevio", label: "Trevio", sortOrder: 10 },
      { value: "trevista", label: "Trevista", sortOrder: 20 },
    ],
  },
  "appShell.bookingStatusOptions": {
    product: "app-shell",
    options: ["All statuses", "Upcoming", "Pending", "Cancelled", "Completed"].map((label, index) => ({ value: index ? label : "all", label, sortOrder: index * 10 })),
  },
  "appShell.bookingSortOptions": {
    product: "app-shell",
    options: [
      { value: "newest", label: "Newest first", sortOrder: 0, metadata: { sort: { columnId: "createdAt", direction: "desc" } } },
      { value: "oldest", label: "Oldest first", sortOrder: 10, metadata: { sort: { columnId: "createdAt", direction: "asc" } } },
      { value: "priceLow", label: "Price: Low to High", sortOrder: 20, metadata: { sort: { columnId: "price", direction: "asc" } } },
      { value: "priceHigh", label: "Price: High to Low", sortOrder: 30, metadata: { sort: { columnId: "price", direction: "desc" } } },
    ],
  },
  "appShell.bookingExportOptions": {
    product: "app-shell",
    options: [
      { value: "csv", label: "Export CSV", sortOrder: 0 },
      { value: "pdf", label: "Export PDF", sortOrder: 10 },
    ],
  },
});

export default DEFAULT_OPTION_SETS;
