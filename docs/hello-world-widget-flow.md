# Hello World Widget — Flow Documentation

This document describes the end-to-end flow of the **Hello World widget** rendering lifecycle — from backend API to frontend render.

## Overview

The Hello World widget is a demonstration widget built to validate the widget-driven architecture of the TravelsTREM platform. It follows the server-driven UI pattern:

```
Backend JSON Contract → API Route → WidgetRegistry → WidgetRenderer → React Component
```

---

## Files Involved

### Backend (`apps/backend-api`)

| File | Role |
|---|---|
| `src/constants/routes.js` | Defines `HELLO_WORLD` route constant as `/api/hello-world.json` |
| `src/modules/portal/helloWorldRoutes.js` | Express router; single `GET /` that delegates to controller |
| `src/modules/portal/controllers/helloWorldController.js` | Calls `pageDefinitionService.buildWidgetResponse()` and returns the JSON response |
| `src/services/pageDefinitionService.js` | Reads JSON data file, resolves labels/refs, builds a structured widget response |
| `src/data/customer-shell/home/widgets/hello-world.json` | Static JSON data contract for the hello world widget (labels, structure, props) |
| `src/data/customer-shell/home/page.json` | Home page-level contract; lists `helloWorld` in its `structure.widgets` array with `widgetRef` pointing to the hello-world JSON |
| `src/bootstrap/routes.js` | Registers `helloWorldRoutes` at `API_ROUTES.HELLO_WORLD` |
| `src/config/pageConfig.js` | Static page config that maps route `"/"` to home page widgets; includes `{ type: "helloWorld", source: "shell" }` |

### Frontend — customer shell (`apps/customer-shell`)

| File | Role |
|---|---|
| `src/Featured/HelloWorld/helloWorld.jsx` | Presentational React component; calls `useComponentData("/hello-world.json")`, reads `componentData.structure.title` and `.description`, renders Title + SubTitle |
| `src/Featured/HelloWorld/helloWorld.scss` | Styles for hello world section (dashed border, centered layout, loader/error states) |
| `src/widgets/registry/widgetRegistry.jsx` | Maps widget type `"helloWorld"` (aliases `"hello.world"`, `"helloWorld"`) to the `HelloWorld` component |
| `src/widgets/WidgetRenderer.jsx` | Generic renderer: looks up widget definition from registry, resolves props via `getWidgetRenderProps()`, renders the component inside `Suspense` |
| `src/pages/homePage/home.jsx` | Home page that feeds `fallbackWidgets` (includes `{ type: "helloWorld", source: "shell" }`) into `WidgetRenderer` |

---

## Rendering Flow (Step by Step)

```
User visits "/"
       │
       ▼
Home.jsx
  ├─ Reads pageConfig from PortalConfigContext (fetched via /api/page-config)
  ├─ If empty, uses fallbackWidgets array (includes helloWorld)
  └─ Passes widgets[] to WidgetRenderer
       │
       ▼
WidgetRenderer.jsx
  ├─ Iterates each widget config
  ├─ Calls normalizeWidgetConfig() for type/id/props
  ├─ Looks up definition from shellWidgetRegistry.get("helloWorld")
  ├─ Resolves render props via getWidgetRenderProps()
  └─ Renders <HelloWorld {...props} /> inside Suspense
       │
       ▼
helloWorld.jsx (Frontend component)
  ├─ Calls useComponentData("/hello-world.json")
  │      │
  │      ▼
  │   HTTP GET → Backend /api/hello-world.json
  │      │
  │      ▼
  │   helloWorldRoutes.js → helloWorldController.js
  │      │
  │      ▼
  │   pageDefinitionService.buildWidgetResponse(
  │     "customer-shell/home",
  │     "./widgets/hello-world.json",
  │     {}
  │   )
  │      │
  │      ▼
  │   Reads hello-world.json data file
  │   Returns resolved JSON with labels + structure
  │
  ├─ Checks loading/error states
  ├─ Reads componentData.structure.title (from "helloTitle" label)
  ├─ Reads componentData.structure.description (from "helloDescription" label)
  └─ Renders <Title> + <SubTitle> inside .ui-hello-world section
```

## Data Contract Shape

### `hello-world.json` (served at `/api/hello-world.json`)

```
{
  "status": "success",
  "component": {
    "elements": {
      "labels": {
        "helloTitle": "Hello World!",
        "helloDescription": "This is a dummy widget ..."
      }
    },
    "structure": {
      "widgets": [
        {
          "type": "helloWorld",
          "props": {
            "titleRef": "helloTitle",
            "descriptionRef": "helloDescription",
            "source": "shell"
          }
        }
      ]
    }
  }
}
```

## Key Files Summary

```
Backend data files:
  apps/backend-api/src/data/customer-shell/home/page.json
  apps/backend-api/src/data/customer-shell/home/widgets/hello-world.json

Backend API wiring:
  apps/backend-api/src/constants/routes.js
  apps/backend-api/src/modules/portal/helloWorldRoutes.js
  apps/backend-api/src/modules/portal/controllers/helloWorldController.js
  apps/backend-api/src/bootstrap/routes.js

Frontend presentational component:
  apps/customer-shell/src/Featured/HelloWorld/helloWorld.jsx
  apps/customer-shell/src/Featured/HelloWorld/helloWorld.scss

Frontend page & widget wiring:
  apps/customer-shell/src/pages/homePage/home.jsx
  apps/customer-shell/src/widgets/WidgetRenderer.jsx
  apps/customer-shell/src/widgets/registry/widgetRegistry.jsx
```
