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

- [x] 3.1 Pass the shared range to the `Camera`, so a pinch is bounded by the same range
      as a button and as `fitBounds`.
- [x] 3.2 Seed the current zoom from the framing camera rather than treating `null` as
      "cannot zoom". Done as a fallback at read time (`currentZoom`) rather than a
      write, because there is nothing to write *to*: `onRegionDidChange` fires on settle
      and an untouched map never settles, so a seeded state would be the framing zoom
      anyway. Confirmed on the simulator — both buttons draw active on a map nobody has
      touched, which is the case this was for.
- [x] 3.3 Promote the zoom to state. Affordable here in a way it is not on web:
      `onRegionDidChange` fires on settle, not per frame. The ref stays, and the press
      reads it rather than the state, because the state is one render behind a settle.
- [x] 3.4 The stack on the right edge, rising off `lift` — the one expression for
      whatever is standing on the bottom edge — and clear of the credit, which keeps the
      other corner.
- [x] 3.5 Rendered after the sight overlay so it is drawn on top of it.
- [x] 3.6 **Answered, by looking at it on a simulator in both themes.** It does not read
      as debris. The verdict at `trip-map.tsx:118-131` is about the trip's *actions* and
      it stands; what it binds here is the shape, and a single stacked pair with a
      hairline and an `sm` lift reads as one object rather than as two loose lozenges.
      Zoom is an instrument of the map, not a thing you do here, so the bar is the wrong
      home for it.
- [x] 3.7 **Decided: hidden while the capture form is open**, which the ticket allows.
      The strip of map the form leaves is the only way to confirm the place, and a
      control floating in it costs more of that strip than it gives.
- [x] 3.8 **Not in the plan, found by working through the states.** The marker sheet
      needed deciding too, and `lift` is deliberately blind to it — a thing that tracked
      that sheet would slide as it resized, which is the objection already recorded for
      the credit. A stack anchored to `lift` would therefore sit behind the sheet,
      half-covered and unpressable, so it is hidden for that glance exactly as the
      credit is.
- [x] 3.9 **Not in the plan.** `overflow: 'hidden'` on the stack sets `masksToBounds` on
      the iOS layer, which clips the shadow away — the lift vanishes on a style that
      reads as correct. Nothing needed clipping: the buttons draw no fill of their own.

## 4. Close out

- [x] 4.1 `openspec validate zoom-from-a-visible-control --strict`.
- [ ] 4.2 Archive once both platforms have landed on `main`.

## 5. Still to be looked at

Recorded rather than ticked, because this project's standing lesson is that green checks
have covered real visual defects five changes running.

- [ ] 5.1 Web: re-photograph the stack after the measured-corner change. Every number
      behind it was measured in the running application, but the browser this session
      could reach was in a background tab that never painted after that edit.
- [ ] 5.2 Mobile: the sight-armed state, the form at both detents, and pressing the
      buttons at the ends of the range. Driving a touch needs either accessibility
      permission for `osascript` or the inspector, which answers 401 on this version —
      neither was available. The mechanism itself is confirmed: `zoomTo` calls `setStop`
      with a zoom and **no centre**, so the camera centre is untouched by construction.
