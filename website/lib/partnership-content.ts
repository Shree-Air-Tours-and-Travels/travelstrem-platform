// Original agency plans and workflow, restored from the pre-sales website.
export const partnerPlans = [
  {
    "name": "Partner Start",
    "price": "₹1,999",
    "label": "A confident start",
    "copy": "For independent agencies ready to bring everyday sales and service into one place.",
    "features": [
      "One organised agency workspace",
      "Tour and package publishing",
      "Enquiry and quotation management",
      "Clear customer booking visibility"
    ]
  },
  {
    "name": "Partner Growth",
    "price": "₹3,999",
    "label": "For growing teams",
    "copy": "For growing teams coordinating more travellers, tours and sales opportunities.",
    "features": [
      "Everything in Partner Start",
      "More team members with defined responsibilities",
      "Expanded catalogue and distribution reach",
      "Quote-to-booking business oversight",
      "Agency performance visibility"
    ]
  },
  {
    "name": "Partner Signature",
    "price": "₹5,999",
    "label": "For established teams",
    "copy": "For established agencies seeking greater capacity, support and operating control.",
    "features": [
      "Everything in Partner Growth",
      "Greater team and catalogue capacity",
      "Priority onboarding and business support",
      "Deeper operating and performance views",
      "Early access to new partner capabilities"
    ]
  }
] as const;

export const partnerWorkflow = [
  [
    "Discover",
    "Traveller finds an eligible tour through a TravelsTREM product."
  ],
  [
    "Enquire",
    "Requirements reach the responsible partner and assigned agent."
  ],
  [
    "Customise",
    "The agent adapts the package to the traveller's actual requirement."
  ],
  [
    "Quote",
    "Variants are priced, shared, revised and accepted inside the journey."
  ],
  [
    "Book & pay",
    "Payment secures the booking and creates the post-payment workflow."
  ],
  [
    "Deliver",
    "Tickets, vouchers, balances and trip status continue until completion."
  ]
] as const;

export const partnerCapabilities = [
  { name: "Agency operations", title: "Know what needs attention.", copy: "Agency admins can see the movement from enquiry to delivery instead of tracking disconnected spreadsheets.", points: ["Incoming customer requirements waiting for action", "Draft, sent and revised commercial proposals", "Confirmed bookings that still need delivery actions", "Marketplace-ready travel inventory"] },
  { name: "People & access", title: "Manage the people responsible for every journey.", copy: "Invite agents, manage their status and keep workspace ownership clear.", points: ["Agency profile and workspace", "Team invitations and account status", "Role-based product access", "Assigned operational responsibility"] },
  { name: "Tour inventory", title: "Create once. Manage departures. Publish when ready.", copy: "Approved tours can participate in the TravelsTREM marketplace where the agency is enrolled.", points: ["Overview and commercial information", "Day-wise itinerary", "Hotels and inclusions", "Departures and capacity", "Eligible inventory distributed through Trevista"] },
  { name: "Enquiries & CRM", title: "Keep the requirement, conversation and next action together.", copy: "Requirements, assigned agent, tour reference, quote activity and booking status remain connected.", points: ["Customer requirements and travel preferences", "Assigned agent and enquiry ownership", "Quote activity and follow-up", "Connected booking status"] },
  { name: "Quotes & pricing", title: "Build options around the traveller.", copy: "Pricing logic stays centrally governed instead of being duplicated in every product flow.", points: ["Package variants and traveller customisations", "Itemised commercial review", "Draft, send, review and revise", "Acceptance carried forward to payment"] },
  { name: "Journey fulfilment", title: "A booking is not finished when payment succeeds.", copy: "Documents, payment progress and status stay visible from the customer’s dashboard.", points: ["Accepted quote and advance payment", "Tickets, passes and hotel vouchers", "Balance collection and final settlement", "Delivery status until journey completion"] },
  { name: "Payments & records", title: "Track collections without losing booking context.", copy: "Operational records connect booking value, payments, outstanding balances and agency-level reporting.", points: ["Final agreed customer amount", "Advance payments and collected amounts", "Remaining settlement and payment schedule", "Booking-to-payment reporting"] },
  { name: "AdminTREM oversight", title: "Central platform governance above agency operations.", copy: "PartnerTREM manages the agency journey. AdminTREM gives the platform owner oversight across the ecosystem.", points: ["Partner and internal team management", "Access and configuration", "Platform approvals", "Cross-product reporting"] },
] as const;

export const commercialModels = [
  { name: "Complete SaaS", label: "Entire product suite", copy: "For businesses that want the complete connected travel SaaS ecosystem.", features: ["All customer and operational products", "Booking and shared platform engines", "Design system, Storybook and documentation", "Frameworks and reusable packages"] },
  { name: "White-labelled Platform", label: "Your brand", copy: "For businesses that want TravelsTREM capabilities presented as their own platform.", features: ["White-labelled customer experience", "Configured product and workflow scope", "Shared engineering foundation", "Brand and deployment planning", "Product walkthrough before scoping"] },
  { name: "Individual Products", label: "Focused adoption", copy: "For teams that need one product or a selected combination of capabilities.", features: ["Trevio, Trevista or TreHub", "Dashboard, PartnerTREM or AdminTREM", "Booking Engine", "Finance, Process and Form Engines", "Reusable design and platform packages"] },
] as const;
