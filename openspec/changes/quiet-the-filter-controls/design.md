## Context

See `proposal.md` — Why. Two facts about the current code shape the approach.

Web's filter control is one flex row inside a toolbar that is itself one flex row
with `flex-wrap: wrap`. The count-and-clear block is the row's third child and is
gated on `isFiltered(filter)`, so applying a filter changes the row's content
width — which is what makes everything to its right move, and at some viewport
widths flips the whole toolbar between one line and two.

Mobile's is not the same shape at all. The filter lives in a bottom sheet reached
from a pill in the header, and the count-and-clear is a **full-width strip between
the header and the map**, present only while narrowed. Deleting a conditional
element on web frees horizontal space in a row that already exists; on mobile it
frees a band of vertical space over the map, which is the scarcer resource.

## Goals / Non-Goals

**Goals:**

- One rule for how a narrowed view declares itself, holding on both platforms.
- No element in either application appears or disappears as a filter is applied.
- A web toolbar whose row count is chosen rather than emergent.

**Non-Goals:**

- Changing what any filter selects. `matchesFilter`, `isFiltered` and `NO_FILTER`
  are not touched.
- The zero-match dead end. The map overlay's "No places match this filter" and its
  inline way out are a different requirement and stay as they are.
- A list view. Row two is search and drop-a-pin; the long-deferred web list is not
  in this change.
- Any mobile capture work. Row two exists on web only, because mobile has neither
  a search box nor a drop-a-pin control — that is roadmap item 1 and stays there.

## Decisions

### The declaration is `Clear`'s state, not a count and not a label

Alternatives considered, in the order they were eliminated:

- **Keep `Showing N of M`.** It is the clearest possible declaration and it is the
  thing that appears. Rejected as the substance of the change.
- **Name the selection on the closed control** (`Ana and You`). Also rejected as
  something that grows — the control's width tracks the number of people ticked,
  so it moves its neighbours for the same reason the count does.
- **Accent the closed control and stop there.** Nothing appears, nothing moves,
  and it is what mobile's pill already does. Rejected because the entire signal
  would then be hue, which the spec delta now forbids and which `map-rendering`
  had already decided once for visited markers.
- **A count on the label** (`Wanted by · 2`). Survives greyscale, but it is a
  number arriving where there was none — a smaller version of the thing being
  removed.

`Clear` is the only control in the bar whose *reason to exist* is that a filter is
applied. Making its live-versus-inert state carry the fact means the declaration
and the way out are the same object, which is also the shortest path to the
existing requirement that clearing be available from where the narrowing is
visible.

### `Clear` is inert rather than absent, and inert via `aria-disabled`

Exploration had settled on "always present, always enabled" before the declaration
moved onto it. Those cannot both hold: a control that never changes state cannot
report one. It is therefore inert when no filter is applied — that is the point,
not a compromise. The usual objection to disabled controls (they explain nothing
about why they are disabled) does not apply when being disabled *is* the
information.

Use `aria-disabled="true"` with inert styling, **not** the `disabled` attribute.
A `disabled` button leaves the tab order and is skipped by screen readers, so the
one class of reader who cannot see the accent styling would get no declaration at
all — reintroducing the colour-only failure through the back door. `aria-disabled`
keeps the control focusable and announced, with the click handler declining to act.
React Native's equivalent is `accessibilityState={{ disabled: true }}` on a
`Pressable` whose `onPress` is a no-op; do not set `disabled`, for the same reason.

### Web splits into a narrow row and an add row, narrowing on top

Row two pairs place search with drop-a-pin. They are the two ways to create a
marker and today sit at opposite ends of the bar with a filter between them, which
is the arrangement flex produced rather than one anybody chose.

Narrowing goes on top because it is the constant activity — a trip is scanned far
more often than it is added to — and because city, who wants to go, hide visited
and clear are one thought. Search on top is the more conventional arrangement and
was considered; it puts the occasional action above the constant one.

City stays in row one. It reads as a filter far more often than it reads as the
field a new marker is filed under.

The `flex-wrap: wrap` on `.toolbar` is what makes today's row count accidental, and
it goes. Each row is its own flex container; row two lets search take the free space
and pins the button right.

### Mobile keeps the rule and drops the geometry

The strip is deleted outright and `Clear` moves into the header row that already
exists, beside the filter pill. Nothing is added to the vertical stack, and the
sheet's own conditional `Clear` goes too — a control that clears the filter should
be in one place, and the header is the place that is visible without opening
anything.

This is deliberately **not** a copy of web's layout. `marker-filtering` already
says each application presents the control in the form native to it, and `styling`
already says the shared thing is token values, not styling code — there is no
mechanism that could hold two layouts identical, so identical-by-intent would drift
silently. What converges is the rule: on both platforms, `Clear` is permanent and
its state is the declaration.

### Both summarising functions are deleted, not shared

`summarise()` (web) and `summariseFilter()` (mobile) are two implementations of one
idea, which normally argues for lifting the predicate into `@pinpoint/core`. Not
here: once `Clear` carries the declaration, neither control needs to summarise
anything, so the shared thing would have no callers. Extracting it would be shared
infrastructure introduced without a shared use, which `styling` explicitly warns
against. If a later change wants the summary back — a list view is the likely one —
it arrives in `@pinpoint/core` at that point, with a caller on each side.

## Risks / Trade-offs

- **A screen reader hears nothing about the narrowing.** → `aria-disabled` over
  `disabled`, as above; verify by tabbing to `Clear` on web with VoiceOver and
  confirming the state is announced in both conditions.
- **Who is selected is no longer visible without opening the control.** → Accepted
  and recorded in the proposal. Mitigated only by the trips being two or three
  people deep.
- **The mobile header runs out of width.** It already carries a wordmark, the trip
  name, a pill capped at 150pt and Sign out; `Clear` is a fifth item on a ~390pt
  screen. → Check on a real device at the narrowest supported width before calling
  it done. The trip name is the element that should truncate.
- **Two rows cost vertical space over the map.** → It replaces a bar that already
  wrapped to two rows at common laptop widths, so the realistic cost is smaller
  than it looks. Confirm by opening the app at a short viewport rather than by
  reasoning about it.
- **This change is exactly the kind that type-checks and is wrong.** Conditional
  rendering removed, props deleted, CSS restructured — three consecutive changes
  have now shipped a defect that passed `typecheck`, `lint` and `build` untouched,
  including a class name resolving to the literal string `"undefined"`. → Tasks
  that mean opening both applications and looking are part of the work, not a
  formality after it.

## Migration Plan

None. No schema, no data, no dependency, no persisted state — the filter lives in
component state and opens cleared on every launch. Reverting is reverting the
commit.
