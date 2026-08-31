## Why

`floor` is the one number the web application uses to say how much of the map is hidden
behind its own chrome. Two things read it: framing, which shrinks the viewport it fits
markers into and then shifts the centre; and the lift, which raises a place clear of
whatever is describing it. At a laptop width the number is **larger than the map is
tall**, and both of them faithfully act on it.

Measured live, on a 1440×900 window with the save form open:

```
the map (the <main> stage)          614px tall
overlap the toolbar reports         664   ← a run of controls in the bar ABOVE the map
overlap the save form reports       446   ← genuinely on the map, bottom-left corner
floor the application uses          664   ← the larger of the two
```

The toolbar covers none of the map. It is a flex item in the bar, and the overlap is
computed as `stage.bottom - element.top`, which for anything positioned above the map
returns the distance from the top of the bar all the way down to the bottom of the map.
The comment above that line says this case "comes out negative and clamps to zero." The
sign is the other way round: an element above the map reports a *larger* overlap than
one covering the map completely.

Four defects follow, all from that one number, and all reproduced rather than reasoned
about:

- **A dropped pin lands off the top of the map.** The lift centres the place in what it
  believes is the visible strip: `614/2 - 664/2 = -25`. Measured after the drop, the
  pin's tip sat at y = −25 — twenty-five pixels above the map's top edge. The form asks
  the person to describe a place they cannot see. This is `#79`.
- **The map opens looking at almost nothing.** Framing clamps the covered height at 65%
  of the surface, so at a laptop width it fits every marker into a 215px strip and
  shifts the centre up 200px. All sixteen markers of the test trip landed at y ≈ 22–29,
  their pin bodies clipped by the top edge, the lower 95% of the map empty. Nobody filed
  this and it is the more common path: it happens on every load, without dropping
  anything.
- **The zoom control is off the page at every laptop width.** It is positioned at
  `cornerHeight + floor + creditHeight` above the bottom edge — `20 + 716 + 0 = 736` on a
  666px map. Measured, its box sits at viewport y −95 to −25: above the map, above the
  document, unreachable by pointer, keyboard or screen reader, while `display` still
  reports `grid` and it stays in the accessibility tree. `map-rendering` requires the
  control to "be present whenever the map is, without any prior interaction." It is not,
  and has not been at any laptop width since the number went wrong.
- **Selecting a saved marker flings the map the same way as dropping one.** The lift
  takes `the draft, or else the selected marker`, so both arrive at the same arithmetic.

The application's own licence credit reads the same number and escapes only by luck: it
is `display: none` above the phone breakpoint, where MapLibre's control carries
attribution instead. It is handed `bottom: calc(716px + …)` regardless, and would leave
the map the moment that width rule changed.

At a phone width the same measurement is correct — 67px for a 67px toolbar — because
there the toolbar really is standing on the map's bottom edge. The formula has only ever
been right by accident of position.

Fixing the sign is not enough. With the toolbar excluded, `floor` becomes the save form's
446 on a 614px map, and framing would still squash every marker into a 168px strip while
a pin dropped on the right-hand side would still be lifted 223px to clear a 328px-wide
card it was never behind. What the code is missing is not a clamp; it is that **a
rectangle in the corner of the map is not a band across it**, and it has no way to say so.

## What Changes

**The chrome standing over the map is measured as a rectangle, not as a single height.**
The application already knows which elements those are; what it loses today is where they
are. Intersecting each one with the map's own box and keeping the result is enough to
answer both questions correctly, and makes the toolbar's contribution empty at a laptop
width — which is what `floor`'s own documentation has always claimed.

**Framing is reduced only by chrome that spans the map's width.** A full-width sheet
halves the map and framing must fit the markers into what is left; a card in the corner
leaves the map essentially whole and framing should use all of it. No proportion is
chosen as a threshold: the phone's sheets are edge to edge by construction and the
laptop's panel is inset by design, so both real cases are unambiguous. Anything genuinely
partial-width in future frames against the full surface, which is the safe direction —
the failure is a marker behind a corner, not a map showing the ocean.

**The lift moves a place only when something is actually in front of it, and the
correction is proportionate to how much of the map is taken.** Where chrome takes a whole
band, what remains is a strip and the place belongs in the middle of it — the behaviour
the phone shape has today, unchanged. Where chrome takes a corner, the map is nearly
whole: a place outside the rectangle does not move at all, and one behind it rises by the
least that clears its top edge, keeping the existing margin so a place does not come to
rest on the boundary.

**The arithmetic moves into `@pinpoint/map` and gets tests; the measurement stays in the
application.** Reading the DOM is the application's business and stays there. Deciding
what a covered rectangle means for a camera is the same kind of thing `fitBounds` and
`offsetCenter` already are, and it is the only way this gets a test at all — `apps/web`
has no test runner.

**Not breaking.** Nothing stored changes, no schema moves, the phone shape's behaviour is
held constant on purpose, and no capability is added or removed.

## Capabilities

### Modified Capabilities

- `map-rendering`: two requirements are tightened, and neither reverses. *The map opens
  framing the trip's markers* already says framing accounts for chrome drawn **over** the
  map "rather than beside it" — it does not say how an application tells the difference,
  and this one gets it wrong. The requirement gains the rule that the covered part is
  determined by actual overlap with the map, that chrome beside the map contributes
  nothing, and that only chrome spanning the map's width reduces the framing viewport.
  *An unsaved marker is drawn distinguishably from saved ones* already says the camera
  "moves only far enough, if at all, to keep that position clear of anything drawn over
  the map." That clause is currently false in both directions — the camera moves when
  nothing is in front of the position, and it moves further than clearing requires. It
  gains the bound that makes it checkable: after the correction the position is on
  screen, and a position already clear does not move.

`marker-capture`, `workspace-chrome` and `styling` are **not** modified. What a person
does to place a pin, where chrome is drawn, and how anything is styled are all unchanged;
only the arithmetic between them is corrected.

## Impact

**Web** — `trip-workspace.tsx` (the measurement: rectangles rather than one height, and
the overlap computed against the map's box rather than from its bottom edge alone),
`trip-map.tsx` (`frameAround` takes the covered rectangle; the lift effect asks whether
the place is behind it before moving, and how far), and the `floor` prop, which becomes a
rectangle and should be renamed for what it now carries.

The zoom control and the licence credit read `floor` as a bottom clearance and are not
incidental to this change — the zoom control is one of the four defects. Both want the
covered height **at their own corner**, which a rectangle can answer and a single height
cannot: at a laptop width the save form is in the bottom-left, the zoom control in the
bottom-right, and the correct clearance for the control is zero. Their three-term sum
(`cornerHeight + floor + creditHeight`) is documented as working because at most two
terms are ever non-zero; that assumption is part of what has to be re-checked, not
carried over.

**Shared packages** — `@pinpoint/map` gains pure functions over plain rectangles and a
point: what a covered rectangle reduces a framing viewport to, and what vertical offset
lifts a point clear of one. No renderer, no DOM API, no native module: the inputs are
numbers the application has already measured. This is a deliberate departure from the
comment in `trip-map.tsx` arguing nothing should be added to the package — see the design
document, which addresses it directly.

**Mobile** — none. The phone derives its covered height from the sheet heights it already
knows rather than by measuring overlap, so it never had this defect. It is also not the
reference here: `#70` records that the two applications compose framing differently and
that the phone is the one behind, and this change does not touch that.

**Documents** — none expected. `DESIGN.md` describes shapes, not camera arithmetic.

**Dependencies** — none added. The `$0` constraint is untouched.

**Verified by looking, and it has to be** — every one of the three defects type-checks,
renders, and is wrong. Two of them were found by measuring the running application rather
than by reading, and the fix has to be confirmed the same way, at a laptop width and at a
phone width, before this is called done.

**Tracked by** — `#79`, which describes the dropped-pin symptom and asks for the root
cause to be established by observation before anything is changed. It has been: the
numbers above are measurements, not predictions. The other two defects are the same root
cause and are folded in rather than filed separately. Adjacent to `#70`, which this change
deliberately does not answer.
