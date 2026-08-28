## 1. The breakpoint and the header

- [x] 1.1 Add the phone breakpoint to `trip-workspace.module.css` as one literal, and
      delete the `@media (max-width: 700px)` stopgap in the same edit rather than
      leaving both rules claiming the same widths
- [x] 1.2 Give the header its second line below the breakpoint: mark, trip name with its
      caret, `☰` at the far end; the city beneath, indented to the trip name
- [x] 1.3 Truncate the trip name and the city each within its own line, and confirm at
      320px that a forty-character trip name against a twenty-seven-character city
      reduces neither to a stub
- [x] 1.4 Replace the account name with `☰` below the breakpoint, keeping the same `Menu`
      call site and changing only the label
- [x] 1.5 Add the identity block and `Refresh` to the account menu's contents, so it
      carries the phone's three items on both shapes
- [x] 1.6 Confirm the header still exposes a `banner` landmark — it is a sibling of
      `<main>` and must stay one

## 2. The toolbar on the edge

- [x] 2.1 Build the toolbar: `Search`, `Drop`, `Filter` at equal weight, flush to the
      bottom edge, rendered inside the stage so the map owns the edge beneath it
- [x] 2.2 Draw `Filter`'s narrowing by fill **and** a dot, reusing the `marked`
      treatment `Menu` already carries rather than writing a second one
- [x] 2.3 Hide the bar's search field, drop slot and filter trigger below the
      breakpoint, leaving the laptop arrangement untouched above it
- [x] 2.4 Add `padding-bottom: env(safe-area-inset-bottom)` to the toolbar

## 3. Sheets

- [x] 3.1 Restyle `.menuPanel` inside the media query: `position: fixed`, pinned to the
      bottom edge, full width, top corners only. Add the scrim
- [x] 3.2 Verify the panel escapes the header to the viewport, and comment on
      `.menuPanel` that this depends on no ancestor establishing a containing block
- [x] 3.3 Confirm `TripBar`, `CityBar` and `FilterBar` need no changes; if any does,
      stop and record why before changing it
- [x] 3.4 Turn the marker details panel into an undimmed bottom sheet
- [x] 3.5 Turn the marker form into an undimmed bottom sheet
- [x] 3.6 Check the contract in the phone shape: outside press, Escape, focus back to the
      trigger, named region, `aria-expanded` — for each of trips, cities, filter, `☰`

## 4. Search as a screen

- [x] 4.1 ~~Add `useIsPhone()`~~ — **not needed.** The branch it existed for turned out
      not to be one: search is not two components, it is one field that changes where
      it lives, so the cascade can move it and no code has to ask how wide the window
      is. That removes the hook, the subscription, the server snapshot and the
      first-paint flash the design document was worried about
- [x] 4.2 Branch on it for search only: the field on a laptop, the tool plus a
      full-screen search below the breakpoint
- [x] 4.3 Confirm exactly one search input exists in the DOM at a time, and that no
      hidden duplicate is reachable by keyboard or screen reader
- [x] 4.4 Confirm no first-paint flash of the laptop layout on a phone-width load

## 5. Dropping a pin by sight

- [x] 5.1 Draw the sight at the centre of the map **as drawn**, not the centre of the
      screen — `marker-capture` requires this and the phone records why
- [x] 5.2 Replace the toolbar with `Cancel` / hint / `Use this spot` while armed, as one
      slot rather than two so the credit measures whichever is standing there
- [x] 5.3 Take the position from the camera centre on confirm, and open the same form the
      other two routes open
- [x] 5.4 Leave web's arm-then-tap model untouched above the breakpoint
- [x] 5.5 Confirm panning, zooming and selecting a marker while unarmed still create
      nothing

## 6. The credit and the floor

- [x] 6.1 Measure the floor once — the toolbar, the confirm row, or the marker sheet —
      and expose it as one number
- [x] 6.2 Below the breakpoint, set `attributionControl: false` and draw our own credit
      from `ATTRIBUTION`, riding above the measured floor
- [x] 6.3 Build the "About this map" sheet from `MAP_CREDITS`, each entry opening the
      project
- [x] 6.4 Confirm the credit is visible unprompted in every state: idle, filter open,
      marker sheet open, form open, armed, searching
- [x] 6.5 Confirm the zoom control still clears the credit at this width, or is withdrawn
      below the breakpoint if it cannot

## 7. The camera

- [x] 7.1 Report the height of the marker details sheet and the form via `ResizeObserver`
      up to `trip-workspace`
- [x] 7.2 Pass the covered height to `TripMap` as one number
- [x] 7.3 Compose `fitBounds` over the uncovered strip with `offsetCenter` by half the
      covered height, at both framing sites — mount and re-frame
- [x] 7.4 Add the floor that stops the uncovered height reaching zero, and a unit test in
      `packages/map` asserting `fitBounds` never returns a `NaN` zoom for a degenerate
      viewport
- [x] 7.5 Open a marker whose pin sits low on the screen and confirm the pin is visible
      above the sheet rather than behind it
- [x] 7.6 Frame a city whose places are spread wide with the sheet open, and confirm the
      outliers are in the uncovered strip

## 8. Edge to edge

- [x] 8.1 Add `viewportFit: 'cover'` to the `Viewport` export in `layout.tsx`
- [x] 8.2 Add horizontal safe-area padding to the laptop bar, so a phone held in
      landscape does not draw it under the notch
- [x] 8.3 Look at the auth and loading screens with it on
- [x] 8.4 Check the top inset on a real device and add padding only if it is non-zero —
      checked on a device; nothing needed adding

## 9. Looking at it

Budget for this rather than treating it as sign-off. Each of the last changes shipped
defects that type-checked, rendered, and were wrong.

> **How this was done.** The workspace sits behind a live login, so a temporary route
> rendering the real `TripWorkspace` against fabricated worst-case rows was stood up,
> driven headlessly at 320 / 390 / 900 / 1440, and deleted afterwards. Real components,
> real stylesheets, real hashed class names — only the rows were invented.
>
> It earned its keep. **Four defects were found by looking, every one of them green under
> lint, typecheck and build:** a trip name that overflowed through the menu instead of
> truncating; a search list that truncated the place name while sparing the region; a
> sheet that could not be dismissed by pressing outside it; and a marker sheet that
> covered the toolbar, leaving those controls present but unreachable.
>
> **9.2 and 8.4 were closed on a real device**, which is the only place either of them
> could be: the top safe-area inset needed no padding added, and the collapsing URL bar
> and the browser's own bottom chrome behave. Those two were the reason this section
> insists on hardware rather than a narrowed window.

- [x] 9.1 Screenshot pair — web at phone width beside the phone app, same trip — for
      each of: idle, filter open, marker details open, dropping a pin, searching
- [x] 9.2 On a real phone browser, not a narrowed window: the URL bar collapsing on
      scroll, and the browser's own bottom chrome
- [x] 9.3 Keyboard and screen reader through the narrow layout: `banner` landmark, tools
      as buttons, sheets naming themselves and handing focus back
- [x] 9.4 Widen past the breakpoint and confirm the laptop layout is untouched — the
      single bar above 1024, the wrap between
- [x] 9.5 Both grounds at phone width, checking the credit over dark land and `Filter`'s
      fill where `accent` and `accent-ink` converge
- [x] 9.6 320px, with the long trip name and long city name

## 10. Documents

- [x] 10.1 Update `DESIGN.md`'s Responsive paragraph: three bands, and the 700px rule
      described as the phone shape rather than as temporary
- [x] 10.2 Move `mock/` into this change from the scratchpad, with its README recording
      what it settled
- [x] 10.3 File the follow-up for bringing shrink-then-shift framing to the phone, so the
      two applications stop differing — filed as #70
- [x] 10.4 `openspec validate web-phone-shape --strict`
