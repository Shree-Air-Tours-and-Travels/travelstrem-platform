# System architecture

## Repository topology

TravelsTREM is a pnpm/Turborepo monorepo. Deployable applications live in `apps/`; reusable libraries live in `packages/`; the marketing website lives in `website/`; operational scripts live in `scripts/`.

```mermaid
flowchart TB
    Website[Marketing website]
    Auth[auth-trem]
    Shell[app-shell]
    Admin[admin-shell]
    Agent[agent-shell]
    Dashboard[dashboard-remote]
    Products[trevio / trevista / trehub remotes]
    Payment[payment-app]
    API[backend-api]
    Shared[shared packages]
    Mongo[(MongoDB)]
    Redis[(Redis)]
    External[Providers / SMTP / Storage / Gateway]
    Website --> Auth
    Auth --> API
    Shell --> Dashboard
    Shell --> Products
    Admin --> API
    Agent --> API
    Dashboard --> API
    Products --> API
    Payment --> API
    Shared --> Shell
    Shared --> Admin
    Shared --> Agent
    Shared --> Products
    API --> Mongo
    API --> Redis
    API --> External
```

## Runtime request pipeline

```mermaid
flowchart LR
    R[Tenant request] --> T[Resolve runtime tenant]
    T --> TC[Load tenant configuration]
    TC --> IP[Load active TenantIntegrationProfile]
    IP --> PC[Resolve product and capability]
    PC --> DB[Use deployment-bound tenant DB]
    DB --> AR[Resolve provider/payment/storage/email adapter]
    AR --> AC[Validate user and role access]
    AC --> BF[Execute business flow]
    BF --> AU[Audit and realtime events]
```

The API middleware rejects browser-driven tenant switching, disabled products/modules and platform-only routes in a tenant runtime. The integration profile is stored in request-scoped asynchronous context so factories resolve the correct tenant without accepting tenant identifiers from business inputs.

## Database isolation

The platform database contains the client registry, platform staff, product catalogue and provisioning metadata. Each tenant database contains a restricted runtime tenant snapshot plus that tenant's users, bookings, enquiries, payments, notifications, support and product data.

```mermaid
flowchart TB
    Platform[(Platform database)] --> Registry[clients and registrations]
    Platform --> Catalogue[product catalogue]
    Platform --> Provision[provisioning secret references]
    Provision --> TenantA[(Tenant A database)]
    Provision --> TenantB[(Tenant B database)]
    TenantA --> AData[A users and operations]
    TenantB --> BData[B users and operations]
```

Tenant runtime MongoDB users must have collection-scoped privileges derived from enrolled products. Provisioning credentials and runtime credentials are separate. The tenant database cannot be the platform database.

## Configuration ownership

- Platform-owned: client registry, licences, provisioning, supported adapters and platform branding.
- Tenant-owned: company identity, theme, tenant users and enabled integration profile choices.
- Deployment-owned secrets: database URI and actual provider credentials in environment/KMS/secret manager.
- Backend-owned runtime decisions: access, adapter resolution, pricing, quote snapshots and payment transitions.

## Resilience boundaries

Provider failures must become stable domain errors. No adapter may leak upstream credentials or raw sensitive payloads. Supplier operations use timeouts and request governors where implemented. Payment webhooks are authoritative and idempotent. Realtime is supplementary; persisted state remains authoritative.
