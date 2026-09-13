## Context

The laptop composes the notice out of three facts that all live in one component:

```
  web                                    phone
  ─────────────────────────────────      ─────────────────────────────────
  trip-workspace.tsx                     trip-workspace.tsx
    visibleMarkers.length  ✓               visible.length     ✓
    anyInView              ✓ reported up   ✗  never asked for
    revealed               ✓ own state     ✗  lives in the map
    dropping / draft       ✓ own state     ✓ own state
    └─ writes the notice                   └─ writes the other two notices

  trip-map.tsx                           trip-map.tsx
    bounds  ──▶ onMarkersInView            bounds  — arrives, unread (:912)
                                           reveal  — own state (:530)
```

On the phone two of the four facts are inside `trip-map.tsx`, and the comment on
`openMarkers` argues against lifting the sheet's state out of it: doing so "would drag
selection, framing and the sheet's own lifecycle along with it, for one new caller". So
something has to be reported upward, and the choice is what.

Everything else is in place. The phone has the note component, an idiom for a note that
can be tapped, `frameOn` on the map's imperative handle, and `frameAround` behind it.

## Goals / Non-Goals

**Goals:**

- The phone detects that a filter's matches are all off screen, says so, and offers to
  frame them.
- Both applications answer "is this position within this view" from the same code.
- Both withhold the offer while a position is being placed.
- The condition is named after the question it answers, so the next pin drawn outside the
  filtered set has an obvious place to be counted.

**Non-Goals:**

- Lifting the phone's details-sheet state into the workspace.
- Any change to when the camera moves. A filter still moves nothing; the offer is the only
  new thing that moves it, and only when accepted.
- Tolerance, padding or a "nearly in view" band. A position is in the view or it is not.
- Reworking the two existing overlay notes. They keep their wording and their conditions.

## Decisions

### Read `bounds` off the settle event, rather than asking for it

`onRegionDidChange` already fires on every settle and the phone's map already handles it
for the centre and the zoom (`apps/mobile/components/trip-map.tsx:912`). The same payload
carries `bounds`, typed `[west, south, east, north]`.

*Alternatives:* `MapRef.getBounds()` is available and returns a promise — it would mean
holding a second ref to the map, a bridge round trip per question, and an answer that
arrives after the render that wanted it. Deriving bounds from the centre, the zoom and the
viewport is arithmetic this repo would then own for a value the platform already computed.
Neither buys anything over reading a field that is already in hand.

### The predicate is derived at render; only the answer is reported upward

Web needs an effect that re-subscribes on `groups` (`apps/web/app/_components/trip-map.tsx:641`),
because narrowing a filter fires no `moveend` and the listener alone would never re-run.
The phone holds the bounds as state and recomputes the predicate on every render, so a
filter change is picked up with no effect and no subscription. A settle already calls
`setZoom`, so holding bounds in state adds no render that was not already happening.

The *answer* still crosses to the workspace through a callback in an effect, which leaves
the workspace one render behind a settle. That is the same lag the laptop has and the same
lag `zoom` already has on the phone, documented at `trip-map.tsx:606` — a stale value for
at most one frame, in a notice about where the camera is not.

### "Within the view" means the map's raw bounds

Stated in the specification and repeated here because the phone's own framing convention
says the opposite: `frameAround([...markers], viewport, barHeight)` insets the covered
strip, and `d23d60c` was the change that made it do so.

*Alternative considered and rejected:* testing against the uncovered strip. It is the more
honest reading of "what a person can see", and it manufactures `#83` from parts — a
details sheet is capped at half the window (`marker-details.tsx:60`), so reading a place
would push the only match out of the visible strip and raise *"1 place matches, none of
them in view"* beside the place being read, with an offer leading away from it.

The two conventions are then not in conflict but in sequence: framing insets, the test does
not, so the matches land inside the uncovered strip and therefore well inside the bounds.
The offer always settles the condition that raised it. Reversed, a notice could survive its
own fix, which is the worse failure of the two.

### The phone's map answers one question, named for the question

The reported value means **is there anything on this map to look at**. It is true when any
drawn marker is within the bounds, when a revealed place's sheet is open, or when a
position is being placed. The workspace keeps only the filter-shaped half of the
condition: a filter is applied, it matches something, and there is nothing to look at.

*Alternative:* report `anyInView` and `revealing` as two booleans and compose them in the
workspace, mirroring the laptop exactly. Rejected on the evidence in AGENTS.md: `#83`
happened because "the condition had always meant 'there is nothing on the map to look at'
and `!anyInView` had always been the same thing as that, until it wasn't". A boolean named
after the mechanism invites the next person to add a pin outside the filtered set without
finding the count that reads it. One named after the question does not.

This folds the placement-in-progress case into the map's answer on the phone even though
the workspace has `dropping` and `draft` in scope, because it is the same question and
splitting it across two components is how the meaning gets lost again. The laptop composes
it in its workspace instead — the facts live differently there, and it is the condition
rather than the arrangement that the specification holds both to.

Name to use: `onSomethingToLookAt(something: boolean)` on `TripMap`, held as
`somethingToLookAt` in the workspace, so the notice's condition reads
`… && !somethingToLookAt`. (Chosen here, not handed down — it is the one part of this
design that is only a name.)

### Before the first settle, assume there is something to look at

`onRegionDidChange` fires on settle, and a map nobody has moved has never settled — the
same gap the zoom buttons work around with a fallback at `trip-map.tsx:833`. There is no
equivalent fallback for bounds, so the answer defaults to "yes, something to look at", and
no notice appears until the map has reported once.

Safe rather than merely convenient: the map opens framed on the markers it was handed, a
filter only ever removes from that set, and a subset of a framed set is still framed. The
laptop makes the same assumption with `useState(true)` at `trip-workspace.tsx:321`.

### The containment test moves into `@pinpoint/map`, and the web switches to it

One function, taking a bounds and a position. It has to decide longitude wrap: bounds that
cross the antimeridian arrive with `west > east`, and the range is then the two pieces
either side of ±180 rather than the empty span between them. That is the concrete reason
this is a named function with a test rather than two comparisons written twice.

The web switching off `bounds.contains()` is the point rather than a side effect — a shared
function only one application calls is not shared. It is also the only way the rule gets a
test, since `apps/web` has no test runner.

### Withholding while a position is being placed is one rule, not two

An armed sight and an unsaved pin are both drawn outside the filtered set, both are on
screen, and both are being attended to. The specification states them beside the revealed
place under the same reasoning rather than as a second rule with its own rationale.

## Risks / Trade-offs

- **`bounds` is typed as always present and is not.** Android builds it inside a
  `try/catch` and returns the view state early when the camera has no target
  (`MLRNMapView.kt:1375`), so the key can be absent while the type says otherwise. → Read
  it defensively and treat a missing value as no update: keep the last bounds, and if there
  has never been one, fall back to the default above (no notice). Never assume the tuple is
  there because TypeScript says so.

- **Only the iOS path was read end to end.** `MLRNMapView.m` builds the dictionary and
  `MLRNMapViewComponentView.mm:159` passes `viewState.bounds` into the event struct; the
  Android source above is the equivalent. → *Since watched on iOS:* a settle logged on the
  device carried `[134.57, 30.56, 138.98, 37.23]`. Android has still only been read.

- **A tappable note wrapped in a bare `Pressable` is drawn off screen.** Found on the
  device, not foreseen here. The note is absolutely positioned, the wrapper had collapsed
  to nothing at the bottom of the column, and the note sat below the screen with its
  condition true. The existing filter-matching-nothing note had the same wrapper and had
  never been visible. → `MarkersOverlayNote` takes `onPress` and is the pressed view itself;
  recorded in `AGENTS.md`.

- **The web's behaviour at ±180 changes.** Swapping `bounds.contains()` for our own
  function replaces MapLibre's normalisation with ours. → Mirror the wrap rule, test both
  sides of the antimeridian, and accept that a trip spanning it is the only case that can
  differ.

- **The notice's condition now has four terms on the phone and four on the laptop.** Every
  one of them is a state that must *not* produce output, which is indistinguishable from
  the feature being broken. → Each is verified by looking, on device, and each is a
  scenario in the specification rather than a comment.

- **One extra render per settle on the phone**, from reporting the answer upward. → Already
  paid: `setZoom` renders on every settle today and this rides along with it.

## Open Questions

- **Does `onRegionDidChange` fire once after the initial camera is applied, or only after
  the first gesture?** It decides whether the "nothing reported yet" default is ever
  observable in practice or is dead on arrival. To be answered by watching a device, not by
  reading the source — the settle semantics differ between the two platforms.

- **Does the offer belong on the phone's note or should the whole note be the target?** The
  existing idiom makes the entire note a `Pressable` and says "tap to clear" in the
  sentence; the laptop has an inline button inside a sentence. Following the phone's own
  idiom is the default and needs no decision, but the sentence is longer here than the one
  it is copying and may not read as well with the action folded into it. To settle by
  looking at it on a device.
