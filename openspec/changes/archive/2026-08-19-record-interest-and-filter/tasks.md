## 1. The domain

- [x] 1.1 ~~Add~~ Verify the interest record in `@pinpoint/core` — it already existed
      (`marker-interest.ts`: schema, `InterestState`, `interestStateOf`) and matches what
      the specification requires, including absence meaning undecided. Nothing to add.
- [x] 1.2 Add `InterestFilter` and `VisitedFilter` as named values, and a pure
      `matches(marker, interestForMarker, filter)` predicate.
      **Revised twice, after the control was built and rejected on sight both times.** The
      filter is now three mutually exclusive states — `anyone`, `wanted-by` a named set of
      members, and `unanswered` — rather than choices written for exactly two travellers.
      Naming members is what lets a trip of three ask about two of them. The trip's
      membership stopped being a parameter, which also retired the separate rule about
      ignoring a departed member's record.
- [x] 1.3 Unit-test the predicate against every combination the spec names, including the
      two that are easy to conflate: everybody declined is **not** "nobody has answered",
      and a member who declined does **not** count as wanting to go
- [x] 1.4 Unit-test that naming an unanswered member never matches, so the behaviour
      behind the unclaimed-member risk is pinned rather than discovered — and that
      unticking them is the way out
- [x] 1.5 Unit-test that naming two people means both rather than either, and that a trip
      of three can be asked about two of them

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
      **Rebuilt twice, rejected on sight twice.** The first attempt was `WHO` with five
      fixed choices: `Who → No filter` does not parse, the toolbar and the card used
      different words for one concept, and the choices assumed exactly two travellers.
      The second kept those choices and added member checkboxes *beside* them — worse,
      because the control then had two halves that could contradict each other and the
      names appeared as a side effect of picking something else.
      It is now one dropdown whose entries **are** the people, plus `Nobody has answered
      yet` below a divider. Ticking names asks for the places they all want; the closed
      button says which people, joined with "and". `Wanted by` as the label because it
      parses with a name.
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

All of the interactive checks below were run against the live application by the author,
not inferred from the code. That distinction earned its place on this change: three
defects here — a class name resolving to `undefined`, a card rendering a stale marker, and
a map crashing to its error boundary — passed `typecheck`, `lint` and `build` untouched.
Two were caught by reading and one only by clicking.

- [x] 6.1 Open the web app and record interest as one member; confirm the other member's
      state is untouched and that withdrawing returns the marker to undecided
- [x] 6.2 Against a trip with a mix of answers, confirm each question the control can ask
      shows what the spec says: one name, two names, and `Nobody has answered yet`.
      Two names means the places they **both** want — the one reading a person could
      reasonably expect to be the other one.
- [x] 6.3 Confirm a marker every member declined is invisible under every question the
      control can ask, and reachable with the filter cleared — the reachability guarantee,
      which is the one that would otherwise strand a marker in the trip. Declining is an
      answer, so such a marker is not in `Nobody has answered yet` either, which is the
      half of the guarantee that is easy to get wrong.
- [x] 6.4 Filter to nothing and confirm the map and the list both say so, and that neither
      claims the trip is empty
- [x] 6.5 Pan somewhere, change the filter, and confirm the camera stays put.
      This is the one 5.2 had ticked from reading the code rather than from looking, so
      the interactive pass is what actually settles it.
- [x] 6.6 Filter so every match is off screen, and confirm the map says so and can frame
      them
- [x] 6.7 Check both themes, since the control is new surface in a themed toolbar
- [x] 6.8 Confirm the mobile app is unchanged, still builds, and still shows markers.
      Worth running rather than assuming: the last change to land here broke the iOS build
      through stale codegen, and nothing in the JavaScript checks would have said so.
- [x] 6.9 Run `pnpm lint`, `pnpm lint:mobile`, `pnpm typecheck`, `pnpm typecheck:mobile`,
      `pnpm test`, `pnpm build`, `pnpm check:cycles`, `pnpm check:tokens`,
      `pnpm check:fonts` and `pnpm check:specs`.
      All pass. `pnpm lint` reports 0 errors and 1077 warnings, every one of them from the
      vendored MapLibre worker in `apps/web/public/maplibre/` — noise that has twice hidden
      real output, and worth an ESLint ignore in its own change.
- [x] 6.10 Run `openspec validate record-interest-and-filter --strict`
