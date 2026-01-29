# Audit Logging Requirements

## System Overview
All sensitive operations must be logged to the `audit_logs` table. This table is immutable and restricted to Admin access.

## Schema
- `id`: CUID
- `timestamp`: DateTime (now)
- `actorId`: User ID performing the action
- `actorRole`: Role at time of action
- `action`: String (e.g., USER_LOGIN, PACKAGE_CREATED)
- `resourceType`: String (e.g., User, VendorPackage)
- `resourceId`: String
- `ipAddress`: String
- `userAgent`: String
- `oldValue`: JSON (Snapshot before change)
- `newValue`: JSON (Snapshot after change)
- `metadata`: JSON (Additional context)

## Implementation
- Use `runWithAuditContext` for wrapping operations.
- Use `appendAuditLog` for writing the log.
- Never log sensitive PII (passwords, credit cards).

### Trip layout changes

- All updates to the global Trip Summary layout must emit explicit audit
  entries via `appendAuditLog` using:
  - `action`: one of `ADMIN_TRIP_LAYOUT_CREATED`, `ADMIN_TRIP_LAYOUT_UPDATED`,
    or `ADMIN_TRIP_LAYOUT_RESET`.
  - `resourceType`: `TripUiPreference`.
  - `resourceId`: the primary key of the row (currently `"default"`).
  - `oldValue`: previous layout configuration (or `null` when creating).
  - `newValue`: new layout configuration.
  - `metadata`: must include `apiRoute = "admin/trip-layout"`.

### Itinerary link clicks

- All external link clicks initiated from the itinerary UI (traveler or vendor views)
  must be logged via `appendAuditLog` with:
  - `action = "ITINERARY_LINK_CLICKED"`.
  - `resourceType = "Trip"`.
  - `resourceId =` the trip id.
  - `metadata` including at minimum:
    - `label`: link label (e.g., "Directions", "Official Site").
    - `url`: destination URL (validated as a URL and length-limited).
    - `source = "itinerary"`.
    - `route = "trips.track-link"`.


## Access
- Protected Route: `/admin/audit-logs`
- Role Required: `admin`
- Features: Pagination, Filtering (Action, Actor, Resource), Export to CSV.
- Admins can quickly filter for itinerary link activity using `ITINERARY_LINK_CLICKED`
  and `resourceType = Trip`.
