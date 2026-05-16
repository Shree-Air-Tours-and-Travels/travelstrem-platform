# Codex Implementation Rules — TravelsTREM

This document defines mandatory implementation rules for Codex across the TravelsTREM monorepo.

Codex must read and follow this document BEFORE creating, moving, deleting, refactoring, or generating code.

Failure to follow these rules means the task is incomplete.

---

# Rule 1: Every implementation must create/update documentation

Any newly created feature, widget, flow, route, API, module, backend system, frontend rendering chain, page-definition structure, service, migration, or architecture change MUST generate documentation.

Documentation is mandatory.

Create under:

```
docs/
```

Use naming:

```
docs/<feature-name>-flow.md
```

Examples:

- docs/hello-world-widget-flow.md
- docs/tours-page-flow.md
- docs/booking-engine-flow.md
- docs/page-definition-system.md
- docs/chatbot-state-flow.md

---

# Rule 2: Documentation format is standardized

Every generated document MUST use this structure:

# Feature Name — Flow Documentation

## Overview

Describe:

- purpose
- business role
- architectural purpose
- why feature exists

Include flow:

```
Backend JSON Contract
→ API Route
→ Service Layer
→ Render Layer
→ Component
```

or equivalent architecture chain.

---

## Files Involved

Separate sections:

### Backend

| File | Role |
| ---- | ---- |

### Frontend

| File | Role |
| ---- | ---- |

Include all important files.
No hidden logic.

---

## Rendering / Execution Flow

Always generate diagrams.

Backend example:

```txt
User Action
    ↓
Page
    ↓
Route
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Frontend example:

```txt
Page
 ↓
WidgetRenderer
 ↓
Registry
 ↓
Component
 ↓
API
 ↓
Backend
```

Never summarize the execution chain.

---

## Data Contract Shape

Provide actual payloads:

```json
{}
```

Must represent real implementation.

No placeholders.

---

## Key Files Summary

Provide final map:

```txt
apps/backend-api/...
apps/customer-shell/...
```

---

## Architecture Notes

Explain:

- registry usage
- state handling
- label refs
- page definition rules
- dynamic rendering rules
- ownership boundaries
- performance considerations

---

# Rule 3: Documentation updates are mandatory

If implementation changes existing behavior:

- update documentation
- never leave stale docs

Examples:

- adding routes
- changing payloads
- moving files
- changing widget props
- architecture refactors

---

# Rule 4: File move tracking

When files move, add:

## Migration Notes

Old:

```
apps/backend-api/src/services/pageDefinitionService.js
```

New:

```
apps/backend-api/src/modules/pageDefinitions/pageDefinitionService.js
```

Reason:

Ownership moved into pageDefinitions domain.

---

# Rule 5: Merge/delete tracking

If files are merged or removed:

## Deleted Files

```txt
old/file.js
```

Include reason.

## Merged Files

```txt
A.js + B.js
→ mergedService.js
```

Explain why.

---

# Rule 6: Architecture decisions must be documented

When introducing:

- repositories
- validators
- bootstrap
- constants
- core
- shared systems

Generate:

```
docs/architecture-change-<feature>.md
```

Include:

- Before
- After
- Reason
- Benefits
- Tradeoffs

---

# Rule 7: Avoid undocumented magic

No file or folder may appear without explanation.

Examples:

- controllers/
- repositories/
- validators/
- core/
- bootstrap/

Everything requires documentation.

---

# Rule 8: Keep documentation synchronized

After implementation Codex must:

1. detect affected docs
2. update docs
3. generate missing docs
4. print changed docs list

Example:

Created:

- docs/tours-page-flow.md

Updated:

- docs/page-definition-system.md
- docs/booking-engine-flow.md

---

# Rule 9: Final implementation output

After task completion print:

A) Created files

B) Deleted files

C) Merged files

D) Modified files

E) Documentation created

F) Final tree

G) Architecture summary

---

# Rule 10: Simplification and merge-first policy

Codex must actively simplify architecture.

Rules:

- Merge tiny files when separation adds no value
- Merge duplicate services
- Merge duplicate helpers
- Remove dead code
- Remove unused wrappers
- Remove unused exports/imports
- Collapse folders containing only one tiny file
- Prefer fewer meaningful files over excessive file counts

Examples:

```
filtersController.js + filtersRoutes.js
→ filters.module.js
```

```
staticPayload.js
→ tourService.js
```

Always explain:

- what was merged
- why it was merged
- why separate ownership was unnecessary

---

# Rule 11: Documentation quality rules

Never write vague descriptions like:

"handles logic"

Instead explain exact behavior.

Never omit:

- file names
- flows
- ownership
- payload structures

Documentation must allow a new engineer to understand the system without reading implementation code.

---

# Usage

Every Codex command should begin with:

```bash
codex --full-auto "
Read docs/CODEX_IMPLEMENTATION_RULES.md first.
Strictly follow every rule before implementation.
"
```

This document acts as a mandatory engineering contract for all future implementation work.
