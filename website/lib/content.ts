export const site = {
  name: "TravelsTREM",
  url: "https://travelstrem.com",
  appUrl: "https://app.travelstrem.com",
  demoUrl: "/sales#book-demo",
  operator: "Shree Air Tours & Travels",
  email: "akshat.goyal@travelstrem.com",
  phoneLabel: "+91 90576 35580",
  phoneHref: "+919057635580",
  location: "Shree Air Tours and Travels, Jaipur",
  locationUrl: "https://maps.app.goo.gl/ebvDhsdzAe27XRSn7",
} as const;

// Public Google IDs can be overridden at build time for another deployment.
export const tracking = {
  analyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "G-RP0Z50DM4P",
  adsenseClient: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT || "ca-pub-2541753556383634",
} as const;

export const products = [
  {
    key: "01",
    name: "Trevio",
    label: "Community travel",
    copy: "Shared departures, adventures, treks and travel communities built around real journeys.",
  },
  {
    key: "02",
    name: "Trevista",
    label: "Tours and holidays",
    copy: "Curated tours, structured itineraries and a connected personalisation and quote journey.",
  },
  {
    key: "03",
    name: "TreHub",
    label: "Flights and stays",
    copy: "Search and compare flights and hotels without losing the context of the wider trip.",
  },
  {
    key: "04",
    name: "TravelsTREM Hub",
    label: "Traveller workspace",
    copy: "One account for enquiries, quotes, reservations, documents, support and every journey.",
  },
  {
    key: "05",
    name: "PartnerTREM + AdminTREM",
    label: "Agency operations",
    copy: "Inventory, enquiries, customers, quotations, bookings, finance and governance in one workspace.",
  },
  {
    key: "06",
    name: "Booking Engine",
    label: "Connected conversion",
    copy: "Availability, traveller details, pricing, payments and fulfilment carried through one record.",
  },
] as const;

export const foundations = [
  "Storybook",
  "Design system",
  "Documentation",
  "Frameworks",
  "Finance Engine",
  "Process Engine",
  "Form Engine",
  "Shared packages",
] as const;

export const workflow = [
  ["Discover", "Find the right tour, trip, flight or stay."],
  ["Personalise", "Share requirements with the responsible travel team."],
  ["Review", "Compare a structured quotation built around the journey."],
  ["Book", "Carry accepted choices into payment and fulfilment."],
  ["Travel", "Keep updates, documents and support connected."],
] as const;

export const leadership = [
  {
    initials: "NG",
    role: "Chairperson",
    name: "Mrs. Nisha Goyal",
    copy: "Guides the organisation's service culture, stewardship and long-term direction.",
  },
  {
    initials: "SG",
    role: "Founder & Managing Director",
    name: "Mr. Shreekant Goyal",
    copy: "Leads Shree Air Tours & Travels, its relationships and travel operations.",
  },
  {
    initials: "AG",
    role: "CEO & Executive Director",
    name: "Mr. Akshat Goyal",
    copy: "Leads TravelsTREM product engineering and the connected customer and partner experience.",
  },
] as const;

export const partnerTypes = [
  ["Travel agencies", "Digitise the daily journey from enquiry to fulfilment."],
  ["Tour operators", "Structure, manage and distribute eligible inventory."],
  ["Suppliers", "Connect services to accountable travel workflows."],
  ["Travel specialists", "Own customer context across quotes and bookings."],
] as const;

export const faqs = [
  [
    "Can TravelsTREM be adopted as a complete platform?",
    "Yes. The complete SaaS connects traveller products, agency operations, administration and the booking journey.",
  ],
  [
    "Is white-labelling available?",
    "Yes. The existing commercial experience includes complete SaaS, white-labelled deployment and focused product options.",
  ],
  [
    "Can we start with an individual product?",
    "Yes. A demo can focus on Trevio, Trevista, TreHub, the Dashboard, PartnerTREM, AdminTREM or the Booking Engine.",
  ],
  [
    "What happens after a demo request?",
    "Your email app opens with your details and preferred slot prepared. Review the message and send it to the TravelsTREM team.",
  ],
  [
    "Where is the team based?",
    "TravelsTREM is engineered by Shree Air Tours & Travels in Jaipur, India.",
  ],
] as const;

export const engineering = [
  {
    name: "Storybook",
    label: "Component workshop",
    copy: "Explore reusable interfaces, component states and patterns in one reference for product teams.",
  },
  {
    name: "Design system",
    label: "One visual language",
    copy: "TREM tokens connect typography, colour, spacing and component behaviour across light and dark themes.",
  },
  {
    name: "Documentation & frameworks",
    label: "Shared understanding",
    copy: "Product documentation, frameworks and reusable packages support a consistent engineering foundation.",
  },
  {
    name: "Finance Engine",
    label: "Commercial foundation",
    copy: "A shared foundation for pricing, payments and financial workflows across the platform.",
  },
  {
    name: "Process Engine",
    label: "Guided operations",
    copy: "Structured stages connect tasks, reviews and the next action in each business workflow.",
  },
  {
    name: "Form Engine",
    label: "Structured information",
    copy: "Reusable form patterns keep data collection and validation consistent across the builders.",
  },
] as const;

export const roadmap = [
  {
    name: "Support Dashboard",
    label: "Help, support & team operations",
    copy: "Planned tools for customer support and internal team management, bringing service requests and ownership into one workspace.",
    capabilities: ["Help & support", "Team management", "Internal coordination"],
  },
  {
    name: "TreCARE",
    label: "Services beyond the booking",
    copy: "Planned travel-service coordination for visas, passports, forex, transfers and insurance.",
    capabilities: ["Visa & passport", "Forex", "Transfers", "Insurance"],
  },
] as const;
