const services = [
  {
    id: "flight-bookings",
    disabled: true,
    label: "Flight Bookings",
    shortDescription: "Domestic & international flight tickets at best prices",
    description:
      "We offer comprehensive flight booking services for both domestic and international destinations. Partnered with 200+ airlines worldwide to bring you the most competitive fares.",
    fullDescription:
      "Our flight booking service provides end-to-end travel solutions including domestic and international flight reservations, group bookings, corporate travel management, and last-minute deals. We partner with over 200 airlines globally to ensure you get the best rates with flexible cancellation and rescheduling options. Our 24/7 support team assists with seat selection, meal preferences, special assistance, and baggage queries to make your journey seamless from takeoff to landing.",
    image: "/service-images/flight-bookings.jpg",
    coverImage: "/service-images/flight-bookings-cover.jpg",
    features: [
      "Best price guarantee on all bookings",
      "Free cancellation within 24 hours",
      "Seat selection & meal preferences",
      "Group & corporate booking discounts",
      "24/7 customer support",
    ],
    highlights: [
      "200+ airline partners worldwide",
      "Instant e-ticket delivery",
      "Flexible rescheduling options",
      "Exclusive member discounts",
    ],
    cta: {
      label: "Book Flights",
      href: "/flights",
    },
  },
  {
    id: "hotel-reservations",
    disabled: true,
    label: "Hotel Reservations",
    shortDescription: "Curated stays from budget to luxury worldwide",
    description:
      "Handpicked accommodations ranging from boutique hotels to 5-star resorts, ensuring comfort and value for every traveler.",
    fullDescription:
      "Discover our carefully curated collection of hotels, resorts, boutique stays, and homestays across 500+ destinations worldwide. Each property is vetted for quality, hygiene, and service standards. Whether you're looking for a budget-friendly inn or a luxury beachfront villa, our hotel reservation service offers exclusive rates, free breakfast deals, loyalty rewards, and flexible check-in options. Our travel experts provide personalized recommendations based on your preferences, trip purpose, and budget.",
    image: "/service-images/hotel-reservations.jpg",
    coverImage: "/service-images/hotel-reservations-cover.jpg",
    features: [
      "Verified & curated property listings",
      "Exclusive member-only rates",
      "Free breakfast & upgrade offers",
      "Easy check-in & late checkout",
      "Loyalty rewards program",
    ],
    highlights: [
      "500+ destinations covered",
      "Price match guarantee",
      "No hidden charges",
      "Instant booking confirmation",
    ],
    cta: {
      label: "Find Hotels",
      href: "/hotels",
    },
  },
  {
    id: "visa-assistance",
    disabled: true,
    label: "Visa Assistance",
    shortDescription: "End-to-end visa processing for 150+ countries",
    description:
      "Hassle-free visa application support with document verification, appointment scheduling, and tracking.",
    fullDescription:
      "Navigating visa requirements can be complex. Our visa assistance service simplifies the entire process from document checklist preparation and application form filling to appointment scheduling at embassies and visa tracking. We support tourist visas, business visas, transit visas, e-visas, and visa-on-arrival for 150+ countries. Our experts review your documents to ensure 100% accuracy before submission, significantly improving your approval chances. We also offer urgent visa processing and embassy interview preparation guidance.",
    image: "/service-images/visa-assistance.jpg",
    coverImage: "/service-images/visa-assistance-cover.jpg",
    features: [
      "Complete document checklist & verification",
      "Application form filling assistance",
      "Appointment scheduling at embassies",
      "Real-time visa tracking",
      "Interview preparation guidance",
    ],
    highlights: [
      "150+ country coverage",
      "98% application success rate",
      "Urgent processing available",
      "Dedicated visa expert assigned",
    ],
    cta: {
      label: "Apply for Visa",
      href: "/visa",
    },
  },
  {
    id: "travel-insurance",
    disabled: true,
    label: "Travel Insurance",
    shortDescription: "Comprehensive coverage for worry-free travel",
    description:
      "Protect yourself against trip cancellations, medical emergencies, lost baggage, and travel delays.",
    fullDescription:
      "Our travel insurance plans provide comprehensive coverage tailored to your trip type and duration. Choose from single-trip, multi-trip, family, and senior citizen plans that cover medical emergencies, trip cancellations or interruptions, lost or delayed baggage, flight delays, personal accident coverage, and emergency evacuation. We partner with leading insurance providers to offer competitive premiums with instant policy issuance, easy claim filing, and 24/7 emergency assistance hotline. Travel with peace of mind knowing you're protected against the unexpected.",
    image: "/service-images/travel-insurance.jpg",
    coverImage: "/service-images/travel-insurance-cover.jpg",
    features: [
      "Medical emergency & evacuation coverage",
      "Trip cancellation & interruption protection",
      "Lost baggage & delay compensation",
      "Flight delay & missed connection cover",
      "24/7 emergency assistance hotline",
    ],
    highlights: [
      "Instant policy issuance",
      "Easy online claim filing",
      "Competitive premium rates",
      "Coverage for 200+ activities",
    ],
    cta: {
      label: "Get Insurance",
      href: "/insurance",
    },
  },
  {
    id: "car-rentals",
    disabled: true,
    label: "Car Rentals",
    shortDescription: "Self-drive & chauffeur-driven cars across cities",
    description:
      "Wide range of vehicles for rent with flexible pickup and drop-off options across major cities.",
    fullDescription:
      "Explore your destination at your own pace with our car rental service. We offer a wide fleet of vehicles including hatchbacks, sedans, SUVs, luxury cars, and tempo travelers for both self-drive and chauffeur-driven options. Rentals are available on hourly, daily, weekly, and monthly basis with free cancellation up to 24 hours before pickup. All vehicles are sanitized, well-maintained, and insured. We provide doorstep delivery, unlimited mileage options, GPS navigation, and 24/7 roadside assistance for a smooth driving experience.",
    image: "/service-images/car-rentals.jpg",
    coverImage: "/service-images/car-rentals-cover.jpg",
    features: [
      "Self-drive & chauffeur options",
      "Flexible rental durations",
      "Doorstep delivery & pickup",
      "GPS navigation included",
      "24/7 roadside assistance",
    ],
    highlights: [
      "PAN India & international presence",
      "Sanitized & well-maintained fleet",
      "Unlimited mileage on select plans",
      "No hidden security deposit",
    ],
    cta: {
      label: "Rent a Car",
      href: "/car-rentals",
    },
  },
  {
    id: "cruise-bookings",
    disabled: true,
    label: "Cruise Bookings",
    shortDescription: "Luxury cruises to exotic destinations worldwide",
    description:
      "All-inclusive cruise experiences with world-class dining, entertainment, and shore excursions.",
    fullDescription:
      "Set sail on the vacation of a lifetime with our cruise booking service. We partner with the world's leading cruise lines including Royal Caribbean, Carnival, Norwegian, MSC, and Celebrity Cruises. Whether you're looking for a short weekend cruise, a family-friendly voyage, or a luxury expedition to Antarctica, we offer the best deals with cabin upgrades, onboard credits, and all-inclusive packages. Enjoy world-class dining, Broadway-style entertainment, exciting shore excursions, and premium amenities — all included in your cruise fare.",
    image: "/service-images/cruise-bookings.jpg",
    coverImage: "/service-images/cruise-bookings-cover.jpg",
    features: [
      "Leading cruise line partnerships",
      "Cabin upgrades & onboard credits",
      "All-inclusive dining & beverages",
      "Shore excursion packages",
      "Family & couple cruise deals",
    ],
    highlights: [
      "Top cruise line partners",
      "Best price guarantee",
      "Expert cruise consultants",
      "Special anniversary & honeymoon packages",
    ],
    cta: {
      label: "Explore Cruises",
      href: "/cruises",
    },
  },
  {
    id: "airport-transfers",
    disabled: true,
    label: "Airport Transfers",
    shortDescription: "Reliable pickup & drop-off at 300+ airports",
    description:
      "Pre-booked private airport transfers with meet-and-greet service and flight tracking for punctuality.",
    fullDescription:
      "Start and end your trip stress-free with our premium airport transfer service. Available at 300+ airports worldwide, our private transfer service includes professional chauffeurs, real-time flight tracking to adjust for delays, meet-and-greet at arrivals with name boards, and luggage assistance. Choose from economy sedans, premium SUVs, or luxury limousines. All rides are pre-paid with fixed pricing — no surge charges, no waiting fees. Book in advance and enjoy a smooth transition between the airport and your accommodation or business venue.",
    image: "/service-images/airport-transfers.jpg",
    coverImage: "/service-images/airport-transfers-cover.jpg",
    features: [
      "Real-time flight tracking",
      "Meet-and-greet with name board",
      "Fixed pricing with no surge charges",
      "Luggage assistance included",
      "Wide range of vehicle options",
    ],
    highlights: [
      "300+ airports covered",
      "Professional chauffeurs",
      "Free waiting time included",
      "Instant cancellation & refund",
    ],
    cta: {
      label: "Book Transfer",
      href: "/airport-transfers",
    },
  },
  {
    id: "travel-packages",
    disabled: false,
    label: "Travel Packages",
    shortDescription: "Curated group tours & customized travel packages",
    description:
      "Handcrafted group tours and fully customizable private travel packages across India and international destinations.",
    fullDescription:
      "Our travel packages are designed for every kind of traveler — from budget-friendly group tours to luxury private vacations. Choose from our pre-designed itineraries covering popular destinations like Rajasthan, Kerala, Goa, Himachal, and international hotspots like Dubai, Bali, Thailand, Europe, and more. Each package includes accommodation, meals, guided sightseeing, inter-city transfers, and activity passes. We also offer fully customizable private packages where you pick the destination, duration, hotels, and experiences. Our travel experts handle all the logistics so you can focus on making memories.",
    image: "/service-images/travel-packages.jpg",
    coverImage: "/service-images/travel-packages-cover.jpg",
    features: [
      "Pre-designed & custom itineraries",
      "Group tours & private packages",
      "Honeymoon, family & adventure bundles",
      "Accommodation, meals & transfers included",
      "Expert tour leaders & local guides",
      "Flexible booking & cancellation",
      "Travel insurance included",
    ],
    highlights: [
      "Domestic & international destinations",
      "Budget to luxury options",
      "Solo, couple, family & group plans",
      "Seasonal special deals",
      "24/7 on-trip support",
    ],
    cta: {
      label: "View Packages",
      href: "/tours",
    },
  },
  {
    id: "corporate-packages",
    disabled: true,
    label: "Corporate Packages",
    shortDescription: "End-to-end corporate travel & event management",
    description:
      "Tailored travel solutions for businesses including team offsites, conferences, incentive trips, and employee travel management.",
    fullDescription:
      "Our corporate travel services provide end-to-end solutions for businesses of all sizes. We handle everything from booking flights and hotels for employee business travel to organizing large-scale corporate events, team offsites, annual conferences, client entertainment, and incentive reward trips. Our dedicated account managers work with your travel policy to ensure cost-effective bookings while maintaining comfort and productivity. Features include centralized billing, detailed travel reports, policy compliance checks, priority support, and emergency assistance for business travelers on the go.",
    image: "/service-images/corporate-packages.jpg",
    coverImage: "/service-images/corporate-packages-cover.jpg",
    features: [
      "Dedicated account management",
      "Centralized billing & invoicing",
      "Travel policy compliance",
      "Detailed travel expense reporting",
      "Priority 24/7 support",
    ],
    highlights: [
      "Team offsites & retreats",
      "Conference & event travel",
      "Incentive & reward trips",
      "Employee business travel",
    ],
    cta: {
      label: "Explore Corporate Plans",
      href: "/dashboard",
    },
  },
  {
    id: "cab-services",
    disabled: true,
    label: "Cab Services",
    shortDescription: "City cabs, outstation trips & airport rides",
    description:
      "Reliable cab services for local city travel, outstation trips, and airport pickups with transparent pricing.",
    fullDescription:
      "Get affordable and reliable cab services for all your travel needs. We offer city rides for daily commuting and local travel, outstation cabs for weekend getaways and road trips, and dedicated airport transfers with flight tracking. Choose from a wide range of vehicles including hatchbacks, sedans, SUVs, and tempo travelers. All cabs are GPS-tracked for safety, sanitized before every ride, and driven by verified professional drivers. Transparent pricing with no surge charges, real-time ride tracking, and multiple payment options including cash, card, and UPI.",
    image: "/service-images/cab-services.jpg",
    coverImage: "/service-images/cab-services-cover.jpg",
    features: [
      "City rides, outstation & airport cabs",
      "GPS-tracked rides for safety",
      "Verified & professional drivers",
      "Transparent fixed pricing",
      "Cash, card & UPI payments",
    ],
    highlights: [
      "Available in 100+ cities",
      "Sanitized vehicles",
      "Real-time ride tracking",
      "24/7 customer support",
    ],
    cta: {
      label: "Book a Cab",
      href: "/cab",
    },
  },
];

export default services;
