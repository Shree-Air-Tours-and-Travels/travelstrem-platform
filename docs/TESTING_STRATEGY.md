# Testing Strategy

## Overview

Two parallel test runners serve different parts of the monorepo:

| Runner   | Scope                    | Config                    | Environment |
|----------|--------------------------|---------------------------|-------------|
| **vitest** | Pure-JS packages         | `vitest.config.mjs`       | Node / jsdom |
| **Jest**   | CRA apps (customer-shell) | inherited from react-scripts | jsdom       |

---

## 1. Package Tests (vitest)

**Affected workspaces:** `@packages/trem-utils`, `@packages/trem-ui`

### Infrastructure

Each package contains:
- `vitest.config.mjs` — configures runner, glob pattern, environment, and module aliases.
- `test-setup.js` (*trem-ui only*) — imports `@testing-library/jest-dom/vitest` matchers and registers `afterEach(cleanup)` to prevent DOM leakage between tests (vitest does **not** auto-cleanup like Jest does).
- Dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.

### Conventions

- **Directory:** `src/__tests__/*.test.js` or `src/__tests__/*.test.jsx`
- **Pure JS tests** (utils): no environment needed, run in Node.
  ```js
  import { describe, it, expect } from 'vitest';
  ```
- **React component tests** (UI): use `jsdom` environment + `@testing-library/react`.
  ```js
  import { render, screen } from '@testing-library/react';
  import { describe, it, expect } from 'vitest';
  ```

### What We Test

| Package        | File                          | Tests | Scope |
|----------------|-------------------------------|-------|-------|
| `trem-utils`   | `filterUtils.test.js`         | 35    | Validation rules, option lists, filter counts, cross-field validation |
| `trem-utils`   | `calculateRating.test.js`     | 7     | Star rating aggregation (empty, single, multiple, boundary/edge) |
| `trem-utils`   | `slugify.test.js`             | 8     | Whitespace, special chars, edge cases |
| `trem-ui`      | `Button.test.jsx`             | 7     | Renders, anchor link, disabled, className, onClick, type attribute |
| `trem-ui`      | `BookingSummaryCard.test.jsx` | 5     | Minimal, price, dates, route, total label |
| `trem-ui`      | `TourCard.test.jsx`           | 8     | Title, link, article role, featured badge, admin controls, heart icon, location, price |
| `trem-ui`      | `FavoritesContext.test.jsx`   | 2     | Provides default context, throws outside provider |

### Run

```bash
pnpm --filter @packages/trem-utils run test    # 50 tests
pnpm --filter @packages/trem-ui run test       # 22 tests
```

---

## 2. Integration Tests (Jest / CRA)

**Affected workspaces:** `@apps/customer-shell`

### Infrastructure

Because `craco test` does not automatically forward its own Babel config to Jest for JSX in test files:

- **`babel.config.js`** — `presets: ['react-app']` enables JSX parsing during test runs.
- **`package.json` `moduleNameMapper`** — resolves `@packages/trem-utils` and `@packages/trem-ui` to their source so Jest can find them.
- **No separate config file** — Jest is configured through `package.json` and `babel.config.js`. Inherits `resetMocks: true` from CRA defaults.

### Conventions

- **Directory:** `src/**/__tests__/*.test.jsx` (standard CRA convention)
- **File:** `Checkout.integration.test.jsx`
- Uses `@testing-library/react` (bundled with CRA, no extra install needed).

### What We Test

| File                              | Tests | Scope |
|-----------------------------------|-------|-------|
| `Checkout.integration.test.jsx`   | 9     | Loading state, error state, not-found, full checkout render, Pay button (PAYMENT_PENDING), Get quote (QUOTE_SENT), empty travelers, summary sidebar, Back navigation |

### Run

```bash
CI=true pnpm --filter @apps/customer-shell exec -- npx react-scripts test --watchAll=false --env=jsdom
```

---

## 3. Choosing Between vitest and Jest

| Situation                              | Use      | Reason                              |
|----------------------------------------|----------|-------------------------------------|
| Pure JS package with no React          | vitest   | Fast, zero config, no DOM overhead  |
| React component library/package        | vitest   | Fast, esbuild-based transform       |
| Full-page integration in a CRA app     | Jest     | Must run inside the app's Jest setup |
| App that ships with CRA/react-scripts  | Jest     | No extra tooling, matches CI        |

---

## 4. Key Design Decisions

- **`afterEach(cleanup)` is explicit in vitest** because vitest does not auto-register DOM cleanup like Jest does. Without this, rendered components accumulate across tests, causing duplicate-text errors.
- **`@testing-library/jest-dom/vitest`** import path is used instead of `@testing-library/jest-dom` because vitest does not inject `expect` globally the same way Jest does.
- **`resetMocks: true`** (CRA default) does not affect manually created mocks inside test functions, only auto-mocked modules from `jest.mock()`. Our tests create mocks inline, so they are unaffected.
- **`CI=true` is required for app tests** because `craco test` defaults to watch mode. Without it, the test runner hangs waiting for input in CI pipelines.

---

## 5. Adding New Tests

### For a new utility function in `trem-utils`
1. Create `src/__tests__/<functionName>.test.js`
2. Use `describe` / `it` / `expect` from vitest
3. Run: `pnpm --filter @packages/trem-utils run test`

### For a new component in `trem-ui`
1. Create `src/__tests__/<ComponentName>.test.jsx`
2. Import `{ render, screen }` from `@testing-library/react`
3. Use `describe` / `it` / `expect` from vitest
4. Run: `pnpm --filter @packages/trem-ui run test`

### For a new page/feature in `customer-shell`
1. Create `src/features/<feature>/__tests__/<Feature>.integration.test.jsx`
2. Use `{ render, screen }` from `@testing-library/react`
3. Run: `CI=true pnpm --filter @apps/customer-shell exec -- npx react-scripts test --watchAll=false --env=jsdom`

---

## 6. Known Limitations

- **Root `pnpm test`** (`turbo run test`) fails because apps with no test files (`backend-api`, `admin-shell`, `tours-remote`, `auth-trem`) report errors. Either add `--passWithNoTests` to their test scripts or run tests per-workspace.
- **Module aliases** must be added to `moduleNameMapper` in `apps/customer-shell/package.json` whenever a new `@packages/*` workspace dependency is added.
- **`craco test` argument forwarding is limited.** `--watchAll=false` and `--env=jsdom` are passed via `npx react-scripts test` directly rather than through the craco CLI.
