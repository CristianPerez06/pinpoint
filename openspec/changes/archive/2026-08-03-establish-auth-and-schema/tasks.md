## 1. Supabase project and migration workflow

- [x] 1.1 Create the Supabase project (free plan) and record its URL and publishable key. Confirm the secret key is not copied anywhere in the repository (AGENTS.md — configuration)
- [x] 1.2 In Authentication settings, enable the email provider and **disable** "Confirm email" (design D2). Record the setting in the change notes — it is a dashboard state the repository cannot assert
- [x] 1.3 Add the Supabase CLI as a root dev dependency and `supabase init`, producing `supabase/config.toml` and `supabase/migrations/`
- [x] 1.4 Add root scripts: one to apply migrations, one to generate types into `packages/supabase/src/database.types.ts` (design D9)
- [x] 1.5 Confirm `supabase/` is at the repository root and contains no product code — it is configuration and automation only (design D9, spec `monorepo-structure`)

## 2. Schema and row-level security

- [x] 2.1 Migration: `trips` — id, name, created_at
- [x] 2.2 Migration: `trip_members` — id, trip_id, display_name, email, **nullable** user_id referencing `auth.users`, unique per (trip_id, user_id) where user_id is present. `email` and the `claim_trip_memberships()` function were added during implementation — 4.7 is not implementable without them (design D5, D11; spec `trips`)
- [x] 2.3 Migration: `cities` — id, trip_id, name. No cross-trip sharing (design D7)
- [x] 2.4 Migration: `markers` — id, trip_id, nullable city_id, name, note, lng, lat, type (text), link, price, visited, created_at. `city_id` set null on city delete, so removing a city unassigns its markers rather than deleting them (spec `markers`)
- [x] 2.5 Migration: `marker_interest` — marker_id, member_id, interested, unique per (marker_id, member_id). Absence of a row means undecided (spec `markers`)
- [x] 2.6 Migration: enable row-level security on **every** table above, with no exception and no permissive interim policy (spec `trips`)
- [x] 2.7 Migration: a single membership predicate — is the requesting account linked to a member of this trip — and select/insert/update/delete policies on every table resolving through it. Policies must not trust a client-supplied trip identifier. Amended: `trips` gets select and update only, since an insert policy cannot resolve to membership for a trip with no members (design D11; spec `trips`)
- [x] 2.8 Seed the first trip and its two member rows, leaving `user_id` null on both. They are linked in 4.7
- [x] 2.9 Generate `database.types.ts` with `pnpm db:types` and replace the hand-written version committed during implementation. Diff the two — a disagreement means the hand-written file was wrong (design D11)

## 3. Shared packages

- [x] 3.1 `@pinpoint/core`: add zod schemas for sign-up and sign-in input, including the password rules. Export the inferred input types (design D4)
- [x] 3.2 `@pinpoint/core`: add the marker type list — each type with an id, an icon, and a family drawn from `see | eat | buy | sleep | move` — plus the fallback type and a zod schema validating a marker's type against it (design D6, spec `markers`)
- [x] 3.3 `@pinpoint/core`: extend `markerSchema` with `cityId` (nullable), `type`, `link` (nullable), `price` (nullable), `visited`; add `citySchema`, `tripMemberSchema`, and `markerInterestSchema`
- [x] 3.4 `@pinpoint/core`: unit-test the new schemas — password rules, coordinate bounds, an unknown marker type, and that omitted optional fields are absent rather than empty strings
- [x] 3.5 `@pinpoint/supabase`: add the authentication error mapping — service error code to an internal identifier, unrecognised codes to a generic identifier. No branching on message text (spec `auth`)
- [x] 3.6 Create `packages/auth` (`@pinpoint/auth`): source-only, depending on `@pinpoint/core` and `@pinpoint/supabase` and on no platform API (design D3)
- [x] 3.7 `@pinpoint/auth`: implement `signUp`, `signIn`, `signOut`, each taking an already-constructed client plus input, validating before any network call, and returning a discriminated result carrying field errors or a mapped failure identifier (spec `auth`)
- [x] 3.8 `@pinpoint/auth`: unit-test with a stubbed client — validation failure issues no call; a known service error maps to its identifier; an unknown one maps to generic
- [x] 3.9 Verify `packages/auth` imports no cookie API, no secure-storage module, and nothing under `apps/`; run `pnpm check:cycles` (spec `auth`, spec `monorepo-structure`)

## 4. Web application

- [x] 4.1 Add `@supabase/ssr` and `@pinpoint/auth` to `apps/web`, and **add `@pinpoint/auth` to `transpilePackages` in `next.config.ts`** — a missing entry fails the build with an unhelpful parse error (AGENTS.md — gotchas)
- [x] 4.2 Add the Supabase URL and publishable key to `apps/web/lib/config.ts` as required, validated variables, and to `.env.example` with shape-carrying placeholders. Nothing else reads `process.env` (AGENTS.md — configuration)
- [x] 4.3 Server and browser Supabase clients backed by cookies, both reading credentials from the config module rather than `process.env` directly
- [x] 4.4 Middleware that refreshes the session on each request and writes the updated cookies back
- [x] 4.5 Auth guards: one that redirects to sign-in when there is no valid session and returns the account id otherwise, and one that redirects an already-signed-in visitor away from the auth screens. The check must run before a protected screen renders (spec `auth`)
- [x] 4.6 Sign-up, sign-in, and sign-out — forms plus server actions calling `@pinpoint/auth`, rendering field errors per field and the mapped failure at form level
- [x] 4.7 On successful sign-up, link the new account to its seeded member row by setting `user_id`, and confirm no attributed row changes (design D5, spec `trips`)
- [x] 4.8 A protected page listing the trips the signed-in person is a member of, read from the database with no client-side filtering
- [x] 4.9 Confirm an account with no membership sees an empty list rather than an error (spec `trips`)

## 5. Mobile application

- [x] 5.1 Add `expo-secure-store`, `react-native-url-polyfill`, and `@pinpoint/auth` to `apps/mobile`
- [x] 5.2 Add the Supabase URL and publishable key to `apps/mobile/lib/config.ts` and `.env.example`, matching the web contract
- [x] 5.3 A Supabase client using secure storage as the session store, with URL session detection off (there is no URL to read a session back from)
- [x] 5.4 A sign-in screen calling `@pinpoint/auth`, and sign-out. **No sign-up route or control** (design D8, spec `auth`)
- [x] 5.5 Route protection: an unauthenticated launch lands on sign-in, an authenticated one lands on the signed-in area
- [x] 5.6 The same trips list as web, proving the shared package and the policies both work under Metro's resolution (design D10)
- [x] 5.7 Confirm the session survives closing and reopening the application

## 6. Verification

- [x] 6.1 Sign up on web, sign in on both applications with the same account, and confirm both show the same trip
- [x] 6.2 With a second account that has no membership, confirm both applications show an empty list and neither errors
- [x] 6.3 Query a table directly with the publishable key and no session; confirm zero rows from every table (spec `trips`)
- [x] 6.4 Query as a signed-in member for rows belonging to a trip they do not belong to; confirm zero rows and no indication of whether the trip exists
- [x] 6.5 Confirm the same credentials are accepted or rejected identically by both applications' forms (spec `auth`)
- [x] 6.6 Run `pnpm lint`, `pnpm lint:mobile`, `pnpm typecheck`, `pnpm typecheck:mobile`, `pnpm test`, `pnpm check:cycles`, and a web production build
- [x] 6.7 Confirm no `.env` file is tracked and `.env.example` is not ignored, for both applications
- [x] 6.8 `openspec validate establish-auth-and-schema --strict`
