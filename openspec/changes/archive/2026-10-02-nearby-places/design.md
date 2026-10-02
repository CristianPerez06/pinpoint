## Context

#250 (`device-location`) gave both apps a `useWhereAmI()` hook — `{ status, fix, locate(),
dismiss() }` over the shared `locate()` in `@pinpoint/map` — created once in each
`trip-workspace.tsx` and feeding the map's dot. Its refused and not-found notes are drawn
over the map from `map.locationOff`, `map.locationBlocked` and `map.locationNotFound`.
`distanceKm` is in `@pinpoint/map`; `formatDistance` in `@pinpoint/core` always writes
kilometres. Neither app has a list of a trip's places. On the phone the map's edge (zoom,
"where am I", re-read) is hidden while any sheet is open.

The look was settled on an HTML mock in the session's scratchpad, which is not kept;
everything it decided is in the specs.

## Goals / Non-Goals

**Goals:**

- One position per workspace: the map's dot and the Nearby sheet read the same hook, so
  they can never disagree about where the person is.
- Ordering, drift and distance wording are pure functions in packages, tested without a
  device, so the two apps cannot order the same trip differently.

**Non-Goals:**

- Changing how "where am I" behaves when pressed.
- Virtualising for trips far beyond the worst case seen (about 150 places).

## Decisions

**1. Extend `useWhereAmI` rather than add a second hook.** One addition per app:
`permission` — `'unknown' | 'granted' | 'refused'`, read without prompting
(`Location.getForegroundPermissionsAsync()` on the phone; `navigator.permissions.query({
name: 'geolocation' })` on the laptop, falling back to `'unknown'` where the browser lacks
it). `locate()` is unchanged: it already returns the fix and leaves the camera to the
caller, so Nearby calls it and does not move the map. On the phone, `permission` is
re-read on `useActiveAgain`, which is what makes "allowed later in Settings" work on
return.
*Alternative:* a separate Nearby hook with its own watch. Two watches would draw one dot
and order the list from a different fix.

**2. Opening Nearby with `permission === 'granted'` calls `locate()` once.** With
`'unknown'` it shows the offer line; `Use my location` calls `locate()`, which prompts.
With `'refused'` it shows the refused line without calling anything. The workspace's
existing map note is suppressed while the sheet is open and carrying the same status, so
the same sentence is not on screen twice.

**3. Shared ordering in `@pinpoint/map` (`nearby.ts`).**
`orderByDistance(markers, from)` returns `{ id, km }[]` nearest first, ties broken by name
so the order is stable. `hasDrifted(order, markers, from, toleranceKm)` answers whether the
held order now disagrees with the distances by more than the tolerance; the tolerance is
the fix's `accuracy` (min 20 m), or 20 m when ordering from the map. Each app holds the
order (ids) in state, set on open and on *Re-sort*, and recomputes only the distances on
each fix or camera settle.

**4. The map-centre reference is the centre of the uncovered part.** Each app already
knows the covered height for framing; the point is `offsetCenter` from `@pinpoint/map`
applied the other way. It is read on camera settle, not every frame.

**5. Distance wording in `@pinpoint/core`.** `formatWalkingDistance(language, km)` beside
`formatDistance`: metres rounded to 10 under 1 km, then the existing kilometre form. Two
new named sentences (`nearby.metres`, reusing `search.distance` for km). `formatDistance`
itself is left alone, because search's rows are a different question at a different scale.

**6. Return-to-list is a field in the workspace, not a navigation stack.** When a row is
pressed the workspace records `returnTo = { scrollOffset, order }` and opens the place.
Closing the place reopens Nearby from it; opening any other panel clears it. Both apps
already route "one thing open" through a single state, so this is one more value beside it.

**7. Words.** `nearby.tool`, `nearby.toward.you`, `nearby.toward.map`, `nearby.count`,
`nearby.filtered`, `nearby.offer`, `nearby.offerHint`, `nearby.useLocation`,
`nearby.finding`, `nearby.rough`, `nearby.resort`, `nearby.unassigned`, `nearby.metres`,
plus reuse of `map.locationOff`, `map.locationBlocked`, `map.locationNotFound` and
`visited.on`. The iOS prompt sentence in `app.json` and `locales/es.json` gains "and how
far you are from the trip's places".

**8. The far-away threshold is 50 km, not search's 100 km.** Search dims a *candidate*
that is probably the wrong place; this dims a *saved* place that is a day trip away. A
place 50–100 km off is not something to walk to, and a trip's places within a city sit
within about 5 km of each other (`city-claim.ts`), so 50 km leaves every nearby city
undimmed. It is one constant in `nearby.ts`, exported for both apps.

## Risks / Trade-offs

- **[Web `permissions.query` is missing in some browsers]** → `'unknown'` shows the offer
  line; pressing it learns the answer from the position call, as #250 already does.
- **[A watch updating every few metres re-renders up to ~150 rows]** → Distances are
  computed once per fix in the parent and rows are memoised on `(id, km rounded to the
  displayed precision)`, so a row re-renders only when its printed distance changes.
- **[The phone hides "where am I" while the sheet is open]** → Intended; the sheet carries
  its own offer and status lines, so nothing about location is unreachable while it is up.
- **[The iOS prompt sentence changes]** → It is read from the native build. No new native
  module, but the next development build must include it; until then the old sentence
  shows, which is still true.
