## Context

The web application renders one bar at every width, folded onto two lines below 1024px
and three below 700px. The 700px rule carries a comment naming itself temporary and
naming this change as its replacement. The phone application already renders the
arrangement being brought over, so the target is not being invented here — it is being
read off `apps/mobile/components/trip-workspace.tsx` and `trip-map.tsx`.

Two constraints shape everything below. `styling` forbids sharing a component between
the applications, so this is a second implementation of one arrangement rather than a
lift. And `@pinpoint/map` declares no runtime dependencies, so anything needing a
renderer or the DOM stays in `apps/web`.

A mock was built and reviewed before any of this was written, at real widths on both
grounds, with a forty-character trip name against a twenty-seven-character city and
thirty-four places. It is kept in `mock/`.

## Goals / Non-Goals

**Goals**

- One arrangement below 700px: header, map, toolbar on the edge, sheets from the edge.
- Reuse the dismissal contract that already exists rather than writing a second one.
- Keep the laptop layout byte-for-byte unchanged in behaviour.
- Delete the 700px stopgap rather than amend it.

**Non-Goals**

- The 700–1024px band. It keeps wrapping, and is its own task. The only thing done to it
  here is horizontal safe-area padding, which this change creates the need for.
- `#40`, the wide-layout menu review.
- Bringing the shrink-then-shift framing fix to the phone. The phone shifts only today;
  correcting it is a follow-up that fixes both applications against one spec.
- Any change to what search asks, what the filter narrows, or what a save writes.

## Decisions

### CSS moves what moves; one branch for what genuinely differs

Almost everything here is repositioning, and repositioning is a media query over one
DOM. Search is not: on a laptop it is a field that lives permanently in the bar, on a
phone it is a button that opens a whole screen. That is a different component, not a
moved one.

*Alternatives considered.* **CSS only**, rendering both and hiding one — rejected because
it means two `<input>` elements and two pieces of search state, one of them always dead,
and a screen reader reaching the hidden one. **A branch on width for the whole
workspace** — rejected because the server renders with no window, so the laptop shape
would paint first and snap, on every load, for every reader.

So the hook was written into this document — and then not needed. Building it showed the
premise was wrong: search is not two components, it is **one field that changes where it
lives**. The same `<input>`, the same state, relocated by the cascade from a slot in the
bar to the whole screen. There is therefore no branch, no subscription, no server
snapshot, and no first paint in the wrong shape.

`inputsInDom` is 1 at every width, which is the property the rejected alternatives were
trying to buy. **This change ends up with no JavaScript branch on viewport width at all.**
The only JavaScript the width costs is measurement — the floor and the credit's height —
and measurement does not care what the number means.

### The sheets stay the `Menu` primitive

`ui.tsx`'s `Menu` already owns the whole contract: dismiss on outside pointer-down,
dismiss on Escape, return focus to the trigger, announce a named region, report
`aria-expanded`. None of that is positional. So the dimmed sheets are the same component
with `.menuPanel` restyled inside the media query — `position: fixed`, pinned to the
bottom edge, full width — plus a scrim.

This is what makes `TripBar`, `CityBar` and `FilterBar` need no changes at all, and it is
the direct reason the new spec requires one contract across both shapes: the five
inconsistent contracts that preceded `Menu` came from the contract living at each call
site.

*Alternative considered.* A separate `Sheet` component. Rejected: it would be `Menu` with
different CSS and a second copy of the contract, which is the failure `Menu` was built to
end.

One thing to verify rather than assume: `position: fixed` escapes to the viewport only if
no ancestor establishes a containing block. `.menuAnchor` is `position: relative`, which
does not; a `transform`, `filter`, or `contain` on an ancestor would. None is present in
the header today.

### The marker sheet reports its height; the camera consumes it

The details and form panels become bottom sheets that must not cover the pin they
describe. A `ResizeObserver` on each reports its height to `trip-workspace`, which passes
it to `TripMap` as one number: how much of the bottom of the map is covered. The toolbar
reports the same way, so there is one measurement and not a special case per thing that
can stand on the floor — which is how the phone does it, with one `onLayout` over a slot
that holds either the toolbar or the confirm row.

The camera then composes two functions that already exist:

```
const camera = fitBounds(points, {
  viewport: { width, height: Math.max(MIN_STRIP, height - covered) },
})
const centre = offsetCenter(camera.center, camera.zoom, 0, covered / 2)
```

`fitBounds` has taken a `viewport` since it was written; `offsetCenter` is exported from
`@pinpoint/map` with a comment recording that it is waiting for a browser window narrow
enough to want the same sheet. Nothing is added to the package — the composition is the
application's, because only the application knows what is covering the map.

*Alternative considered.* Shifting the centre only, as the phone does. Rejected on the
argument in the proposal: the zoom is then chosen for an area twice the height of the
visible one, so a spread-out group keeps its outliers behind the sheet. Taking the
better answer here and leaving the phone on the older one is a deliberate, temporary
asymmetry, recorded as a follow-up rather than as a discovery.

The clamp on `covered` is the guard the new spec requires — and the reason for it turned
out to be different from the one written here first. Driving the strip to zero does *not*
produce `NaN`: `Math.log2(0)` is `-Infinity`, and the shared clamp turns that into
`MIN_ZOOM`. So the failure is a camera showing the whole world rather than a camera that
has stopped working, which is less alarming and more likely to be mistaken for something
the person did. Tests in `packages/map` pin that behaviour down. The floor stays, because
framing against a strip too small to show anything has stopped being framing.

### The credit becomes ours at this width

A bar flush to the bottom edge covers MapLibre's own attribution control, and `DESIGN.md`
forbids both hiding the credit and letting a bottom bar stop short of the edge. The phone
already resolved this by drawing its own credit above whatever holds the floor and
opening a sheet of the four projects.

Web does the same below 700px: `attributionControl: false`, our own pill reading
`ATTRIBUTION`, positioned above the measured floor, opening a sheet built from
`MAP_CREDITS`. Both constants are already exported from `@pinpoint/map` and web already
imports the first.

*Alternative considered.* Keeping MapLibre's control and pushing it up with CSS.
Rejected: it would need a `bottom` written onto a node the library owns and re-renders,
the zoom control already competes for the same corner, and the phone's answer is the one
being copied.

Above 700px MapLibre's control stays exactly as it is. The credit is visible in both
cases, which is what the requirement asks.

### Edge to edge, and what it obliges

`viewportFit: 'cover'` on the `Viewport` export in `layout.tsx` is what makes
`env(safe-area-inset-bottom)` return a real number; without it the declaration the ticket
asks for is silently `0px`. That setting is document-wide, which creates two obligations
beyond the toolbar:

- the laptop bar takes `padding-inline: max(var(--pp-space-md), env(safe-area-inset-*))`,
  because width alone sends a phone in landscape to the laptop bar and the notch is on
  its side there;
- the auth and loading screens are looked at, not reasoned about.

The top inset is checked on a device rather than padded pre-emptively: browser chrome
occupies the top in portrait and iOS hides the status bar in landscape, so it is expected
to be `0`, and padding for a number that never arrives is how dead styling gets written.

### Dropping a pin

The sight, as the phone does it — and `marker-capture` already licenses it, already
requires it be centred on the map as drawn rather than on the screen, and already says
neither way is a fallback for the other. The confirm row **replaces** the toolbar rather
than joining it, which is what says the map is doing something other than what it usually
does.

Web's arm-then-tap model is untouched above 700px. Two models in one application is the
specification's own instruction, not a compromise: how a position is indicated follows
the shape of the screen.

## Risks / Trade-offs

- **`position: fixed` fails to escape if an ancestor gains a `transform`.** Every sheet
  would then be trapped inside the header, which reads as a stacking bug. → Verified at
  build time by opening it; a comment on `.menuPanel` records the dependency so the next
  person adding an animation to the header knows what it would break.
- **`100dvh` re-measures as iOS Safari's URL bar collapses,** so the map container
  resizes on scroll gestures. Present today, but invisible because nothing is pinned to
  the bottom. → Looked at on a real device; the toolbar is `position: absolute` within
  the stage rather than `fixed` to the viewport, so it rides the same resize as the map.
- **Width alone sends a phone in landscape to the laptop bar**, which eats a quarter of a
  390px-tall viewport. → Accepted deliberately, recorded here so it is not rediscovered
  as a defect. Revisiting it means a height or orientation term, which is a change to
  what `DESIGN.md` says.
- **The covered height and the camera can disagree for a frame** while the sheet animates
  in. → The measurement drives the camera, not the reverse, so the worst case is one
  frame of a slightly wrong offset; nothing is stored.
- **Two framing behaviours across the applications** until the follow-up lands. → Written
  into the spec as one rule that the phone does not yet meet, rather than left as two
  undocumented behaviours.

## Migration Plan

No data migration; nothing stored changes. The change is deployable as one unit and
revertible by reverting it — the laptop layout is not touched, so a rollback restores the
stopgap along with everything else.

The 700px rule is deleted in the same change that replaces it. It is one literal in one
place for exactly this reason, and leaving both in would mean two rules claiming the same
widths.

## Open Questions

None blocking. Two things are deliberately deferred rather than unresolved: `#40`'s
wide-layout menu review, and bringing shrink-then-shift framing to the phone.
