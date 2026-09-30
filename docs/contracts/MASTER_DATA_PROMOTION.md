# Master data promotion

Business/reference choices used by Tour CRUD are stored in MongoDB's
`masteroptionsets` collection. Agent and Admin clients load the same option-set
keys through `useTourBuilderContract`; they do not carry fallback business
lists. UI wording and schema invariants remain versioned code, while editable
choices, ordering and process navigation are master data.

## Export from the source environment

Run from `apps/backend-api` with that environment's `MONGO_URI`:

```bash
npm run master-data:export > master-data.json
```

The export excludes Mongo IDs and timestamps, making it portable.

## Validate against production

Set the production `MONGO_URI`, then run the import without `--apply`:

```bash
npm run master-data:import -- ./master-data.json
```

Dry-run exits with code `2` and prints the exact keys that would be upserted.
No data is changed.

## Apply

```bash
npm run master-data:import -- ./master-data.json --apply
```

Import uses keyed upserts. It does not delete option sets that exist only in
the target database.

## Reset behavior

`npm run reset:empty-database -- --apply` preserves `masteroptionsets`, the
single master administrator, authentication identity, product records and
platform configuration. It is disabled when `NODE_ENV=production`.

## Tour CRUD master keys

- Tour steps, required fields and operations sections
- Package type, departure status and Tour status
- Flexible pricing model and accommodation tier
- Commercial component type, pricing unit, status, tier and substeps
- Currency and price-source provenance
- Extra categories

The backend enum remains the final integrity boundary. Master data controls
what users may choose; schema enums prevent invalid persisted values.

## Agent draft visibility

An Agent process save creates an owner-private Tour with `status: draft`,
`isPublished: false`, `agentTour: true`, and `ownerAgent` set to the authenticated
Agent. Only that owner receives the draft in management queries and can resume,
edit or delete it. Master Admin and partner-admin queries exclude it. Public
Tour details, widgets and price previews also return not found for unpublished
records. Once the owner submits the Tour into the approval/publishing workflow,
it leaves the private-draft state and becomes visible to the appropriate review
role.
