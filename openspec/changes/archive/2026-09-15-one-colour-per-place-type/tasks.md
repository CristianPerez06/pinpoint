# Tasks

Ordered by dependency. Section 1 settles the new values before anything is built
on them; sections 2–4 move outward from `@pinpoint/tokens` and `@pinpoint/map` to
the two applications; section 5 is looking, which this repo has learned three
times is where the defects are.

**Extended after the implementation landed.** The collapse first went to seven
and folded Temple into `culture`; the eighth type takes it back out. Ticked items
below are the record of what the seven-type pass did and are left as they stand —
where one says *seven*, that is what was true when it was done. The delta is
carried by the unticked items added to the end of each section.

## 1. Settle the palette before building on it

- [x] 1.1 Build an HTML mock: all seven pins at real size, over the real basemap
      in both themes, using real Figtree and the real glyphs. Commit its source
      beside this proposal, as the toolbar change did.
      The commit half of this was not actually done until now: `.gitignore`
      excluded `mock/*.html` as generated output, which this mock is not — it has
      no builder, so the HTML is the source. The rule is narrowed rather than
      dropped; see `.gitignore`.
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
      read as a faded `temple` — the slate is `temple`'s now, and that is the pin
      `place` sits closest to.
- [ ] 1.5 Confirm the glyph clears its floor on all three new values — white on
      the light values, near-black on the dark ones — at or above the ratios the
      slate achieves (3.61:1 light, 7.06:1 dark).
- [ ] 1.6 Confirm the ranking holds with the majority reassigned: `temple` is the
      most recessive coloured value in both themes, and the other six are
      prominent in both.
- [ ] 1.7 Lay all eight beside the amber accent and `danger`, in both themes. Ten
      values on one screen is the actual test of the cap, and it has never been run.
      This is now the check the change turns on rather than a formality: eight
      types is *at* the cap, not under it.
- [x] 1.8 Add the eighth pin to `mock/palette.html`: `temple` on the slate, and
      `culture` live-editable alongside `nature` and `place`. Re-publish, and
      update the URL recorded in 1.1 if it changes.
      Eight pins, the castle glyph, `temple` removed from the mock's remap, three
      editable candidates, and new checks 1.9/1.10/1.11. Republished to the URL
      in 1.1, which is unchanged. The source is now committed as well — see 1.1.
- [x] 1.9 Choose `culture`'s light and dark values against the mock. Settled at
      `#B43F72` / `#E57DA5` — CIE LCh hue 356°, the middle of the 94° span between
      `shopping` at 310° and `food` at 44°, clearing 46° and 48°. For comparison
      `nature` against `transport`, already judged acceptable, is 49°.
      The first candidates (`#A83C81` / `#DE7BB5`) were picked in OKLCH and came
      out 33° from `shopping` when the mock measured them in CIE LCh. Both gaps
      and the glyph ratios now clear; **what is not settled by a number is
      whether a rose reads as the right colour for a museum**, which is 1.7's job
      and yours.
- [ ] 1.10 Draw `place` beside `temple` at pin size in both themes. This is the
      design's one acknowledged soft pair and it has changed which type it is
      against; confirm they still part by hue direction and not by lightness.
- [ ] 1.11 Put a selected `culture` pin — deep rose inside the amber ring —
      beside a selected `food` pin. The widest hue pairing in the product, and an
      argument that it will look fine is not a look at it.

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
- [x] 2.9 `packages/map/src/marker-type.ts` — add `temple` to the type list and to
      `MARKER_TYPE_IDS_TUPLE`. It goes second, after `place`: the list runs from
      what a trip holds most of to what it holds least, and `temple` is now the
      most. Rewrite the header comment's "seven types" and its *do not add an
      eighth* sentence — the eighth is spent, and what the comment has to warn
      against now is a ninth.
- [x] 2.10 `packages/map/src/marker-type.ts` — `temple` takes the `landmark`
      glyph, which is the columned facade and the one that actually draws a
      temple. `culture` takes `castle`, brought back from the nine names the
      seven-type pass retired. Update the icon comment: eight names, eight types,
      and eight retired rather than nine.
- [x] 2.11 `packages/map/src/marker-migrate.ts` — **delete** the `temple` entry.
      A live identifier must not appear in the retired table; it resolves to
      itself. Add a line to the block comment saying so, because an entry there
      would pass the exhaustiveness test while asserting the opposite of the truth.
- [x] 2.12 `packages/tokens/src/colour.ts` — an eighth entry, `temple`, taking the
      slate; `culture` takes the value settled in 1.9. Rewrite the block comment:
      the reason the slate is recessive now attaches to `temple`, the majority
      count it cites is wrong and cites a seed that no longer exists, and
      `culture` has to be described as a prominent minority type.
- [x] 2.13 `packages/geocode/src/type-guess.ts` — `temple`, `shrine`, `monastery`
      and `place_of_worship` retarget to `temple`, and `church`, `cathedral`,
      `chapel`, `mosque` and `synagogue` are added, which the table does not carry
      at all today. Leave `tourism` and `historic` on `culture`. Record in the
      comment that the scope is any place of worship and that the label is the
      accepted cost.
- [x] 2.14 Re-run `derive` and commit the generated output — an eighth
      `--pp-pin-*` and an eighth `theme.markerType` entry.

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
      it when looking (5.7).
- [x] 3.5 Both `marker-icon.tsx` records gain `castle` and keep `landmark`, now
      pointing at different types. Two files, two icon sets, same two names.
      `lucide-react` and `lucide-react-native` both carry `castle`; no new
      dependency, and the mobile side keeps its one-icon-per-import style.
- [x] 3.6 Both type grids go from seven cells to eight. On web that is two tidy
      rows of four, which is what the fixed four-column grid was chosen for — no
      CSS change was needed, only its comment, which still described the seven.
      On the phone the wrapping row grows by one; re-check the detent in 5.7
      rather than assuming one more cell cannot change it.
- [x] 3.7 Nothing else in either application names a type. Confirm it — `pin.tsx`,
      `marker-form.tsx`, `marker-details.tsx` and `place-search.tsx` all resolve
      through the shared list, and an eighth type should reach all four without
      an edit. If any of them needs one, that is a leak worth knowing about.

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
- [x] 4.7 `temple` resolves to `temple`, not to `culture`. The regression this
      extension exists to prevent, and it fails today.
- [x] 4.8 `temple` does not appear in `RETIRED_TYPES`. Asserted directly rather
      than inferred from 4.7 — 4.7 would still pass with a stale entry present,
      because the live list is consulted first.
- [x] 4.9 4.1 still holds over the fifteen remaining retired identifiers, and no
      live identifier is among them. State it as *the retired set and the live set
      are disjoint*, which is the property, rather than as a list that has to be
      edited every time a type moves.
- [x] 4.10 `type-guess.test.ts` — `place_of_worship`, `church` and `mosque` all
      reach `temple`; `museum` and `castle` still reach `culture`.

## 5. Looking

The last three changes each shipped defects that typechecked, linted, built, and
were wrong. None of the following is confirmable by reading.

- [ ] 5.1 Make a trip to look at. The seeded Kyoto trip these checks were written
      against was deleted in #138, so there is no longer anything to open. It needs
      a place of each of the eight types and a **lopsided** count — several
      temples, one restaurant — because an even eight would make the ranking look
      fine when the ranking is the thing being checked.
- [ ] 5.2 Open it on the laptop, both themes. Any place saved before this change
      carries a retired identifier, so this is the remap's real test: no pin should
      read as `place` unless it was stored as `other`. A field of neutral pins
      means the remap is falling through, which is exactly the failure this change
      exists to avoid.
- [ ] 5.3 The same trip on the phone, both themes. The same place is the same
      colour in both applications.
- [ ] 5.4 Save a temple through the place search on both platforms and confirm it
      arrives as Temple rather than as Culture. Then save a church, which reaches
      the tag table for the first time — it should arrive as Temple too, labelled
      wrongly and coloured rightly, which is the trade recorded in `design.md`.
- [ ] 5.5 Mark several places visited and look at the map. `VISITED_OPACITY` is out
      of scope and is expected to be bad; confirm it is no *worse* on the three new
      values than it already is on the five that survive, and file what is found.
- [ ] 5.6 Select a pin of each type. The amber ring must not read as a ninth type
      against any of the eight, and least of all against `place`.
- [ ] 5.7 Search for a place of each type and look at the type chip in the results,
      the form, and the detail card — four surfaces resolve a colour and only one
      of them is the map. Check the phone's capture sheet detent here too, now that
      the grid is eight cells rather than seven.
- [ ] 5.8 Read the map in greyscale, or with the macOS colour filter on. Eight
      values reduced to eight lightnesses is a harder problem than five were, and
      harder again than seven; `temple` and `place` sit within 0.003 of each other
      in lightness by construction, so they *will* be one value here. Confirm
      nothing else collapses with them. The phone's narrowed state is already an
      open loose end for the same reason.

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
      removing types rather than by adding colours — and then, for the one
      distinction that was worth it, by adding a colour after all.
- [x] 6.5 `DESIGN.md` — the type list and the *Ranking Rule* name the recessive
      type; both move to `temple`. The *Sixth Family Rule*, already rewritten to
      say a new type costs a colour, gains the fact that the budget is now spent.
- [x] 6.6 `PRODUCT.md` — *five fixed colour groups (`see`, `eat`, `buy`, `sleep`,
      `move`)* and *Colour is carried by five fixed families, icons by a growable
      type list* both describe the scheme this change removed and were left behind
      when the implementation landed. They become eight types, each its own
      colour, with the type list bounded by the palette rather than growable.
