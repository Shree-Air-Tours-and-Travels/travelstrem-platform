# trem-process-engine

Reusable deterministic process kernel for backend-owned, resumable workflows.

## Hierarchy

`process → stages (steps) → subSteps → children → widgets`

Every node has a stable `id`, label, optional `requiredFields`, child collections and presentation metadata. The engine is UI- and database-independent.

## API

- `flattenProcessNodes(definition)` returns the ordered process tree.
- `validateProcessNode(definition, nodeId, data)` validates a node or parent subtree.
- `getProcessStages(definition)` returns the top-level, navigable stages.
- `applyProcessAction(definition, persistedState, action)` supports `SAVE`, `SUBMIT_AND_NEXT`, `BACK`, and `GO_TO`. Only stages participate in navigation; descendants remain useful for validation and rendering metadata.
- `getProcessSnapshot(definition, persistedState)` returns node statuses, safe previous/next navigation, completed stage IDs, and percentage progress.

Required fields support presence, item limits, enabled-item limits, numeric bounds, and patterns. A product can attach backend-only validator functions to a stage. The kernel contains no Tour, Quote, React, HTTP, or database logic.

Persistence belongs to the consuming backend. Definition keys and versions are stored with state so workflows can evolve safely. TravelsTREM stores Tour Builder state in `Tour.builderProcess`; Quote Builder can reuse the same state and action contract with its own definition.
