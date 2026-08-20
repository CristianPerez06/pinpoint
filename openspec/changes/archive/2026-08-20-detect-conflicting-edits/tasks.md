## 1. The column, and who maintains it

- [x] 1.1 Add a migration giving `markers` an `updated_at`, defaulting to `now()` so
      existing rows are not null
- [x] 1.2 Add a `before update` trigger that sets it, so no caller can forget it or fake it
- [x] 1.3 Confirm `pnpm check:rls` still passes — the migration touches a secured table and
      must not disturb its policies

## 2. The domain

- [x] 2.1 Add `updatedAt` to `markerSchema`, and deliberately **not** to
      `markerPatchSchema` — it is a precondition of a write, not a field somebody edits
- [x] 2.2 Add `conflict` to `WriteOutcome`, distinct from `invalid-input` and `rejected`
- [x] 2.3 Unit-test that the three refusals are distinguishable without reading a message
      string. Also pinned that `markerPatchSchema` drops `updatedAt` — it falls out of
      `newMarkerSchema`'s explicit pick rather than from an omit, and a test says so in
      case that pick ever becomes an omit.

## 3. The write path

- [x] 3.1 `updateMarker` takes the version it is updating from and applies it as a filter,
      so Postgres checks and writes in one statement rather than leaving a window
- [x] 3.2 Distinguish "changed underneath you" from "no longer exists" by re-reading when
      the update matches nothing — otherwise deleting a marker elsewhere reports a conflict
- [x] 3.3 Unit-test both, and test that an ordinary edit is unaffected.
      The read test needed fixing too: its fixture had no `updated_at`, and `toMatchObject`
      treats a missing field as absent rather than wrong — so it would have gone on passing
      even if the column never reached the domain type. Its fixture now carries a value
      different from `created_at`, so the assertion cannot pass by coincidence.

## 4. On web

- [x] 4.1 Carry the marker's version into the edit form and back out with the save
- [x] 4.2 Report a conflict in its own words — somebody else changed this place — without
      discarding what was typed
- [x] 4.3 Confirm the marker in client state is not updated when a save is refused

## 5. Checks, and looking

Run against two browsers by the author. Worth stating for this change in
particular: the defect it fixes is invisible by construction — a silent overwrite
leaves no error, no log line and no failing test — so the only way to know the
guarantee works is to make two people collide on purpose and watch.

- [x] 5.1 Edit a place in two browsers: save in one, then save in the other, and confirm
      the second is refused and the first survives
- [x] 5.2 Confirm what was typed is still in the form after the refusal
- [x] 5.3 Confirm an ordinary edit — nobody else touching it — still saves
- [x] 5.4 Delete a marker in one browser and edit it in the other; confirm it does not
      report a conflict, because that is not what happened
- [x] 5.5 Mark a place visited in one browser while editing it in the other, and confirm
      the edit is refused. Over-eager and intended — the row did change
- [x] 5.6 Confirm the mobile app still reads, still shows markers, and still builds
- [x] 5.7 The migration was applied with `pnpm db:push`, and `pnpm db:types` regenerated
      `database.types.ts` against the real database. The diff was **empty** — the column
      hand-added to keep the build compiling matched what the migration actually produced.
- [x] 5.9 Run `pnpm lint`, `pnpm lint:mobile`, `pnpm typecheck`, `pnpm typecheck:mobile`,
      `pnpm test`, `pnpm build`, `pnpm check:cycles`, `pnpm check:tokens`,
      `pnpm check:fonts`, `pnpm check:rls` and `pnpm check:specs`
- [x] 5.8 Run `openspec validate detect-conflicting-edits --strict`
