# Security Notes (v1.1)

- Auth: handled by NextAuth with credentials provider and JWT sessions.
- Passwords: stored as bcrypt hashes in `User.passwordHash`.
- Sessions: HTTP-only cookies, server-side session validation.
- Audit logs: all sensitive operations (auth events, user creation, trip creation) write immutable `AuditLog` rows.
- No plaintext secrets are logged.
- No card data is stored in this version.
- **Development Accounts**: Default accounts (admin/vendor/traveler) with known passwords are seeded only in development/test environments. Quick-login buttons are disabled in production.
 - **Profile Security**: Sensitive profile updates are protected by a short-lived verification code and fully logged in `AuditLog` (old vs new values, actor, metadata).

