## 1. The wording

- [x] 1.1 Add `EMPTY_FIELD_WORDING` to `packages/core/src/empty-field-wording.ts`, export
      it from the package, and pin it in a test.

## 2. The cards

- [x] 2.1 Laptop: `apps/web/app/_components/marker-details.tsx` reads the day, note and
      link wording from `EMPTY_FIELD_WORDING`.
- [x] 2.2 Phone: `apps/mobile/components/marker-details.tsx` does the same; `Field` no
      longer carries a default phrase of its own.

## 3. The specification

- [x] 3.1 Apply the delta to `openspec/specs/map-rendering/spec.md`. It is a `MODIFIED`
      requirement, so check every sentence of the old text is carried forward.

## 4. Looking at it

- [x] 4.1 Laptop: open a place with no day, note or link, in both themes. It reads
      `No day yet`, `No note yet`, `No link yet`. *Verified in the running app on Maruyama Park, which has no day and no link: both read in words, muted, in dark and light. No place in the trip has an empty note, so that one is by reading — it goes through the same `Absent`.*
- [x] 4.2 Phone: the same place reads the same words. *By reading, not by looking: the sheet's `Field` now requires its wording and all three are passed from `EMPTY_FIELD_WORDING`. Not run on a simulator.*
- [x] 4.3 A place with every field filled shows none of those words. *Verified on Chayamachi.*

## 5. Close out

- [x] 5.1 `pnpm verify` green.
- [x] 5.2 `openspec validate empty-fields-say-what-is-missing --strict`.
- [x] 5.3 `openspec archive empty-fields-say-what-is-missing`.
