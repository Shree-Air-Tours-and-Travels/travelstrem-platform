# Turborepo Monorepo Architecture (Module Federation)

This project uses a **Turborepo monorepo** with **Webpack Module Federation** to support a micro frontend architecture.

---

# Shell Applications

**Definition:**  
Host applications that own layout, session management, and route orchestration.

Two shell applications exist:

| Shell                  | Port   | Module Federation Name | Role                                                        |
| ---------------------- | ------ | ---------------------- | ----------------------------------------------------------- |
| `apps/customer-shell/` | `3000` | `frontendShell`        | Customer portal — loads `toursTREM` remote                  |
| `apps/admin-shell/`    | `3002` | —                      | Standalone admin portal (Module Federation not enabled yet) |

---

## Customer Shell Responsibilities

The customer shell owns:

- Application layout
- Session management
- Route resolution
- Page configuration
- Remote orchestration
- Widget rendering

### Key Files

#### Layout & Routing

- `apps/customer-shell/src/app/AppLayout.jsx`  
  Layout with header, footer, and route container

- `apps/customer-shell/src/app/routes.jsx`  
  Resolves shell-native and remote routes

---

#### Providers

- `apps/customer-shell/src/app/providers/PortalProvider.jsx`  
  Provides:
  - session state
  - header config
  - page config context

---

#### Federation

- `apps/customer-shell/src/federation/FederatedMicroApp.jsx`  
  Generic Module Federation remote loader

- `apps/customer-shell/src/federation/FederatedToursApp.jsx`  
  Wrapper specifically for the Tours remote

---

#### Widgets

- `apps/customer-shell/src/widgets/registry/widgetRegistry.jsx`  
  Registry for shell-native + federated widgets

- `apps/customer-shell/src/widgets/WidgetRenderer.jsx`  
  Renders widgets from backend JSON definitions

---

#### Configuration

- `apps/customer-shell/modulefederation.config.js`  
  Module Federation configuration

  References:
  - `toursTREM`

---

#### Backend-controlled Shell Data

- `apps/backend-api/src/config/header.js`

Contains:

```js
routeMap = {
  "/": "shell",
  "/about": "shell"
};

Used to determine which routes belong to shell vs remotes.

apps/backend-api/src/data/customer-shell/

Contains server-driven page definitions.

Remote Applications

Definition:
Micro frontends dynamically loaded via Webpack Module Federation.

Current status:

Remote	Port	Module Federation Name	Exposes
apps/tours-remote/	3001	toursTREM	ToursApp, TourCard, BookingWidget, ReviewWidget, TourFilters, WidgetRegistry
apps/admin-shell/	3002	adminTREM (planned)	Not configured yet
Tours Remote Responsibilities

Owns:

Tour routes
Tour widgets
Embedded/standalone behavior
Remote component exposure
Key Files
App Entry
apps/tours-remote/src/app/App.jsx

Handles:

embedded mode
standalone mode

Behavior controlled via props.

Routes
apps/tours-remote/src/app/routes.jsx

Routes vary based on:

embedded usage
standalone usage
Webpack / Federation
apps/tours-remote/craco.config.js

Contains Webpack + Module Federation setup

apps/tours-remote/modulefederation.config.js

Exposes remote modules via:

remoteEntry.js
Widgets
apps/tours-remote/src/widgets/registry/widgetRegistry.jsx

Remote-owned widget registry

Backend Data
apps/backend-api/src/data/tours-remote/

Contains:

tour listing pages
detail pages
booking definitions
Runtime Interaction Flow
1. Backend Serves Configuration

Backend endpoint:

/header-config

Returns:

routeMap
remote definitions
2. Shell Builds Routes

PortalProvider

Responsibilities:

fetch header config
resolve route ownership
dynamically construct routes
3. Route Loads Remote

Visiting:

/tours/*

Flow:

FederatedToursApp
        ↓
FederatedMicroApp
        ↓
load toursTREM/remoteEntry.js
4. Remote Runs Embedded

tours-remote renders in embedded mode:

no header
no footer
no session ownership

Uses:

basename="/tours"
5. Shell Uses Remote Widgets Inline

Shell widget registry can directly consume remote components:

Examples:

TourCard
BookingWidget

This allows remote widgets inside shell-owned pages.

6. Cross-App Communication

Communication occurs through:

trem-events

Event bus examples:

USER_LOGOUT
SESSION_TOKEN_READY

Used for:

session sync
authentication updates
cross-app events
High-Level Architecture
Backend API
    ↓
Header Config + RouteMap
    ↓
Customer Shell
    ↓
PortalProvider
    ↓
Dynamic Routes
    ↓
FederatedToursApp
    ↓
FederatedMicroApp
    ↓
toursTREM remoteEntry.js
    ↓
Tours Remote
```
