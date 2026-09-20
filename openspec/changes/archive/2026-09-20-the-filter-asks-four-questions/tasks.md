## 1. What a filter means

- [x] 1.1 Add `kind`, `day` and `city` to `MarkerFilter` in
      `packages/core/src/marker-filter.ts`. Each is a closed shape that cannot hold two
      answers at once, the way `InterestFilter` is — `NO_FILTER` names the unfiltered
      value for every one of them, because "unfiltered" is a guarantee this
      specification makes and is easier to keep with one definition.
- [x] 1.2 Extend `matchesFilter` so the three new questions compose with the two that
      exist: a marker survives when it satisfies all five. Kind and day each match on
      **any** of their chosen values.
- [x] 1.3 Make kind match on the kind a marker is **drawn** as, not on its stored string.
      Take the read-side resolution from `@pinpoint/map`'s `markerTypeOf`; do not attach
      a type predicate to the schema's `refine`, which would retype `Marker.type`
      through every consumer.
- [x] 1.4 `activeFilterCount` counts the three new questions, one each, so it reads 4
      when all four are asked. Naming five kinds or five days is still one question, for
      the reason naming five members is.
- [x] 1.5 Derive the days a trip offers: the days it spans, plus any day its places
      carry, including days outside the trip's own dates. A trip with no dates of its
      own still offers its places' days.
- [x] 1.6 Tests in `marker-filter.test.ts` for each new question alone and in
      combination: any-of for kind and day, a place drawn as a fallback kind, a place on
      several days matching any one of them, the undated pile, and the unfiled pile.
- [x] 1.7 Tests for the day set: a trip with no dates, a place dated outside the trip.

## 2. The city list stops being specified to hide

- [x] 2.1 Leave `markersSelectedBy` doing the camera and search-bias job it already
      does. Rewrite its doc comment to say that selecting a city frames and never hides,
      and why — the requirement said otherwise for as long as it existed.
- [x] 2.2 Check both workspaces still narrow the drawn set by `matchesFilter` alone, so
      that no city selection reaches it.

## 3. The laptop

- [x] 3.1 Rebuild `filter-bar.tsx`'s panel as one row per question, each expanding, with
      *Not filed under a city* and *Hide visited* staying as plain choices and *Clear the
      filter* at the foot.
- [x] 3.2 Each collapsed row states what its question is set to, in words, truncating
      rather than growing. The trigger's own label is untouched — same word, same pip,
      same slot.
- [x] 3.3 Head the kind list with wording that says it selects **any** of the ticked
      kinds, so it is not read as the *Wanted by* list above it.
- [x] 3.4 Day list grouped by week, with the places carrying no day offered beneath it.
- [x] 3.5 Confirm the trigger still measures 124px with four criteria applied, and that
      the panel does not move when a filter is applied.

## 4. The phone

- [x] 4.1 The same four questions in `filter-sheet.tsx`, in the sheet's own form, reading
      the same predicate.
- [x] 4.2 The sheet scrolls its content inside a container with a definite height —
      `SHEET_CAP`, not a container sizing to its children — or the list past the first
      rows is clipped.
- [x] 4.3 The toolbar's filter button is unchanged: glyph, pip, and the accessible name
      that says some places are hidden.

## 5. Look at it

- [x] 5.1 On the laptop, on a real trip: narrow by kind alone, by day alone, by both, and
      with people and visited on top. Check the map and the calendar disagree only where
      they are meant to — the calendar shows every place whatever the map is narrowed to.
- [x] 5.2 Narrow to a kind and a day that between them match nothing, and check it reads
      as a filter matching nothing rather than as a trip with no places.
- [x] 5.3 Make a place unfiled, narrow to *Not filed under a city*, and check it is the
      only one drawn. Then select Unassigned in the city list and check nothing is
      hidden. Validated by the user; the write to the live trip was theirs to make. The
      half needing no write was checked here — with nothing unfiled the choice reads as a
      filter matching nothing (*"No places match this filter. The trip still has 105
      places"*) rather than as an empty trip — and the city list's half was confirmed
      while exploring, where framing on Osaka leaves seven of Nara's eight places drawn.
- [x] 5.4 Open the panel on the largest trip available and confirm every question and the
      way out are reachable without scrolling past the questions.
- [x] 5.5 The same four passes on the phone, in both themes. Dark was checked here — the
      sheet, its scroller, the pinned foot and the toolbar's declaration — and is where
      the open row's chevron was found missing and fixed. Light validated by the user.
- [x] 5.6 Both applications, both themes, and the laptop at its phone-shaped arrangement.
      The laptop was checked here in both themes. Its phone-shaped arrangement was
      validated by the user — the browser would not resize below its own window here.

## 6. Finish

- [x] 6.1 `pnpm verify`.
- [x] 6.2 `openspec validate the-filter-asks-four-questions --strict`.
- [x] 6.3 Present `findings.md`, then archive.
