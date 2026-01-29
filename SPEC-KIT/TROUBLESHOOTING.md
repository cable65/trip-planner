# Troubleshooting Guide

This document tracks common issues encountered during development and their resolutions.

## Type Checking Issues (`npm run typecheck`)

### 1. `auditPrisma` is possibly `undefined`
**Error:**
```
src/app/settings/actions.ts:77:25 - error TS18048: 'auditPrisma' is possibly 'undefined'.
```
**Cause:**
`auditPrisma` is declared globally as `PrismaClient | undefined` to prevent connection exhaustion in development (hot-reloading), but strict null checks require verification before use.

**Resolution:**
Use the non-null assertion operator (`!`) if you are certain the client is initialized, or add a runtime check:
```typescript
// Fix:
const exists = (await auditPrisma!.$queryRaw<any[]>`...`)[0];
```

### 2. Date Type Mismatches
**Error:**
```
src/app/trips/[id]/actions.ts:123:7 - error TS2322: Type 'string' is not assignable to type 'Date'.
```
**Cause:**
Form data or JSON serialization often results in date strings (ISO format), but the Prisma client or internal functions expect JavaScript `Date` objects.

**Resolution:**
Explicitly convert strings to Date objects before passing them to functions expecting Dates:
```typescript
// Fix:
startDate: new Date(parsed.data.startDate),
```

### 3. Missing Properties on Prisma Models (`imageUrl`)
**Error:**
```
src/app/trips/actions.ts:93:11 - error TS2353: Object literal may only specify known properties, and 'imageUrl' does not exist...
```
**Cause:**
The Prisma schema (`schema.prisma`) was missing a field that was being used in the code. The generated client types were out of sync with the intended data structure.

**Resolution:**
1. Add the field to `prisma/schema.prisma`:
   ```prisma
   model Trip {
     // ...
     imageUrl String?
   }
   ```
2. Run `npx prisma db push` (or `migrate dev`) to update the database and regenerate the client.

## Runtime Issues

### 1. "Failed to generate itinerary" (AI Integration)
**Symptom:**
User sees a generic error message "Failed to generate itinerary" when submitting the "New Trip" form.

**Causes:**
1. **Environment Variables**: Missing quotes in `.env` file caused `dotenv` parsing to fail for keys with special characters (like spaces or equals signs).
2. **AI Response Format**: The AI provider (DeepSeek/OpenAI) returned Markdown code blocks (e.g., ` ```json ... ``` `) which `JSON.parse` cannot handle directly.
3. **Zod Validation**: The AI returned JSON that did not strictly match the expected Zod schema (e.g., missing fields or wrong types).

**Resolution:**
1. **Fix `.env`**: Ensure all values with special characters are wrapped in double quotes.
2. **Clean AI Output**: Strip Markdown code blocks before parsing:
   ```typescript
   const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
   ```
3. **Strict Prompting**: Update the system/user prompt to explicitly request the exact JSON structure and forbid Markdown formatting.
4. **Error Logging**: Enhance `src/lib/ai/client.ts` to log the raw response when parsing fails, facilitating easier debugging.

### 2. PrismaClientValidationError: Unknown argument `imageUrl`
**Error:**
```
Invalid `prisma.trip.create()` invocation:
{
  data: {
    ...
    imageUrl: null,
    ~~~~~~~~
  }
}
Unknown argument `imageUrl`.
```
**Cause:**
The application is running with an outdated version of the Prisma Client in memory, even if the schema file has been updated. This happens when `prisma generate` has not been run or the Next.js dev server has not been restarted after the client regeneration.

**Resolution:**
1. Run `npx prisma generate` to update the generated client code in `node_modules`.
2. Restart the Next.js development server to load the new client definition.
