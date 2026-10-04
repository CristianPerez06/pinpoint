## 1. The form asks

- [x] 1.1 In `apps/mobile/components/marker-form.tsx`, add `capturing` and `unsaved` props and an `entered` value computed as the laptop's (`capturing || unsaved || a field differs from initial`). Verify by `pnpm typecheck:mobile`
- [x] 1.2 Route ✕, Cancel and the dim behind the form through one `leave`: with something entered, show the `Question` in place of the footer (laptop wording: `placeForm.discardQuestion`, `discardCapture` or `discardEdit`, `common.discard`); otherwise call `onCancel`. Update the `dimBehind` comment. Verify `grep -n "onPress={onCancel}" apps/mobile/components/marker-form.tsx` finds nothing

## 2. The workspace says what the form cannot see

- [x] 2.1 In `apps/mobile/components/trip-workspace.tsx`, pass `capturing` for a new place and `unsaved` for an edit whose position differs from the marker's or whose `initial` differs from the marker's values. Verify by `pnpm typecheck:mobile`

## 3. Looking at the running app

- [ ] 3.1 Phone (iOS), map: start saving a place, press ✕ with nothing typed; it asks. Decline; the form stays. Type a name, press Cancel, decline; the name is still there. Discard; the form closes — not done: the simulator would not take taps from this session
- [ ] 3.2 Phone (iOS), calendar: edit a place, change nothing, tap the dark area; it closes. Change the name, press ✕; it asks. Tap the dark area; it asks. Decline keeps the change — not done, for the same reason
- [ ] 3.3 Phone (iOS), dark ground: the question is readable — not done, for the same reason; it is the phone's existing `Question`, already used for removing a place on both grounds

## 4. Done

- [x] 4.1 Run `openspec validate phone-form-asks-before-discarding --strict` and `pnpm verify`, and both pass
