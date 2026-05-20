// USE_DOTENV=true must be set before running this script
// (handled by npm script: cross-env USE_DOTENV=true)
// env.js will load .env.development and use the Atlas MONGO_URI

import connectDB from "../config/database.js";
import Tour from "../modules/tours/models/Tour.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rng = (seed = 1) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const randInt = (rand, min, max) => Math.floor(rand() * (max - min + 1)) + min;

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

const pickN = (rand, arr, n) => {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(rand() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
};

const CLOUDINARY_BASE = "https://res.cloudinary.com/dofxshf3z/image/upload";
const photoPool = [
  `${CLOUDINARY_BASE}/v1779131576/tour-img01_tljj0m.jpg`,
  `${CLOUDINARY_BASE}/v1779131579/tour-img02_gjgdel.jpg`,
  `${CLOUDINARY_BASE}/v1779131579/tour-img03_fi3oaw.jpg`,
  `${CLOUDINARY_BASE}/v1779131576/tour-img04_e0pdeh.jpg`,
  `${CLOUDINARY_BASE}/v1779131576/tour-img05_wt4bgs.jpg`,
  `${CLOUDINARY_BASE}/v1779131576/tour-img06_vvmms0.jpg`,
  `${CLOUDINARY_BASE}/v1779131576/tour-img11_b6u8kn.jpg`,
  `${CLOUDINARY_BASE}/v1779131577/tour-img14_okpafa.jpg`,
  `${CLOUDINARY_BASE}/v1779131576/tour-img15_vs7fg8.jpg`,
  `${CLOUDINARY_BASE}/v1779131577/tour-img16_s7rcgo.jpg`,
  `${CLOUDINARY_BASE}/v1779131577/tour-img17_pmk8ih.jpg`,
];

const pickPhotos = (rand) => {
  const shuffled = [...photoPool].sort(() => rand() - 0.5);
  return shuffled.slice(0, Math.min(7, shuffled.length));
};

// ---------------------------------------------------------------------------
// Data pools
// ---------------------------------------------------------------------------

const domesticDestinations = [
  { from: "Delhi", to: "Jaipur", state: "Rajasthan", zip: "302001" },
  { from: "Mumbai", to: "Goa", state: "Goa", zip: "403001" },
  { from: "Chandigarh", to: "Manali", state: "Himachal Pradesh", zip: "175131" },
  { from: "Kochi", to: "Alleppey", state: "Kerala", zip: "688011" },
  { from: "Delhi", to: "Agra", state: "Uttar Pradesh", zip: "282001" },
  { from: "Dehradun", to: "Rishikesh", state: "Uttarakhand", zip: "249201" },
  { from: "Ahmedabad", to: "Udaipur", state: "Rajasthan", zip: "313001" },
  { from: "Chandigarh", to: "Shimla", state: "Himachal Pradesh", zip: "171001" },
  { from: "Port Blair", to: "Havelock", state: "Andaman & Nicobar", zip: "744211" },
  { from: "Manali", to: "Leh", state: "Ladakh", zip: "194101" },
  { from: "Bangalore", to: "Coorg", state: "Karnataka", zip: "571201" },
  { from: "Chennai", to: "Pondicherry", state: "Puducherry", zip: "605001" },
  { from: "Mumbai", to: "Lonavala", state: "Maharashtra", zip: "410401" },
  { from: "Kolkata", to: "Darjeeling", state: "West Bengal", zip: "734101" },
  { from: "Hyderabad", to: "Hampi", state: "Karnataka", zip: "583239" },
  { from: "Delhi", to: "Varanasi", state: "Uttar Pradesh", zip: "221001" },
  { from: "Mumbai", to: "Mahabaleshwar", state: "Maharashtra", zip: "412806" },
  { from: "Bangalore", to: "Ooty", state: "Tamil Nadu", zip: "643001" },
  { from: "Delhi", to: "Jaisalmer", state: "Rajasthan", zip: "345001" },
  { from: "Guwahati", to: "Shillong", state: "Meghalaya", zip: "793001" },
  { from: "Chennai", to: "Madurai", state: "Tamil Nadu", zip: "625001" },
  { from: "Lucknow", to: "Varanasi", state: "Uttar Pradesh", zip: "221001" },
  { from: "Pune", to: "Ajanta", state: "Maharashtra", zip: "431102" },
  { from: "Ahmedabad", to: "Dwarka", state: "Gujarat", zip: "361335" },
  { from: "Bhubaneswar", to: "Puri", state: "Odisha", zip: "752001" },
];

const internationalDestinations = [
  { from: "Delhi", to: "Bangkok", country: "Thailand" },
  { from: "Mumbai", to: "Dubai", country: "UAE" },
  { from: "Delhi", to: "Kathmandu", country: "Nepal" },
  { from: "Bangalore", to: "Singapore", country: "Singapore" },
  { from: "Mumbai", to: "Male", country: "Maldives" },
  { from: "Delhi", to: "Colombo", country: "Sri Lanka" },
  { from: "Mumbai", to: "Bali", country: "Indonesia" },
  { from: "Delhi", to: "Paris", country: "France" },
  { from: "Mumbai", to: "London", country: "UK" },
  { from: "Delhi", to: "Tokyo", country: "Japan" },
  { from: "Bangalore", to: "Kuala Lumpur", country: "Malaysia" },
  { from: "Mumbai", to: "Phuket", country: "Thailand" },
  { from: "Delhi", to: "Hanoi", country: "Vietnam" },
  { from: "Mumbai", to: "Istanbul", country: "Turkey" },
  { from: "Delhi", to: "Cairo", country: "Egypt" },
  { from: "Bangalore", to: "Zurich", country: "Switzerland" },
  { from: "Mumbai", to: "Baku", country: "Azerbaijan" },
  { from: "Delhi", to: "Tbilisi", country: "Georgia" },
  { from: "Mumbai", to: "Nairobi", country: "Kenya" },
  { from: "Delhi", to: "Bangkok", country: "Thailand" },
];

const holidayPackageNames = [
  "Diwali Special Family Getaway",
  "Christmas Beach Bonanza",
  "New Year's Eve Celebration",
  "Monsoon Magic Retreat",
  "Summer Camp Adventure",
  "Pongal Festival Tour",
  "Easter Holiday Escape",
  "Valentine's Day Romantic",
  "Holi Festival of Colours",
  "Navratri Cultural Tour",
  "Durga Puja Special",
  "Onam Harvest Festival",
  "Ladakh Summer Solstice",
  "Winter Wonderland Escape",
  "Spring Blossom Trail",
  "Maha Shivratri Pilgrimage",
  "Raksha Bandhan Family",
  "Independence Day Camp",
  "Ganesh Chaturthi Tour",
  "Karwa Chauth Couple",
];

const agencies = [
  "Trem Travels", "Wanderlust Tours", "HolidayIQ", "YatraGenie",
  "Peak Adventures", "Coastal Cruises", "Heritage Walkers",
  "Backpacker's Den", "Luxury Escapes", "Budget Trips",
];

const tagsOptions = ["heritage", "family", "adventure", "beach", "wellness", "romance", "photography", "trekking", "roadtrip", "diving", "history", "short", "hillstation", "relax", "culture", "wildlife", "pilgrimage", "festival", "luxury", "budget"];

const inclusionsPool = [
  "Hotel accommodation as specified", "Daily breakfast", "Private transport for sightseeing",
  "English-speaking guide", "Entry fees as specified", "Airport transfers",
  "All taxes", "Complimentary water bottles", "Welcome drink on arrival",
  "Guide and porters", "Camping gear", "Internal flights",
  "Ferry transfers", "Meals as per itinerary", "Local permits",
];

const exclusionsPool = [
  "Flights", "Personal expenses", "Travel insurance", "Tips & gratuities",
  "Meals not mentioned", "Optional activities", "Visa fees",
  "Camera fees", "Alcoholic beverages", "Items of personal nature",
  "Medical expenses", "Phone calls", "Laundry",
];

const languages = ["English", "Hindi"];

const additionalLanguages = ["Marathi", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Gujarati"];

const tourDesc = (title, dest) => `${title} , a carefully curated ${dest?.to || "travel"} experience designed for comfort and discovery. Includes expert guide, quality accommodation, and handpicked activities.`;

// ---------------------------------------------------------------------------
// Tour factory
// ---------------------------------------------------------------------------

function makeDomesticTour(rand, index) {
  const dest = domesticDestinations[index % domesticDestinations.length];
  const days = randInt(rand, 1, 7);
  const nights = days - (rand() > 0.2 ? 1 : 0);
  const minPrice = randInt(rand, 2499, 14999);
  const maxPrice = minPrice + randInt(rand, 3000, 30000);
  const totalSeats = randInt(rand, 10, 50);
  const isFeatured = rand() > 0.6;
  const tags = pickN(rand, tagsOptions, randInt(rand, 2, 4));
  const langCount = randInt(rand, 1, 2);

  return {
    title: `${dest.to} Getaway`,
    city: { from: dest.from, to: dest.to },
    address: {
      line1: `Near ${dest.to} Central`,
      line2: "Main Road",
      city: dest.to,
      state: dest.state,
      zip: dest.zip,
      country: "India",
    },
    distance: randInt(rand, 50, 800),
    period: { days: Math.max(1, days), nights: Math.max(0, nights) },
    startDate: new Date("2025-01-01"),
    endDate: new Date("2026-12-31"),
    photo: pick(rand, photoPool),
    photos: pickPhotos(rand),
    desc: tourDesc(dest.to, dest),
    price: { min: minPrice, max: maxPrice, currency: "INR", isFinal: rand() > 0.5, source: rand() > 0.5 ? "agent" : "manual" },
    seasonalPricing: [],
    itinerary: Array.from({ length: Math.min(days, 3) }, (_, i) => ({
      day: i + 1,
      title: i === 0 ? "Arrival & Exploration" : i === days - 1 ? "Departure" : "Sightseeing & Activities",
      summary: `Day ${i + 1} of your ${dest.to} tour.`,
      activities: [`Activity ${i + 1}.1`, `Activity ${i + 1}.2`, `Activity ${i + 1}.3`],
      meals: i === 0 ? ["Dinner"] : i === days - 1 ? ["Breakfast"] : ["Breakfast", "Lunch"],
      accommodation: ["Hotel stay", "Resort stay", "Camp"][i % 3] || "Hotel",
      location: dest.to,
      notes: "Standard itinerary; subject to change based on local conditions.",
    })),
    highlights: [
      { title: `${dest.to} Highlights`, short: `Best of ${dest.to}`, icon: "compass", order: 1 },
      { title: "Local Experiences", short: "Authentic local interactions", icon: "users", order: 2 },
    ],
    availability: { totalSeats, seatsAvailable: randInt(rand, 2, totalSeats) },
    meetingPoint: `${dest.from} Airport / Railway Station pickup`,
    inclusions: pickN(rand, inclusionsPool, randInt(rand, 3, 6)),
    exclusions: pickN(rand, exclusionsPool, randInt(rand, 3, 5)),
    languages: [...languages, ...(rand() > 0.5 ? [pick(rand, additionalLanguages)] : [])].slice(0, langCount + 1),
    cancellationPolicy: "Full refund up to 7 days before departure; 50% refund within 7 days; no refund within 48 hours.",
    minAge: randInt(rand, 0, 5),
    maxAge: randInt(rand, 65, 90),
    maxGroupSize: totalSeats,
    reviews: [
      { name: pick(rand, ["Akshat", "Priya", "Ravi", "Sara", "Meera", "Anita"]), rating: randInt(rand, 3, 5), comment: "Great experience!" },
    ],
    featured: isFeatured,
    tags,
    isPublished: true,
    status: "published",
  };
}

function makeInternationalTour(rand, index) {
  const dest = internationalDestinations[index % internationalDestinations.length];
  const days = randInt(rand, 4, 14);
  const nights = days - 1;
  const minPrice = randInt(rand, 29999, 99999);
  const maxPrice = minPrice + randInt(rand, 20000, 150000);
  const totalSeats = randInt(rand, 8, 30);
  const isFeatured = rand() > 0.7;
  const tags = ["international", ...pickN(rand, tagsOptions, randInt(rand, 1, 3))];
  const langCount = randInt(rand, 1, 2);

  return {
    title: `Explore ${dest.to}`,
    city: { from: dest.from, to: dest.to },
    address: {
      line1: `Downtown ${dest.to}`,
      line2: "City Center",
      city: dest.to,
      state: "",
      zip: "000000",
      country: dest.country,
    },
    distance: randInt(rand, 500, 8000),
    period: { days, nights },
    startDate: new Date("2025-01-01"),
    endDate: new Date("2026-12-31"),
    photo: pick(rand, photoPool),
    photos: pickPhotos(rand),
    desc: `International tour to ${dest.to}, ${dest.country}. ${tourDesc(dest.to, dest)}`,
    price: { min: minPrice, max: maxPrice, currency: "INR", isFinal: rand() > 0.4, source: rand() > 0.5 ? "agent" : "manual" },
    seasonalPricing: [],
    itinerary: Array.from({ length: Math.min(days, 4) }, (_, i) => ({
      day: i + 1,
      title: i === 0 ? "Arrival & City Tour" : i === days - 1 ? "Departure" : `Day ${i + 1} Exploration`,
      summary: `Exploring ${dest.to} , day ${i + 1}.`,
      activities: [`Visit ${dest.to} landmark`, "Local cuisine tasting", "Shopping & leisure"],
      meals: i === 0 ? ["Dinner"] : i === days - 1 ? ["Breakfast"] : ["Breakfast", "Lunch"],
      accommodation: "International standard hotel",
      location: dest.to,
      notes: "Visa requirements apply. Check local laws and customs.",
    })),
    highlights: [
      { title: `${dest.to} Explorer`, short: `Discover ${dest.to}`, icon: "globe", order: 1 },
      { title: "Cultural Immersion", short: "Local traditions & cuisine", icon: "food", order: 2 },
    ],
    availability: { totalSeats, seatsAvailable: randInt(rand, 1, totalSeats) },
    meetingPoint: `${dest.from} International Airport`,
    inclusions: [...pickN(rand, inclusionsPool, randInt(rand, 4, 7)), "Visa assistance"],
    exclusions: [...pickN(rand, exclusionsPool, randInt(rand, 3, 5)), "Visa fees"],
    languages: [...languages, ...(rand() > 0.5 ? [pick(rand, additionalLanguages)] : [])].slice(0, langCount + 1),
    cancellationPolicy: "Full refund up to 14 days before departure; 50% refund within 7-14 days; no refund within 7 days.",
    minAge: randInt(rand, 5, 12),
    maxAge: randInt(rand, 65, 80),
    maxGroupSize: totalSeats,
    reviews: [
      { name: pick(rand, ["Akshat", "Priya", "Ravi", "Sara", "Meera"]), rating: randInt(rand, 3, 5), comment: "Amazing international trip!" },
    ],
    featured: isFeatured,
    tags,
    isPublished: true,
    status: "published",
  };
}

function makeHolidayPackage(rand, index) {
  const dest = domesticDestinations[index % domesticDestinations.length];
  const days = randInt(rand, 2, 6);
  const nights = days - 1;
  const minPrice = randInt(rand, 5999, 19999);
  const maxPrice = minPrice + randInt(rand, 5000, 40000);
  const totalSeats = randInt(rand, 15, 60);
  const isFeatured = rand() > 0.5;
  const tags = ["festival", "special", ...pickN(rand, tagsOptions, randInt(rand, 1, 2))];

  return {
    title: holidayPackageNames[index % holidayPackageNames.length],
    city: { from: dest.from, to: dest.to },
    address: {
      line1: `${dest.to} Festival Grounds`,
      line2: "Main Square",
      city: dest.to,
      state: dest.state,
      zip: dest.zip,
      country: "India",
    },
    distance: randInt(rand, 50, 600),
    period: { days, nights },
    startDate: new Date("2025-10-01"),
    endDate: new Date("2026-03-31"),
    photo: pick(rand, photoPool),
    photos: pickPhotos(rand),
    desc: `Special holiday package: ${holidayPackageNames[index % holidayPackageNames.length]} at ${dest.to}. Festivities, special meals, and curated experiences included.`,
    price: { min: minPrice, max: maxPrice, currency: "INR", isFinal: rand() > 0.3, source: "agent" },
    seasonalPricing: [],
    itinerary: Array.from({ length: Math.min(days, 3) }, (_, i) => ({
      day: i + 1,
      title: i === 0 ? "Arrival & Festivities" : i === days - 1 ? "Farewell & Departure" : "Festival Celebrations",
      summary: `Celebrate ${holidayPackageNames[index % holidayPackageNames.length]} in ${dest.to}.`,
      activities: ["Cultural performances", "Festival rituals", "Community feast", "Local market visit"],
      meals: ["Breakfast", "Lunch", "Dinner"],
      accommodation: "Premium hotel / Resort",
      location: dest.to,
      notes: "Festival dates may vary by 1-2 days based on local calendar.",
    })),
    highlights: [
      { title: `${holidayPackageNames[index % holidayPackageNames.length]}`, short: `Special ${dest.to} festival experience`, icon: "star", order: 1 },
      { title: "Cultural Shows", short: "Live performances and rituals", icon: "music", order: 2 },
    ],
    availability: { totalSeats, seatsAvailable: randInt(rand, 5, totalSeats) },
    meetingPoint: `${dest.from} pickup point`,
    inclusions: [...pickN(rand, inclusionsPool, randInt(rand, 4, 7)), "Festival pass", "Special meals"],
    exclusions: pickN(rand, exclusionsPool, randInt(rand, 2, 4)),
    languages: [...languages, ...(rand() > 0.6 ? [pick(rand, additionalLanguages)] : [])].slice(0, 3),
    cancellationPolicy: "Partial refund up to 10 days; 50% within 5-10 days; no refund within 48 hours of festival start.",
    minAge: randInt(rand, 0, 3),
    maxAge: randInt(rand, 70, 90),
    maxGroupSize: totalSeats,
    reviews: [
      { name: pick(rand, ["Akshat", "Priya", "Ravi", "Sara", "Meera"]), rating: randInt(rand, 4, 5), comment: "Unforgettable festive experience!" },
    ],
    featured: isFeatured,
    tags,
    isPublished: true,
    status: "published",
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const populateTours = async () => {
  try {
    console.log("Connecting to DB...");
    await connectDB();

    console.log("Clearing existing tours...");
    await Tour.deleteMany();

    console.log("Generating 50 tours...");

    const rand = rng(42);
    const tours = [];

    // 20 domestic tours
    for (let i = 0; i < 20; i++) {
      tours.push(makeDomesticTour(rand, i));
    }

    // 15 international tours
    for (let i = 0; i < 15; i++) {
      tours.push(makeInternationalTour(rand, i));
    }

    // 15 holiday packages
    for (let i = 0; i < 15; i++) {
      tours.push(makeHolidayPackage(rand, i));
    }

    // Strip _id if present
    const docs = tours.map((t) => {
      const clone = { ...t };
      if (clone._id !== undefined) delete clone._id;
      return clone;
    });

    const created = await Tour.insertMany(docs);
    console.log(`Successfully seeded ${created.length} tours.`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding tours:");
    console.error(err.stack || err);
    process.exit(1);
  }
};

populateTours();
