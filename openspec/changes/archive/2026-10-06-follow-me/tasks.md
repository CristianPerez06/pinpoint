## 1. Shared

- [x] 1.1 Add `walkedBearing(from, to, accuracy, metres = WALKED_M)` and `WALKED_M = 15` to `@pinpoint/map` beside `bearingAhead`, exported, with tests (east and north give 90 and 0; closer than 15 m is null; closer than a worse accuracy is null; the same point is null). Verify the map package's tests pass.
- [x] 1.2 Add `map.followMe`, `map.followMeOff` and `map.followMeLocationOff` in English and Spanish (impersonal). Verify `pnpm check:wording` passes once they are used.

## 2. Phone

- [x] 2.1 In `trip-map.tsx`, make `followCamera` take the covered band and the zoom as arguments; route following passes what it does today. Verify `pnpm typecheck:mobile` passes and nothing about route following changes.
- [x] 2.2 Add Follow me to `trip-map.tsx`: the arrow button between "where am I" and the re-read (wash when on, accessible name and selected state); turning on through `whereAmI.locate()`; the anchor and direction from `walkedBearing`; following while `followMe && !lookingAround && selection === null`, resuming when that becomes true again; "where am I" bringing the camera back while Follow me is on and its crosshair filled while following; the tilt button and the compass at the top right; `stopFollowMe` from the button, `calculateRoute`, arming the sight and `frameOn`. Verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass.
- [x] 2.3 In the workspace, show `map.followMeLocationOff` when the refused press was Follow me, and let the notes over the map leave the top-right column free while Follow me is on (`besideControls` on `MarkersOverlayNote`). Verify `pnpm typecheck:mobile` passes.

## 3. Check the running app

- [x] 3.1 On a running phone build, with simulated walking: the map opens flat and north up; Follow me tilts the map and keeps the dot clear of the bar; the map turns smoothly at a corner and does not spin while standing still; *2D*/*3D* and the compass work and the tilt choice carries over to route following; dragging and "where am I" resume; opening a pin pauses and closing resumes; *Calculate route*, dropping a pin and choosing a city turn it off flat and north up; refused location shows the Follow me note; pins readable tilted; both grounds; Spanish.

## 4. Finish

- [x] 4.1 Run `pnpm verify` and `openspec validate follow-me --strict`. Verify both pass.
