# Engineering rules for developers and Codex agents

## Backend framework

- Keep transport parsing in routes/controllers, authorization in policy/middleware, business decisions in domain services, persistence constraints in models, and external calls behind provider adapters.
- Resolve tenant, environment and integration profile on the backend. Never accept a database, credential, provider endpoint or authoritative entitlement from the browser.
- Pass explicit tenant context into timers, queues, schedules, exports and workers. A background handler must fail closed when tenant context is absent.
- Keep pricing, tax, commission, payment amounts, validation, sanitization and persistence backend-owned. Use `FinancialEngine` and integer minor units for money.
- Extend the existing integration registry and domain provider interfaces. Activation requires a safe live connection test; configuration presence is not provider acceptance.
- Store credential references in profiles and values in encrypted deployment secret storage. Never log or return secret values.

## Trem design system and packages

- Search existing workspace packages before adding app-local components or utilities. Shared production UI belongs in `trem-ui`; reusable logic belongs in the package that already owns that concern.
- Design-token source is `packages/trem-design-tokens/src/tokens`. Never edit generated Sass directly. After a token change run `pnpm tokens:generate` and the targeted `pnpm tokens:check`.
- Use semantic tokens instead of raw product colors, spacing or typography in shared components. Tenant branding is a validated runtime override, not a fork of the design system.
- Keep package APIs backward compatible unless the task explicitly changes the contract. Do not make cross-app edits only for visual consistency.
- Packages must not import application code. Applications may consume packages through their public exports.
- Do not add frontend business rules to shared UI. Components render backend-authored state and return user intent.

## Storybook

- Storybook is the reference and review surface for reusable `trem-ui` components, not a second implementation.
- Add or update a story whenever a shared component's public visual state changes. Reuse the real component, tokens and public props; do not copy production markup into a story.
- Cover only meaningful supported states: default, loading, empty, error, disabled, long content, relevant theme and narrow viewport. Use deterministic fixtures with no network, credentials or customer data.
- Place stories in `packages/trem-standard-ui-library` and import components from package public exports.
- Run `pnpm storybook` for local review. Run `pnpm build:storybook` only when a static Storybook build is required for the change or release.

## Change discipline

- Inspect minimally, preserve unrelated work, make the smallest scoped change and use targeted validation.
- Do not add dependencies, destructive migrations, broad refactors, generated-file edits or repository-wide validation unless the task requires them.
- Update the relevant architecture or deployment document when changing a public contract, security boundary or operational requirement.
