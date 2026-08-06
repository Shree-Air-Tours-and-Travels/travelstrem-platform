## Important Engineering Rules

* Reuse the existing design system and shared components.
* Reuse the current API clients, state management, form libraries, validation libraries, and table components.
* Do not duplicate existing models, services, modules, or shared utilities.
* Do not rewrite unrelated code.
* Keep all changes backward compatible wherever possible.
* Preserve existing working functionality.
* Avoid large, monolithic files.
* Follow the existing project architecture and use clearly separated:

  * Services
  * Controllers
  * Repositories
  * Policies
  * Middleware
  * Hooks
  * Components
* Add appropriate database indexes for:

  * Tenant or agency IDs
  * Status fields
  * Ownership fields
  * Email addresses
  * Foreign keys
  * Frequently searched, filtered, or sorted columns
* Use database transactions for multi-step operations, including:

  * Agency creation
  * Partnership request conversion
  * User invitation flows
  * Record reassignment
  * Deactivation
  * Deletion or anonymization workflows
* Avoid N+1 database queries.
* Use eager loading, joins, batching, or equivalent optimized query patterns where appropriate.
* Paginate all potentially large datasets.
* Add database constraints where appropriate, including:

  * Unique constraints
  * Foreign-key constraints
  * Non-null constraints
  * Valid status constraints
  * Composite tenant-scoped uniqueness constraints
* Do not hide incomplete functionality behind mocked API responses, placeholder data, or fake success states.
* Do not leave critical `TODO`, `FIXME`, or unfinished implementation comments.
* Do not hardcode:

  * Agency IDs
  * Product IDs
  * Role IDs
  * Permission IDs
  * User IDs
  * URLs
  * Email addresses
  * Credentials
  * Secrets
  * Environment-specific configuration
* Use environment variables or the existing configuration system for environment-specific values.
* Validate permissions and tenant ownership on the backend, not only in the frontend.
* Follow the existing coding standards, naming conventions, linting rules, and formatting rules.
* Add reusable abstractions only when they reduce duplication and remain consistent with the current architecture.
* Do not introduce new libraries when the existing stack already provides the required functionality.
* Document any new configuration, migrations, permissions, environment variables, and architectural decisions.
