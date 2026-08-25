## 1. The step, shared

- [x] 1.1 Add `ZOOM_STEP` to `packages/map/src/constants.ts` and `zoomStep(current,
      direction)` to `camera.ts`, beside `fitBounds`, clamped to `MIN_ZOOM`/`MAX_ZOOM`.
      Export both.
- [x] 1.2 Cover it in `camera.test.ts`: a whole step in each direction, a fractional
      zoom staying fractional, both clamps, and a `current` arriving from outside the
      range. **The last one corrected the plan**: stepping *down* from 22 lands on 20,
      not 19 — the clamp brings an out-of-range camera back inside rather than stepping
      it further out, which is the behaviour worth having and the test now says so.

## 2. Web

- [x] 2.1 Pass `minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM` to the map constructor. Confirmed
      in the running application rather than assumed: asking the map for zoom 22 lands
      at 20, and asking for −4 lands at the renderer's own world-fit minimum.
- [x] 2.2 Read the settled zoom into React state on `zoomend` **only**. Never `zoom` or
      `move` — the centre beside it is a ref for exactly that reason.
- [x] 2.3 Our own stacked pair rather than `NavigationControl`, so the spent control
      gets DESIGN.md's inert treatment instead of the library's `disabled`. Glyphs drawn
      as SVG, not typed as `+` and `-`.
- [x] 2.4 `aria-disabled` with a no-op handler at either end. Verified in the browser:
      at zoom 20 the zoom-in control reports `aria-disabled="true"`, `tabIndex` 0, the
      `disabled` property false, 0.55 opacity and `not-allowed`, and clicking it leaves
      the zoom at 20.
- [x] 2.5 Centre does not move. Measured, not assumed: one press moved zoom by exactly
      1.0 and the centre by 2e-12° of longitude — floating-point noise.
- [x] 2.6 Placement. **Settled by looking, and the first answer was wrong.** A fixed
      offset above the attribution is correct at every width the toolbar has and closes
      to exactly zero clearance at 420px, where the credit wraps to two lines. MapLibre
      stacks its own corner controls with floats rather than flex, so there is no way to
      join that stack from outside and be pushed up by it. The height of that corner is
      now measured with a `ResizeObserver` and the buttons rise off it — which is what
      the phone already does with its bottom bar, for the same reason.
- [x] 2.7 Remove the `.maplibregl-ctrl-group` rules from `globals.css`. They dressed a
      stacked pair of buttons for a navigation control that was never added.

## 3. Mobile

- [ ] 3.1 Pass the shared range to the `Camera`, so a pinch is bounded by the same range
      as a button and as `fitBounds`.
- [ ] 3.2 Seed the current zoom from the initial framing camera rather than treating
      `null` as "cannot zoom" — the buttons need a zoom from the moment they are drawn.
- [ ] 3.3 Promote the zoom to state. Affordable here in a way it is not on web:
      `onRegionDidChange` fires on settle, not per frame.
- [ ] 3.4 The stack on the right edge, rising off `lift` — the one expression for
      whatever is standing on the bottom edge — and clear of the credit and the sight.
- [ ] 3.5 Rendered after the sight overlay so it is drawn on top of it.
- [ ] 3.6 Answer the standing argument at `trip-map.tsx:118-131` against floating
      controls, or accept it and close the ticket. **To be decided by looking at a
      device, not on paper.**
- [ ] 3.7 Decide what the stack does while the capture form is open, on a device.

## 4. Close out

- [ ] 4.1 `openspec validate zoom-from-a-visible-control --strict`, then archive once
      both platforms satisfy their scenarios.
