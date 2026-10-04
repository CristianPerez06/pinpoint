## 1. Fix

- [x] 1.1 Pass the dismiss to `MarkersOverlayNote`'s `onPress` in `apps/mobile/components/trip-workspace.tsx` instead of wrapping it in a `Pressable`. Verified by `pnpm typecheck:mobile` and lint

## 2. Looking at the running app

- [x] 2.1 Phone (iOS), light: with a refusal forced on, the note was not on screen before the fix and stands at the top of the map after it
- [ ] 2.2 Phone (iOS): tapping the note dismisses it, and the dark ground reads — not done: the simulator would not take taps from this session, and the app is set to the light ground

## 3. Done

- [x] 3.1 Run `openspec validate phone-refusal-note-visible --strict` and `pnpm verify`, and both pass
