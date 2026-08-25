## Why

Neither application has a zoom control. On web the only ways to change zoom are a
scroll over the canvas, a trackpad pinch, and MapLibre's keyboard `+`/`−` — and the
last one works only once the canvas has focus, which nothing on screen says. A scroll
wheel over a full-bleed map is easy to trigger by accident and hard to aim: it zooms
about the pointer, so the view slides while it scales. On the phone there is a
two-finger pinch and nothing else.

The case is not the same on the two platforms and it is worth saying so plainly.

On web, buttons put zoom into the tab order and into a screen reader, which no gesture
does, and they zoom about the centre one step at a time.

On the phone, pinch is discoverable and nobody needs to be taught it. What it needs is
two hands, or a grip most people cannot hold while walking. This app is used *during* a
trip — one hand on the phone, looking for what is near — and that is the case a
stepped, thumb-reachable control answers.

There is a second defect underneath both, which is the reason this is one change rather
than two coincidences. **The zoom range is ours and nothing enforces it.**
`MIN_ZOOM`/`MAX_ZOOM` are `0` and `20`; `maplibre-gl`'s own defaults are `0` and `22`.
`fitBounds` clamps to ours. So today a wheel can leave the web camera at 21 and nothing
in the product can frame its way back — the end of the range depends on which
instrument you last touched.

## What Changes

**The step becomes shared.** `zoomStep(current, direction)` joins `fitBounds` in
`packages/map/src/camera.ts`, clamped to `MIN_ZOOM`/`MAX_ZOOM`, with the step size as a
named constant. One line of arithmetic, and still shared: neither application derives a
camera on its own, and "two applications each choosing their own" is exactly where the
marker-anchor drift defect lived. Neither application writes `zoom + 1`.

**Both renderers are given our range.** `minZoom`/`maxZoom` on the web map constructor
and on the phone's `Camera`. Every instrument — wheel, pinch, keyboard, button — then
ends at the same place, and the buttons inherit the clamp rather than being the only
thing that knows about it.

**Each application draws its own pair.** A vertical stack of two, on the right edge,
rising off whatever is standing on the bottom edge. Not MapLibre's `NavigationControl`
on web: it draws the library's glyphs and its disabled state is the library's, not the
inert treatment this design system specifies.

**A spent control is drawn inert, not removed** — `aria-disabled` on web,
`accessibilityState={{ disabled: true }}` on native, with a no-op handler, per DESIGN.md.
The `disabled` attribute leaves the tab order and is skipped by screen readers.

**This is not a re-frame.** The centre does not move and no framing token is touched, so
it stays inside `map-rendering`'s "nothing else SHALL move the camera": the person
asked, with a button instead of a wheel.

**Not changing.** Pinch, scroll and MapLibre's own keyboard zoom all still work. No
marker, no capture flow, no schema, no dependency, no migration.

## Capabilities

### Modified Capabilities

- `map-rendering`: adds **Zoom is reachable from a visible control, not only a gesture**.

  The existing requirement already says each application renders a map "that can be
  panned and zoomed", so the capability is not new. What is missing is any statement
  about the *instrument*, and about whose range is in force — which is how the two
  applications came to disagree with their own renderer about where zoom ends.

  The new requirement also states that the range binds every instrument, not only the
  new one. That half is worth having on its own account and would be worth writing even
  if no button ever shipped.

## Impact

Two applications and one package. No dependencies, no migration, no row-level security
change, and `@pinpoint/map` still declares no runtime dependencies.

- `packages/map/src/constants.ts` — `ZOOM_STEP`.
- `packages/map/src/camera.ts` — `zoomStep`, beside `fitBounds`, unit-tested including
  both clamps and a `current` arriving from outside the range.
- `apps/web/app/_components/trip-map.tsx` — the range on the constructor, the settled
  zoom in state, and the pair of buttons.
- `apps/web/app/_components/trip-map.module.css` — the stack, and a box around the
  canvas to hang it on.
- `apps/web/app/globals.css` — the `.maplibregl-ctrl-group` rules are removed. They
  dressed a stacked pair of buttons for a navigation control that was never added;
  styling left behind for a control nobody mounts is how the next person concludes one
  is there.
- `apps/mobile/components/trip-map.tsx` — the range on the `Camera`, the current zoom
  seeded and promoted to state, and the stack rising off the bottom edge with the
  credit.
