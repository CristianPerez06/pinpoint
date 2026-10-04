## 1. Leaving from outside the form

- [x] 1.1 In `apps/mobile/components/marker-form.tsx`, add an optional `leaveRef` prop that is set to the form's `leave` after every commit and cleared on unmount. Verify by `pnpm typecheck:mobile`
- [x] 1.2 In `apps/mobile/components/trip-map.tsx`, add `onLeaveForm`; on a pin tap with the form open, call it and return without selecting. Keep the armed-sight path as it is, and update the `onAbandonCapture` comment. Verify by `pnpm typecheck:mobile`
- [x] 1.3 In `apps/mobile/components/trip-workspace.tsx`, hold the ref, pass it to the form as `leaveRef` and to the map as `onLeaveForm`. Verify by `pnpm --filter mobile lint`

## 2. Looking at the running app

- [ ] 2.1 Phone (iOS): start saving a place, tap a saved pin; it asks and the pin does not open. Decline; the form is unchanged. Discard; the form closes, and a second tap opens the pin — not done: the simulator would not take taps from this session
- [ ] 2.2 Phone (iOS): edit a place on the map without changing anything, tap another pin; the form closes and that pin does not open on the same tap — not done: the simulator would not take taps from this session
- [ ] 2.3 Phone (iOS): arm the sight with Drop, tap a pin; the sight goes and the pin opens, as before — not done: the simulator would not take taps from this session

## 3. Done

- [x] 3.1 Run `openspec validate pin-tap-leaves-form-through-question --strict` and `pnpm verify`, and both pass
