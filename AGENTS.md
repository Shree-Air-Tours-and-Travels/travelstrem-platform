# TravelsTREM agent rules

Follow [docs/08-engineering-rules.md](docs/08-engineering-rules.md) for backend boundaries, Storybook, the Trem design system and package ownership.

- Make minimal, targeted changes and preserve unrelated work.
- Keep all business logic and tenant enforcement on the backend.
- Reuse existing Trem packages and provider/runtime registries before creating new abstractions.
- Carry explicit tenant context into all background work and fail closed if it is absent.
- Do not add dependencies, destructive migrations, or repository-wide validation unless explicitly required.
