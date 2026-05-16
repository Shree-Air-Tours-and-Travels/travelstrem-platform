# TravelsTREM Page Definition Consistency Rules

## Contract

Every server-driven page lives under `src/data/<app>/<page>/page.json` and returns:

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

`data` stores DB-backed business data only. `dataScope.options` stores option sets resolved from persisted backend data. `elements.labels` owns visible copy. `elements.urls` owns only URLs used by that page or widget. `structure` owns composition and may only point to copy through refs such as `titleRef`, `labelRef`, or `ctaLabelRef`.

## Scope Precedence

Page output is resolved in this order:

1. shared defaults
2. page definition
3. remote overrides
4. feature overrides
5. environment metadata

Later scopes override earlier scopes for labels and URLs. Feature overrides may replace the widget structure for experiments, localization variants, white-label portals, or partner pages.

## Allowed

```json
{
  "type": "button",
  "labelRef": "bookNow"
}
```

## Forbidden

```json
{
  "type": "button",
  "label": "Book Now"
}
```

Do not add visible copy to JSX, widget structures, local frontend JSON files, or route constants. Backend page definitions are the content source of truth.

Each section is a widget contract. A page file composes widget refs; the referenced widget JSON owns its labels, URLs, structure, config, and actions.

## Validation

`pageContractValidator` checks:

- schema shape
- missing label and URL refs
- unresolved structure refs
- visible string literals embedded in structure

`pageDefinitionService` validates definitions before they leave the backend.

## Controller Pattern

Controllers inject only dynamic data:

```js
const page = pageDefinitionService.buildPageResponse("tours-remote/details", {
  injectData: { tour, tours: [tour] },
});
return res.json(page);
```

Controllers should not manually rebuild label sets, URL maps, or widget trees.
