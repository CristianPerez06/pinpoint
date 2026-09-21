## 1. Name the field list once

- [x] 1.1 Add `MarkerFormValues` to `packages/core/src/marker.ts` as
  `Omit<NewMarker, 'tripId' | 'lng' | 'lat'>`, with a comment saying why those three are
  left out, and export it from `packages/core/src/index.ts`. Verify with
  `pnpm typecheck:packages`.
- [x] 1.2 Rewrite the paragraph in `packages/core/src/marker.ts` that says the type system
  cannot see a missing field and that a test is the only thing that would — it stops being
  true in task 2.1. Say instead why the four defaults remain: they answer for a caller the
  compiler never saw, which neither application is. Verify by reading it back beside
  `newMarkerSchema`.

## 2. Make the writes say what they accept

- [x] 2.1 Type `createMarker`'s `input` as `NewMarker` and `updateMarker`'s `patch` as
  `MarkerPatch` in `packages/data/src/markers.ts`. Verify `pnpm typecheck:packages` passes
  and that the `validate(...)` call in each is untouched.
- [x] 2.2 Do the same for the remaining six: `createCity`/`updateCity`
  (`NewCity`/`CityPatch`), `createTrip`/`updateTrip` (`NewTrip`/`TripPatch`),
  `inviteMember` (`NewTripMember`) and `recordInterest` (`NewMarkerInterest`). Verify
  `pnpm typecheck:packages` passes with no other edit to those files.
- [x] 2.3 Confirm no `: unknown` write parameter remains in `packages/data/src/`:
  `grep -n ": unknown" packages/data/src/*.ts` should return only `validate.ts` and the
  `hours` row field in `markers.ts`.

## 3. Let the tests keep being the untyped caller

- [x] 3.1 Add the `untyped` helper to `packages/data/src/writes.test.ts` as design.md
  describes, and route through it every call that deliberately passes something the
  compiler would now reject. Verify `pnpm test` passes with the same assertions as before.
- [x] 3.2 Give `VALID_MARKER` the three keys it currently omits (`hours`, `localPrice`,
  `localCurrency`), so the ordinary tests send what a real caller sends. Verify the test
  named "saves a place with no hours key as having none" still omits the key, through
  `untyped`, and still passes.

## 4. Take the field list off both forms

- [x] 4.1 Delete the hand-written `MarkerFormValues` from
  `apps/web/app/_components/marker-form.tsx` and import it from `@pinpoint/core`. Update
  the files that imported it from the form module (`trip-workspace.tsx`,
  `trip-calendar.tsx`). Verify `pnpm typecheck`.
- [x] 4.2 Do the same in `apps/mobile/components/marker-form.tsx` and its importers.
  Verify `pnpm typecheck:mobile`. Note that `plannedOn` becomes `string | null` rather
  than `IsoDay | null`; `IsoDay` is an alias for `string`, so nothing else should move.
- [x] 4.3 Add the `if (!draft) return` guard to `save` in
  `apps/web/app/_components/trip-workspace.tsx`, before the create branch, so the position
  passed is `number` rather than `number | undefined`. Verify `pnpm typecheck` passes and
  that the create branch now passes `draft.lng` / `draft.lat`.

## 5. Prove it catches the thing it was built for

- [x] 5.1 Temporarily add a field to `writableMarkerFields` in `packages/core/src/marker.ts`
  and run `pnpm typecheck && pnpm typecheck:mobile`. Verify both applications fail and each
  failure names the new field and the file. Remove the field afterwards.
- [x] 5.2 Temporarily delete one field from the object literal that opens the phone's
  capture form and run `pnpm typecheck:mobile`. Verify it fails and names the field.
  Restore it afterwards.

## 6. Look at both applications running

- [x] 6.1 On the laptop: save a new place from search and from a pointed position, edit
  one, and remove one. Verify each succeeds and that a blank name is still refused with the
  error under the name field.
- [x] 6.2 On the phone: the same four, plus saving a place straight onto a day from the
  calendar. Verify each succeeds — this is the path the original defect broke, and it
  type-checked then too.
- [x] 6.3 On both: create a city from inside the place form, rename a trip, and mark a
  place interesting. Verify each still works; these are the other six writes this change
  re-typed.

## 7. Close it out

- [x] 7.1 Run `pnpm verify`. Verify it passes end to end.
- [x] 7.2 Run `openspec validate a-missing-field-fails-the-build --strict`. Verify it
  passes.
