## 1. Nearby closes for good

- [x] 1.1 Phone: remove `NearbyReturn`, `resume`, `nearbyReturn`/`nearbyResume` and `onDismissDetails`; verify by typecheck and by reading the dismiss path
- [x] 1.2 Laptop: remove the same return from `trip-workspace.tsx` and `nearby-bar.tsx`; verify by typecheck and by reading the dismiss path

## 2. A fixed half-screen height on the phone

- [x] 2.1 Export `SHEET_HEIGHT` (0.5) and `sheetHeight` from `apps/mobile/components/sheet.tsx`, and set it as the `height` of the Filter, Nearby and Trips sheets; verify by typecheck and lint
- [x] 2.2 Give a place's details the same fixed height with its fields always in a scroller, removing the overflow measurement; verify by typecheck and lint

## 3. Cities, People and the site

- [x] 3.1 Give the cities and people sheets the same fixed height; verify by typecheck and lint
- [x] 3.2 Make a sheet asked to open while another is closing wait for it, in `sheet.tsx`; verified on the simulator: People rises in place of Trips, and the date picker still opens on top of the open trips sheet
- [x] 3.3 Add `half` to the site's `Menu` and place card, on the trips, cities, Filter and Nearby menus and the place card; verify in Chrome at 390×844 that each stands at 422px, and that closing a place opened from Nearby leaves the map

## 4. Checks

- [x] 4.1 `openspec validate half-height-sheets-and-nearby-close --strict` and `pnpm verify` pass
