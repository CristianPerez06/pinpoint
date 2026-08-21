## Why

The phone can read a trip, record interest and narrow it, and it cannot add a
place. That is the last thing standing between it and being a real client, and
it is the item the first trip would actually settle: whether somebody standing
outside a temple types a name and a price into a phone is an assumption this
product has always made and never tested.

It is also not separable from anything smaller. The phone has no search box, and
on the laptop search is not a feature beside capture — choosing a result goes
straight into creating a marker, so search *is* the front door. "Add search to
the phone" is either this change or a different feature wearing its name.

The shell it lands in was built last change: the filter control and `Clear` moved
to a bar across the bottom of the map, within a thumb's reach, and the header
kept what should be hard to reach by accident. That bar was sequenced first
because capture needed somewhere to land. This is what lands on it.

## What Changes

- **Search, as a screen rather than a field.** A `Search` pill in the bottom bar
  opens a full-screen search: query, candidates with their distances and guessed
  types, and choosing one flies the camera and opens the form. The bar is flush
  to the bottom edge — it is the floor the map's ornaments and the licence credit
  rise off — and a text field focused down there collides with the keyboard.
- **Dropping a pin, by framing rather than by pointing.** A `Drop` pill arms a
  fixed sight at the centre of the map; the map moves under it and the confirm
  bar takes the position it is left at. This is a different mechanism from the
  laptop's draggable pin, for a reason given in the design: the native renderer
  has no draggable marker, and the alternative reopens a defect that has already
  cost this project a change.
- **The marker form, full-screen, with all six fields.** Name, type, city, note,
  link, price — the same fields the laptop captures, not a reduced set. Reached
  by both entry paths, and by editing an existing marker from its details sheet.
  Full-screen rather than a sheet because six fields, an eleven-pin type grid and
  a keyboard do not fit in one, and because a scrolling sheet is a shape this
  codebase has already been bitten by.
- **Repositioning, reached from the form.** The sight is where an unsaved
  position is corrected, entered from the form by `Adjust position` and returning
  with everything typed still there. Search results do not have to pass through
  it first.
- **Editing and removing a marker**, from the details sheet that already shows
  what was recorded — including the stale-read refusal, which is a state the
  phone can now reach and so must now say out loud.
- **Cities, created and managed from the phone.** Creating one from inside the
  form, and renaming, setting a currency and removing one from the header menu.
  The phone does **not** get the laptop's selected-city concept: no city control
  in the bottom bar, search biased by the visible map, and the form defaulting to
  the city last used rather than the one selected.
- **BREAKING (to the specification, not to anything running):** the requirement
  that capture is offered by the web application only is deleted. It is the last
  of the two web-only requirements the roadmap named; the other went with mobile
  interest.

Not in this change: any list view, anything about where the person is standing,
and any change to the web application.

## Capabilities

### New Capabilities

None. Every requirement this change touches already exists — what changes is
which platforms satisfy them and, in two places, how a requirement is worded so
that it describes a shape rather than a pointer.

### Modified Capabilities

- `marker-capture`: the web-only requirement is deleted outright. Pointing at the
  map is restated so that indicating a position covers both a pointer at a
  coordinate and a sight the map is framed under. Repositioning is restated the
  same way. The city default stops being expressed only in terms of a selected
  city, because one platform has no selection. And a paragraph superseded by the
  stale-read requirement is removed — see below.
- `map-rendering`: the unsaved marker requirement currently says the map draws
  the unsaved marker. Where positioning is done by framing there is no marker to
  draw and the sight is what shows the position, so the requirement is restated
  in terms of what must be true — the position is shown, distinguishable at a
  glance, above the saved markers, and never counted among the trip's — rather
  than in terms of drawing a marker.

### Not modified, and worth saying why

- `place-search` needs no delta. "Search is biased toward where the person is
  working" already says the bias comes from a selected city's markers *or*
  otherwise from the area the map is showing. A platform with no selection takes
  the second branch, which is compliance rather than an exception.
- `marker-filtering` and `marker-interest` already require both applications to
  offer what they describe. Nothing here weakens that.

### A contradiction this change closes on the way past

`marker-capture` currently holds two requirements that directly disagree about
concurrent edits. "A marker can be edited and removed by any member of the trip"
still says *neither edit SHALL be rejected and no conflict SHALL be raised: the
later write is what is stored*, with a scenario asserting the later save wins.
"A save based on a stale read is refused" says the opposite, and it is the one
that is built. The superseded paragraph and its scenario were left behind when
the conflict change landed.

This is not this change's debt, but it is in the requirement this change has to
amend anyway — the phone is about to start offering editing — and shipping a
delta that touches a requirement while leaving it contradicting its neighbour is
worse than the two-line removal. It is removed here.

## Impact

**Code.** Almost all of it is `apps/mobile`. New: a search screen, a marker form
screen, a city sheet, and a sight plus confirm bar inside `trip-map.tsx`. Changed:
`trip-workspace.tsx` grows the write path it does not have yet, `marker-details.tsx`
gains edit and remove, `menu-sheet.tsx` gains cities, and the bottom bar goes from
two controls to four.

**Shared packages.** The expectation is that none change. `createMarker`,
`updateMarker`, `deleteMarker`, `createCity`, `updateCity`, `deleteCity` and
`searchPlaces` are already written and already used; the mobile interest change
established the precedent by touching nothing under `packages/`. If a shared
package does need changing, that is a signal worth stopping on rather than a
task, because it means something is being reimplemented rather than ported.

**Dependencies.** `apps/mobile` gains `@pinpoint/geocode`, which it does not
currently depend on. It takes its fetcher as a parameter and holds no opinion
about its runtime, so this should work under Metro unchanged — and it is the one
real test in this change of the portability claim the whole package layout rests
on. No new third-party dependency, and no metered service: search is still
Photon's free instance.

**The camera.** Mobile's camera is deliberately uncontrolled today, so that it
cannot fight somebody panning. Search has to be able to move it, which means an
imperative fly-to on a ref rather than a controlled camera. That is a real change
to a component that currently has a comment explaining why it is the way it is.

**Looking.** Four consecutive changes have shipped defects that type-checked,
linted and built clean — a class resolving to the string `"undefined"`, a sheet
rendering a stale snapshot, a map crashing over a ref that outlived a hot reload,
taps on iOS pins doing nothing at all. This change adds gesture handling, a
keyboard, and a camera that moves. Tasks that mean holding a device belong in the
task list, and they are in it.
