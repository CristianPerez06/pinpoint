## Context

The phone reads a trip, records interest and narrows it. It cannot write a place,
and it has no search box at all. The bar across the bottom of its map — built last
change and holding `Filter` and `Clear` — was sequenced ahead of this one precisely
so that capture would have somewhere to land.

Two constraints shape everything below.

**The renderers are not the same library.** Web draws with `maplibre-gl`, native
with `@maplibre/maplibre-react-native`. `@pinpoint/map` carries no renderer, so
what is shared is data and pure functions and each application binds its own
drawing. Where the two libraries differ in what they *can do*, the phone gets a
different mechanism rather than a worse copy of the laptop's.

**The screen is a different shape, and the roadmap already decided what follows
from that.** Chrome follows the screen shape, not the platform: frequent controls
within a thumb's reach at the bottom, rare ones out of reach at the top. That rule
was written for the last change and this one is its first real test, because
capture is the first thing to arrive with enough controls to strain it.

## Goals / Non-Goals

**Goals:**

- Every capability of `marker-capture` reachable from the phone: add by search, add
  by pointing, the full six-field form, edit, remove, and cities.
- One shared write path. `@pinpoint/data` and `@pinpoint/geocode` are used
  unchanged; if either needs a change, that is a signal, not a task.
- The bottom bar stays legible at 375pt without relocating anything already on it.
- Either application sufficient on its own, per the parity rule this change adds
  to the specification.

**Non-Goals:**

- Any change to `apps/web`. The responsive-web item is next on the roadmap and is
  deliberately a separate change: a sheet a finger drags is not a sheet a browser
  draws, and folding them together is how one ends up with the other's compromises.
- A list view. Still deferred, still called co-equal with the map, and still
  arriving with "what's near me right now" rather than here.
- The laptop's selected-city concept.
- Offline anything. `.pmtiles` remains uncommitted and this change does not need it.

## Decisions

### The position is chosen with a fixed sight, not a draggable pin

`MarkerProps` in `@maplibre/maplibre-react-native` v11 is `id`, `lngLat`, `anchor`,
`offset`, `selected`, `onPress`, `children`. There is no `draggable` and there are
no drag events. Web's draft pin is `new Marker({ draggable: true })` with a
`dragend` listener, and it has no counterpart here. Something has to replace it.

Three candidates, and the deciding factor is not ergonomics:

| | How the position is read | What it costs |
|---|---|---|
| **Fixed sight** | `onRegionDidChange` → `event.nativeEvent.center` | A mode, and a crosshair |
| Tap to relocate | `Map.onPress` → `event.lngLat` | Reopens a known iOS defect |
| Hand-rolled drag | `PanResponder` → `mapRef.unproject()` | Gesture code, and `unproject` is async |

**Tap-to-relocate is rejected because of a defect this project has already paid
for.** `apps/mobile/components/trip-map.tsx` deliberately carries no `Map.onPress`,
with a comment explaining why: on iOS `MLRNPointAnnotation._handleTap` and the map
view's own recogniser can both fire for one tap on a pin, and a map-level handler
undid the selection the marker had just set — tapping a pin did nothing at all, with
no error and no clue. Adding `onPress` back to place a pin makes that worse rather
than equal, because now both handlers want to act rather than one cancelling the
other.

**Hand-rolled drag is rejected as disproportionate.** It is buildable —
`mapRef.unproject()` exists — but it is a `PanResponder` over an absolutely
positioned view, resolving a promise per gesture, in an app that carries no gesture
library and hand-rolls its sheets. It reproduces the laptop's mechanism at the
highest cost of the three, for a screen the mechanism does not suit anyway.

**The sight wins on the library, and happens to also be the native idiom.** It is a
`View`, not a marker — absolutely positioned, `pointerEvents="none"`, drawn over the
map. The annotation layer is never involved, so no recogniser is touched. The
position comes from `onRegionDidChange`, which delivers `{ center, zoom, bearing,
pitch, bounds, userInteraction }` synchronously in the event: no ref read, no
promise, and `userInteraction` distinguishes a person panning from a `flyTo` still
running.

One trap, and it is the marker-drift defect wearing a new hat. The sight must be
centred on the **map**, not the screen — the header is above it and the confirm bar
below — or every dropped pin lands consistently north of where it was aimed, which
type-checks, renders, and is wrong. It is in the spec delta as its own scenario for
that reason.

### Search results skip the confirm step; the sight is reached from the form

Web opens the form immediately on both paths, with the draggable pin live alongside
it the whole time. The phone cannot fully reproduce that — the form covers the lower
half of the map rather than sitting beside it — so position and fields become
sequential, and something has to decide the order. (The form was a full screen when
this was written; see below for why it stopped being one, which narrowed the gap
without closing it.)

Search goes straight to the form. The geocoder's dangerous failure is the
confidently wrong result — six of thirty-five Osaka places came back between 270 km
and 16,187 km away — and that is caught in the candidate list, where each result
carries its distance, not while positioning. What survives choosing correctly is the
centroid-versus-door error, which is metres, on a map whose question is "can we do
these three in one afternoon?". Charging a confirmation tap on every save to fix an
error below the product's own resolution is a bad trade.

That leaves the spec's requirement that an unsaved position be correctable, so the
sight is reachable **from** the form by `Adjust position`, and returning preserves
everything typed. One sight, two entry points: drop starts there, search reaches it
on demand. The requirement is satisfied without the step becoming mandatory, and
that distinction is now written into the delta rather than left as an implementation
choice.

### Search is a screen; the form is a two-height sheet; filters and cities are sheets

The bar is the floor: flush to the bottom edge, with MapLibre's ornaments and our
licence credit rising off it, and `barHeight` measured so the credit clears both.
A text input focused down there fights the keyboard for the same pixels.

So `Search` is a pill that opens a full-screen search, not a field in the bar. That
also keeps the bar at three controls — `Search`, `Drop`, `Filter` — plus the
existing `Clear`, which stays where it is. Moving `Clear` into the filter sheet
would contradict reasoning written into `filter-sheet.tsx` on purpose: a way out
behind a control you must already suspect is on is not a way out.

The form was full-screen for a different reason, **and that reason was partly wrong
— corrected after using it.** The original argument leaned on the `AGENTS.md`
gotcha about a `ScrollView` inside a container that sizes to its children. That
gotcha does not apply to a sheet whose height is a fraction of the window: such a
height is definite, so `flex: 1` resolves and the scroller works. What was true
about the screen was only that the content is large.

What the screen got wrong was worse than what it avoided. It took the map away at
the one moment the map is load-bearing — confirming that the place being saved is
the place that was meant. A geocoded candidate is a name plus a claim about where
it is, and the only way to check the claim is to look at where it landed. A form
that covers the map makes that impossible, and the `Adjust position` route makes
the position *reachable* without making it *visible*, which is a different thing.

So the form is a sheet at one of two heights — about half the window, draggable to
nearly full — with the unsaved marker drawn behind it. That is closer to the
laptop's arrangement than the screen was, and it is why `map-rendering`'s delta
now carries an explicit requirement that the position stay visible while its form
is open.

Two consequences worth recording. The unsaved marker had to start being drawn at
all: before this the sight showed the position while framing and nothing showed it
afterwards, which was defensible only while the map was hidden. And the licence
credit has to clear the sheet, which is reported on settle rather than followed
frame by frame — MapLibre's own ornaments take a number and cannot be animated, so
following a drag continuously would mean a re-render per frame for something that
can only be correct at rest.

Cities stay a sheet, in the header menu. `menu-sheet.tsx` was built near-empty on
the explicit expectation that trip-scoped rare things land there, and renaming a
city or setting its currency is exactly that.

### The camera becomes imperative on mobile, and this is the better version

`trip-map.tsx` uses `Camera` with `initialViewState` and a comment explaining the
choice: a controlled camera re-applies on every render and fights the person
panning. Search has to move it, so the camera gains a ref and search calls
`flyTo()` once.

This is cleaner than web's, which threads `{ points, token }` through state so that
"somebody asked again" can be distinguished from "this array is a new object". A
one-shot imperative call has no such problem. Noted because it is the second time
the phone has ended up with the better mechanism — the interest overrides were the
first — and because the responsive-web change may want to take it back the other way.

### No selected city on the phone

Web's city selection does four things beyond management: frames the map, biases
search, becomes the save default, and scopes the city editor. Bringing it over means
a fourth control competing for a bar that is already at three.

It is not brought over, and the three consequences each have an answer that is
independently defensible:

- **Framing** is what the map already does on open, and a filter deliberately never
  moves the camera. Nothing is lost.
- **Search bias** falls to the visible map area — which `place-search` already names
  as the branch taken when no city is selected, so this is compliance rather than an
  exception. The sight already produces a map centre on every settle, so the same
  event feeds both.
- **The save default** becomes the city last used on this device. That needed a spec
  change, and got one, because the existing requirement expressed the default only
  in terms of a selection.

City *management* is not affected by any of this and comes over in full, because the
governing rule is that either application is sufficient alone.

## Risks / Trade-offs

**The sight is a different mechanism from the laptop's, and divergence is what the
parity decision was written to end.** → It diverges in arrangement, not in meaning,
which is exactly the line the roadmap's chrome decision draws. The spec delta is
written so that both mechanisms satisfy one requirement rather than the phone
getting a requirement of its own — if that wording turns out not to hold, the
divergence is real and the spec is where it will show.

**A full-screen form takes the map away at the moment the person is placing
something on it.** → **This risk landed, and the design above is the fix.** It was
written as "not fully mitigated" and mitigated by `Adjust position`; using it made
clear that reachable is not the same as visible. The form is a two-height sheet
now. Recorded rather than rewritten away, because the original reasoning was
sound about everything except which of the two costs was larger — and the thing
that settled it was opening the app, not thinking harder.

**Centring on a point hides it when a sheet covers the middle of the map.** →
Landed, and fixed with `offsetCenter` in `@pinpoint/map`. Worth keeping as a risk
entry rather than only a fix, because the shape recurs: any surface that covers
part of the map makes "centre on this" mean something other than "show this", and
the responsive-web change is about to introduce another one.

**`@pinpoint/geocode` has never run under Metro.** → It takes its fetcher as a
parameter and touches no DOM API, so there is no known reason it would not. It is
also the whole portability claim under test, so it is the first task rather than a
late one: if it needs a change, that is worth knowing before the screens are built
on top of it.

**The bar goes from two controls to four, on a 375pt screen.** → Three pills plus
`Clear`, measured rather than assumed. If it does not fit, the correct move is a
narrower treatment of the pills, not relocating `Clear`.

**Four consecutive changes have shipped defects that type-checked, linted and built
clean.** → This one adds gesture handling, a keyboard, and a camera that moves,
which is a worse-than-usual surface for exactly that class of defect. The sight's
centring, the keyboard's overlap with the form's actions, and the round trip through
`Adjust position` are each a task that means holding a device, not reading a diff.

## Open Questions

- **Whether the two detents are the right two.** 0.52 and 0.92 of the window,
  chosen so that half leaves enough map to recognise a street corner and enough
  sheet to show the name field and the type grid. Both are guesses until somebody
  saves a place standing outside it.
- **What the sight looks like while the map is moving.** A static crosshair reads as
  broken during a pan on some maps; a small lift or a shadow says "this is hovering
  over a point". `userInteraction` makes the distinction available. Settle it by
  looking, not here.
- **Whether `Adjust position` is discoverable enough** for somebody who chose a
  search result and wants the pin thirty metres away. It is the only route to a
  correction on that path, and if it is missed, the correction may as well not exist.
- **Whether the last-used-city default should instead be derived from the position
  being saved** — the nearest city's markers are a better guess than recency, and
  the framing helper already exists. Deliberately not done here: it is new design
  work, and inventing it under a port is how a change grows a second subject.
