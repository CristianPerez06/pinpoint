## Context

Two applications already disagree about what a city is for.

On the laptop, `CityBar` sits between the trip's name and the tools and does three
things when a city is chosen (`apps/web/app/_components/trip-workspace.tsx`,
`selectCity`): it re-frames the camera on that city's *visible* markers, it biases place
search toward them through `biasRef`, and it becomes the next save's default `cityId`.
The selection lives in the URL, so a reload and a shared link both survive it. It does
not filter, and the file says why.

On the phone, `CitySheet` renames, sets a currency and removes. It does not select, and
its header comment says that was deliberate: each of the three jobs has another answer
there — the map frames on open, search biases on the visible map, the form defaults to
`lastCityId`. `openspec/ROADMAP.md` records the same decision as a bounded exception to
"either application is sufficient on its own": the selected city is a *convenience*, and
declining a convenience is allowed as long as no capability is reachable from only one
application.

That reasoning is sound and still produced something that reads as broken, which is what
`#68` was filed about. A control called **Cities** that looks like the laptop's and does
a third of its job is not experienced as a deliberate omission.

Three constraints shape everything below. `@pinpoint/map` declares no runtime
dependencies, so anything about the camera is data and pure functions with each app
binding its own renderer. Chrome follows screen shape rather than platform. And the
project's own standing lesson, recorded in `openspec/config.yaml`, is that the last two
changes each shipped three defects that type-checked and were wrong — visible only by
opening the applications.

A mock was built and reviewed before this document. It is in `mock/`, and the decisions
below cite it where it is the reason.

## Goals / Non-Goals

**Goals:**

- The phone can choose which city is being worked on, with the same three consequences
  the laptop has.
- Both applications list a city the same way and offer the same way into its editor.
- Editing a city stops depending on that city being selected — on both platforms.
- The camera behaviour on the phone honours what covers the map, so a framed city is not
  drawn behind the toolbar.

**Non-Goals:**

- **Filtering by city.** Selecting narrows what is being *worked on*, never what is
  *drawn*. That question is `#57` and is deliberately left open here.
- **Persisting the phone's selection.** Decided against below.
- **Changing `map-rendering` or `place-search`.** Both already require this behaviour
  without naming a platform; this change makes them bite rather than restating them.
- **Rewriting the laptop's chrome layout.** The laptop gets a new row shape inside its
  existing menu, nothing more. `#58` owns web-at-phone-width.
- **A distance-sorted list, or anything about location.** Unrelated roadmap item.

## Decisions

### The phone puts the city on a second header line, not on the trip's line

Copying the laptop's `Trip / City` onto one row is the obvious answer and it is wrong at
phone width. Two names that both want the row leave each other roughly 90 pt — about
eleven characters — so `Tokyo & Kyoto Honeymoon / Hiroshima & Miyajima` renders as
`Tokyo & Ky… / Hiroshi…`. Neither name then answers its question. The laptop gets away
with the arrangement because it has an order of magnitude more bar.

Neither name has a length anybody promised; both are typed by a person, up to 80 and 120
characters. A layout that divides one line between them fails exactly where it matters.

*Alternatives considered.* **A chip floating over the map** also fits both names and
costs the header nothing, and it is what most map applications do. Rejected because the
chip is not visibly attached to the trip above it, so it reads as "you are in Hiroshima"
rather than "this trip, narrowed to Hiroshima" — and the reason the city belongs beside
the trip at all is that it is a narrowing of it. **A fourth tool in the bottom bar** was
rejected outright: that row is capped at three for a reason already recorded in
`trip-workspace.tsx`, and the city is not a control of the same kind as finding and
dropping a place.

### The city control is not a pill, and the header does not use them

It shipped as one and that was wrong twice over, which is worth recording because the
first mistake is the kind anybody would repeat.

It was an **off-spec pill**. `DESIGN.md` already defines a *selector pill* — muted fill,
a transparent border held in reserve for hover, 7×11 padding, `control` type, "the
control states nothing at rest" — and what was built drew its border always, at its own
padding, in `rowName`. It was not a deliberate third style; it was the component list
not being read before a control was invented.

Fixing that would have produced a correct pill in the wrong place. **`DESIGN.md` scopes
pills to "the toolbar and the bottom bar"**, and this is the header, whose established
idiom is already a name with a caret — that is what the trip's name is. So the city
mirrors `tripButton` exactly: no fill, no border, same padding, and the hierarchy is
carried by size and weight alone, `rowName` sitting under `title`.

Two things confirmed the direction. The laptop reaches the same answer from the other
side — both its trip and city triggers are `tone="quiet"`, transparent — so this is the
one shape where the two platforms agree about the *relationship* between the controls
rather than only about each one. And an outlined chip is what a filter chip looks like
everywhere else, which is the last thing this control should suggest while sitting two
inches above `Filter` and deliberately hiding nothing.

*Alternatives considered.* The **canonical selector pill** was drawn and rejected for the
scope reason above; `control` type also made the city read as a hint rather than as the
thing being worked in. **Matching the trip's size** was never on the table — they are not
peers, and the title is what makes a caret legible as a control at all.

*The cost, stated.* A quiet line with a small chevron is exactly what `trip-sheet.tsx`
warns about: "a label that opens something and looks like a label is a control nobody
finds." It survives here only because it sits directly beneath the trip name that teaches
the pattern. If it is missed in real use, the selector pill is the fallback and the
reason to change back is written down.

*There is no 15px type role*, and the first mock drew this at 15/650. `rowName` (14/600)
is the nearest step below `title` and is what shipped; the mock was corrected to match
rather than the other way round.

### One sheet picks and edits; the trip sheet's Cities entry is retired

The phone already has the editor. It grows an **All places** row and one row per city;
the row picks, and a pencil on the row opens the editor in place. Cities then stop being
an errand filed under the trip and become the thing being worked in, which is what they
already are on the laptop.

*Alternative considered.* Keeping two surfaces — a picker in the header and the editor
under the trip sheet — was rejected because it produces two things called cities, which
is the confusion this change exists to remove.

### The laptop gets a pencil per row, and this is a defect fix

`city-bar.tsx` renders `Edit "<city>"` only when `selected` is non-null. Two
consequences, both real today: under **All places** no city can be edited at all, and
renaming Osaka requires selecting Osaka first — which moves the camera to Osaka. A
correction cannot be made without taking the view away from wherever the person was.

A pencil on each row separates *which city am I working in* from *which city am I
fixing*. The editor expands under its own row rather than replacing the panel, matching
the phone.

*Alternative considered.* Leaving the laptop alone and only unifying the row's contents.
Rejected: the defect is in the surface being touched, and it is cheaper to fix now than
to describe in a follow-up ticket.

### Rows carry a place count on both platforms

The laptop shows only a currency; the phone already shows count and currency. Both will
show `24 places · JPY`, and a city with no currency will say so rather than showing
nothing. The count is the more useful half when choosing which group to work on, and it
is what makes **Remove city** legible a moment before it is confirmed — a confirmation
already required to name how many markers it will unassign.

### The phone's selection is held in memory and is not persisted

It resets on a cold launch, exactly as `lastCityId` does today.

The alternative is choosing a store, and that is a larger decision than this change
should make. `ROADMAP.md` already records "the phone has nowhere to remember a
preference, and two things now want one"; this makes it three, which strengthens the
case for closing it deliberately rather than absorbing it here as a side effect. No
dependency is added.

The cost is small and worth naming: on the laptop the selection is in the URL and is
therefore linkable and reload-proof, and on the phone it will not be. The two are
honestly different, not accidentally different.

### `lastCityId` goes, rather than becoming a fallback

Once the phone has a picker, keeping a remembered last-used city underneath it gives the
save form two answers to one question, one of them invisible. Selecting a city already
defaults every subsequent save — the same convenience, said out loud, and it frames the
map as well.

This is a spec change, not just an implementation one, which is why `marker-capture`
carries the delta.

### `TripMapRef` gains a way to frame a set of points

The phone's map exposes `flyTo(position, bottomInset?)` for a single point; the opening
frame is computed once at first measure and deliberately does not depend on `markers`.
Framing a city needs neither of those. The new method takes the points and a bottom
inset and resolves the camera through `fitBounds` from `@pinpoint/map`, which is the same
derivation the laptop uses — so the two frame identically given the same markers and
viewport, which `map-rendering` already requires.

The bottom inset is not optional in practice. The phone's toolbar and any open sheet
cover the bottom of the map, and a frame computed against the full view puts part of the
chosen city behind them. `flyTo` already takes this parameter for the same reason.

*Alternative considered.* Expressing the target as state, the way the laptop does with
`{ points, token }`. Rejected because the phone's map is already imperative here and the
token exists only to distinguish "asked again" from "new array on re-render" — a problem
a method call does not have. `trip-map.tsx` already documents this split.

### Framing uses visible markers, not every marker filed under the city

Matching the laptop. Framing to include markers a filter is hiding would zoom out to fit
places that are not drawn, and the empty margin would have no explanation. Selecting a
city that has no visible markers leaves the camera where it is, which `map-rendering`
already requires.

## Risks / Trade-offs

- **Two touch targets on one phone row, about 40 pt apart, one of which leads to
  Remove.** → The pencil opens an editor, and removal inside it is still confirmed with
  a count. A mis-tap costs an open editor, not a lost city. Worth watching in real use;
  the fallback is a swipe or a long-press, neither of which is discoverable enough to
  reach for first.
- **Selecting does not filter, and the phone has a Filter control two inches away.** →
  The mock showed this mostly answers itself: framing zooms in far enough that other
  cities leave the screen. It only bites when two groups sit inside one metro area.
  Accepted as-is rather than pre-solved; `#57` owns the question if it turns out to
  matter.
- **The selection is lost on a cold launch on the phone, and the laptop's is not.** →
  Accepted and documented above. Choosing a store is a change of its own.
- **This is the third consecutive change to the same chrome**, after the toolbar and the
  one-bar work. → The rules those changes established are being followed rather than
  reopened: rare things away from the thumb, the name of a thing opens what acts on it,
  one thing open at a time. The header line is new placement, not a new principle.
- **Three defects shipped in each of the last two changes, visible only by looking.** →
  The task list ends with looking at both applications in both themes, and the acceptance
  criteria are written as things to observe rather than to infer.

## Migration Plan

None required. No stored data changes, no schema moves, nothing to backfill, and no
dependency is added or removed. The change is reversible by reverting the commits.

`openspec/ROADMAP.md` needs an edit rather than a deletion: the paragraph declining the
phone's selected city must say that it was reversed and why, because a rule with real
consequences that quietly disappears is exactly the failure that paragraph exists to
prevent.

## Open Questions

- **A tick or a fill for the city being worked in.** The phone marks it with a tick, the
  laptop fills the row with the accent wash. Each matches what its own platform already
  does elsewhere — the trips sheet ticks, the trip menu fills — so forcing agreement here
  breaks agreement with the neighbours. Left as it is unless it is decided otherwise.
- **Whether the laptop should also move its city control to a second line at narrow
  widths.** `#58` owns web-at-phone-width and will inherit whatever lands here; nothing
  in this change forces the answer.

  This was nearly written as a requirement binding every width, and looking at the
  running laptop application is what stopped it. The laptop's city control is pinned to
  `11ch` at *every* size — so `Hiroshima & Miyajima` is shortened on a 2560px monitor —
  and that is deliberate and argued in `city-bar.module.css`: a control whose width
  follows its own state moves everything after it in the bar each time the selection
  changes. A requirement saying both names must always be readable would have
  contradicted a decision that is correct, and would have been violated by shipped code
  on the day it was written. What the mock actually established is narrower: at a
  *phone's* width, two names sharing a row leave each other about eleven characters and
  both become stubs. The requirement says that, and says explicitly that a settled-width
  control whose list states the name in full is a different thing.

  Web's chrome at 700px and below is a temporary wrap, not the phone shape — its own
  stylesheet says so and names `#58` as what replaces it. So nothing violates this
  today, and `#58` inherits a requirement telling it what the shape owes.
- **Whether `All places` is the right words.** It is what the laptop says today and it
  is carried over unexamined rather than chosen.
