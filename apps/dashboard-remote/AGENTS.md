# Dashboard implementation contract

These rules apply to all dashboard-remote changes.

- `src/Dashboard.jsx` is the public role dispatcher. Keep role selection, model selection and loading/error handling here; do not add page markup or styles.
- Put each role layout in `src/views/<role>/`. Keep its renderer in `<Role>Dashboard.view.jsx`, presentation adapter in `<Role>Dashboard.model.jsx`, and styles alongside the owning view.
- Traveller-specific components and styles belong in `views/traveller/`. Client and support roles currently reuse the partner renderer; preserve that mapping unless explicitly changing it.
- Reuse genuinely shared presentation in `views/shared/`. Each shared component imports its own stylesheet. Shared grid rules belong in `DashboardLayout.scss`; do not rebuild a global catch-all dashboard stylesheet.
- Import styles from their owning view/component, not the root dispatcher. Scope role-specific selectors to that view. Keep responsive rules with the component they affect.
- Reuse Trem UI primitives and Trem design tokens. The traveller hero uses theme-aware surfaces, a soft primary gradient and decorative compass rings. Text, search and chips follow the app theme. Do not override theme variables on the hero.
- Backend contracts own visible copy, search visibility/enabled flags, destinations, permissions and data. Models only adapt presentation; never move authorization or tenant filtering into renderers.
- Preserve independent widget containers and requests. Render only configured widgets and retain their existing loading, error and empty-state behavior.
- Preserve the remote's public exports, navigation callbacks, role mapping and widget ordering during structural refactors.
