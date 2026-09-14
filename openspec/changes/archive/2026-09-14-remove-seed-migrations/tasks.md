## 1. Confirm the live database before touching anything

- [x] 1.1 Re-run the read-only check against the live project with
      `pnpm exec supabase db query --linked`: no trip named `Japan`, zero markers named
      after any of the eighteen seeded places, and both `20260803023543` and
      `20260808120000` still listed in `supabase_migrations.schema_migrations`. Record the
      trip, member, city and marker counts — task 3.2 compares against them. If any seeded
      row has come back, stop and bring it to the user.
      *Recorded 2026-09-14: 1 trip, 2 members, 1 city, 1 marker, 0 interest rows; no
      `Japan` trip, 0 seeded places; both versions still listed.*

## 2. Remove the seed

- [x] 2.1 Delete `supabase/migrations/20260803023543_seed_first_trip.sql` and
      `supabase/migrations/20260808120000_seed_kyoto_markers.sql`; verify `ls
      supabase/migrations/` lists the four remaining files.
- [x] 2.2 Mark both versions reverted:
      `pnpm exec supabase migration repair --linked --status reverted 20260803023543 20260808120000`.
      Verify neither version is in `supabase_migrations.schema_migrations` any more.
- [x] 2.3 `pnpm exec supabase db push --dry-run` reports the remote is up to date, with
      nothing to apply and no complaint about missing local migrations.

## 3. Verify

- [ ] 3.1 With Docker running, `pnpm exec supabase db reset --local` builds a database
      from the migrations; `trips`, `trip_members`, `cities`, `markers` and
      `marker_interest` each count zero rows.
      *Not run: Docker's disk is full (`No space left on device` during `initdb`), and
      freeing it would clear other projects' build cache. Checked by reading instead:
      in the four remaining migrations every `insert` is inside `create_trip()` or
      `claim_trip_memberships()`, and the one top-level statement is
      `update public.markers`, which matches nothing on an empty table.*
- [x] 3.2 Re-run the counts from 1.1 against the live project; every one is unchanged.
      *Unchanged at 21:46 UTC. At 21:49 UTC 36 places were bulk-inserted into "Japan 2026"
      from outside this change (current type identifiers, not the seed's), bringing it to
      37; seven share a name with a seeded place.*
- [x] 3.3 `pnpm check:rls` passes.

## 4. Documentation

- [x] 4.1 `PRODUCT.md` § Evidence on Hand — remove the *A seeded first trip* bullet
      entirely. Verify `grep -n -i seed PRODUCT.md` returns nothing.
- [x] 4.2 `DESIGN.md` § *Secondary — The Place Types* — remove the clause "the seeded
      Kyoto trip is ten `culture` against one each of the rest, and no `food` at all",
      leaving the paragraph reading as a whole sentence. Verify `grep -n -i seed
      DESIGN.md` returns nothing.

## 5. Look at the running apps

- [x] 5.1 Open the web app signed in against the live project, both themes: "Japan 2026"
      loads, its place is on the map and its details open.
- [ ] 5.2 The same on the phone.
      *Dark: "Japan 2026" loads on the current bundle and a place's details open. Light not
      yet checked — the app is set to Dark and the in-app setting could not be driven
      from here. Not pursued: this change touches no application code.*

## 6. Close out

- [x] 6.1 `pnpm verify` passes and `openspec validate remove-seed-migrations --strict`
      passes.
