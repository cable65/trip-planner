# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Itinerary link density overrides per trip, merged with global layout settings.
- Support for `officialUrl` on itinerary activities, rendered as an "Official Site" link.
- API endpoint `POST /api/trips/[id]/track-link` for logging itinerary external link clicks.
- Admin quick filter on `/admin/audit-logs` for `ITINERARY_LINK_CLICKED` entries.
- Extended `User` model with contact, professional, and media fields.
- Field-level privacy settings stored in `User.profilePrivacy`.
- Profile editor under `/settings` with live preview and completion indicator.
- Two-step verification (short-lived code) for profile changes with full audit logging.

## [0.4.0] - 2026-01-14

### Added
- Admin Trip Layout controls for the Trip Summary section on trip detail pages.
  - Global configuration of block ordering (Trip Finances, Regenerate Itinerary, Notes & Tips, Bookings, Vendor Quotes).
  - Visibility toggles for Trip Finances and Bookings (both enabled by default).
  - Drag-and-drop admin UI under `/admin/trip-layout`.
  - Versioned preference storage in `TripUiPreference` with optimistic concurrency handling.
  - Reset-to-default action that restores standard ordering and visibility.
- API endpoints under `/api/admin/trip-layout` to fetch and update layout preferences.
- Immutable audit logging for layout changes using `ADMIN_TRIP_LAYOUT_CREATED`, `ADMIN_TRIP_LAYOUT_UPDATED`, and `ADMIN_TRIP_LAYOUT_RESET` actions.

### Added
- **Daily Itinerary Enhancement**:
  - **Smart Time**: Estimated start/end times, stay duration, buffer time.
  - **Auto-Sorting**: Chronological sorting with overlap detection and manual override.
  - **Visual Timeline**: Improved itinerary view with time slots and duration.
  - **Configuration**: User preferences for day start time, pace, and time format.
- **Itinerary Editing (Traveler)**:
  - Inline editing of activities (name, description, time, location, duration, notes, cost).
  - Add activities at logical points with templates and custom entries.
  - Remove activities with confirmation; preserves ordering.
  - Undo/Redo with automatic persistence.
  - Time conflict detection when editing/adding items.
  - Revision history stored per trip; original AI-generated itinerary preserved.
  - Audit logging for all itinerary updates.
- **AI Image Generation System**:
  - **DALL-E 3 Integration**: Auto-generates trip header images on demand.
  - **Server-Side Caching**: `AiImageLog` model tracks and reuses images for same destinations to save costs.
  - **Admin Analytics**: New dashboard page `/admin/ai` to track AI costs, usage, and cache efficiency.
  - **User Control**: "Regenerate Image" button in Trip Header.
  - **Auto-Update**: Automatically updates `Destination` table with generated images for future global reuse.
- **Trip Enhancements**:
  - **Group Travel**: Added `pax` column to Trip model (Person count).
  - **Budget Logic**: Enhanced budget calculations to support per-person and total views.
  - **Visuals**: Implemented landmark image display in trip lists and details.
- **Development Tools**:
  - Database seeding for default Admin, Vendor, and Traveler accounts.
  - Development-only login buttons for quick access to default accounts.
- **Traveler Features**:
  - **Destination Images**: Added `imageUrl` to `Destination` and `Trip` models.
  - **Trip Listing**: Display destination images on trip cards.
  - **Trip Details**: Display immersive header image for trips.
  - **Itinerary Map**: Added interactive map (Leaflet) to daily itinerary view.
  - **AI Itinerary**: Updated AI prompt to generate coordinates for mapping.
- **Automated Optimization**:
  - Cron API: `POST /api/cron/optimize` to pause low-performing campaigns.
  - Schema: Added `paused` to `CampaignStatus`.
- **Vendor Packages**:
  - Database models: `VendorPackage`, `PackageComponent`, `PackageAvailability`.
  - Vendor Portal UI: List packages, create new package, edit details, manage availability.
  - Server Actions: `createVendorPackage`, `updateVendorPackage`, `addAvailability`.
  - Public Package Page: View details and book.
  - Admin Review: Approve/Reject workflow.
- **Campaign Analytics**:
  - Database models: `CampaignVariation`, `VariationMetric`.
  - Vendor Dashboard: Metrics overview, A/B testing management.
  - Tracking API: Enhanced to support `variantId`, `costCents`, `revenueCents`.
  - Suggestions API: Automated optimization tips (ROAS, CTR).
- **Audit Logging**:
  - Enhanced export with pagination.
  - Added JSON details viewer.

### Fixed
- **Images**: Resolved issue with blocked external images by switching to internal AI generation and hosting.
- **Settings**: Fixed "Failed to save Currency" error by isolating Prisma client usage for raw queries.
- **Trip Generation**: 
  - Fixed page refresh issue when generating itinerary; added client-side state management, loading indicators, and error handling.
  - Fixed "Failed to generate itinerary" error by correcting `.env` configuration and updating AI prompt to enforce strict JSON schema.
- **Database**: Synced `Trip` model with schema documentation (added `imageUrl` field).
- **Database**: Updated seed data to include images for Cameron Highlands, George Town, Ipoh, Johor Bahru, Putrajaya, Kota Kinabalu, and Kuching.

### Changed
- `CampaignStatus` enum now includes `paused`.
- `Booking` logic prepared for package integration.
