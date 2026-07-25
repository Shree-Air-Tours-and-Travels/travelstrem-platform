


# TravelsTREM Platform

Product architecture and migration rules are documented in [docs/product-architecture.md](docs/product-architecture.md). TravelsTREM is the parent platform; Trevio and Trevista are the active customer-facing products.

A scalable monorepo architecture powering the TravelsTREM ecosystem using Micro Frontends (MFE), shared packages, and modular backend services.

---

# Overview

TravelsTREM is designed as a platform-level architecture consisting of:

- Parent company website and independent product applications
- Admin operational platform
- Shared backend API
- Shared UI & utility packages
- Independent deployments
- Shared database infrastructure

The system is built using:

- React
- Module Federation
- Node.js
- Express
- MongoDB
- Turborepo
- pnpm workspaces

---

# Platform Architecture

┌──────────────────────────────────────────────┐
│                Frontend Layer               │
├──────────────────────────────────────────────┤
│                                              │
│  travelstrem.in                              │
│  └── TravelsTrem parent website              │
│       ├── Product discovery                  │
│       ├── About / Contact / Help             │
│       └── Shared platform capabilities       │
│                                              │
│  trevio.travelstrem.in                       │
│  └── Trevio                                  │
│                                              │
│  trevista.travelstrem.in                     │
│  └── Trevista                                │
│                                              │
│  admin.travelstrem.in                        │
│  └── Unified admin portal                    │
│       ├── DashboardTREM                      │
│       ├── Trevio operations                  │
│       ├── Trevista operations                │
│       ├── Partners                           │
│       ├── Payments                           │
│       └── Support / Reports                  │
│                                              │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│                Backend Layer                │
├──────────────────────────────────────────────┤
│                                              │
│          api.travelstrem.com                 │
│                                              │
│   Shared Modular Backend API                 │
│                                              │
│   Modules:                                   │
│   - auth                                     │
│   - users                                    │
│   - tours                                    │
│   - bookings                                 │
│   - analytics                                │
│   - notifications                            │
│   - admin                                    │
│                                              │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│                Database Layer               │
├──────────────────────────────────────────────┤
│                                              │
│                 MongoDB                      │
│                                              │
└──────────────────────────────────────────────┘

---

# Repository Structure

travelstrem-platform/
│
├── apps/
│   │
│   ├── customer-shell/
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── admin-shell/
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── trevista-remote/
│   │   ├── src/
│   │   ├── federation/
│   │   └── package.json
│   │
│   └── backend-api/
│       ├── src/
│       │   ├── modules/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── services/
│       │   └── config/
│       │
│       └── package.json
│
├── packages/
│   │
│   ├── trem-ui/
│   │   ├── components/
│   │   ├── styles/
│   │   └── package.json
│   │
│   ├── trem-utils/
│   │   ├── helpers/
│   │   └── package.json
│   │
│   ├── trem-config/
│   │   ├── eslint/
│   │   ├── prettier/
│   │   ├── tsconfig/
│   │   └── package.json
│   │
│   └── trem-types/
│       ├── dto/
│       ├── enums/
│       ├── interfaces/
│       └── package.json
│
├── infra/
│   │
│   ├── docker/
│   ├── nginx/
│   ├── deployment/
│   └── github-actions/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md

---

# Why Monorepo?

This architecture provides:

- Shared dependency management
- Shared UI system
- Shared TypeScript contracts
- Easier cross-app refactoring
- Faster local development
- Independent deployments
- Better scalability

---

# Application Responsibilities

## TravelsTrem Parent Website

Handles:

- company homepage
- product discovery
- about, contact, help, and platform pages
- authentication entry points
- shared profile, wallet, rewards, support, and platform capabilities

Domain:
travelstrem.com

---

## Admin Shell

Handles:

- admin authentication
- dashboards
- tour management
- user moderation
- analytics
- reporting
- CMS
- operations

Domain:
admin.travelstrem.com

---

## Backend API

Handles:

- authentication
- authorization
- RBAC
- tour APIs
- booking APIs
- analytics APIs
- notifications
- audit logs

Domain:
api.travelstrem.com

---

# Shared Packages

## trem-ui

Shared design system.

Contains:

- Button
- Input
- Modal
- Typography
- Layout components
- Table
- Loader
- Theme tokens
- Shared SCSS utilities

---

## trem-utils

Reusable utilities.

Contains:

- date helpers
- formatting
- validators
- API utilities
- constants

---

## trem-types

Shared TypeScript contracts.

Contains:

- DTOs
- interfaces
- enums
- API response types

Used by:
- frontend
- backend

---

## trem-config

Shared configurations.

Contains:

- eslint configs
- prettier configs
- tsconfig base
- environment validation

---

# Micro Frontend Strategy

TravelsTREM uses Module Federation.

Example:

The parent website routes users into independent products:

- Trevio
- Trevista

Admin Shell may later dynamically load:

- AnalyticsTREM
- BookingManagementTREM
- TourManagementTREM

Benefits:

- independent deployments
- scalable architecture
- isolated domains
- faster team scaling

---

# Backend Architecture

The backend remains a SINGLE modular API service initially.

Recommended structure:

src/modules/
│
├── auth/
├── users/
├── tours/
├── bookings/
├── analytics/
├── notifications/
└── admin/

Benefits:

- shared business logic
- centralized authentication
- simpler deployments
- easier maintenance
- reduced duplication

---

# Security Architecture

## Public APIs

/api/public/*

Used by customer applications.

---

## Admin APIs

/api/admin/*

Protected using:

- RBAC
- JWT validation
- permission middleware
- audit logging

---

# Authentication Flow

Customer Login
    ↓
JWT Issued
    ↓
Customer APIs Accessible

Admin Login
    ↓
Admin JWT Issued
    ↓
Permission Validation
    ↓
Admin APIs Accessible

---

# Deployment Architecture

Each application deploys independently.

Example:

| Application | Deployment |
|-------------|------------|
| customer-shell | Vercel |
| admin-shell | Vercel |
| trevista-remote | Vercel |
| backend-api | Render |
| MongoDB | Atlas |

---

# Recommended Tooling

## Package Manager

pnpm

Reason:
- fast
- optimized for monorepos
- disk efficient

---

## Monorepo Orchestrator

Turborepo

Reason:
- excellent React support
- optimized caching
- scalable pipelines
- easy workspace management

---

Future Scalability

Future services may include:

notification-worker
payment-worker
recommendation-engine
AI-search-service
media-service

without changing the core architecture.

Architectural Principles
Shared backend platform
Independent frontend applications
Shared UI system
Shared TypeScript contracts
API-driven communication
RBAC-first admin security
Incremental MFE adoption
Monorepo-based development
Current Recommended Growth Path

Phase 1

Customer shell
Tours MFE
Shared backend

Phase 2

Admin shell
Shared UI package
Shared types package

Phase 3

Additional MFEs
Analytics platform
Worker services

Phase 4

Advanced infra
Kubernetes
CDN optimization
Event-driven architecture
Important Architectural Rules
DO
share UI primitives
share types
share configs
keep one backend initially
use RBAC middleware
deploy independently
DO NOT
directly access database from frontend
tightly couple customer/admin apps
create multiple backend services too early
initialize git separately inside apps
Final Vision

TravelsTREM is evolving into:

Consumer Travel Platform
Admin Operations Platform
Shared API Platform
Shared Design System
Modular Frontend Ecosystem

designed for long-term scalability and enterprise-grade growth.


# Local Development

Install dependencies:

```bash
pnpm install

-----------------------------------------------
Run all apps:

pnpm dev

Run specific app:

pnpm --filter customer-shell dev

Run backend only:

pnpm --filter backend-api dev
