// src/data/toursSeedFilled.js

const photoPool = (() => {
  const pool = [];
  for (let n = 2; n <= 50; n++) {
    const num = String(n).padStart(2, "0");
    pool.push(`/tour-images/tour-img${num}.jpg`);
  }
  return pool;
})();

const shuffle = (arr, seed = 1) => {
  const a = arr.slice();
  let random = seed;

  const rand = () => {
    random = (random * 1664525 + 1013904223) % 4294967296;
    return random / 4294967296;
  };

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
};

const pickPhotos = (index) => {
  const shuffled = shuffle(photoPool, index + 11);
  return shuffled.slice(0, 4);
};

const createTour = ({
  id,
  title,
  from,
  to,
  state,
  country = "India",
  city,
  line1,
  line2,
  zip,
  distance,
  days,
  nights,
  startDate,
  endDate,
  minPrice,
  maxPrice,
  tags,
  desc,
  highlights,
  featured = false,
  languages = ["English", "Hindi"],
}) => ({
  _id: `t${id}`,

  title,

  city: {
    from,
    to,
  },

  address: {
    line1,
    line2,
    city,
    state,
    zip,
    country,
  },

  distance,

  period: {
    days,
    nights,
  },

  startDate,
  endDate,

  photo: pickPhotos(id)[0],

  photos: pickPhotos(id),

  desc,

  price: {
    min: minPrice,
    max: maxPrice,
    currency: "INR",
    isFinal: false,
    source: "manual",
  },

  seasonalPricing: [],

  itinerary: [
    {
      day: 1,
      title: "Arrival & Check-in",
      summary: `Arrival in ${to} and local exploration.`,
      activities: [
        "Hotel check-in",
        "Orientation tour",
        "Local market visit",
      ],
      meals: ["Dinner"],
      accommodation: "3-star / 4-star hotel",
      location: to,
      notes: "Subject to weather and operational conditions.",
    },

    {
      day: 2,
      title: "Sightseeing Experience",
      summary: `Explore major attractions around ${to}.`,
      activities: [
        "Guided sightseeing",
        "Photography stops",
        "Cultural experiences",
      ],
      meals: ["Breakfast", "Lunch"],
      accommodation: "3-star / 4-star hotel",
      location: to,
      notes: "Entry tickets included where specified.",
    },

    {
      day: days,
      title: "Departure",
      summary: "Return transfer and departure.",
      activities: [
        "Breakfast",
        "Hotel checkout",
        "Drop-off transfer",
      ],
      meals: ["Breakfast"],
      accommodation: "N/A",
      location: to,
      notes: "Standard checkout timings apply.",
    },
  ],

  highlights: highlights.map((h, index) => ({
    ...h,
    order: index + 1,
  })),

  availability: {
    totalSeats: 40,
    seatsAvailable: Math.floor(Math.random() * 30) + 5,
  },

  meetingPoint: `${from} pickup point shared after booking`,

  inclusions: [
    `${nights} nights accommodation`,
    "Breakfast",
    "Sightseeing transfers",
    "Local guide assistance",
  ],

  exclusions: [
    "Flights",
    "Personal expenses",
    "Travel insurance",
  ],

  languages,

  cancellationPolicy:
    "Full refund up to 7 days before departure. Partial refund afterward.",

  minAge: 5,
  maxAge: 75,
  maxGroupSize: 40,

  reviews: [
    {
      name: "Rahul",
      rating: 5,
      comment: "Amazing experience and smooth arrangements.",
    },
    {
      name: "Emily",
      rating: 4,
      comment: "Very well planned and comfortable stay.",
    },
  ],

  featured,

  tags,

  isPublished: true,

  status: "published",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),
});

const tours = [
  createTour({
    id: 1,
    title: "Majestic Jaipur Escape",
    from: "Delhi",
    to: "Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    line1: "MI Road",
    line2: "Pink City",
    zip: "302001",
    distance: 550,
    days: 3,
    nights: 2,
    startDate: "2025-10-01T00:00:00.000Z",
    endDate: "2026-03-31T23:59:59.000Z",
    minPrice: 4999,
    maxPrice: 14999,
    tags: ["heritage", "family"],
    featured: true,
    desc:
      "Explore Jaipur’s forts, palaces, bazaars and royal heritage with guided tours and comfortable stays.",
    highlights: [
      {
        title: "Amber Fort",
        short: "Historic hilltop fort",
        icon: "fort",
      },
      {
        title: "City Palace",
        short: "Royal architecture",
        icon: "palace",
      },
    ],
  }),

  createTour({
    id: 2,
    title: "Goa Beach Escape",
    from: "Mumbai",
    to: "Goa",
    city: "North Goa",
    state: "Goa",
    line1: "Calangute Beach Road",
    line2: "Near Baga Beach",
    zip: "403516",
    distance: 590,
    days: 4,
    nights: 3,
    startDate: "2025-10-01T00:00:00.000Z",
    endDate: "2026-03-31T23:59:59.000Z",
    minPrice: 7999,
    maxPrice: 24999,
    tags: ["beach", "nightlife"],
    desc:
      "Enjoy Goa’s beaches, nightlife, water sports and Portuguese heritage.",
    highlights: [
      {
        title: "Baga Beach",
        short: "Popular nightlife destination",
        icon: "beach",
      },
      {
        title: "Water Sports",
        short: "Adventure activities",
        icon: "surf",
      },
    ],
  }),

  createTour({
    id: 3,
    title: "Kerala Backwaters Retreat",
    from: "Kochi",
    to: "Alleppey",
    city: "Alappuzha",
    state: "Kerala",
    line1: "Boat Jetty Road",
    line2: "Backwaters",
    zip: "688011",
    distance: 70,
    days: 2,
    nights: 1,
    startDate: "2025-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    minPrice: 6999,
    maxPrice: 16999,
    tags: ["relax", "honeymoon"],
    featured: true,
    desc:
      "Cruise through serene Kerala backwaters with authentic cuisine and luxury houseboats.",
    highlights: [
      {
        title: "Houseboat Stay",
        short: "Private backwater experience",
        icon: "boat",
      },
      {
        title: "Kerala Cuisine",
        short: "Authentic local flavors",
        icon: "food",
      },
    ],
  }),

  // Continue similarly...

  createTour({
    id: 50,
    title: "Swiss Alps Scenic Escape",
    from: "Zurich",
    to: "Interlaken",
    city: "Interlaken",
    state: "Bern",
    country: "Switzerland",
    line1: "Hoheweg",
    line2: "Central Interlaken",
    zip: "3800",
    distance: 120,
    days: 6,
    nights: 5,
    startDate: "2025-11-01T00:00:00.000Z",
    endDate: "2026-05-31T23:59:59.000Z",
    minPrice: 119999,
    maxPrice: 249999,
    tags: ["international", "mountains", "luxury"],
    featured: true,
    languages: ["English", "German"],
    desc:
      "Experience Switzerland’s alpine landscapes, scenic rail journeys and charming mountain towns.",
    highlights: [
      {
        title: "Jungfraujoch",
        short: "Top of Europe experience",
        icon: "mountain",
      },
      {
        title: "Scenic Rail",
        short: "Panoramic alpine trains",
        icon: "train",
      },
    ],
  }),
];

export default tours;