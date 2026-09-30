Analyze the entire existing TravelsTREM repository first, understand its architecture, and then build a production-ready AI layer called TREM AI fully integrated with the current system.
TREM AI must be an orchestration layer only:
TREM AI → AI Orchestrator → existing TravelsTREM services/engines → DB
Do NOT replace, duplicate, or bypass existing business logic. Reuse existing controllers, services, schemas, helpers, validations, auth/session logic, RBAC, APIs, UI components, design tokens, MongoDB/Redis usage, and project conventions wherever available.
Integrate TREM AI with the existing Tour/Trevista, Inquiry, Quote, Pricing, Booking, Payment, User/Auth, Partner/Agent, and Admin systems.
TREM AI must support customer, agent/partner, agency-admin, and master-admin contexts.
The authenticated backend session must be the only trusted source for:

- portal: customer / partner / admin
- userId
- role
- agencyId
- permissions/scopes
- ownership/resource access
  Never infer or trust role, agency, ownership, pricing, permissions, or identity from the user message or frontend payload.
  Expose AI tools dynamically according to the authenticated context, but also enforce authorization inside every protected backend tool/service. Tool visibility is NOT security.
  Use strict RBAC + ownership/agency-scope validation for all CRUD operations.
  Customer capabilities should include things such as:
- search/list available tours
- get tour details
- compare tours
- create/read own inquiries
- read own quotes
- request quote modifications
- read own bookings/payment status/documents
  Agent capabilities should include permitted operations such as:
- summarize customer inquiries
- inspect assigned inquiries/tours
- prepare quote drafts
- create Standard / Premium / Advance quote variants
- suggest itinerary/customization changes
- use the existing pricing engine
- create/update permitted tours and quotes
- inspect assigned bookings/payments
- upload/manage permitted booking documents
  Agency admins may manage resources within their agency according to existing permissions.
  Master admins may perform platform-level operations according to existing admin permissions.
  Never allow one agent/agency/customer to access another user's or agency's private data unless explicitly authorized.
  TREM AI must NEVER invent operational TravelsTREM data.
  Tours, packages, hotels, availability, departures, prices, quotes, fees, bookings, payments, customers, agencies, documents, and statuses must always come from existing APIs/services/database.
  If the DB/service returns no result, say that it is unavailable/not found instead of generating fictional data.
  The LLM may understand intent, reason, summarize, compare, explain, recommend among returned records, and decide which approved tool to call, but it must never become the source of truth for operational data or calculations.
  Pricing must always use the existing TravelsTREM pricing engine.
  Create a reusable TREM AI module containing:
- AI orchestrator
- LLM provider abstraction so the model/provider can be replaced later
- structured function/tool calling
- role-aware tool registry
- conversation/session context
- current tour/inquiry/quote/booking context
- validation
- authorization
- error handling
- logging/audit trail
- rate limiting/security
- prompt-injection protection
- safe output/data filtering
  Build a clean RAG/knowledge layer only for relatively static information such as TravelsTREM policies, FAQs, cancellation rules, destination information, booking/quote documentation, and approved internal documentation.
  Never use RAG/model memory for live operational data.
  For sensitive operations such as:
- sending/accepting quotes
- changing prices
- modifying confirmed bookings
- payments/refunds
- destructive CRUD
- other financially sensitive actions
  use:
  AI request → RBAC/ownership check → validation → explicit confirmation → existing service/engine → audit log
  TREM AI should never directly modify the database by bypassing the existing service/business layer.
  Users should be able to naturally ask things like:
- “Plan a 6-day Bali honeymoon under ₹1.5 lakh.”
- “Show premium Dubai packages.”
- “Compare these tours.”
- “What is included in this quote?”
- “Request airport transfers.”
- “What is my booking status?”
  TREM AI should understand the request, call the correct existing tools/services, and return grounded structured results.
  Support tools equivalent to existing functionality such as:
  searchTours, getTourDetails, compareTours, createInquiry, getInquiry, getQuote, requestQuoteModification, getBooking, getBookingStatus, getUploadedDocuments.
  Do not force these exact function names if better existing services/functions already exist.
  Agents should be able to ask TREM AI to:
- summarize an inquiry
- understand customer requirements
- inspect the selected/base tour
- suggest itinerary changes
- prepare Standard / Premium / Advance quote variants
- calculate using the existing pricing engine
- create quote drafts
- review bookings and payment status
  TREM AI should assist the agent but respect all existing workflow/status/permission rules.
  Integrate TREM AI into the existing portals using the current frontend architecture, Trem UI components, design tokens, icons, and patterns.
  Do not redesign the application.
  Create a polished conversational experience supporting:
- chat history
- session context
- loading/tool-execution states
- error states
- structured tour cards
- comparison results
- quote summaries
- inquiry context
- booking/payment status
- document/status results
- contextual CTA actions
  The same TREM AI system must automatically behave differently based on authenticated portal/role/context.
  Implement:
  User message → authenticated context → TREM AI → permitted tool selection → RBAC/ownership validation → existing TravelsTREM service/engine → validated/filtered result → AI response/structured UI → optional next action
  Support multi-step conversations while preserving relevant tour/inquiry/quote/booking context within the authorized session.
  Before coding, inspect the full repository and determine the correct integration points yourself.
  Prefer minimal production-quality changes. Do not create parallel architecture if equivalent functionality already exists. Do not perform unrelated refactors, repeated builds, unnecessary tests, or cosmetic cleanup.
  When implementation is complete, provide only a concise summary of:

1. architecture/components added
2. files changed
3. TREM AI tools/capabilities
4. role/portal permission behavior
5. API endpoints added/changed
6. required environment variables
7. how to run and verify the complete end-to-end TREM AI flow
