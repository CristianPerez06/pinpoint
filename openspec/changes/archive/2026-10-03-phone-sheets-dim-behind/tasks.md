## 1. The dim in `Sheet`

- [x] 1.1 In `apps/mobile/components/sheet.tsx`, draw a full-screen `scrim` view behind the content when `dim` (default `true`), its opacity driven by the same `shown` value, taking no touches. Update the header comment. Verify by `pnpm typecheck:mobile`
- [x] 1.2 Pass `dim={false}` from `place-search.tsx`, and verify `grep -n "dim=" apps/mobile/components` shows only it
- [x] 1.3 Remove the scrim colour from `DayField`'s iOS backdrop in `apps/mobile/components/ui.tsx` so it is not drawn twice, and verify `grep -n "colour.scrim" apps/mobile/components/ui.tsx` finds nothing

## 2. Looking at the running app

- [ ] 2.1 Phone (iOS), light and dark: open Filter, Nearby, the trips, the cities and the people in turn. The map is darker behind each, fades back when it closes, and a tap on the dark area over a pin closes the sheet without selecting the pin — partly done: Filter, forced open on the simulator, darkens the map on the light ground. The simulator could not be tapped from this session, so the other sheets, the dark ground and the tap were not checked by hand
- [ ] 2.2 Phone (iOS): open the menu, the map credits and a city's currency list; each dims. Open a trip's dates from the trips sheet: the dims stack and the map is still recognisable on the dark theme — not done: needs taps the simulator would not take from this session
- [ ] 2.3 Phone (iOS): open a place on the map and start saving one; neither dims the map. Open place search; it looks as before — not done by hand, for the same reason; neither of the first two is a `Sheet`, and place search passes `dim={false}`

## 3. Done

- [x] 3.1 Run `openspec validate phone-sheets-dim-behind --strict` and `pnpm verify`, and both pass
