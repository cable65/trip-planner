# DB Schema (v1.2)

## ER overview

- `User 1—∞ Trip`
- `Trip 1—∞ Booking`
- `Booking 1—∞ Payment`
- `User 1—∞ Payment`
- `User 1—∞ Review`
- `User (Vendor) 1—1 VendorProfile`
- `Trip 1—∞ TripShare`
- `TripShare 1—1 Quote`
- `AuditLog` references all entities logically via `resourceType` + `resourceId`.

## Tables (Prisma models)

- `User(id, name, email, passwordHash, role, preferences JSON, phone, jobTitle, company, location, website, bio, avatarUrl, coverUrl, profilePrivacy JSON, createdAt, updatedAt, ...)`
- `VendorProfile(id, userId, intro, logoUrl, bannerUrl, isApproved, createdAt, updatedAt)`
- `Trip(id, userId, destination, imageUrl, startDate, endDate, budget, pax, interests[], travelStyle, itinerary JSON, status, createdAt, updatedAt)`
- `Booking(id, tripId, vendorId, type, price, status, createdAt, updatedAt)`
- `Payment(id, userId, bookingId, amount, currency, status, createdAt, updatedAt)`
- `Review(id, userId, targetType, targetId, rating, comment, createdAt, updatedAt)`
- `TripShare(id, tripId, vendorId, status, expiresAt, createdAt, updatedAt)`
  - Status: `PENDING`, `RESPONDED`, `EXPIRED`
- `Quote(id, tripShareId, price, currency, notes, attachments JSON, status, createdAt, updatedAt)`
  - Status: `PENDING`, `ACCEPTED`, `REJECTED`
- `AuditLog(id, timestamp, actorId, actorRole, action, resourceType, resourceId, ipAddress, userAgent, oldValue, newValue, metadata, prevHash, entryHash)`
- `ProfileChangeChallenge(id, userId, codeHash, expiresAt, attempts, createdAt)`
- `Destination(id, name, country, imageUrl, active, createdAt, updatedAt)`
- `TripUiPreference(id, visibility JSON, sequence JSON, version, createdAt, updatedAt)`
- Auth-related tables for NextAuth (`Account`, `Session`, `VerificationToken`).
