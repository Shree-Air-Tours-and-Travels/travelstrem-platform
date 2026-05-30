# TravelsTREM — Business Logic & System Reference

Version: v1
Purpose: Internal team + Codex agents reference

---

# 1. Vision

TravelsTREM is not only a travel booking website.

TravelsTREM is a travel operating platform connecting:

- Customers
- Travel Agents / Partners
- Travel Providers
- Internal agency team

TravelsTREM acts as a gateway between demand and inventory.

Flow:

Customer → TravelsTREM → Agents → Providers

or

Customer → TravelsTREM → Providers

Goal:
Provide one platform where:

- users get a modern experience
- agents get tools
- providers get customers
- TravelsTREM earns a platform fee

---

# 2. Business Model

Traditional:

User → Agent → TBO → Provider

Problems:

- Agent searches multiple platforms
- Manual package creation
- Weak communication flow
- Scattered booking details
- Limited tracking

TravelsTREM solution:

User → TravelsTREM → Agent → Provider

TravelsTREM becomes the operating layer.

TravelsTREM earns:

- platform fee
- booking markup
- service charges
- commissions

Providers earn:

- provider fee

Agents earn:

- commission/service charge

Users receive:

- unified experience
- notifications
- package tracking
- documents
- support

---

# 3. User Types

## Customer

Can:

- search tours
- search flights
- search hotels
- request custom packages
- upload documents
- choose agent assistance
- track bookings
- receive notifications

---

## Agent Partner

Not TravelsTREM employees.

Partners using platform tools.

Can:

- manage own customers
- create packages
- search providers
- manage bookings
- add own tours
- upload quotations
- earn commissions

Restrictions:

Can only modify:

- own tours
- own packages
- own bookings

Cannot modify global system data.

---

## Internal Agency Agents

Initial bootstrap team from:

Shree Air Tours and Travels

Purpose:

Handle:

- direct users
- fallback bookings
- package creation

Used when:

No external partner available.

---

## Admin

Full access.

Can:

- manage users
- verify agents
- approve agents
- manage providers
- business dashboards
- support management
- analytics
- assignment management

---

## Support Team

Future module.

Responsibilities:

- ticket management
- refund support
- disputes
- escalation

---

# 4. Platform Flows

## Flow A

Existing agent customer

User
↓
Agent
↓
Agent Shell
↓
Backend
↓
Provider

---

## Flow B

Direct TravelsTREM customer

User
↓
Customer Shell
↓
Backend
↓
Provider

---

## Flow C

Customer wants assisted booking

User
↓
Customer Shell
↓
Request Agent
↓
Assignment Engine
↓
Agent
↓
Backend
↓
Provider

---

# 5. Agent Assignment Logic

If user requests assistance:

Step 1:
Assign internal agents.

Priority:

Shree Air Tours agents.

Step 2:
If all agents unavailable:

Search verified partners.

Step 3:
Assign available partner.

Step 4:
Notify customer.

Example:

"We are assigning an agent. Please wait."

---

# 6. Core System Principle

Frontend NEVER communicates directly with:

- TBO
- providers
- airlines
- hotels

Frontend ONLY talks to:

Backend API

Flow:

Frontend
↓
Backend
↓
Provider APIs
↓
Normalize
↓
Return common contract

---

# 7. Universal Contract Principle

Never expose provider response formats.

Bad:

Frontend knows TBO fields.

Good:

Backend transforms everything.

Universal example:

TourContract

{
 id,
 title,
 image,
 price,
 source,
 duration,
 type
}

Frontend only renders contract.

Never provider-specific structure.

---

# 8. Core References

System uses:

userRef
agentRef
providerRef
tourRef
bookingRef
requestRef
paymentRef
documentRef
notificationRef

---

# 9. Core Entity Models

Users
Agents
Tours
Packages
Bookings
BookingRequests
Flights
Hotels
Documents
Notifications
Payments
SupportTickets
Providers

---

# 10. Main Backend Engines

backend-api

provider-engine
assignment-engine
booking-engine
workflow-engine
pricing-engine
package-builder
document-engine
notification-engine
analytics-engine

---

# 11. Shell Architecture

## Customer Shell

Modules:

- Tours
- Flight Search
- Hotel Search
- Visa & Passport
- Shared Cab
- Booking Tracking
- Notifications
- Documents

---

## Agent Shell

Modules:

- Tour Management
- Flight Management
- Hotel Management
- Visa Management
- Cab Management
- Customer Requests
- Package Builder
- Commission Dashboard

---

## Admin Shell

Modules:

- Tour Management
- Flight Management
- Hotel Management
- Visa Management
- Cab Management
- Agent Management
- Support
- Business Dashboard

---

## Support Shell

Future

Modules:

- ticket management
- refund support
- escalation

---

# 12. Remote Modules

Customer:

1. Tours
2. Flight Search
3. Hotel Search
4. Visa
5. Cab

Agent:

1. Tours Management
2. Flights Management
3. Hotel Management
4. Visa Management
5. Cab Management

Admin:

1. Tours Management
2. Flights Management
3. Hotel Management
4. Visa Management
5. Cab Management
6. Agent Management
7. Support
8. Dashboard

---

# 13. Future Provider Integrations

Potential:

TBO
Amadeus
Hotels APIs
Airline APIs
Visa providers
Cab providers

Rule:

All provider integrations go through adapters.

Never direct frontend usage.

---

# 14. Architectural Rules

Rule 1:
Frontend never knows provider.

Rule 2:
Backend is source of truth.

Rule 3:
All provider responses normalized.

Rule 4:
Assignment engine decides agents.

Rule 5:
All actions tracked.

Rule 6:
Everything reference-driven.

Rule 7:
Build workflows, not pages.

Rule 8:
Think platform first.

---

End of v1

