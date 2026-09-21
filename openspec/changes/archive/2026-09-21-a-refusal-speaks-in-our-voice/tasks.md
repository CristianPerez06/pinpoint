## 1. Say which fields the surface supplies

Do this first: the guard in group 3 reads these, and writing them first means the guard
can be run against the messages as they land.

- [x] 1.1 In `packages/core/src/marker.ts`, name the marker's surface-supplied fields
  (`tripId`, `lng`, `lat`) as a runtime constant beside the schema, and rebuild
  `MarkerFormValues` from it so the type and the constant cannot disagree. Verify
  `pnpm typecheck:packages`, `pnpm typecheck` and `pnpm typecheck:mobile` all still pass —
  both forms are built from that type, so a mistake here stops them compiling.
- [x] 1.2 Do the same in `city.ts` (`tripId`) and `trip-member.ts` (`tripId`). Verify
  `pnpm typecheck:packages` passes.
- [x] 1.3 In `trip.ts`, state that a trip has no surface-supplied fields — a trip is made
  of what the person typed — as an explicit empty declaration rather than an absent one,
  so the guard can tell "nothing is excluded" from "nobody has said". Verify
  `pnpm typecheck:packages` passes.

## 2. Write the sentences

Each message ends in a full stop and does not name its own field. Put them on the base
description (`markerSchema`, `tripSchema`, `citySchema`, `tripMemberSchema`) so both the
create and the patch schema inherit them.

- [x] 2.1 A place's `name`, `note` and `link` in `packages/core/src/marker.ts`: empty
  name, over-long name, over-long note, malformed link, over-long link. Verify by
  parsing each bad value in `marker.test.ts` and asserting the exact sentence.
- [x] 2.2 A place's `price` and `localPrice`. The dollar case is the one from #196 —
  `-5` must read as a sentence, not as `Too small: expected number to be >0`. Verify in
  `marker.test.ts`, including that the local price's message still arrives under the
  `localPrice` key so the form can prefix it with the currency code.
- [x] 2.3 A place's `plannedOn`, `plannedUntil` and `cityId` — a malformed date and an
  unrecognised city. Leave `markerTypeSchema` alone: it already says `Unknown marker
  type.`, and per AGENTS.md nothing about `isMarkerType` is to be touched. Verify in
  `marker.test.ts`.
- [x] 2.4 The three-letter code check in `packages/core/src/currency.ts`, which has no
  message today. The USD refine already has one and stays as it is. Verify in
  `currency.test.ts`.
- [x] 2.5 A trip's `name` and its two dates in `packages/core/src/trip.ts`. The
  end-before-start message already exists and stays. Verify in `trip.test.ts`.
- [x] 2.6 A city's `name` in `packages/core/src/city.ts`. Verify in `city.test.ts`.
- [x] 2.7 An invitation's `displayName` and `email` in `packages/core/src/trip-member.ts`.
  The email message matches the one the sign-in screen already gives for the same
  mistake — verify in a test that asserts the two are the same string, so they cannot
  drift into two answers for one error.
- [x] 2.8 Sweep `opening-hours.ts` and `auth.ts` and confirm every message there is
  already a written sentence ending in a full stop; fix any that is not. Verify the
  existing tests still pass.

## 3. The guard

- [x] 3.1 Add `packages/core/src/refusal-messages.test.ts`: walk each write schema's
  shape, skip the fields named in group 1, unwrap `.nullable()`, `.optional()` and
  `.default()`, and assert every remaining constraint carries a message of its own.
  Verify it passes against the messages written in group 2.
- [x] 3.2 In the same file, assert every message is a sentence — begins with a capital,
  ends in a full stop. Verify it fails when pointed at a schema with a bare
  `z.string().min(1)` and passes on the real ones.
- [x] 3.3 Add the honesty probe: with `z.config({ customError })` returning a sentinel,
  parse a fixture of one field with a message and one without, and assert the walk and
  the probe agree about which is which. Verify by temporarily removing a message and
  confirming both report it.
- [x] 3.4 Confirm the guard fails for the right reason: add a field with an unmessaged
  constraint to a schema, run `pnpm --filter @pinpoint/core test`, check the failure names
  the field and the record, then remove it.

## 4. See it

- [x] 4.1 On the laptop, type `-5` into each price on a place in a city with a second
  currency and save. Verify the dollar message is a sentence and the local one still
  reads `JPY: …`, per `marker-capture`.
- [x] 4.2 On the laptop, sweep the rest by hand: empty place name, a link that is not a
  link, an empty trip name, an empty city name, an invitation to a malformed address.
  Verify none of them answers in the library's voice.
- [x] 4.3 Repeat 4.1 and 4.2 on the phone and verify each message is word-for-word what
  the laptop said. This is the check that the shared description did its job.

## 5. Close it out

- [x] 5.1 Run `pnpm verify` and verify it passes end to end.
- [x] 5.2 Run `openspec validate a-refusal-speaks-in-our-voice --strict` and verify it
  passes.
- [x] 5.3 Re-read the checklist on issue #196 and confirm each box is honestly tickable,
  including "every refusable field reviewed, not only the price".
