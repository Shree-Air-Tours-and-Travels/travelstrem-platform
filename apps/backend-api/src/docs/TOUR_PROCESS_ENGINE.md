# Tour Process Engine

Tour CRUD is a backend-owned resumable process powered by `@packages/trem-process-engine`.

## Endpoints

- `GET /api/tours.json/process/definition` returns steps, substeps, widgets and initial statuses.
- `POST /api/tours.json/process/action` accepts `{ tourId?, nodeId, payload }`, validates the submitted process node, persists a draft and returns the next node.

The first successful Basics action creates a regular Tour with `status: draft` and `isPublished: false`. It is scoped using the same agency/owner fields as every other Tour, appears in existing management lists, and can be reopened. Later actions update the same `_id` and `builderProcess` snapshot.

The REST process endpoint and the backend-driven renderer now import the same versioned definition from `modules/tours/builder/stepDefinitions.js`; there is no parallel tour workflow to drift. Parent actions validate and complete their required descendants, while navigation advances only through top-level stages.

The final Review action continues through the existing Tour submit/update path, where complete Tour validation and publishing permissions remain authoritative.
