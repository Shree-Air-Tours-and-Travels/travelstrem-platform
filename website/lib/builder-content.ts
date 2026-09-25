export const builders = [
  {
    id: "agency", name: "Agency builder", title: "Agency partnership activation", engine: "Process Engine + Form Engine",
    copy: "A structured path from business identity to partnership review. Each step keeps the next action clear.",
    steps: [
      { title: "Business identity", copy: "Establish who the agency is and how customers know the business.", fields: ["Agency trading name", "Registered legal name", "Company email", "Company phone"], output: "One agency identity" },
      { title: "Registration & address", copy: "Collect legal identifiers and the registered operating address.", fields: ["Registration details", "Registered address", "City & country", "Postal code"], output: "Structured business record" },
      { title: "Agency operations", copy: "Understand the agency's operating scale and services.", fields: ["Services offered", "Operating markets", "Team size", "Business profile"], output: "Operational context" },
      { title: "Primary contact", copy: "Identify the person responsible for review updates and activation.", fields: ["Contact name", "Work email", "Phone number", "Role"], output: "Clear ownership" },
      { title: "Verification", copy: "Bring branding and verification documents into the same review.", fields: ["Company branding", "Business documents", "Verification details", "Supporting information"], output: "Review-ready documents" },
      { title: "Review & submit", copy: "Review the complete application before submitting it for partnership review.", fields: ["Business identity", "Operations summary", "Contact details", "Documents"], output: "Partnership application" },
    ],
  },
  {
    id: "tour", name: "Tour builder", title: "Build a journey worth discovering", engine: "Process Engine + Finance Engine",
    copy: "Connect the itinerary, included services and commercial structure before a tour reaches the traveller.",
    steps: [
      { title: "Tour overview", copy: "Give the journey a clear identity and destination context.", fields: ["Tour title", "Destinations", "Duration", "Travel style"], output: "Structured tour profile" },
      { title: "Itinerary", copy: "Organise the experience into a clear day-by-day journey.", fields: ["Day plan", "Places to visit", "Activities", "Journey notes"], output: "Day-by-day itinerary" },
      { title: "Included services", copy: "Keep stays, transfers and experiences connected to the tour.", fields: ["Accommodation", "Transfers", "Included experiences", "Exclusions"], output: "Service inventory" },
      { title: "Packages & pricing", copy: "Define package choices through the shared commercial foundation.", fields: ["Package options", "Occupancy", "Commercial details", "Pricing rules"], output: "Package structure" },
      { title: "Availability", copy: "Prepare the departure and operating information travellers need.", fields: ["Departure dates", "Operating period", "Capacity", "Booking conditions"], output: "Departure information" },
      { title: "Review & publish", copy: "Review the complete inventory and prepare eligible tours for discovery.", fields: ["Tour summary", "Itinerary review", "Package review", "Publishing readiness"], output: "Discoverable inventory" },
    ],
  },
  {
    id: "quote", name: "Quote builder", title: "Compose a traveller quotation", engine: "Process Engine + Finance Engine",
    copy: "Carry the customer's request through customisation, itemised pricing and a quotation ready for review.",
    steps: [
      { title: "Customer request", copy: "Understand the traveller's requirements before preparing the quotation.", fields: ["Selected tour", "Package preference", "Travellers", "Travel dates"], output: "Customer context" },
      { title: "Included tour", copy: "Review the tour and included services attached to the request.", fields: ["Tour itinerary", "Included stays", "Transfers", "Activities"], output: "A shared starting point" },
      { title: "Customisations", copy: "Review requested changes alongside the original package.", fields: ["Requested changes", "Replaced services", "Additional services", "Traveller notes"], output: "Personalised journey" },
      { title: "Itemised quotation", copy: "Keep included items and adjustments visible in the commercial review.", fields: ["Package items", "Customised items", "Additional charges", "Price summary"], output: "Itemised customer price" },
      { title: "Review & send", copy: "Review the complete journey and quotation before sharing with the traveller.", fields: ["Journey summary", "Commercial review", "Supporting documents", "Customer message"], output: "Traveller quotation" },
    ],
  },
] as const;
