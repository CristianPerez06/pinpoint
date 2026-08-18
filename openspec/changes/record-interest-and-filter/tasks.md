## 1. The domain

- [x] 1.1 ~~Add~~ Verify the interest record in `@pinpoint/core` — it already existed
      (`marker-interest.ts`: schema, `InterestState`, `interestStateOf`) and matches what
      the specification requires, including absence meaning undecided. Nothing to add.
- [x] 1.2 Add `InterestFilter` and `VisitedFilter` as named values, and a pure
      `matches(marker, interestForMarker, members, filter)` predicate
- [x] 1.3 Unit-test the predicate against every combination the spec names, including the
      two that are easy to conflate: everybody declined is **not** "Nobody yet", and a
      member who declined does **not** count toward "Either"
- [x] 1.4 Unit-test that a trip with one unanswered member never satisfies "Both", so the
      behaviour behind the unclaimed-member risk is pinned rather than discovered

## 2. Reading and writing

- [x] 2.1 Add `fetchTripInterest(supabase, tripId)` to `@pinpoint/data`, returning the
      trip's records unfiltered — the policies decide what comes back
- [x] 2.2 Add `recordInterest` and `withdrawInterest`; withdrawing deletes the row rather
      than storing a third value
- [x] 2.3 Add `setMarkerVisited`, trip-wide, recording no author
- [x] 2.4 Resolve the reader's own `trip_members.id` for the current trip, since every
      write is attributed to a member rather than a user
- [x] 2.5 Confirm the existing policies actually refuse a write attributed to another
      member, with a rolled-back `do $$ … raise exception 'RESULT: %' … $$` probe rather
      than by reading the policy and assuming.
      **Verified against the live database:** the write was
      `refused: new row violates row-level security policy for table "marker_interest"`.

## 3. Recording, on web

- [x] 3.1 Load interest alongside markers and cities in the page's existing `Promise.all`,
      and hand it to the workspace
- [x] 3.2 Hold interest in workspace state keyed by marker id, beside the markers it
      already owns
- [x] 3.3 Add the per-member rows to the marker detail card — own row interactive, other
      members' read-only, undecided rendered as its own state
- [x] 3.4 Add the visited control to the detail card
- [x] 3.5 Write optimistically and revert on failure, matching how saving and removing a
      place already behave

## 4. Filtering, on web

- [x] 4.1 Build the filter control in the toolbar's reserved slot, as a labelled selector
      matching the city selector's construction, plus a `Hide visited` toggle.
      One wording change from the design: the unfiltered choice reads **"No filter"**, not
      "Anyone". "Anyone" and "Either of you" are the same words to somebody scanning a
      menu, and they are the one pair in the list that must not be confused — one narrows
      the trip and the other does not.
- [x] 4.2 Apply the predicate to produce one filtered set, and feed it to both the map and
      the list so they cannot disagree. Filtered **upstream of `groupCoincident`**, so the
      map and the card's chooser read from the same groups and there is no second place a
      predicate could be applied differently.
      Web has no standalone list of places; the chooser shown when several markers share a
      point is the only list of markers on the screen, and it narrows with everything else.
- [x] 4.3 Indicate that the view is narrowed whenever any filter is applied, with clearing
      available from there — `Showing N of M · Clear` in the filter bar
- [x] 4.4 Say "no markers match this filter" when nothing matches, distinctly from the
      trip being empty. States the trip's real count, so the note cannot be read as loss.

## 4b. A visited marker looks visited

- [x] 4b.1 Carry `visited` and the muting amount in `MarkerView`, decided by shared code so
      neither application picks its own — the same reason the box and anchor live there
- [x] 4b.2 Draw the muting and a small check on web, never as a colour change
- [x] 4b.3 Draw it identically on mobile. Mobile gains no controls; `map-rendering`
      requires both applications to draw the same map, so the rule cannot be adopted by one
- [x] 4b.4 Unit-test that a visited and an unvisited marker of one family differ only in
      the muting, and that the family colour is untouched

## 5. The map under a filter

- [x] 5.1 Add the filtered-to-nothing state to the map, distinguishable from loading,
      failed and genuinely empty — a fourth overlay note, and the only one that names a
      count and offers a way back out
- [x] 5.2 Confirm changing or clearing a filter does not move the camera.
      **Confirmed by construction rather than by looking:** the camera moves only when
      `frameToken` changes, and the only two things that change it are selecting a city
      and choosing a place from search. Nothing on the filter path touches it. Still worth
      the interactive check in 6.5, because "confirmed by reading" has been wrong before.
- [x] 5.3 Indicate that matches lie outside the current view when none are visible, and
      offer to frame them. The map reports whether anything it drew is inside the current
      view — a boolean, on `moveend` and on every change to the drawn set, since narrowing
      while the map sits still fires no camera event at all.

## 6. Checks, and looking

- [ ] 6.1 Open the web app and record interest as one member; confirm the other member's
      state is untouched and that withdrawing returns the marker to undecided
- [ ] 6.2 Work through all five interest choices against a trip with a mix of answers, and
      confirm each shows what the spec says it shows
- [ ] 6.3 Confirm a marker every member declined is invisible under all four named filters
      and reachable with the filter cleared — the reachability guarantee, which is the one
      that would otherwise strand a marker in the trip
- [ ] 6.4 Filter to nothing and confirm the map and the list both say so, and that neither
      claims the trip is empty
- [ ] 6.5 Pan somewhere, change the filter, and confirm the camera stays put
- [ ] 6.6 Filter so every match is off screen, and confirm the map says so and can frame
      them
- [ ] 6.7 Check both themes, since the control is new surface in a themed toolbar
- [ ] 6.8 Confirm the mobile app is unchanged, still builds, and still shows markers
- [ ] 6.9 Run `pnpm lint`, `pnpm lint:mobile`, `pnpm typecheck`, `pnpm typecheck:mobile`,
      `pnpm test`, `pnpm build`, `pnpm check:cycles`, `pnpm check:tokens`,
      `pnpm check:fonts` and `pnpm check:specs`
- [ ] 6.10 Run `openspec validate record-interest-and-filter --strict`
