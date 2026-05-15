# Page Definition Architecture - Consistency Rules

## 1. Base Schema Contract

Every page definition MUST follow this envelope:

```json
{
  "status": "success",
  "component": {
    "data": {
      "title": "",
      "subtitle": "",
      "description": "",
      "itemIds": []
    },
    "elements": {
      "labels": {},
      "urls": {}
    },
    "structure": {}
  }
}
```

### Field Rules

| Field | Rule | Example |
|-------|------|---------|
| `status` | Always `"success"` at rest. Controllers may override to `"error"` | `"success"` |
| `component.data` | Dynamic business content only. No UI strings. | `{ "title": "Our Popular Tour Packages", "itemIds": ["id1"] }` |
| `component.data.title` | Page-level heading. Overridable by controllers. | `"Admin Dashboard"` |
| `component.data.subtitle` | Optional secondary heading. | `"Find your perfect adventure"` |
| `component.data.description` | Page-level description/metadata. | `"View and manage all platform bookings."` |
| `component.data.itemIds` | Array of resource IDs for this page. Populated by controllers. | `["tour_123", "tour_456"]` |
| `component.elements.labels` | ALL user-visible text. Every string must be here. | `{ "bookNow": "Book Now" }` |
| `component.elements.urls` | ALL URLs (image sources, links, endpoints). | `{ "logoUrl": "/logo.png" }` |
| `component.structure` | Component composition tree. No hardcoded UI strings. | `{ "widgets": [...] }` |

---

## 2. Label Rules (No Hardcoded Strings)

### Rule 2a: All UI text in elements.labels

Every string displayed to the user MUST exist in `elements.labels`. This includes:
- Button text, link text
- Headings, titles, subtitles
- Placeholder text, helper text
- Error messages, success messages
- Tooltips, ARIA labels
- Dropdown option labels
- Table column headers

✅ CORRECT:
```json
{
  "elements": {
    "labels": {
      "bookNow": "Book Now",
      "contactAgent": "Contact Agent",
      "viewMore": "View More"
    }
  },
  "structure": {
    "widgets": [{
      "type": "button",
      "props": { "labelRef": "bookNow" }
    }]
  }
}
```

❌ INCORRECT:
```json
{
  "structure": {
    "widgets": [{
      "type": "button",
      "props": { "text": "Book Now" }
    }]
  }
}
```

### Rule 2b: labelRef naming convention

Use descriptive kebab-case or camelCase keys:

```
bookNow                        ✅
contactAgent                   ✅
heroTitle                      ✅
filterByStatus                 ✅
noToursFound                   ✅
```

### Rule 2c: No dynamic label generation

Do not construct labels in controllers or frontends. All labels must be resolved from the page definition.

---

## 3. Data Section Rules

### Rule 3a: Business data only

`component.data` contains ONLY dynamic business content:
- Page title/heading
- Entity IDs
- Metadata (dates, counts, statuses)
- References to external resources

### Rule 3b: No UI presentation in data

Do not put display-related fields in `data`. Use `elements.labels` for display text and `structure` for layout.

❌ INCORRECT:
```json
{
  "data": {
    "title": "Our Tours",
    "buttonColor": "blue",
    "showBadge": true,
    "cardLayout": "grid"
  }
}
```

✅ CORRECT:
```json
{
  "data": {
    "title": "Our Tours",
    "itemIds": []
  },
  "structure": {
    "widgets": [{
      "type": "TourGrid",
      "props": { "layout": "grid", "showBadge": true }
    }]
  }
}
```

---

## 4. Structure Rules

### Rule 4a: Widget composition

Define page composition as a list of widgets:

```json
{
  "structure": {
    "widgets": [
      { "type": "Hero", "props": { "titleRef": "heroTitle" } },
      { "type": "TourGrid", "props": { "emptyLabelRef": "noTours" } }
    ]
  }
}
```

### Rule 4b: Reference labels by ref

All widget props that reference UI text must use `*Ref` suffix:
- `labelRef`
- `titleRef`
- `subtitleRef`
- `ctaLabelRef`
- `emptyLabelRef`
- `placeholderRef`

### Rule 4c: Structure is static

The widget tree should remain stable between deployments. Dynamic visibility or conditional rendering should be controlled via `props.visible` or similar boolean flags, not by removing widgets.

---

## 5. URL Rules

### Rule 5a: All URLs in elements.urls

Every URL used by the page must be listed in `elements.urls`:

```json
{
  "elements": {
    "urls": {
      "logoUrl": "/logo-images/travelsTrem-header-logo.png",
      "defaultTourImage": "/tour-images/tour-img01.jpg"
    }
  }
}
```

### Rule 5b: Structure references URLs via urlRef

```json
{
  "structure": {
    "widgets": [{
      "type": "Image",
      "props": { "srcRef": "defaultTourImage" }
    }]
  }
}
```

---

## 6. Controller Rules

### Rule 6a: Controllers load, don't construct

Controllers should call `pageDefinitionService` and only inject dynamic data:

```javascript
const page = pageDefinitionService.buildPageResponse("customer-shell/home", {
  injectData: { title: dynamicTitle },
});

return res.json(page);
```

### Rule 6b: Controllers may override

| Override | Purpose |
|----------|---------|
| `injectData` | Override dynamic data fields |
| `injectLabels` | Override/supplement labels |
| `injectUrls` | Override/supplement URLs |
| `remoteOverrides` | Provide remote-specific overrides |

### Rule 6c: Error responses

On error, preserve the page definition structure:

```javascript
const page = pageDefinitionService.buildPageResponse("customer-shell/home");
page.status = "error";
page.message = "Failed to fetch tours";
return res.status(500).json(page);
```

---

## 7. Data Scoping Rules

### Rule 7a: Resolution order

Labels and URLs are resolved in this order (later overrides earlier):

1. **Shared** (`data/shared.json`) - App-wide defaults
2. **Page** (`data/{app}/{page}/page.json`) - Page-specific definitions
3. **Remote Override** (injected at request time) - Micro-frontend overrides
4. **Environment** (from config/index.js) - Environment-specific values
5. **Controller Injection** (at response time) - Dynamic data from controllers

### Rule 7b: shared.json

Contains labels and URLs that are common across ALL pages. Only generic items:
- "Loading...", "Error", "Retry"
- App name, logo URL
- Shared navigation text ("Home", "About", "Login")

---

## 8. White-Label Rules

### Rule 8a: Brand-specific overrides

For white-label deployments:
1. Create a brand-specific overrides JSON
2. Pass it as `remoteOverrides` to the page definition service
3. Only override labels that differ from defaults

```javascript
const brandOverrides = {
  elements: {
    labels: {
      appName: "Partner Travels",
      bookNow: "Reserve Now",
    },
    urls: {
      logoUrl: "/partner-logo.png",
    },
  },
};

pageDefinitionService.resolvePage(req, res, "home", {
  remoteOverrides: brandOverrides,
});
```

---

## 9. Localization Rules

### Rule 9a: Labels enable i18n

Because all UI text is in `elements.labels`, localization is a matter of swapping the labels object:

```javascript
const locale = req.headers["accept-language"] || "en";
const translations = localeMap[locale];

pageDefinitionService.resolvePage(req, res, "home", {
  injectLabels: translations,
});
```

### Rule 9b: Do not localize data

`component.data` must contain locale-agnostic business data. All user-facing strings must be in `elements.labels`.

---

## 10. Validation Rules

### Rule 10a: Every labelRef must resolve

Every `*Ref` property in `structure` must have a corresponding key in `elements.labels`.

### Rule 10b: No orphan labels

Every key in `elements.labels` should be referenced by at least one `labelRef` in `structure` (or be contextually understood as shared).

### Rule 10c: Schema validation

Use the `schemaValidation` middleware to enforce contract compliance automatically:
- Validates required fields
- Checks for hardcoded strings in structure
- Validates labelRef resolution

---

## 11. Migration Path

### Phase 1: Create page definitions
- Move all UI text from controllers/JSON configs into `data/{app}/{page}/page.json`
- Use the `@examples/` files as reference

### Phase 2: Update controllers
- Remove hardcoded label construction
- Use `pageDefinitionService.buildPageResponse()` to build response envelopes
- Pass only dynamic business data

### Phase 3: Frontend adoption
- Frontend reads `component.elements.labels` for all UI text
- Frontend uses `component.structure.widgets` for WidgetRenderer
- Remove hardcoded strings from frontend components

### Phase 4: Advanced features
- Localization via label injection
- White-label via remoteOverrides
- A/B testing via service-level label switching

---

## 12. Folder Structure

```
apps/backend-api/src/data/
├── index.json              # Page registry (maps keys → files)
├── shared.json             # Shared labels and URLs
├── customer-shell/
│   ├── home/page.json
│   ├── profile/page.json
│   ├── tours/page.json
│   └── checkout/page.json
├── tours-remote/
│   ├── listing/page.json
│   └── details/page.json
├── admin-shell/
│   ├── dashboard/page.json
│   └── bookings/page.json
└── examples/
    ├── hero-migration.controller.js
    ├── tours-migration.controller.js
    └── page-definition-route.js
```

---

## 13. Quick Reference

| Do | Don't |
|----|-------|
| Put all UI text in `elements.labels` | Hardcode strings in `structure` |
| Use `labelRef` to reference labels | Use literal strings in widget props |
| Use `*Ref` suffix for label references | Reference labels without suffix |
| Keep structure static and semantic | Generate structure from data |
| Use pageDefinitionService to build responses | Manually construct component payloads |
| Override only what changes | Duplicate the entire definition |
| Reference URLs via `urls` section | Inline URLs in structure |
