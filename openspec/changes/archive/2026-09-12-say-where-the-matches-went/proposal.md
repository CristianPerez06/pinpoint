## Why

Pan the map on the phone with a filter applied until none of the matching places are on
screen. The map is empty, the toolbar says places match, and nothing accounts for the
gap. The laptop handles this: it says how many match, that none are in view, and offers
to frame them. The phone has no equivalent and never detects the state at all.

`map-rendering`, *Changing a filter does not move the camera*, already requires it of
both applications — "the map SHALL indicate that the matching markers are elsewhere and
SHALL offer to frame them" — and `marker-filtering` closes the door on reading that as
web-only: the guarantees are "properties of filtering rather than of a platform", and it
names the phone specifically as having once satisfied a specification by omission. So no
requirement is being invented here for the notice itself. The phone is behind.

The phone's two overlay notes (`apps/mobile/components/trip-workspace.tsx:1551` and
`:1556`) cover a trip with nothing on it and a filter matching nothing. This is the third
state neither covers: `visible.length > 0` **and** none of them within the current view —
the same indistinguishable-empty problem arrived at from a third direction.

Tracked by `#85`. The ticket names one question as the substance of the fix: whether the
phone's map can report what is in view, or whether it has to be derived. It can report
it, and already receives it (see below).

## What Changes

**The phone reads the bounds it is already handed.** `onRegionDidChange` carries the
whole view state — `center`, `zoom`, `bearing`, `pitch`, **`bounds`** — and
`apps/mobile/components/trip-map.tsx:912` destructures the first two and drops the rest.
`bounds` is `[west, south, east, north]` and survives to JavaScript: `MLRNMapView.m`
builds the dictionary and `MLRNMapViewComponentView.mm:159` passes `viewState.bounds`
into the event struct. No derivation from camera and markers, no asynchronous
`getBounds()` call across the bridge, no new event subscribed to.

This also disposes of the laptop's one awkward part. Web must re-run its report when the
drawn set changes (`apps/web/app/_components/trip-map.tsx:641`), because narrowing a
filter moves no camera and `moveend` never fires. The phone holds the bounds as a value
and derives the answer at render, so a filter change recomputes it with no effect at all.
A settle already calls `setZoom`, so this costs no render that was not happening.

**"In view" means the whole map, not the strip the chrome leaves.** The laptop tests raw
bounds and ignores its own chrome; the phone will match it. A match sitting behind the
bottom bar therefore counts as on screen and no notice appears.

This is a deliberate choice against the phone's own framing convention, which does read
the covered strip — `frameAround([...markers], viewport, barHeight)` at
`trip-map.tsx:822`, and `d23d60c` was the change that made it. Two reasons. The two
applications must answer the same question the same way, and the laptop's answer is the
raw one. And an inset-aware test creates a state that cannot otherwise occur: a details
sheet covers up to half the window (`SHEET_CAP = 0.5`), so reading a place would push the
only match out of the "visible" strip and raise *"1 place matches, none of them in view"*
beside the place being read. That is precisely the defect `#83` was filed for, rebuilt
from parts.

The two conventions then agree in the useful direction: framing puts the matches in the
strip *above* the bar, which is strictly inside the raw bounds, so accepting the offer
always clears the notice. The other choice could leave a notice surviving its own fix.

**The phone's map answers one question rather than reporting two facts.** The laptop
keeps `anyInView` and `revealed` separately in its workspace and composes them at the
note. The phone cannot: the details sheet's open state, and with it `reveal`, lives
inside `trip-map.tsx:530`, and the argument against lifting it is written on `openMarkers`
— doing so "would drag selection, framing and the sheet's own lifecycle along with it,
for one new caller".

So the map reports one boolean meaning *is there anything on this map to look at*, and
the workspace's condition keeps only the filter-shaped half. That is not merely the
cheaper plumbing. AGENTS.md's own account of `#83` says the invariant broke because
nobody wrote down what `!anyInView` stood in for — "the condition had always meant 'there
is nothing on the map to look at' and `!anyInView` had always been the same thing as
that, until it wasn't". Naming the signal after the question writes it down, and every
future pin drawn outside the filtered set has one obvious place to be counted.

**The notice is withheld while a pin is being placed, on both platforms.** An armed sight
or a draft is a pin on screen that somebody is deliberately positioning, and the offer
leads away from it by name — the same shape as the revealed place, and the laptop has it
today. It is fixed here rather than filed because this change is already writing the
sentence that contains it, and because the phone would otherwise inherit it on the way
in. Both applications have the state in scope at the note already (`dropping` and `draft`
on the web workspace; the same two as props of `Body` on the phone).

**Whether a position is within the current view becomes shared.** The laptop borrows
`bounds.contains()` from `maplibre-gl`; the phone has nothing to borrow. Rather than a
second hand-written longitude comparison, `@pinpoint/map` gains the test and the web
switches to it. Two applications choosing their own is where the last drift defect lived,
and `map-rendering` asks both for the same answer from the same data.

**Not breaking.** No schema, no column, no query, no dependency. A trip with no filter
applied and a trip with nothing on it behave exactly as they do today on both platforms. A
filter matching nothing keeps its wording and its condition, and on the phone is now
actually on screen — see Impact.

## Capabilities

### Modified Capabilities

- `map-rendering`: two requirements are qualified.

  *Changing a filter does not move the camera* already withholds the offer while a place
  revealed by search is on screen. It gains the other half of the same rule — the offer is
  also withheld while a position is being placed — and states that "within the current
  view" means the map's own bounds, not the part of it left uncovered by chrome. Both
  additions are stated once, for both applications, because the failure they prevent is a
  property of the offer rather than of a platform.

  *Both applications render the same map from the same shared logic* enumerates what must
  come from the shared package: the style reference, the framing camera, and each marker's
  visual description. Whether a position is within a view joins that list. It is the same
  class of thing — geometry that decides what a person sees — and the requirement's own
  closing scenario ("Given the same markers and the same viewport, both applications SHALL
  frame them identically") is weakened if the two can disagree about what "within" means.

### New Capabilities

None.

`marker-filtering` is deliberately **not** modified. The phone gaining the notice needs no
new requirement — the existing ones already oblige it, which is the ticket's whole
argument — and a delta there would suggest otherwise.

## Impact

**Shared packages** — `@pinpoint/map` gains one pure function: given a bounds and a
position, whether the position is inside. Longitude wrap has to be decided in it (bounds
crossing the antimeridian arrive with `west > east`), which is the concrete reason it is
one function rather than two comparisons. `apps/web` has no test runner, so this is also
the only way the rule gets a test.

**Mobile** — `trip-map.tsx` reads `bounds` off the settle event it already handles, holds
it, and reports one boolean up; `trip-workspace.tsx` gains the third note beside the other
two, in the phone's own idiom — the `Pressable` wrapping a `pointerEvents="none"` note
that the *"tap to clear"* note already uses — and frames the matches through the
`frameOn` already on the map's handle.

*Found while looking, and fixed here:* the phone's "No places match this filter" note has
never been visible. It was wrapped in a bare `Pressable`, and an absolutely positioned note
inside a wrapper with no size is drawn below the bottom of the screen. The third note was
written the same way and inherited it. `overlay-note.tsx` now takes `onPress` so the note is
the pressed view itself. No requirement changes for this — `marker-filtering` already
required the note; the phone was failing it silently.

**Web** — `trip-map.tsx` swaps `bounds.contains()` for the shared test;
`trip-workspace.tsx` adds the placement-in-progress half to the notice's condition.

**Database, dependencies, configuration** — none. No metered service, no credential, no
new package. The `$0` constraint is untouched.

**Documents** — none expected. `DESIGN.md` describes shapes, and this adds no new one: the
third note is the existing note component with different words in it.

**Verified by looking, and it has to be** — every part of this type-checks and renders
whether or not it is right. `bounds` arriving in the event is a claim about a native
bridge, read from its source and not yet watched at runtime. A containment test that
matches nothing looks exactly like a containment test that matches everything until the
map is panned. And the two withheld cases are both states where the correct behaviour is
that *nothing appears*, which is indistinguishable from the feature being broken. The
repro in `#85` is run on the phone in both themes, along with the cases that must keep
working: a trip with no places, a filter matching nothing, and an unfiltered trip panned
away from everything.

**Adjacent** — `#83`, archived as *recognise-a-place-already-saved*, wrote the withholding
rule this inherits. Nothing here re-derives it.
