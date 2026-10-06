## 1. Shared

- [x] 1.1 Add `bearingAhead(line, here, metres)` to `@pinpoint/map` with tests (heading east, a corner within and beyond the look-ahead, a person beside the line, too short a line). Verify the map package's tests pass.
- [x] 1.2 Give `offsetCenter` an optional `bearing`, rotating the screen offset, with tests (0 unchanged; 90 and 180 move the centre the right way on the ground). Verify the tests pass.
- [x] 1.3 Add `follow.northUp` in English and Spanish. Verify `pnpm check:wording` passes once it is used.

## 2. Phone

- [x] 2.1 In `trip-map.tsx`, turn the camera to `bearingAhead` while following (15-degree threshold, offset rotated), add the compass button and `northUp`, make the recentre control turn the map again, and put north back on *Stop* and arrival. Verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass.

## 3. Check the running app

- [x] 3.1 Android emulator: follow the Miyagawacho walk. Verify the route ahead points up, the map turns at corners and not between them, the dot stays clear of the card and bar, the compass puts north at the top for the rest of the trip, recentre turns the map again, and *Stop* and arrival leave north at the top.

## 4. Finish

- [x] 4.1 Run the checks `pnpm verify` runs, and `openspec validate follow-turns-the-map --strict`. Verify both pass.
