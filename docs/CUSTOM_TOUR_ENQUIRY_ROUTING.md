# Custom tour enquiry routing

## Current routing rules

Routing is decided and persisted by the backend when a custom tour enquiry is created.

1. When an existing tour is customised, assign the enquiry to that tour's active owner. If the owner is unavailable, use an active Partner Admin from the owning agency.
2. For a new custom tour, use the one active Trevista agency marked `customTourPartner`.
3. Within that agency, assign only to an active Partner Admin. Prefer the Partner Admin whose email matches the agency contact email; otherwise use the oldest active Partner Admin deterministically.
4. If no custom-tour partner agency or eligible Partner Admin exists, assign the enquiry to the Master Admin.

Only the resolved responsible user receives the assignment notification; the agency's generic contact email is not used as an additional recipient.

The enquiry stores its assignment rule, agency and agent snapshot so routing remains auditable if configuration changes later.

## Known allocation gaps

- **Multiple partner agencies:** only one agency can currently be marked as the custom-tour partner. Before enabling multiple agencies, define an auditable allocation policy covering destination/speciality, capacity, availability, weighted distribution, failover and manual override.
- **Multiple agents within an agency:** routing currently stops at the Partner Admin. Before assigning enquiries directly to agents, add an agency-managed dispatch policy covering a primary handler or queue, skills, language, destination, workload, availability, SLA-based reassignment and assignment history.
