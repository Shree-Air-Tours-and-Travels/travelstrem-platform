# Page Creation Contract , TravelsTREM

This document defines the **mandatory standards and flow** for creating any new page (or adding a page to an existing shell). Every human developer and AI agent **must** follow this contract when implementing a new page.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Page Creation Flow](#2-the-page-creation-flow)
3. [Step 1 — Screen Design & Data Analysis](#3-step-1--screen-design--data-analysis)
4. [Step 2 — Component Audit](#4-step-2--component-audit)
5. [Step 3 — Page Contract JSON (Backend)](#5-step-3--page-contract-json-backend)
6. [Step 4 — Widget Contract JSONs (Backend)](#6-step-4--widget-contract-jsons-backend)
7. [Step 5 — Page Registration (Backend)](#7-step-5--page-registration-backend)
8. [Step 6 — Frontend: Container / View](#8-step-6--frontend-container--view)
9. [Step 7 — Widget Registration (Frontend)](#9-step-7--widget-registration-frontend)
10. [Step 8 — Route Registration (Frontend)](#10-step-8--route-registration-frontend)
11. [Label & Static Data Rules](#11-label--static-data-rules)
12. [Widget Independence Rules](#12-widget-independence-rules)
13. [Verification Checklist](#13-verification-checklist)

---

## 1. Architecture Overview

```
Backend JSON Contract (page.json)
    ↓
API Route → PageDefinitionService → DataScopeResolver
    ↓                                        ↓
Widget JSONs merged via _expandWidgetRefs    Labels merged (shared → page → widget → override)
    ↓
Response (validated against page.schema.json)
    ↓
Frontend useComponentData() hook
    ↓
buildResolvedView() — resolves all *Ref → actual label/url values
    ↓
Container (orchestration, data fetching)
    ↓
View (pure UI)
    ↓
WidgetRenderer (if multiple widgets)
    ↓
Per-widget component from registry
```

**Key principle:** The Page JSON is the orchestrator. Widgets are independently defined — each has its own JSON, its own data lifecycle, and its own Controller/Container/View. No cross-widget coupling.

---

## 2. The Page Creation Flow

```
Screen Design
    ↓
1. DATA ANALYSIS — Identify dynamic vs static data
    ↓
2. COMPONENT AUDIT — Reuse from trem-ui or design new reusable widgets
    ↓
3. FE PAGE CONTRACT — FE dev writes the page.json defining widget layout
    ↓
4. BACKEND REGISTRATION — Register page in data/index.json + pathMap + aliases
    ↓
5. WIDGET JSONs — Each widget gets its own JSON with labels, props, *Ref mapping
    ↓
6. FRONTEND CONTAINER — Create Container (data fetching via useComponentData)
    ↓
7. FRONTEND VIEW — Create View (pure UI, uses resolved labels, no hardcoded strings)
    ↓
8. WIDGET REGISTRY — Register widget type in shellWidgetRegistry
    ↓
9. ROUTE REGISTRATION — Add route in routes.jsx + componentByKey
    ↓
10. VERIFICATION — Run lint, typecheck, verify backend serves correct JSON
```

---

## 3. Step 1 — Screen Design & Data Analysis

Before writing any code, analyze the screen design and classify every piece of content:

### Classification Table

| Category          | Definition                                           | Example                                     | Where it lives                                  |
| ----------------- | ---------------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| **Static text**   | Labels, headings, descriptions, CTAs, error messages | "Contact Us", "Submit", "Full Name"         | `elements.labels` in JSON, resolved via `*Ref`  |
| **Static URLs**   | Image paths, icon names, links                       | `/images/contact-hero.jpg`                  | `elements.urls` in JSON, resolved via `*urlRef` |
| **Static config** | Enums, options, dropdown values, layout flags        | Sort options, tab names                     | `dataScope.options` in JSON                     |
| **Dynamic data**  | User-specific, API-driven, database content          | Bookings list, user profile, search results | `data` in JSON + widget controller              |
| **Structure**     | Layout order, widget types, section placement        | Which widgets render, in what order         | `structure.widgets` array in JSON               |

### Rule

All static text **must** use the `*Ref` → label resolution system. No hardcoded strings in views.

Exception: purely presentational icons (icon names in `iconRef` are not resolved — they pass through as-is).

---

## 4. Step 2 — Component Audit

Check existing `@packages/trem-ui` for reusable components:

| Question                                                      | Action                             |
| ------------------------------------------------------------- | ---------------------------------- |
| Does the screen design use a component already in trem-ui?    | Use it directly                    |
| Is there a similar component that can be extended with props? | Extend with new props              |
| Is the component entirely new but reusable across pages?      | Add to `@packages/trem-ui`         |
| Is the component unique to this page/widget?                  | Keep in `features/<page>/` locally |

### trem-ui available components

`Button`, `Title`, `SubTitle`, `Paragraph`, `Icon`, `Gallery`, `HighlightSpan`, `ContactForm`, `GlobalLoader`, `PortalPreloader`, `Footer`, `ProfileActionMenu`, `Header`, `Dropdown`, `SmoothScroll`, `TourCard`, `BookingSummaryCard`, `BottomSheet`, `Breadcrumbs`, `InputField`, `FloatingActionBar`, `EmptyState`, `QuickChips`

### Rule

Introduce a new trem-ui component only when the pattern appears in **2+ pages/shells**. Otherwise, keep it local to the feature.

---

## 5. Step 3 — Page Contract JSON (Backend)

Every page needs a **page contract** at `apps/backend-api/src/data/<shell>/<page>/page.json`.

### Structure

```json
{
  "status": "success",
  "component": {
    "data": {},
    "dataScope": {
      "options": {}
    },
    "elements": {
      "labels": {},
      "urls": {}
    },
    "structure": {
      "header": {},
      "widgets": [],
      "config": {},
      "actions": []
    }
  }
}
```

### Rules

- **`data`** — Reserved for dynamic data payloads (usually empty in the contract file; populated at runtime by the controller)
- **`dataScope.options`** — Static configuration options (enums, toggles, layout flags)
- **`elements.labels`** — All static text strings keyed by camelCase identifiers (e.g., `"contactTitle": "Contact Us"`)
- **`elements.urls`** — Static URL references (images, links)
- **`structure.header`** — Page-level metadata (title, description, etc.) using `*Ref` keys
- **`structure.widgets`** — Array of widget entries, each with:
  - `type` — Matches a registered widget type in the frontend registry
  - `source` — `"shell"` or `"federated"`
  - `widgetRef` — Path to the widget's JSON file relative to the page directory
  - `props` — (optional) Inline props if the widget is simple enough
- **`structure.config`** — Page-level configuration
- **`structure.actions`** — Global page actions (e.g., "Print", "Share")

### Page Contract — Minimal Example

```json
{
  "status": "success",
  "component": {
    "data": {},
    "dataScope": { "options": {} },
    "elements": {
      "labels": {
        "pageTitle": "Contact Us",
        "pageDescription": "Get in touch with our travel experts."
      },
      "urls": {}
    },
    "structure": {
      "header": {
        "titleRef": "pageTitle",
        "descriptionRef": "pageDescription"
      },
      "widgets": [
        {
          "type": "contactForm",
          "source": "shell",
          "widgetRef": "./widgets/contact-form.json"
        },
        {
          "type": "officeLocations",
          "source": "shell",
          "widgetRef": "./widgets/office-locations.json"
        }
      ],
      "config": {},
      "actions": []
    }
  }
}
```

---

## 6. Step 4 — Widget Contract JSONs (Backend)

Each widget gets its own JSON at `apps/backend-api/src/data/<shell>/<page>/widgets/<widget-name>.json`.

### Structure

Same top-level shape as page.json:

```json
{
  "status": "success",
  "component": {
    "data": {},
    "dataScope": { "options": {} },
    "elements": {
      "labels": {},
      "urls": {}
    },
    "structure": {
      "header": {},
      "widgets": [
        {
          "type": "<widgetType>",
          "props": {}
        }
      ],
      "config": {},
      "actions": []
    }
  }
}
```

### Rules

- Every `*Ref` key (except `iconRef`, `optionsRef`, `widgetRef`) is resolved at runtime by `useComponentData` → `buildResolvedView()` to its label/url value
- Dynamic data placeholders use a `data` array (injected by widget controller at runtime)
- Widget JSONs are merged into the page response by `PageDefinitionService._expandWidgetRefs()`
- Labels cascade: `shared.json` → page `elements.labels` → widget `elements.labels` → runtime overrides

### Widget Props — *Ref Mapping Convention

```json
{
  "type": "contactForm",
  "props": {
    "text": {
      "titleRef": "contactTitle",
      "descriptionRef": "contactDescription",
      "submitLabelRef": "submitLabel"
    },
    "fields": [{ "name": "name", "labelRef": "fieldNameLabel", "type": "text" }],
    "ctas": {
      "primary": { "labelRef": "ctaPrimaryLabel", "href": "/submit" }
    }
  }
}
```

After `buildResolvedView()` resolves the refs, the view receives:

```json
{
  "title": "Contact Us",
  "description": "We'd love to hear from you",
  "submitLabel": "Send Message",
  "fields": [{ "name": "name", "label": "Full Name", "type": "text" }]
}
```

---

## 7. Step 5 — Page Registration (Backend)

Register the page in `apps/backend-api/src/data/index.json`:

```json
{
  "pages": {
    "<shell>/<page>": {
      "app": "<shell>",
      "page": "<page>",
      "file": "./<shell>/<page>/page.json"
    }
  },
  "pathMap": {
    "/<route>": "<shell>/<page>"
  },
  "aliases": {
    "<alias>": "<shell>/<page>"
  }
}
```

### Files to modify

| File                                    | Action                                   |
| --------------------------------------- | ---------------------------------------- |
| `apps/backend-api/src/data/index.json`  | Add to `pages`, `pathMap`, and `aliases` |
| `apps/backend-api/src/config/header.js` | (if new route mapping is needed)         |
| Create `data/<shell>/<page>/page.json`  | Page contract                            |
| Create `data/<shell>/<page>/widgets/`   | Directory for widget JSONs               |

---

## 8. Step 6 — Frontend: Container / View

### File Structure

```
features/<page>/
  Page.jsx                   -> export { default } from "./Page.container"
  Page.container.jsx         -> Data fetching, state, business logic
  Page.view.jsx              -> Pure UI, no data logic, no hardcoded strings
  Page.styles.scss           -> Styles
  sections/                  -> (optional) Sub-sections if page is complex
```

### Container Pattern

```jsx
import { useComponentData } from "@packages/trem-utils";
import PageView from "./Page.view";

export default function PageContainer() {
  const { loading, error, resolvedView } = useComponentData("/pages/<shell>/<page>", {
    headers: {},
    params: {},
  });

  // Extract widgets from resolvedView
  const widgets = resolvedView?.structure?.widgets || [];

  if (loading) return <PageView loading error={null} widgets={[]} />;
  if (error) return <PageView loading={false} error={error} widgets={[]} />;
  if (!resolvedView) return null;

  return <PageView loading={false} error={null} widgets={widgets} />;
}
```

### View Pattern

```jsx
import { WidgetRenderer } from "../../widgets/WidgetRenderer";

export default function PageView({ loading, error, widgets }) {
  if (loading) return <PagePreloader />;
  if (error) return <ErrorState message={error} />;

  return (
    <main className="page">
      <WidgetRenderer widgets={widgets} />
    </main>
  );
}
```

### Rules for Views

1. **No data fetching** — All data arrives via props
2. **No hardcoded strings** — All text comes from resolved labels in widget props
3. **No `useState` for data** — Only UI state (e.g., `contactOpen`, `activeTab`)
4. **Render all states** — loading, error, empty, and success
5. **Skeleton/preloader** is preferred during loading (not a spinner)

### Simple Page (single widget, no WidgetRenderer)

If the page has exactly one widget or a tightly coupled layout, the Container can extract props directly and pass them to the View without using `WidgetRenderer`. Example: `About` page extracts `widget.props` and spreads into View.

### Complex Page (multiple independent widgets)

If the page has multiple independent widgets, use `WidgetRenderer` which iterates `structure.widgets`, resolves each through the registry, and renders them independently.

---

## 9. Step 7 — Widget Registration (Frontend)

### If the page IS the widget (single widget page)

Register the entire page component in `apps/customer-shell/src/widgets/registry/widgetRegistry.jsx`:

```jsx
createWidgetDefinition({
  type: "contactUs",
  aliases: ["contact", "page.contact"],
  component: ContactPage,
});
```

### If the page has multiple widgets

Each widget component needs to be registered separately:

```jsx
createWidgetDefinition({
  type: "contactForm",
  aliases: ["form.contact"],
  component: ContactFormWidget,
});
```

### Key fields

| Field       | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| `type`      | Primary identifier (used in `widget.type` in JSON)                     |
| `aliases`   | Alternative names (used for backwards compatibility)                   |
| `component` | The React component                                                    |
| `source`    | `WIDGET_SOURCES.FEDERATED` for remote widgets; omitted for shell-local |
| `mapProps`  | Optional function to inject context (e.g., `withUser`)                 |

---

## 10. Step 8 — Route Registration (Frontend)

Add the route in `apps/customer-shell/src/app/routes.jsx`:

### 1. Add import

```jsx
import Contact from "../features/contact/Contact";
```

### 2. Add to `componentByKey`

```jsx
const componentByKey = {
  // ... existing
  contact: <Contact />,
};
```

### 3. Add route fallback (in the fallback `<Routes>` section)

```jsx
<Route path="/contact" element={<Contact />} />
```

---

## 11. Label & Static Data Rules

### Label Resolution Chain

```
shared.json (app-wide defaults)
    ↓
page.json elements.labels (page-specific)
    ↓
widget.json elements.labels (widget-specific)
    ↓
remote overrides (from federated modules)
    ↓
feature overrides
    ↓
environment overrides (dev/staging/prod)
```

Later sources override earlier ones.

### *Ref Resolution (buildResolvedView)

The `resolveNode` function processes every key ending with `Ref` (except `iconRef`, `optionsRef`, `widgetRef`):

| Key suffix      | Resolved from       | Example                          |
| --------------- | ------------------- | -------------------------------- |
| `Ref` (generic) | `elements.labels`   | `titleRef` → `title`             |
| `urlRef`        | `elements.urls`     | `imageUrlRef` → `imageUrl`       |
| `optionsRef`    | `dataScope.options` | `sortOptionsRef` → `sortOptions` |
| `labelRef`      | `elements.labels`   | `ctaLabelRef` → `ctaLabel`       |

### When to use *Ref vs hardcoded values

| Scenario                 | Approach                           |
| ------------------------ | ---------------------------------- |
| User-facing text         | **Must** use `*Ref`                |
| API error messages       | **Must** use `*Ref`                |
| Icon names               | Hardcoded in `icon` (not resolved) |
| URLs that change per env | **Must** use `*urlRef`             |
| Static demo/mock data    | `*Ref` with fallback value         |
| Page structural config   | Hardcoded in `props`               |

### Adding new shared labels

If the label is useful across multiple pages, add it to `apps/backend-api/src/data/shared/shared.json`.

---

## 12. Widget Independence Rules

Every widget on a page is **fully independent**:

1. **Each widget has its own JSON file** — Own labels, props, data contract
2. **Each widget has its own container** — Its own data fetching, error handling, loading state
3. **Each widget has its own view** — Renders independently, no shared state
4. **Each widget can fail independently** — One widget's error does not break others
5. **Wiring happens in page.json** — The page JSON defines which widgets render and in what order

### Backend widget expansion flow

```
PageDefinitionService
    ↓
_readPageFile(page.json)             → reads page contract
    ↓
_expandWidgetRefs(widgets, baseDir)  → reads each widgetRef JSON
    ↓
_mergeWidgetIntoPage(page, widget)   → merges widget labels/options into page
    ↓
DataScopeResolver.resolve()          → merges shared + page + widget labels
    ↓
Response
```

### Frontend widget rendering flow

```
useComponentData("/pages/<shell>/<page>")
    ↓
buildResolvedView(component) → resolves all *Ref → actual values
    ↓
Container passes structure.widgets to View
    ↓
WidgetRenderer iterates widgets array
    ↓
normalizeWidgetConfig(rawWidget, index)  → normalizes config
    ↓
registry.get(widget.type) → resolves definition + component
    ↓
getWidgetRenderProps(definition, widget, context) → merges defaultProps + widget.props + mapProps
    ↓
<Rendering each widget independently in Suspense>
```

---

## 13. Complete Example: "Contact Us" Page

### File tree

```
apps/backend-api/src/data/
  index.json                                    ← register page + path + alias
  customer-shell/contact/
    page.json                                   ← page contract
    widgets/
      contact-form.json                         ← widget 1 contract
      office-locations.json                     ← widget 2 contract

apps/customer-shell/src/
  features/contact/
    Contact.jsx                                 ← re-export
    Contact.container.jsx                       ← useComponentData
    Contact.view.jsx                            ← WidgetRenderer
    contact.scss
  widgets/registry/widgetRegistry.jsx           ← register widget types
  app/routes.jsx                                ← add route
```

### Backend: `data/customer-shell/contact/page.json`

```json
{
  "status": "success",
  "component": {
    "data": {},
    "dataScope": { "options": {} },
    "elements": {
      "labels": {
        "pageTitle": "Contact Us",
        "pageSubtitle": "We'd love to hear from you"
      },
      "urls": {}
    },
    "structure": {
      "header": {
        "titleRef": "pageTitle",
        "subtitleRef": "pageSubtitle"
      },
      "widgets": [
        { "type": "contactForm", "source": "shell", "widgetRef": "./widgets/contact-form.json" },
        {
          "type": "officeLocations",
          "source": "shell",
          "widgetRef": "./widgets/office-locations.json"
        }
      ],
      "config": {},
      "actions": []
    }
  }
}
```

### Backend: `data/index.json` additions

```json
{
  "pages": {
    "customer-shell/contact": {
      "app": "customer-shell",
      "page": "contact",
      "file": "./customer-shell/contact/page.json"
    }
  },
  "pathMap": {
    "/contact": "customer-shell/contact"
  },
  "aliases": {
    "contact": "customer-shell/contact"
  }
}
```

### Frontend: `features/contact/Contact.container.jsx`

```jsx
import React from "react";
import { useComponentData } from "@packages/trem-utils";
import ContactView from "./Contact.view";

export default function ContactContainer() {
  const { loading, error, resolvedView } = useComponentData("/pages/customer-shell/contact", {
    headers: {},
    params: {},
  });

  const widgets = resolvedView?.structure?.widgets || [];

  return <ContactView loading={loading} error={error} widgets={widgets} />;
}
```

### Frontend: `features/contact/Contact.view.jsx`

```jsx
import React from "react";
import WidgetRenderer from "../../widgets/WidgetRenderer";
import "./contact.scss";

export default function ContactView({ loading, error, widgets }) {
  if (loading) return null;
  if (error) return <div>{error}</div>;

  return (
    <main className="contact-page">
      <WidgetRenderer widgets={widgets} />
    </main>
  );
}
```

---

## 14. Verification Checklist

Use this checklist to verify every new page implementation:

### Backend

- [ ] `data/<shell>/<page>/page.json` created with valid schema
- [ ] `data/<shell>/<page>/widgets/` directory created
- [ ] Each widget has its own JSON file with `*Ref` → label mapping
- [ ] `data/index.json` updated with `pages`, `pathMap`, `aliases`
- [ ] Backend serves JSON correctly at `/pages/<shell>/<page>`
- [ ] Response passes `page.schema.json` validation
- [ ] All static text uses labels (no hardcoded strings in JSON)

### Frontend

- [ ] `features/<page>/` directory created with Container/View pattern
- [ ] Container uses `useComponentData()` to fetch page contract
- [ ] View handles loading, error, empty, and success states
- [ ] View has **no hardcoded strings** — all text from resolved props
- [ ] View has **no data fetching** — all data arrives via props
- [ ] Widget type(s) registered in `widgetRegistry.jsx`
- [ ] Route added to `routes.jsx` (`componentByKey` + `<Route>`)
- [ ] re-export file (`Page.jsx`) created
- [ ] Stylesheet created and imported in View
- [ ] `npm run lint` passes (or equivalent)
- [ ] `npm run typecheck` passes (or equivalent)

### Architecture

- [ ] Widgets are independent — one widget's failure does not block others
- [ ] No cross-widget coupling
- [ ] trem-ui reused where possible; new components added only if reusable across 2+ pages
- [ ] Labels follow resolution chain (shared → page → widget → override)
