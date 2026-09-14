## Why

Two migrations exist only so early development had a populated map: a trip called
"Japan" with two invited members, and a Kyoto city with eighteen made-up places. Trips
can now be created for real, so the made-up data has no job left — and a new database
built from the repository still comes up pre-filled with it (#126).

The live database has already moved on. Checked read-only on 2026-09-14: its only trip is
"Japan 2026", created on 2026-09-13, with one member, one city and one place. There is no
"Japan" trip and none of the eighteen seeded places, so the rows were removed by hand at
some point. Both seed migrations are still recorded there as applied.

## What Changes

- The two seed migrations are deleted from the repository:
  `20260803023543_seed_first_trip.sql` and `20260808120000_seed_kyoto_markers.sql`.
- The live database's record of applied migrations stops listing those two versions, so
  pushing migrations keeps working once the files are gone. This edits the record only;
  no trip, member, city or place is touched.
- The sentence in `PRODUCT.md` § Evidence on Hand citing the seeded trip as evidence for
  the colour ranking is removed, not reworded. The matching clause in `DESIGN.md`
  (*Secondary — The Place Types*) goes with it; the argument around it — a real wishlist
  is lopsided, so the majority type gets the quiet colour — stays.

What the person using the app sees: nothing changes on the live site. Anyone standing up
a new database from the repository gets an empty one, and sees the empty state that
offers to create a trip.

**Not being done:**

- **No migration that deletes rows.** There is nothing left to delete on the live
  database, and a fresh database never gets the rows once the files are gone.
- **No edit to an already-applied migration.**
  `20260810120000_city_currency_and_city_trip_integrity.sql` mentions the seed in a
  comment; applied migrations are history and stay as written.
- **No replacement test data.** If a populated trip is wanted for visual checks, that is
  its own decision.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No specification mentions the seed data; this change is repository and
documentation housekeeping, so the change declares `skip_specs`.

## Impact

- `supabase/migrations/` — two files deleted.
- Live Supabase project — two rows in its migration history marked reverted. No
  application data.
- `PRODUCT.md`, `DESIGN.md` — one sentence and one clause removed.
- **In-flight `one-colour-per-place-type`:** its visual checks (tasks 5.1 and 5.2) are
  written against "the seeded Kyoto trip". That trip is already gone from the live
  database, independently of this change, so those checks need a real trip to look at
  whichever change lands first.
