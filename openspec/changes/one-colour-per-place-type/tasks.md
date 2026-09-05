# Tasks

Ordered by dependency. Section 1 settles the two new values before anything is
built on them; sections 2–4 move outward from `@pinpoint/tokens` and
`@pinpoint/map` to the two applications; section 5 is looking, which this repo
has learned three times is where the defects are.

## 1. Settle the palette before building on it

- [x] 1.1 Build an HTML mock: all seven pins at real size, over the real basemap
      in both themes, using real Figtree and the real glyphs. Commit its source
      beside this proposal, as the toolbar change did.
      → `mock/palette.html`, published at
      https://claude.ai/code/artifact/7676c1a3-61a4-4446-b7b2-b25a6494d82c
      The two candidates are live-editable in the rail and every check below
      re-measures; it emits the `colour.ts` block when the values are settled.
- [ ] 1.2 Choose `nature`'s light and dark values against the mock. Starting
      candidates `#3F7A32` / `#6FB45C`. It must clear `transport`'s teal at pin
      size, not at swatch size.
- [ ] 1.3 Draw a `nature` pin over the basemap's park fill in both themes —
      `#E1E5DC` / `#1F241F` — and confirm it holds its ground. A viewpoint sits in
      a park; this is the placement, not an edge case.
- [ ] 1.4 Choose `place`'s light and dark values. Starting candidates `#8B857A` /
      `#A8A197`. It must read as the least saturated pin in the set and must not
      read as a faded `culture`.
- [ ] 1.5 Confirm the glyph clears its floor on both new values — white on the
      light pair, near-black on the dark pair — at the ratios `culture`'s slate
      already achieves.
- [ ] 1.6 Confirm the ranking holds with the majority reassigned: `culture` is the
      most recessive coloured value in both themes, and the other five are
      prominent in both.
- [ ] 1.7 Lay all seven beside the amber accent and `danger`, in both themes. Nine
      values on one screen is the actual test of the cap, and it has never been run.

## 2. The shared packages

- [x] 2.1 `packages/tokens/src/colour.ts` — replace `MARKER_FAMILY_COLOURS` with
      seven type colours. Rewrite the block comment: the reason `see` was recessive
      now attaches to `culture`, and the reason `place` is a neutral is new.
- [x] 2.2 `packages/tokens/scripts/derive.ts` — emit `--pp-pin-*` and
      `theme.markerType`; move the completeness check with them. Run `derive` and
      commit the generated output. (`--pp-type-*` was the obvious name and is
      taken by the typography scale; see design.md.)
- [x] 2.3 `packages/map/src/marker-type.ts` — delete `MARKER_FAMILIES`,
      `MarkerFamily` and `MarkerTypeDefinition.family`. Seven types, seven icons.
      Retire the nine unused icon names. Rewrite the header comment: it documents
      the two-channel decision this change reverses, and leaving it would make the
      file argue against its own contents.
- [x] 2.4 `packages/map/src/marker-migrate.ts` — the old-to-new table, exhaustive
      over all sixteen retired identifiers, exported for the applications and the
      geocoder.
- [x] 2.5 `markerTypeOf` resolves through the table before the fallback. The
      fallback survives for values never defined.
- [x] 2.6 `packages/map/src/marker-view.ts` — `MarkerView.family` becomes
      `MarkerView.type`.
- [x] 2.7 `packages/geocode/src/type-guess.ts` — retarget the OSM tag table onto
      the seven. The input vocabulary does not change; only the right-hand side.
      `zoo` and `aquarium` go to `nature` directly rather than through
      `attraction` — the one place the collapse *gains* precision, since those
      tags were always distinct and the old type list had nowhere to put them.
      The coarse keys `natural` and `leisure` both go to `nature`, which for
      `leisure` is what its existing `park` mapping already composes to.
- [x] 2.8 Confirm `packages/core` needs no edit beyond its tests —
      `markerTypeSchema` reads identifiers from `@pinpoint/map` and should follow
      for free. If it does not, that is worth knowing before the applications are
      touched. **It did**: `isMarkerType` kept its signature, so validation
      narrowed to the seven with no code change. Only the comment moved — and it
      gained a sentence, because reads and writes are now deliberately asymmetric
      (a retired identifier reads fine and must never be written).

## 3. The applications

- [x] 3.1 `apps/web` — `pin.tsx`, `marker-form.tsx`, `marker-details.tsx`,
      `place-search.tsx`. Every `var(--pp-family-*)` becomes `var(--pp-type-*)`.
- [x] 3.2 `apps/web/app/_components/marker-icon.tsx` — the glyph map drops to seven
      entries.
- [x] 3.3 `apps/mobile` — the same four components, through `theme.markerType`.
- [x] 3.4 Both type grids go from sixteen cells to seven. On the phone this is the
      grid the roadmap records as eleven pins tall; check what seven does to the
      sheet's height rather than assuming it only shrinks.
      Web moved from `auto-fill` to a fixed four columns: with sixteen items any
      count divided tidily, with seven a width-dependent count can leave one
      orphan on the second row. The phone's grid is a wrapping flex row and needs
      no change — but the sheet is shorter now, so confirm the detent still suits
      it when looking (5.5).

## 4. Tests

- [x] 4.1 Every one of the sixteen retired identifiers resolves to a live type, and
      none reaches the fallback. This is the test that would have caught the silent
      version of this change.
- [x] 4.2 A value never defined still takes the fallback and still renders.
- [x] 4.3 No two types share a colour, asserted over the token module rather than
      by reading it.
- [x] 4.4 Update `marker-view.test.ts` and `marker-type.test.ts` — the assertions
      that a temple and a castle share a family are the behaviour being removed.
      Invert them rather than deleting them, so the guard says it was retired on
      purpose.
- [x] 4.5 Update `type-guess.test.ts` for the new targets.
- [x] 4.6 The icon-mapping completeness check still fails on an unmapped identifier
      in either application.

## 5. Looking

The last three changes each shipped defects that typechecked, linted, built, and
were wrong. None of the following is confirmable by reading.

- [ ] 5.1 Open the seeded Kyoto trip on the laptop, both themes. Every marker was
      written with a retired identifier, so this is the remap's real test: no pin
      should read as `place` unless it was stored as `other`. A field of neutral
      pins means the remap is falling through, which is exactly the failure this
      change exists to avoid.
- [ ] 5.2 The same trip on the phone, both themes. The same place is the same
      colour in both applications.
- [ ] 5.3 Mark several places visited and look at the map. `VISITED_OPACITY` is out
      of scope and is expected to be bad; confirm it is no *worse* on the two new
      values than it already is on the five that survive, and file what is found.
- [ ] 5.4 Select a pin of each type. The amber ring must not read as an eighth
      type against any of the seven, and least of all against `place`.
- [ ] 5.5 Search for a place of each type and look at the type chip in the results,
      the form, and the detail card — four surfaces resolve a colour and only one
      of them is the map.
- [ ] 5.6 Read the map in greyscale, or with the macOS colour filter on. Seven
      values reduced to seven lightnesses is a harder problem than five were, and
      the phone's narrowed state is already an open loose end for the same reason.

## 6. Documentation

- [x] 6.1 `DESIGN.md` — rewrite *Secondary — The Marker Families*, the *Sixth
      Family Rule* and the *Ranking Rule*. The Sixth Family Rule inverts outright:
      a new type now brings exactly one colour, and that is the cost that bounds
      the list.
- [x] 6.2 `DESIGN.md` Do/Don't — the entry saying new types never bring a colour is
      now backwards.
- [x] 6.3 `openspec/ROADMAP.md` — add to *Done* when it lands, and file the visited
      pin under *Loose ends* with the measured numbers from `design.md`, since this
      change found it and deliberately did not fix it.
- [ ] 6.4 Close `#89` against this change, saying plainly that it was answered by
      removing types rather than by adding colours.
