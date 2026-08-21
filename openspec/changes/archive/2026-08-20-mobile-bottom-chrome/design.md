## Context

See `proposal.md` — Why. Three facts about the screen shape the approach.

The header is one flex row with `gap: SPACE.sm` and `SPACE.md` of horizontal
padding, carrying a 9pt dot, the wordmark, the trip name, the filter pill (capped
at 150pt) and Sign out. At 375pt it is close to full, and only the trip name has
`flexShrink: 1`, so it is the only thing that yields.

The bottom of the map is already choreographed. `MarkerDetails` is
`position: absolute; bottom: 0`, full width, with a measured height. The
attribution sits above it and computes its own offset **two different ways** — one
when a marker is selected (`sheetHeight + SPACE.sm`) and one when none is
(`SPACE.sm + insets.bottom + ORNAMENT_CLEARANCE`, the last clearing MapLibre's own
logo). It is a licence condition rather than an ornament, and `map-rendering`
requires it visible.

And what would fill a bottom bar does not exist yet. Search, drop-a-pin and the
city selector are all mobile capture's work.

## Goals / Non-Goals

**Goals:**

- Every control a person touches while planning is within a thumb's reach.
- A place for account and trip-level things that is not the row that matters.
- A shell mobile capture can add to without rearranging what is already there.

**Non-Goals:**

- Any capture work. No search, no drop-a-pin, no city selector, no marker form.
- The web application. The same shape at a narrow browser window is the roadmap's
  Responsive web item, deliberately after capture.
- Changing what a filter selects, or the rule that `Clear` is permanent and its
  state is the declaration. Both survive the move untouched.
- A two-tier bottom bar. See below.

## Decisions

### One row, not a bar with chips above it

The shape this ends up in — a solid bar holding search and a drop control, with a
chip row of city and filter floating above it — is the shape it wants **once those
controls exist**. Today the bottom would hold `Filter` and `Clear`, and those are
two halves of one thing.

Building the two-tier structure now means shipping a bar containing one button.
There is nothing in it to review, it costs height for nothing, and it commits to
proportions before the controls that determine them exist. Capture reshapes a row
it will own anyway, which is one change adjusting its own work rather than two
changes negotiating.

**Reversed after looking at it.** The row was first built as pills floating over
the map, on the argument that a solid surface exists to hold a text field and there
is no text field until capture. That reasoning is fine on paper and did not survive
a phone: two pills over open map read as debris rather than as chrome. It is a bar.

Three things the bar buys that the argument for pills did not weigh. Legibility is
guaranteed rather than dependent on what the map happens to be drawing underneath.
A top border frames the map with the same edge the header gives it, so the map is
bounded the same way at both ends instead of fading out at one. And it is the
surface search and a drop control land on, so capture adds controls rather than
inventing a container for them.

The cost is that a bar takes its height from the map permanently, where pills only
obscured. On a phone that is around fifty points, and it is worth it.

The credit stays **above** the bar rather than inside it. Inside would be tidier,
but it would make the one piece of layout that is a licence condition depend on a
container built for controls — and a container that is sometimes not drawn at all.

### The row is not rendered while a marker is selected

`MarkerDetails` slides up from `bottom: 0` and would cover the row. Three ways out
were considered:

- **Sheet above the row** (`bottom: rowHeight`). Both stay visible, and the
  attribution gains a third case on top of the two it already juggles. More state
  in the one piece of layout that is a licence condition rather than a preference.
- **Row above the sheet.** Rejected outright: it would sit over the thing just
  opened.
- **Row not rendered.** Chosen. Reading a place is not narrowing a trip, so nothing
  useful is lost — and with the bar gone in that case, the sheet is simply what
  holds the floor instead, which is what lets one expression serve both.

Not rendered rather than rendered-and-hidden: the row must not peek out from behind
the sheet's rounded top corners, and an unmounted row cannot.

### The bar is the floor, and everything else at that edge rises off it

Settled after two wrong attempts, both of which tried to fit the bar *between*
things already living at the bottom.

A bar that stops short of the screen edge is not a bar — it is a wide pill with a
gap under it, and the gap fills with whatever it was trying to clear. So the bar
goes flush to `bottom: 0`, carries `insets.bottom` in its own padding so its
contents clear the home indicator, and becomes the floor rather than another
tenant. MapLibre's ornaments sit above it, and our credit above those.

That collapses the whole edge to one number:

```
lift = selection ? sheetHeight : barHeight      // never a sum; never both drawn

  our credit          lift + SPACE.sm + ORNAMENT_CLEARANCE
  their ornaments     lift + SPACE.sm
  the floor           0
```

One expression covering both cases, rather than two offsets that have to be kept
in agreement — and the sheet case gains something it did not have: MapLibre's own
wordmark used to disappear under an open marker sheet, and now rises with
everything else.

Their ornaments are positioned explicitly, via `logoPosition` and
`attributionPosition`, rather than left where the renderer puts them. Anything left
at the bottom would be underneath the bar. Moving somebody's credit is fine;
covering it is the trade `ORNAMENT_CLEARANCE` exists to refuse.

The spec delta covers this, because the requirement as written says the declaring
control is always present and did not contemplate something covering it. What it
now says is that the declaration and the way out are concealed **together or not at
all** — hiding both is honest, hiding only the way out is the original failure
arriving by a route the wording missed.

### The header keeps the rare things, and that is why it stays

An earlier reading of this problem was that the header wastes its width on things
nobody touches, so it should go. That is only true while the header competes with
frequent controls. Once those leave, the header's occupants are exactly the ones
that should be hard to reach by accident — nobody wants Sign out under a thumb.

So the header stays, holding the mark, the trip name and `☰`.

### The wordmark becomes the trip name

`pinpoint`, inside the pinpoint application, tells the reader nothing they do not
know. The dot beside it is already the mark — its own comment calls it a pin
reduced to the point it names — so the brand survives its removal. `Japan` says
which trip, which is a real question the moment more than one can exist.

Not the city. City is the coarser grouping *inside* a trip and it is a filter, so
by this change's own rule it belongs in the bottom row, and it is capture's to
build.

### `☰` opens a sheet holding only Sign out

Deliberately near-empty. It is the place account and trip-level things go, so they
stop competing for the row that matters — trip switching and inviting land there
when those exist. A sheet with one item is honest about how little belongs there
today; a menu invented later would have to relocate Sign out a second time.

Built as a modal sheet in the shape `FilterSheet` already uses, for the same reason
that one is a modal: a decision made and dismissed, with the map dimmed behind it
to say it is waiting.

## Risks / Trade-offs

- **The bottom row holds two controls and looks thin.** → Accepted and named in the
  proposal. The alternative is inventing positions for controls that do not exist.
- **The attribution ends up wrong.** It is a licence condition, its offset already
  has two cases, and this change adds a row underneath it. → The row hides rather
  than sharing the space specifically to keep the case count at two. Verify at both
  states on a device, not by reading the arithmetic.
- **`Clear` becomes unreachable while a sheet is open.** → Intended, specified, and
  the sheet dismisses to a row that still has it. The scenario is in the delta so
  the next person does not read it as a defect.
- **The header could still overflow.** It sheds the wordmark, the filter pill and
  Sign out, and gains `☰` — a large net loss of width, so this should be
  comfortable rather than tight. → Confirm on the narrowest device anyway; the trip
  name is what should truncate.
- **Nothing here is provable by a type checker.** Removing controls from one
  container and mounting them in another type-checks whatever the result looks
  like, and the last three changes each shipped a defect that passed every static
  check. → Tasks that mean holding the phone are part of the work.

## Migration Plan

None. No schema, no data, no dependency, no persisted state.
