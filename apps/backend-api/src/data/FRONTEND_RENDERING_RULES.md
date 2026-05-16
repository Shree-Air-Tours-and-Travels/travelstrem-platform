# Frontend Rendering Rules

Frontends are render-only consumers of backend page contracts.

## Flow

```text
Backend response
  -> useComponentData()
  -> resolve labels / urls / structure refs
  -> build resolvedView
  -> presentational component
```

`useComponentData()` returns:

```js
{
  structure,
  elements,
  dataScope,
  data,
  resolvedView
}
```

Preferred usage:

```jsx
const { resolvedView } = useComponentData("/pages/customer-shell/home");
return <Page data={resolvedView} />;
```

## Components

Views may:

- render fields already present in `data`
- render `resolvedView.structure`
- emit callbacks supplied by containers

Views may not:

- fetch page content themselves
- own business copy
- hardcode display labels or URLs
- duplicate page JSON locally
- embed page-specific nav arrays or CTA strings

## Future-Proofing

This keeps widget rendering ready for localization, A/B testing, white-label portals, theme overrides, partner-specific pages, and AI-generated layouts without changing presentational components.
