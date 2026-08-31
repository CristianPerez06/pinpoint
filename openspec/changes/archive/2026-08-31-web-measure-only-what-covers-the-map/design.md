## Context

The web application draws chrome over its own map and has to tell the camera about it.
It does that with one number, `floor`, measured in `trip-workspace.tsx` and handed to
`trip-map.tsx`, where four things read it: framing, the lift, the licence credit and the
zoom control.

The number is wrong at every laptop width, and wrong in a way no type or lint could
catch — it is a plausible positive integer, larger than the map. The overlap is computed
as `stage.bottom - element.top`, which is the right question only for something whose top
edge is inside the map. The toolbar's top edge is above the map, in the bar, so the
subtraction reaches up past the map's own top and returns a number bigger than the
surface. The comment beside it asserts the opposite ("comes out negative and clamps to
zero"), which is why nobody looked again.

All four defects in the proposal are that one subtraction. Everything downstream is
correct arithmetic faithfully applied to it.

Two facts shape the fix. The **phone shape is correct today** and must stay that way:
there the toolbar and the sheets are edge-to-edge and standing on the map's bottom edge,
so `bottom - top` really is the covered height. And the **laptop's panel is a card in the
bottom-left corner** — 328px wide, `max-height: 70%`, inset by a token from both edges —
which is not a band across the map and must not be described as one.

## Goals / Non-Goals

**Goals**

- Make `floor`'s own documentation true: zero at a laptop width, the covered height at a
  phone width.
- Give framing and the lift each the question it should be asking, rather than one
  number that can only answer one of them.
- Put the zoom control back on the map.
- Get the arithmetic under test, since all four defects rendered without complaint.
- Leave the phone shape's behaviour unchanged, measurably.

**Non-Goals**

- `#70`, bringing the shrink-then-shift framing composition to the phone application.
  Untouched here, and the phone is not a reference for this change.
- Rearranging any chrome. Nothing moves on screen except what the camera and the two
  corner controls were already trying to do.
- Adding a test runner to `apps/web`. It has none; see the decision below.
- Making the lift move horizontally. See "Rejected alternatives".

## Decisions

### What covers the map is a rectangle, not a height

A single height can say *how much* of the map is taken but not *where*, and both
consumers need where.

For framing, a 328px card over a 1440px map is not a reduction of the viewport at all —
reducing the height by the card's 446px throws away 70% of the surface because 23% of one
column is occupied. For the lift, "is this pin behind something?" is a question about a
point and a region, and asking it with a height alone answers "yes" for every pin on the
map.

Each element already found by `standing()` is intersected with the map's own box. An
element entirely above the map yields an empty intersection and contributes nothing,
which is the fix for all four defects at once.

*Alternatives considered.* **Clamp the existing height to the map** — rejected because
`min(floor, stageHeight)` turns 716 into 666 on a 666px map: still every pixel of the
map, still all four defects. **Guard on width instead of measuring** (`if (isPhone)
measure`) — rejected because the whole point of the current design is that it does not
ask how wide the window is, and that property is worth keeping; the bug is the formula,
not the absence of a branch. **Have each panel report its own rectangle upward through a
prop** — rejected for the reason the current code gives for querying by class: three
components render the panel and none of them should have to know something is measuring
them.

### Framing is reduced only by chrome that spans the map's width

Framing fits points into a rectangle. It cannot express the L-shaped region left by a
corner card, so it has to decide between two approximations: treat the card as a
full-width band (today's behaviour, which loses 70% of the map) or as covering nothing
(which risks one marker landing behind a corner).

The second is the right approximation because the two failures are not comparable. A
marker behind a dismissible card is a small, recoverable annoyance; a map that opens
showing an empty ocean with every marker clipped by the top edge is the application
appearing broken, which is what happens today.

**No proportion is chosen as a threshold.** Spanning means spanning: the phone's sheets
and toolbar are edge-to-edge by construction, and the laptop's panel is inset by a token
on both sides, so no real case is near a boundary. Inventing `> 80% of the width` would
be a number nothing justifies and a second thing to get wrong. Anything genuinely
partial-width in future frames against the full surface, which fails in the recoverable
direction.

### The lift's correction is proportionate to how much of the map is taken

The specification says the camera "moves only far enough, if at all". Two behaviours
satisfy that at the two shapes, and they are different because the situations are:

- **Chrome spanning the width.** What remains is a strip, and a place belongs in the
  middle of it. This is exactly what the code does today, and at a phone width it is
  correct — so this path is left alone, byte for byte if possible, and the phone shape is
  verified unchanged rather than reasoned about.
- **Chrome in a corner.** The map is essentially whole. A place outside the rectangle
  does not move at all — it was never hidden, and moving it takes the view away from
  somebody who chose it. A place inside rises by the least that clears the rectangle's
  top edge, keeping the existing 32px margin so it does not come to rest on the boundary.

Splitting on "does it span the width" rather than on viewport width keeps the property
that nothing in `trip-map.tsx` asks how wide the window is.

*Alternative considered.* **Minimum travel in both cases.** Simpler — one rule — and
rejected because it changes the phone shape's behaviour, which is correct today and is
not what this change is about. A place lifted to just above a full-width sheet, with the
whole map empty above it, is worse than one lifted into the middle of the strip.

### The pure arithmetic goes in `@pinpoint/map`; the measurement stays in the app

`trip-map.tsx` currently carries a comment arguing the opposite: *"Nothing is added to the
shared package: composing the two is the application's business, because only the
application knows what is covering its map."* That is still true and is not what is being
moved. Reading the DOM, finding the elements, intersecting their boxes — all of that
stays in `trip-workspace.tsx`, because only the application knows what is over its map.

What moves is the arithmetic that turns an already-measured rectangle into a camera
decision: what a covered rectangle reduces a framing viewport to, and what vertical
offset lifts a point clear of one. That is the same kind of thing `fitBounds` and
`offsetCenter` already are — plain numbers in, plain numbers out, geometry rather than
anything about a renderer. The inputs are `{top, left, right, bottom}` objects of
numbers, which is not a DOM API; the portability boundary is untouched.

The decisive practical reason: **`apps/web` has no test runner.** `pnpm test` runs
`./packages/*` only. Arithmetic that produced four rendering-clean defects has to be
testable, and `packages/map/src/camera.test.ts` is where the neighbouring functions
already are.

*Alternative considered.* **Add Vitest to `apps/web`.** A real gap and worth closing, but
it is a change to how the repository is built and tested, not a bug fix, and doing it
here would put the interesting decision inside a ticket about a camera. Left as a
separate concern.

## Risks / Trade-offs

- **A marker can land behind the corner card after framing.** Accepted deliberately, per
  the framing decision above. The card is dismissible and the map is otherwise whole.
- **Changing the `floor` prop's shape touches the credit and the zoom control**, which
  read it for bottom clearance and are currently fed the same wrong number. The zoom
  control is one of the four defects, so this is not incidental breakage — but their
  three-term sum (`cornerHeight + floor + creditHeight`) is documented as safe because at
  most two terms are ever non-zero, and that reasoning has to be re-derived rather than
  assumed to survive.
- **The phone shape is the thing most likely to be broken by accident**, because it is
  the case that works today. Every phone-width behaviour gets an explicit
  before-and-after measurement in the task list rather than a glance.
- **`#70` remains open**, and the two applications still compose framing differently
  afterwards. That is the same standing difference this change inherits, not a new one.

## Rejected alternatives

- **Lift horizontally as well as vertically.** A pin behind a bottom-left card could
  clear it by moving right, often with less travel. Rejected: both the specification and
  the phone's model describe this as a vertical correction, and a camera that sometimes
  slides sideways is harder to predict than one that always rises.
- **Fix only the sign and ship it.** Rejected because it fixes none of the four
  completely: with the toolbar excluded, `floor` becomes the card's 446 on a 666px map,
  framing still squashes every marker into a 220px strip, and a pin dropped on the right
  is still lifted 223px to clear something it was never behind.
- **Hide the panel from the measurement at a laptop width.** The simplest possible fix,
  and it does produce the correct outcome for all four defects today. Rejected because it
  is the width branch this design is trying not to introduce, and because it answers "is
  this pin hidden?" with "no, never, at this width" — which is false for a pin dropped in
  the bottom-left corner.

## Open Questions

- **Does the zoom control need the covered height at its own corner, or just zero at a
  laptop width?** Both are correct today, because nothing stands in the bottom-right at
  any width. Per-corner is more honest and costs little; a flat zero is less code and
  becomes wrong the first time anything is drawn on that side. Decide while implementing,
  with the reason written down either way.
- **What should the prop be called?** `floor` names the phone's mental model — the bar is
  the floor and things rise off it — and a rectangle is not a floor. Renaming touches
  several comments that are load-bearing documentation. Worth doing in this change rather
  than leaving a name that describes the thing it used to be.
