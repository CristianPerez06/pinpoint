# The search list keeps its shape

## Why

Search is the one wait in this product that happens over a service nobody here
controls. Photon's public instance throttles heavy use and offers no availability
guarantee, so the gap between typing a name and seeing candidates is real, varies
with the connection, and is the only place in either application where a
person is watching a container that is already open, waiting for rows whose shape
is known before they arrive.

That gap is currently filled by the two words `Searching…`, and the list is torn
down to make room for them. Three things follow, and none of them is a matter of
taste.

**Refining a query destroys the answer being read.** `searching` is derived from
the stamp on the last answer not matching what is typed, so it becomes true on
the keystroke. Type `kyoto`, get three results, add a space and a `t` — the three
results are gone, replaced by two words, and they come back changed. The list a
person was reading is the thing search exists to produce, and it is discarded
every time they refine.

**The flag conflates two unrelated situations.** A request is only sent 300ms
after typing stops. From the first keystroke until then, `searching` is true and
*nothing has been asked*. Someone entering `fushimi inari taisha` spends the whole
query in a state that claims a search is in progress when none is. Any indication
that says "this is nearly here" is false for most of the time it is on screen.

**On the laptop, the panel changes width when the answer lands.** `.results` is
`min-width: 100%; width: max-content`, so during the wait it is sized to the
field — 320 to 480px — and when rows arrive it resizes to fit them, up to 560px.
Between roughly 750px and 1300px of window the jump is real and around 180px.

There is also a smaller gap: on the phone `Searching…` is rendered with
`accessibilityRole="text"`, which is not a live region, so the state is never
announced. The laptop announces it and the phone does not.

## What Changes

- **The wait is shown in the shape of the list that is coming.** Three shell rows
  stand where candidates will stand, in each of the three renderings of this list
  — the phone's modal, the laptop's dropdown above 700px, and the laptop's
  full-screen list at 700px and below.

- **A shell is shown only while a request is actually in flight.** The debounce
  window, during which nothing has been asked, shows nothing rather than claiming
  to be searching. This requires distinguishing "a query is being typed" from "a
  query has been sent", which the current derived flag cannot express.

- **A query in flight no longer tears down the answer already on screen.** The
  previous candidates stay, marked as not yet answering what is typed, and are
  replaced when the new answer lands. A shell therefore appears in exactly one
  situation: a request is out and there is nothing settled below the field.

- **MODIFIED** `place-search`'s rule that *what is displayed SHALL always
  correspond to what is currently typed* is narrowed to what it was defending:
  a superseded answer must never be presented as the answer to the current query.
  Keeping the previous answer visible while it is marked as superseded is
  permitted. The discard-late-responses rule is unchanged.

- **A candidate row has one height.** Today it has two — `context` and
  `distanceKm` are both optional, so a row is 53 or 61pt on the phone and 42 or
  52px on the laptop below 700px, and a list mixing them ripples as it is read.
  A floor set to the taller variant fixes the settled list and is what lets a
  shell match a real row exactly.

- The phone announces the wait in words, as the laptop already does.

## Capabilities

### New Capabilities

None. Everything here is behaviour `place-search` already owns.

### Modified Capabilities

- `place-search` — one requirement modified (what may be displayed while a query
  is in flight) and two added (what the wait looks like, and that a candidate row
  has one height).

## Impact

- `apps/web/app/_components/place-search.tsx` and `place-search.module.css` — the
  in-flight state, the shells, the retained list, the row floor. Both viewports
  are one component and one stylesheet with the existing 700px breakpoint.
- `apps/mobile/components/place-search.tsx` — the same four things in React
  Native's idiom, plus the live region the laptop already has.
- No new dependency, no package change, no token change. Nothing on the map, in
  the capture form, or in `@pinpoint/geocode` is touched: the request, the quiet
  period, the abort and the four-state result are all correct and stay as they
  are.
- `openspec/specs/place-search/spec.md`.

### Not in this change

Recorded because the ticket that produced this change (#39) proposed them and
the reasoning is worth not repeating:

- **The map.** Not list-shaped. Keeping it drawn while its markers load means
  changing the camera it opens with — `trip-map.tsx:821` frames on the markers
  present when the surface is first measured and hands the result to
  `initialViewState` — and that is a `map-rendering` change of its own. What
  ships today is already what `map-rendering` § *The indication that the map is
  loading occupies the map's own area* asks for.
- **The trips list and the session wait.** Both happen before any chrome is
  drawn, so there is no surrounding layout for content to jump against.
- **The archived-trips reveal.** Already answered by `write-feedback`'s pending
  label at `trip-sheet.tsx:365`.
- **The cities, people and interest sheets.** These have a real defect —
  `trip-workspace.tsx:229-231` reads `.rows` and never `.state.status`, so
  opening the cities sheet while the trip is still loading states *"No cities
  yet"* about data in flight. It wants a state, not a shell, and it wants its own
  change.
