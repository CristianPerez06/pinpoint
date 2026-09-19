## 1. Reproduce

- [x] 1.1 On web, create a throwaway city, file one place under it, remove the city, then rename that place without reloading. Confirm the save is refused as changed by someone else. Repeat on the phone.

## 2. Fix

- [x] 2.1 In `apps/web/app/_components/trip-workspace.tsx`, `removeCity` re-reads the markers (forced) whenever the city held any marker, rather than only when some had a local price. Keep the immediate local unassignment. Verify with `pnpm typecheck`.
- [x] 2.2 Make the same change in `apps/mobile/components/trip-workspace.tsx`. Verify with `pnpm typecheck:mobile`.

## 3. Look at the running apps

- [x] 3.1 On web, repeat 1.1: the rename saves, and the place shows as unassigned straight after the removal. Removing an empty city sends no markers read (network panel). Check both themes.
- [x] 3.2 On the phone, repeat 1.1: the rename saves.

## 4. Finish

- [x] 4.1 Run `openspec validate city-removal-rereads-its-places --strict` and `pnpm verify`, and both pass.
