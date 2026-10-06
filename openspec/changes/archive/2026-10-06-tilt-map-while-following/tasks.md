## 1. Shared

- [x] 1.1 Add `groundOffset(screenOffset, pitch, height)` to `@pinpoint/map`, exported, with tests (pitch 0 returns the offset unchanged; tilted, a point above the middle is further on the ground than on screen and one below is nearer; zero stays zero). Verify the map package's tests pass.
- [x] 1.2 Add the control's names (`follow.tilt`, `follow.flatten`, and the visible `follow.view3d` / `follow.view2d`) in English and Spanish. Verify `pnpm check:wording` passes once they are used.

## 2. Phone

- [x] 2.1 Add `followTilted` / `chooseFollowTilted` to `apps/mobile/lib/preferences.tsx`, own key, default `true`, read in the launch gate. Verify `pnpm typecheck:mobile` passes.
- [x] 2.2 In `trip-map.tsx`, give `followCamera` a pitch (60° or 0 from the preference) and convert the vertical shift with `groundOffset`; add the *3D*/*2D* control under the turn card with the compass beneath it; make the compass keep the tilt; make `frameRoute` set `pitch: 0`. Verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass.

## 3. Check the running app

- [x] 3.1 On a running phone build, follow a route. Verify the map tilts on *Start*; the dot sits between the card and the bar at the start and after a corner; the map still turns at corners and holds between them; the compass puts north up and keeps the tilt; dragging and *Back to where you are* return to the tilted view; *2D* lays it flat and *3D* tilts it again; the choice survives closing and reopening the app; *Stop* and arrival leave the map flat with north up; pins and the line are readable tilted; both grounds.

## 4. Finish

- [x] 4.1 Run `pnpm verify` and `openspec validate tilt-map-while-following --strict`. Verify both pass.
