## Context

See `proposal.md` § Why for the motivation and `specs/map-rendering/spec.md` for the two
requirements this has to satisfy.

What matters here is one number. On the light ground an **unvisited** pin clears between
3.11:1 and 5.07:1 against the land it sits on — `temple` at 3.11 and `place` at 3.15 are
barely over the 3:1 floor for something that is not text. The palette was chosen that way
deliberately: the families are ranked against each other and against the basemap, and the
quiet ones are meant to be quiet. The consequence nobody drew out is that **there is no
contrast left over to spend on a second signal**, so any treatment that works by taking
luminance away starts below the floor and cannot be tuned back above it.

Measurements were taken from the live tokens on a bench built for this change:
https://claude.ai/artifact/3Fw8Bn4iM3pb124x1Mn49S

## Goals / Non-Goals

**Goals.** One visited treatment and one selected treatment, both decided in
`@pinpoint/map` and carried in `MarkerView`, so neither application can drift again.

**Non-goals.** Changing any family colour — the bench confirms all eight clear the floor
on both grounds and no recolouring is needed. Adding a per-type visited colour. Animating
the phone's selection; the laptop's existing 0.18s transition stays as it is and the phone
does what is natural to it.

## Decisions

### The visited marker is hollow, not faint

The family colour moves to a 3-point outline and to the glyph; the body fills with
`surface`. Measured on the bench, the outline then clears 3.11–5.07 on the light ground
and 5.39–7.05 on the dark, and the glyph clears 3.61–5.90 against the inner fill on light
and 5.06–6.62 on dark. Every one of the sixteen combinations is over 3:1, where the
current treatment clears none of them.

*Why not turn the dial up.* Considered and measured across the range. At 0.70 the worst
pin reaches 2.11:1 on light; at 0.85 it reaches 2.54:1, still under the floor, and by then
it sits 1.29:1 from its own unvisited twin — the two stop being distinguishable before
either becomes legible. There is no setting that satisfies both halves of the ticket.

*Why not fade the fill and keep the glyph solid.* Rescues the glyph and leaves the pin
itself at 1.58:1 against the land, so from any distance it is still a smudge the colour of
the map. It fixes the symptom that was measured and not the one that was described.

*Why not a second colour per type.* Sixteen hand-tuned values, a new type costing two
rather than one, and `MARKER_TYPE_COLOURS satisfies Record<MarkerType, Themed>` would need
a parallel assertion. The whole point of the current design is that a type costs a colour.

**The risk this carries is the draft pin**, which is also hollow. It is dashed, carries a
plus rather than a type glyph, and has no family colour at all, where a visited pin is
solid-outlined, glyphed and coloured. Confirmed as distinct on the bench and to be looked
at again on both applications with a draft pin and a visited pin on screen together.

### `MarkerView` carries a named form, not an opacity

`opacity: number` is replaced by `form: 'solid' | 'hollow'`, and `VISITED_OPACITY` is
removed. A name rather than a number because the applications now differ in *what they
draw* rather than in how much of it, and a number cannot express that — the previous field
worked only while the treatment was a multiplier, which is the thing being replaced.

Keeping `opacity` as well and setting it to 1 was considered and rejected: a field every
caller must set to the same value is a field that will eventually be set to something else
by accident, and the spec sentence it existed to satisfy has been rewritten.

`visited: boolean` stays. It is what the tick is drawn from, and it answers a different
question from `form` — one is the fact, the other is how the fact is drawn.

### The selected marker grows by a shared constant

`MARKER_SELECTED_SCALE = 1.2` joins `MARKER_SIZE` and `MARKER_ANCHOR` in
`@pinpoint/tokens`. 1.2 is the laptop's existing value, kept rather than re-derived: it
has been on screen since the map existed, the bench shows it clears a tight cluster, and
picking a new number would change the platform that is already right in order to agree
with the one that is wrong.

Selection is **not** part of `markerView()`'s input. Which marker is selected is a
property of the view, not of the marker — the shared package would have to be told the
selection on every call, and every caller that does not care would have to pass `false`.
The applications already track `selectedKey`; they read the constant and apply it.

*On the anchor.* The drawn point must stay on the coordinate as the pin grows, which is
the defect `A marker's drawn form declares which of its points sits on the coordinate`
exists to prevent. The laptop gets this free — `transform-origin: 50% 100%` is the bottom
centre, which is the anchor. The phone cannot scale a rendered annotation the same way, so
it draws the SVG at the scaled size and MapLibre re-derives the frame from the view's own
dimensions; the anchor is a normalised fraction, so it lands correctly at either size.

### The phone draws the selected annotation last

Web needs nothing: MapLibre markers are DOM siblings and the selected one already grows
over its neighbours, since `overflow: visible` lets the ring paint outside the box.

On the phone the annotations are children in render order, and the map already relies on
that: the revealed pin and the draft pin are placed after the saved markers with comments
saying they sit above them for exactly this reason. The selected marker joins that
ordering rather than introducing a z-index, which would be a second, competing mechanism
for stacking on the one surface that already has one that works.

## Risks / Trade-offs

- **A hollow pin reads as less important, and "visited" is not "unimportant."** → It is
  the state the product wants to recede; the tick and the full-strength colour keep it
  identifiable. To be judged on a real trip, not only on the bench.
- **A hollow pin is closer to the draft pin than a faded one was.** → See above; checked
  with both on screen as a task rather than argued.
- **Removing `opacity` from `MarkerView` is a breaking change to a shared type.** →
  Contained: both applications and `marker-view.test.ts` are the only consumers, all in
  this repository, and the compiler names every one.
- **The phone growing its selected pin changes how much of the map the pin covers**, which
  interacts with the sheet that opens under it. → The sheet's inset is computed from the
  sheet, not from the pin; nothing in framing reads the drawn size.

## Migration Plan

No data and no stored values change — visited is already a column and selection has never
been persisted. The change is entirely in how existing data is drawn, so it ships in one
commit and reverts in one.

## Open Questions

None. The two that the tickets left open — how much bigger, and what replaces the flat
multiplier — are decided above.

## What the look at the colours found (#143)

Recorded here because #143 asks for a judgement rather than a change, and this is where
the judgement is kept.

**The eight hold.** Every family clears 3:1 against the land on both grounds. The ten
values on one screen — eight families plus the amber accent and the danger red — read as
eight kinds of place and two pieces of chrome; the accent does not present as a ninth
type. `nature` holds against `transport` and against the basemap's park fill. `culture`'s
deep rose inside the amber ring is the widest hue pairing in the product and is
comfortable. No colour needs changing, and the eighth type is not one too many.

**Two greyscale collapses that were not predicted.** The archived change expected `temple`
and `place` to converge without colour, and they do — 0.4 apart in relative luminance on
the light ground. It did not predict the other two:

- On the **light** ground, `food` and `transport` sit **0.1 apart** — closer than the pair
  that was designed to collapse.
- On the **dark** ground, `place`, `temple` and `nature` all sit within **0.8** of each
  other.

This is not a defect. `PRODUCT.md` § Accessibility requires that no signal is carried by
colour alone, and the glyph is the second channel: a fork is not a train and a tree is not
a columned facade at any zoom where the pin is readable. It is recorded because it means
hue alone separates those pairs, which is the reason the visited treatment above had to
stop spending luminance — and it is the evidence for the greyscale scenario now in the
spec.
