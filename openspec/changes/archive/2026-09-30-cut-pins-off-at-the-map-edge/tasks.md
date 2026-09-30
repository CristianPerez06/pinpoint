## 1. Reproduce

- [x] 1.1 On an Android phone or emulator running a build of `main`, open a trip and pan so a pin sits against the top edge of the map; confirm it is drawn over the header, online and with the offline note showing, and record which (screenshot)
- [x] 1.2 Do the same on the iOS simulator and confirm the pin is already cut off there

## 2. Cut the map off at its edge

- [x] 2.1 Give the map's wrapper in `apps/mobile/components/trip-map.tsx` `overflow: 'hidden'`, with a comment saying why (the library turns clipping off on Android and adds pins as children of the map) and why this does not contradict the zoom group's shadow warning; verify with `pnpm typecheck:mobile` and `pnpm --filter mobile lint`
- [x] 2.2 If Android still draws pins past the edge after 2.1, put the same on the `Map` itself and record in `design.md` that the wrapper was not enough; verify by repeating 1.1
  - Not needed: after a full reload the wrapper alone cut pins off on Android (a hot refresh had not reached the phone, which briefly looked like it had not worked)

## 3. Look at the running apps

- [x] 3.1 On Android, in both themes, online and offline: a pin at the top edge is cut off at the map's edge and never covers the trip name, the city line or the offline note
- [x] 3.2 On Android, with a pin just past the top edge beneath the city line, pressing the city line opens the city selector and does not select the pin
- [x] 3.3 On Android, a pin at the bottom, left and right edges is cut off there and does not cover the bar of tools or anything beside the map
  - Left and right edges are the screen's edges on the phone, so nothing sits beside them to cover
- [x] 3.4 On Android and iOS, the zoom control, the re-read button, the credit and the drop sight look as before, shadows included, in both themes
- [x] 3.5 On iOS, repeat 3.1 and 3.2 and confirm nothing changed
- [ ] 3.6 Repeat 3.1 on an Android EAS production build, where the defect was first seen
  - Deferred to the next production build, which the user will make and check on their own phone

## 4. Close

- [x] 4.1 `pnpm verify` passes
- [x] 4.2 `openspec validate cut-pins-off-at-the-map-edge --strict` passes
