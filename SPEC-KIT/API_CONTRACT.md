# API Contract (v1.1)

## Auth

- `POST /api/auth/[...nextauth]`
  - Handled by NextAuth credentials provider.
  - Input: `email`, `password`.
  - Output: session cookie when successful.

## Profile

- `GET /api/profile`
  - Auth: any authenticated user.
  - Returns the caller's profile fields and preferences.
  - Response JSON:
    - `id`, `email`, `role`.
    - Profile fields: `name`, `phone`, `jobTitle`, `company`, `location`, `website`, `bio`, `avatarUrl`, `coverUrl`.
    - `preferences` JSON: includes language, currency, marketing and contact preferences.
    - `profilePrivacy` JSON: field-level visibility (`private`, `connections`, `public`).

- `PUT /api/profile`
  - Auth: any authenticated user.
  - Body (JSON):
    - Optional profile fields: `name`, `phone`, `jobTitle`, `company`, `location`, `website`, `bio`.
    - Optional partial `preferences` object.
    - Optional partial `privacy` object defining field-level visibility.
  - Validation: Zod schema, Prisma to prevent injection.
  - Side effects:
    - Updates `User` row.
    - Writes `USER_PROFILE_UPDATED_API` audit entry.

## Trips

Implemented via Next.js server components and server actions.

- `GET /trips`
  - Auth: traveler.
  - Returns a list of the current user’s trips.

- `GET /trips/new`
  - Auth: traveler.
  - Renders the trip creation form.

- `POST /trips/new (server action createTripFromAi)`
  - Auth: traveler.
  - Body (FormData): `destination`, `startDate`, `endDate`, optional `budget`, `pax` (default 1), `interests`, optional `travelStyle`.
  - Side effects:
    - Calls AI to generate itinerary.
    - Creates `Trip` with itinerary, `status = planned`.
    - Logs Prisma-level audit entry and `AI_TRIP_GENERATED` explicit entry.

- `GET /trips/[id]`
  - Auth: traveler, must own trip.
  - Renders trip header, daily itinerary timeline, cost summary, and notes.
  - Inline itinerary editor is available to traveler.

- `GET /trips/[id]/edit`
  - Auth: traveler, must own trip.
  - Renders an edit form for trip core parameters.

- `POST /trips/[id]/edit (server action updateTrip)`
  - Auth: traveler, must own trip.
  - Body (FormData): `tripId`, `destination`, `startDate`, `endDate`, optional `budget`, `interests`, optional `travelStyle`.
  - Side effects:
    - Updates `Trip` core fields.
    - Prisma middleware logs DB mutation.
    - Explicit `TRIP_UPDATED` entry is inserted into `AuditLog`.

- `POST /trips/[id]/regenerate (server action regenerateTrip)`
  - Auth: traveler, must own trip.
  - Body (FormData): `tripId`.
  - Side effects:
    - Calls AI with current trip parameters.
    - Updates `Trip.itinerary` and leaves other fields unchanged.
    - Prisma middleware logs DB mutation.
    - Explicit `AI_TRIP_REGENERATED` entry is inserted into `AuditLog`.

- `POST /trips/[id]/itinerary (server action updateItinerary)`
  - Auth: traveler, must own trip.
  - Body (JSON via server action):
    - `days`: array of day objects with `items` containing editable fields (name, description, time, location, durationMinutes, notes, category, estimatedCost, coordinates?, officialUrl?)
    - `estimatedTotalCost?`: number
    - `notes?`: string[]
    - `itineraryLinksOverride?`: `{ showDirections?: boolean; showMap?: boolean; showMoreInfo?: boolean }`
  - Validation: Zod-based `ItineraryUpdateSchema` and `ItinerarySchema` for structural integrity.
  - Side effects:
    - Persists updated itinerary to `Trip.itinerary`.
    - Creates `ItineraryRevision` with incremented version (first edit stores original as version 1).
    - Emits `ITINERARY_UPDATED` entry in `AuditLog`.
  - Conflict handling:
    - Client performs time conflict detection before save.
    - Last-write-wins on concurrent edits; revisions ensure recovery.

- `POST /api/trips/[id]/track-link`
  - Auth: traveler or vendor (same session model as viewing the trip/share).
  - Purpose: track itinerary external link clicks for analytics and auditing.
  - Body (JSON):
    - `label`: string (max 80) – human-readable link label (e.g., "Directions", "Official Site").
    - `url`: string (URL, max 2000) – destination URL of the clicked link.
  - Behavior:
    - Validates payload with Zod.
    - Inserts an immutable audit entry in `AuditLog` with:
      - `action = "ITINERARY_LINK_CLICKED"`
      - `resourceType = "Trip"`
      - `resourceId = [id]`
      - `metadata` including `label`, `url`, `source = "itinerary"`, and `route = "trips.track-link"`.


## Admin audit logs

- `GET /admin/audit-logs`
  - Auth: admin.
  - Query params: `action?`, `resourceType?`, `actorId?`, `page?`.
  - Renders paginated audit log table and CSV export.

## Admin trip layout

- `GET /api/admin/trip-layout`
  - Auth: admin.
  - Returns the current Trip Summary layout configuration.
  - Response:
    - `config`: object
      - `version`: integer
      - `visibility`: `{ tripFinances: boolean; bookings: boolean }`
      - `sequence`: array of block ids (`"tripFinances" | "regenerate" | "notes" | "bookings" | "vendorQuotes"`).

- `POST /api/admin/trip-layout`
  - Auth: admin.
  - Body (JSON):
    - `version?`: integer (client’s last-known version for optimistic concurrency).
    - `visibility?`: partial visibility object.
    - `sequence?`: array of block ids in desired order.
    - `resetToDefault?`: boolean (when true, ignores `visibility` and `sequence` and restores defaults).
  - Behavior:
    - On success: updates `TripUiPreference` global row and returns the new `config`.
    - On version conflict: responds with `409` and the latest `config` plus `reason = "version_conflict"`.
  - Logging:
    - Writes one of `ADMIN_TRIP_LAYOUT_CREATED`, `ADMIN_TRIP_LAYOUT_UPDATED`, or `ADMIN_TRIP_LAYOUT_RESET` into `AuditLog`.

## Cron / Automation

- `POST /api/cron/optimize`
  - Auth: `Authorization: Bearer <CRON_SECRET>`
  - Action: Scans active campaigns (status="sending").
  - Logic:
    - If `ROAS < 1.0` and `cost > 5000` (cents), update status to `paused`.
  - Logging: Creates `CAMPAIGN_AUTO_PAUSED` audit logs with `actorId="SYSTEM"`.


