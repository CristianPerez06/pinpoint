## Why

Three things get in the way once a sheet is open on a phone-shaped screen:

- Tapping a place in Nearby shows it on the map, but closing it brings the Nearby list
  straight back over it.
- Sheets choose their own heights and grow with what they hold. Trips and People reached
  85% of the screen, Cities and Filter 80%, Nearby 62%, so a long list left a sliver of
  map. The site at a phone's width had the same problem, with menus up to 76%.
- On the phone, pressing People inside the trips sheet does nothing: the trips sheet
  closes and People never appears.

## What Changes

- **Closing a place opened from Nearby leaves you on the map.** The list no longer
  reopens; pressing Nearby again opens it, freshly sorted. In both apps.
- **Filter, Nearby, Trips, Cities, People and a place's details stand at a fixed half of
  the screen** on the phone and on the site at a phone's width. Longer contents scroll
  inside; shorter ones leave space rather than shrinking the sheet. On the site, People
  is a view inside the trips menu, so it gets the same height with it.
- **People opens from the trips sheet again.** A sheet asked to open while another is
  still sliding away now waits for it, then rises.

Not in this change:

- Moving the map so a pressed pin or the person's dot is not covered by a sheet. Tried
  and dropped: the user judged it too costly for what it gives.
- The menu, the map credits and the place form, which keep their heights.

## Capabilities

### Modified Capabilities

- `nearby-places`: choosing a row no longer returns to the list when the place closes.
- `workspace-chrome`: at a phone's width, six panels stand at a fixed half of the
  screen, and a panel opened from inside another opens.

## Impact

- Phone: `components/sheet.tsx` (the shared height, and the wait for a closing sheet),
  `filter-sheet.tsx`, `nearby-sheet.tsx`, `trip-sheet.tsx`, `city-sheet.tsx`,
  `people-sheet.tsx`, `marker-details.tsx`; `trip-workspace.tsx` and `trip-map.tsx` (the
  return removed).
- Site: `ui.module.css` and `ui.tsx` (a `half` option on menus and the place card),
  `trip-bar.tsx`, `city-bar.tsx`, `filter-bar.tsx`, `nearby-bar.tsx`,
  `marker-details.tsx`; `trip-workspace.tsx` and `nearby-bar.tsx` (the return removed).
