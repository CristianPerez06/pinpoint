# Establish authentication and the trip data model

## Why

The product's most valuable planning feature is per-person interest — each traveller
marks the places *they* want to visit, and the map filters to "places we both want to
go". That feature is impossible without the app knowing which traveller is using it, so
identity is a prerequisite for the data model rather than a later addition.

Doing authentication first also means every table is created with a row-level security
policy written once, against a real authenticated user. The alternative — permissive
policies now, tightened after auth lands — leaves the database open to anyone holding
the publishable key, which ships inside both client bundles, and depends on a follow-up
task that is reliably forgotten.

## What Changes

- **Accounts.** Email-and-password sign up, sign in, and sign out. No third-party
  identity provider, no magic links.
- **Sessions.** Persisted per platform — cookies on web, secure storage on native — and
  refreshed without the caller managing it.
- **Route protection.** Unauthenticated visitors are redirected to sign in;
  authenticated visitors are kept out of the sign-in screens.
- **A new shared package, `@pinpoint/auth`.** The authentication operations themselves
  (validate input, call Supabase, map the failure) are platform-independent and are
  consumed by both applications rather than written twice.
- **Auth input validation in `@pinpoint/core`**, alongside the existing domain schemas.
- **The database schema**: `trips`, `trip_members`, `cities`, `markers`, and
  `marker_interest`, each with row-level security enabled and policies resolving to trip
  membership.
- **Marker type as a code-defined value**, not a table — a fixed list exported from
  `@pinpoint/core` with a display family and an icon, so the map's legibility is a
  design decision rather than user-generated data.
- **A migration workflow.** `supabase/migrations/` becomes the source of truth for the
  schema, and `packages/supabase/src/database.types.ts` stops being a placeholder and
  starts being generated.

Not in this change: the map, place search, adding or editing markers, bulk import,
password recovery, and email confirmation. Those depend on this change and are scoped
separately.

## Capabilities

### New Capabilities

- `auth` — account creation, sign in, sign out, session persistence, and route
  protection across both applications.
- `trips` — a trip, the people on it, and membership as the authorization boundary that
  every row-level security policy resolves to.
- `markers` — the saved-place model: markers, the cities that group them, the types that
  render them, and per-member interest.

### Modified Capabilities

None. `monorepo-structure` and `styling` are unaffected — this change adds a package and
obeys the existing boundary rules rather than changing them.

## Impact

- **New package** `packages/auth/`, depending on `@pinpoint/core` and
  `@pinpoint/supabase`. It declares no platform dependency, so the existing cycle and
  boundary checks continue to pass unchanged.
- **`@pinpoint/core`** gains auth input schemas and the marker type list.
- **`@pinpoint/supabase`** gains an authentication error-code mapping and its generated
  `Database` types. Its client factory already accepts injected session storage and does
  not change.
- **`apps/web`** gains sign-in and sign-up routes, a session-refreshing middleware, and
  server-side auth guards. Adds `@supabase/ssr`.
- **`apps/mobile`** gains a sign-in screen and secure-storage-backed session
  persistence. Adds `expo-secure-store`. Sign-up is deliberately web-only.
- **`supabase/`** is created at the repository root for migrations. This is repository
  automation and configuration, not product code, so it does not violate the
  no-code-at-the-root rule.
- **New required configuration** in both apps' config modules and `.env.example` files.
- **Cost**: none. Supabase authentication is included in the free tier, and with email
  confirmation disabled the change sends no email and needs no mail service.
