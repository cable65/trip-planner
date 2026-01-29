# Admin Guide

## Trip Layout Controls

The Trip Layout admin page lets administrators control how the Trip Summary
section is presented to travelers on the trip details view.

Location: `/admin/trip-layout`

### Blocks in the Trip Summary section

The following blocks can be ordered:

- Trip Finances
- Regenerate Itinerary
- Notes & Tips
- Bookings
- Vendor Quotes

The default order is:

1. Trip Finances
2. Regenerate Itinerary
3. Notes & Tips
4. Bookings
5. Vendor Quotes

### Visibility controls

Administrators can toggle visibility for two blocks:

- Trip Finances
- Bookings

When a block is hidden, it no longer appears in the Trip Summary section for
any user. The configuration is global and affects all trips.

Notes & Tips, Regenerate Itinerary, and Vendor Quotes are always available and
cannot be hidden.

### Drag-and-drop ordering

The Trip Layout page shows all Trip Summary blocks in a list. Administrators
can drag a block card up or down to change the order. The numbered badge on
each card indicates the current sequence.

Changes are not applied until the administrator clicks **Save changes**.

### Resetting to defaults

To revert all changes, click **Reset to defaults**. This restores the default
order and sets both Trip Finances and Bookings to visible.

### Permissions and audit logging

- Only users with the `admin` role can access `/admin/trip-layout`.
- All changes are persisted in the database via the `TripUiPreference` table.
- Each change writes an immutable audit entry to the `AuditLog` table with one
  of the following actions:
  - `ADMIN_TRIP_LAYOUT_CREATED`
  - `ADMIN_TRIP_LAYOUT_UPDATED`
  - `ADMIN_TRIP_LAYOUT_RESET`

If two administrators edit the layout at the same time, the system detects
version conflicts and prompts the second editor to reload the latest
configuration before saving again.

