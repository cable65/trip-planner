# Product Specification

## Overview
The Trip Planner platform is a full-stack web application connecting travelers with vendors (agencies, hotels, tour operators). It features AI-driven trip generation, a booking system, and a vendor marketplace.

## Core Features
- **Traveler**:
  - AI Trip Generation (OpenAI) based on interests and budget.
  - Trip Management: Itinerary, Bookings, Sharing.
  - Visuals: AI-generated destination images and interactive maps for itineraries.
  - Itinerary Links: Official site links, map/directions, and per-trip link density overrides.
  - Social Sharing: Invite friends, split costs (planned).
- **Vendor**:
  - Profile Management.
  - Trip Packages: Create and sell pre-defined packages.
  - Campaigns: Email/Ad campaigns with A/B testing and analytics.
- **Admin**:
  - Audit Logs: Immutable record of sensitive actions.
  - User Management.
  - Content Moderation (Package approval).
  - System Analytics: AI usage and cost tracking.
  - Trip Layout Controls: Configure Trip Summary block visibility and ordering.

## New Features (v0.3.0)
### AI Image Generation System
- **Intelligent Generation**: Automatically generates high-quality header images for trips using DALL-E 3.
- **Credit Optimization**: 
  - **Caching**: Reuses generated images for the same destination across different users.
  - **Smart Fallback**: Checks Destination table first, then Cache, then Generates.
- **Usage Tracking**: Detailed audit logging of every generation event (cost, prompt, user).
- **Admin Analytics**: Dashboard to monitor AI costs, cache hit rates, and generation volume.

## New Features (v0.4.0)

### Trip Summary Layout Controls

- **Global Trip Layout**:
  - Admins can configure the order of blocks in the Trip Summary section on the trip details page (Trip Finances, Regenerate Itinerary, Notes & Tips, Bookings, Vendor Quotes).
  - Configuration is global and applies to all trips.
- **Visibility Controls**:
  - Admins can toggle visibility of the Trip Finances and Bookings blocks.
  - Defaults: both blocks are visible.
- **Persistence & Defaults**:
  - Preferences are stored in the `TripUiPreference` table with a single global row keyed by `id = "default"`.
  - When no preferences exist, the system falls back to a built-in default ordering and visibility.
- **Safety & Consistency**:
  - Required blocks (Trip Finances, Bookings) always remain in the sequence to keep finance data and booking management accessible.
  - Changes take effect immediately on all trip views without requiring a page refresh (server components always read the latest configuration).
- **Concurrency Handling**:
  - Trip layout configuration is versioned.
  - If two admins edit concurrently, version conflicts are detected and the second admin is prompted to reload the latest configuration before saving.

- **User Control**: Users can manually regenerate images if unsatisfied.

### Trip Enhancement
- **Landmark Images**: Visual enrichment for destinations in list and detail views.
- **Group Travel Support**: "Person" count field (1-99) for accurate planning.
- **Budget Intelligence**: Per-person and total budget calculations and displays.

### Development Environment
- **Default Accounts**: Automated seeding of Admin, Vendor, and Traveler accounts for rapid testing.
- **Dev Login Helper**: "One-click" login buttons on the login page (Development only) for the default accounts.
- **Security**: Helper buttons are stripped/disabled in production builds.

### Vendor Packages
- Vendors can create packages with multiple components (Accommodation, Activities).
- Packages require Admin approval before being public.
- Travelers can book packages directly, linking them to a Trip.

### Campaign Growth
- A/B Testing: Support for campaign variations.
- Analytics: ROAS, CTR, Conversion Rate tracking.
- Suggestions: Automated optimization tips.
- **Automated Optimization**: Cron-based system to auto-pause low-performing campaigns (ROAS < 1.0) and alert vendors.

### Daily Itinerary Enhancement
- **Smart Time Management**:
  - **Start Time Calculation**: Estimates start times based on activity type, duration, travel time, and user preference.
  - **Stay Duration**: Includes default durations, pace adjustments, and buffer time.
  - **Visual Timeline**: Displays activities chronologically with overlap indicators.
- **Auto-Sorting**:
  - Automatically arranges activities by start time.
  - Maintains logical constraints (e.g., lunch after morning activities).
  - Allows manual overrides.
  - **Configuration**:
  - User-configurable day start time, duration presets, and time format (12/24h).

### Itinerary Link Controls and Analytics
- **Per-Trip Link Density Overrides**:
  - Each itinerary can override global link visibility for Directions, Map, and More Info.
  - Overrides are stored inside the trip itinerary payload and merged with global defaults.
- **Official Site URL**:
  - Each activity can store an `officialUrl` that surfaces as a dedicated "Official Site" chip.
  - Official site links are editable inline in the itinerary editor.
- **Link Click Tracking**:
  - All itinerary external link clicks are logged as immutable audit entries (`ITINERARY_LINK_CLICKED`).
  - Admins can filter `/admin/audit-logs` to see itinerary link clicks per trip and export them to CSV.

## User Stories
- As a Vendor, I want to create a package so I can sell my services.
- As an Admin, I want to review packages to ensure quality.
- As a Traveler, I want to book a package and add it to my trip.
- As a Vendor, I want my losing campaigns to auto-pause to save budget.
- As a Traveler, I want to specify the number of people so my budget is accurate.
- As a Traveler, I want to see inspiring photos of my destination to get excited.
- As an Admin, I want to track AI costs to ensure profitability.
- As a User, I want to manage a rich profile (contact, professional details, preferences) so that vendors and travelers can understand who I am.
- As a User, I want field-level privacy controls so I can choose which profile fields are public.
- As a User, I want a clear profile completion indicator so I know what is missing.
- As a Security Reviewer, I want sensitive profile changes to require an additional factor so that compromised sessions cannot silently change identities.
