export const DEFAULT_OPTION_SETS = Object.freeze({
  "trevista.tourBuilderSteps": {
    product: "trevista",
    description: "Ordered top-level steps for the agent/admin tour builder",
    options: [
      { value: "basic", label: "Basics", sortOrder: 0, metadata: { shortLabel: "Basics", helper: "Identity and location" } },
      { value: "schedule", label: "Schedule", sortOrder: 10, metadata: { shortLabel: "Schedule", helper: "Dates and availability" } },
      { value: "itinerary", label: "Itinerary", sortOrder: 20, metadata: { shortLabel: "Itinerary", helper: "One screen per day" } },
      { value: "pricing", label: "Packages", sortOrder: 30, metadata: { shortLabel: "Packages", helper: "Components and package composition" } },
      { value: "logistics", label: "Operations", sortOrder: 40, metadata: { shortLabel: "Operations", helper: "Booking, policies and inventory" } },
      { value: "content", label: "Publish", sortOrder: 50, metadata: { shortLabel: "Publish", helper: "Description and visibility" } },
      { value: "review", label: "Review", sortOrder: 60, metadata: { shortLabel: "Review", helper: "Check and submit" } },
    ],
  },
  "trevista.tourBuilderRequiredFields": {
    product: "trevista",
    description: "Backend-owned required-field contract used by every tour CRUD client",
    options: [
      { value: "title", label: "Tour title", sortOrder: 0, metadata: { step: "basic" } },
      { value: "city.from", label: "Departure city", sortOrder: 10, metadata: { step: "basic" } },
      { value: "city.to", label: "Destination city", sortOrder: 20, metadata: { step: "basic" } },
      { value: "distance", label: "Distance", sortOrder: 30, metadata: { step: "basic" } },
      { value: "period.days", label: "Days", sortOrder: 40, metadata: { step: "schedule" } },
      { value: "period.nights", label: "Nights", sortOrder: 50, metadata: { step: "schedule" } },
      { value: "departures", label: "Departure details", sortOrder: 60, metadata: { step: "schedule", conditional: "when-present" } },
      { value: "itinerary", label: "Itinerary day details", sortOrder: 70, metadata: { step: "itinerary", conditional: "when-present" } },
      { value: "commercial", label: "Package pricing", sortOrder: 80, metadata: { step: "pricing" } },
      { value: "maxGroupSize", label: "Maximum group size", sortOrder: 90, metadata: { step: "logistics" } },
      { value: "desc", label: "Description", sortOrder: 100, metadata: { step: "content" } },
    ],
  },
  "trevista.packageTypeOptions": {
    product: "trevista",
    options: [
      { value: "fixed_departure", label: "Fixed departure", sortOrder: 0 },
      { value: "flexible", label: "Flexible dates", sortOrder: 10 },
      { value: "custom", label: "Custom / quote-based", sortOrder: 20 },
    ],
  },
  "trevista.departureStatusOptions": {
    product: "trevista",
    options: ["scheduled", "active", "sold_out", "cancelled"].map((value, index) => ({ value, label: value.replaceAll("_", " "), sortOrder: index * 10 })),
  },
  "trevista.tourStatusOptions": {
    product: "trevista",
    options: ["draft", "pending_approval", "published", "unpublished", "cancelled"].map((value, index) => ({ value, label: value.replaceAll("_", " "), sortOrder: index * 10 })),
  },
  "trevista.extraCategoryOptions": {
    product: "trevista",
    options: ["activity", "transfer", "meal", "visa", "insurance", "other"].map((value, index) => ({ value, label: value, sortOrder: index * 10 })),
  },
  "trevista.commercialComponentTypeOptions": {
    product: "trevista",
    options: ["ACCOMMODATION", "FLIGHT", "ACTIVITY", "TRANSFER", "MEAL", "SIGHTSEEING", "VISA", "INSURANCE", "GUIDE", "TAX", "AGENT_CHARGE", "MISCELLANEOUS"].map((value, index) => ({ value, label: value.replaceAll("_", " "), sortOrder: index * 10 })),
  },
  "trevista.commercialPricingUnitOptions": {
    product: "trevista",
    options: ["PER_PERSON", "PER_ADULT", "PER_CHILD", "PER_INFANT", "PER_ROOM", "PER_NIGHT", "PER_ROOM_PER_NIGHT", "PER_PERSON_PER_NIGHT", "PER_VEHICLE", "PER_TRIP", "PER_DAY", "PER_GROUP", "PER_BOOKING", "FIXED"].map((value, index) => ({ value, label: value.replaceAll("_", " "), sortOrder: index * 10 })),
  },
  "trevista.commercialStatusOptions": {
    product: "trevista",
    options: ["CONFIRMED", "ESTIMATED", "REPRICE_REQUIRED"].map((value, index) => ({ value, label: value.replaceAll("_", " "), sortOrder: index * 10 })),
  },
  "trevista.packageTierOptions": {
    product: "trevista",
    options: [
      { value: "BASIC", label: "Base", sortOrder: 0 },
      { value: "STANDARD", label: "Standard", sortOrder: 10 },
      { value: "PREMIUM", label: "Premium", sortOrder: 20 },
    ],
  },
  "trevista.flexiblePricingModelOptions": {
    product: "trevista",
    options: [
      { value: "seasonal", label: "Seasonal", sortOrder: 0 },
      { value: "fixed", label: "Fixed", sortOrder: 10 },
      { value: "on_request", label: "On request", sortOrder: 20 },
    ],
  },
  "trevista.stayTierOptions": {
    product: "trevista",
    options: ["base", "standard", "premium"].map((value, index) => ({ value, label: value[0].toUpperCase() + value.slice(1), sortOrder: index * 10 })),
  },
  "common.currencyOptions": {
    description: "Currencies enabled for prices entered by operations users",
    options: [{ value: "INR", label: "INR - Indian Rupee", sortOrder: 0 }],
  },
  "trevista.priceSourceOptions": {
    product: "trevista",
    description: "Accepted provenance values for Tour price snapshots",
    options: ["manual", "ai", "agent", "calculated", "component_calculation"].map((value, index) => ({ value, label: value.replaceAll("_", " "), sortOrder: index * 10 })),
  },
  "trevista.tourOperationsSectionOptions": {
    product: "trevista",
    options: ["booking", "cancellation", "extras", "stays", "hotels", "media", "highlights"].map((value, index) => ({ value, label: value === "hotels" ? "Upgrades" : value[0].toUpperCase() + value.slice(1), sortOrder: index * 10 })),
  },
  "trevista.commercialBasisFieldOptions": {
    product: "trevista",
    options: [
      { value: "adults", label: "Adults", metadata: { minimum: 1 } },
      { value: "children", label: "Children", metadata: { minimum: 0 } },
      { value: "infants", label: "Infants", metadata: { minimum: 0 } },
      { value: "rooms", label: "Rooms", metadata: { minimum: 1 } },
      { value: "vehicles", label: "Vehicles", metadata: { minimum: 1 } },
      { value: "nights", label: "Nights", metadata: { minimum: 0 } },
      { value: "days", label: "Days", metadata: { minimum: 1 } },
    ].map((option, index) => ({ ...option, sortOrder: index * 10 })),
  },
  "trevista.commercialComponentStepOptions": {
    product: "trevista",
    options: ["details", "pricing", "upgrade"].map((value, index) => ({ value, label: value[0].toUpperCase() + value.slice(1), sortOrder: index * 10 })),
  },
  "trevista.commercialPackageStepOptions": {
    product: "trevista",
    options: [
      { value: "details", label: "Package details", sortOrder: 0 },
      { value: "assignment", label: "Included components", sortOrder: 10 },
    ],
  },
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
  "tours.preferredContactOptions": {
    description: "Customer contact channel choices",
    options: [
      { value: "whatsapp", label: "WhatsApp", sortOrder: 0 },
      { value: "phone", label: "Phone call", sortOrder: 10 },
      { value: "email", label: "Email", sortOrder: 20 },
    ],
  },
  "appShell.favoriteProductOptions": {
    product: "app-shell",
    description: "Product filters for saved travel items",
    options: [
      { value: "all", label: "All products", sortOrder: 0 },
      { value: "trevio", label: "Trevio", sortOrder: 10 },
      { value: "trevista", label: "Trevista", sortOrder: 20 },
    ],
  },
});

export default DEFAULT_OPTION_SETS;
