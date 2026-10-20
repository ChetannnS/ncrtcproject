# Assumptions and Architectural Decisions

**Status:** Describes the current capstone/demo implementation
**Related document:** [Architecture note](./architecture.md)

This record makes explicit the assumptions behind the current NCRTC Bus Management System (BMS) and the main architecture choices made to support its demonstration workflows. It is not a production deployment specification.

## Assumptions

- The system is a local, single-application capstone demonstration for staff roles such as administrators, depot managers, control-room operators, drivers, and executives.
- Seeded accounts and sample operational records are sufficient to demonstrate workflows. The application is not connected to NCRTC identity, dispatch, depot, or fleet systems.
- Vehicle locations, speeds, and trip paths are illustrative demo data. They are not live telemetry and must not be used to make operational or emergency-response decisions.
- The supported scheduling demonstration needs only `today` and `tomorrow` duty labels. A full service calendar, time-zone policy, recurring roster, and resource-conflict model are outside the current scope.
- A single SQLite database and one backend instance are sufficient for the expected local demo workload; concurrent production-scale operations are not a requirement.
- Demo credentials and local defaults are acceptable only for development/demo use. Any deployment beyond that context requires the security and operational work called out in the [architecture note](./architecture.md).

## Key architectural decisions

| Decision | Rationale and current consequence |
| --- | --- |
| Use a React single-page frontend with Vite, and an Express REST API. | Keeps the UI/API boundary straightforward and supports the role-based dashboard and workflows. The frontend uses Vite's `/api` and `/docs` proxy to reach the backend. Vite is used as a development/demo server, not a production static hosting solution. |
| Persist application data in SQLite. | Avoids a separate database service and keeps local setup simple. Compose persists the database in the `ncrtc_data` named volume; local backend runs use `backend/data/ncrtc.db`. This is a single-instance demo choice, not a production scalability or availability guarantee. |
| Create the schema and seed demo records on backend startup. | Makes a fresh demo easy to launch and allows sample workflows to be shown without a manual setup step. Existing tables are created idempotently and fixtures are seeded by the backend. This is not a replacement for versioned production database migrations. |
| Use JWT bearer authentication, bcrypt password hashes, and role checks on selected API operations. | Demonstrates authenticated role workflows with common web primitives. The browser stores its token in `localStorage`. The current authorization model has incomplete depot/resource scoping and is not a complete production access-control policy. |
| Simulate fleet movement and poll for updates. | Provides a visible AVLS interaction without requiring vehicle devices or a telemetry provider. The displayed positions and speeds are derived from seeded values; the client refreshes fleet and incident data periodically rather than receiving a live stream. |
| Keep incident state/events and notice read receipts in SQLite. | Supports persisted demo workflows for incident assignment/status and per-user notice acknowledgement. These records are not an immutable audit ledger or a guaranteed message-delivery system. |
| Run the frontend and backend as two Docker Compose services. | Gives the demo a reproducible local startup path, waits for backend health before starting the frontend, and keeps SQLite data across container restarts via a named volume. The Compose configuration exposes development services and is not a hardened production topology. |

## Explicit boundaries

The current choices prioritize a runnable demonstration over production readiness. Before real operations, the system needs (at minimum) deployment-managed secrets, hardened authentication and authorization including depot scoping, validated inputs and abuse controls, versioned migrations and a production-grade database strategy, real approved telemetry integrations, operational backups/monitoring, and a production frontend/API deployment topology. See the [readiness statement and roadmap](./architecture.md#7-readiness-statement) for further detail.
