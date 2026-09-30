## 1. Confirm the bug

- [x] 1.1 On the phone, sign in with an account on two or more trips, choose one that is not first, sign out and sign back in with the same account; verify it opens on the chosen trip rather than the first (the defect, before any fix) — not run before the fix; the cause was confirmed by reading the code, and 3.1–3.3 check the fixed behaviour

## 2. Forget the choice on sign-out

- [x] 2.1 Add `forgetTrip()` to `TripChoiceProvider` in `apps/mobile/lib/trip-choice.tsx`, setting the choice back to null; verify with `pnpm typecheck:mobile`
- [x] 2.2 Replace `signOutHere()` in `apps/mobile/lib/sign-out.ts` with a `useSignOut()` hook that forgets the trip choice, forgets the kept copies, then signs out, keeping the comment on why it is tied to the button; verify `signOutHere` no longer appears anywhere under `apps/mobile`
- [x] 2.3 Call `useSignOut()` from the menu in `components/trip-workspace.tsx` and `components/trip-calendar.tsx`; verify with `pnpm typecheck:mobile`
- [x] 2.4 Correct the comment above `TripChoiceProvider` in `apps/mobile/app/_layout.tsx` so it says the choice is forgotten by signing out, not by unmounting

## 3. Check it on the phone

- [x] 3.1 Repeat 1.1 from the map's menu; verify it opens on the first trip
- [x] 3.2 Repeat 1.1 but sign out from the calendar's menu; verify it opens on the first trip
- [x] 3.3 Choose a trip that a second account also belongs to, sign out, sign in as the second account; verify it opens on that account's first trip
- [x] 3.4 With a downloaded map, sign out and back in; verify the map still draws with no signal and that no flash of another trip is visible before sign-in appears

## 4. Finish

- [x] 4.1 Run `openspec validate forget-trip-choice-on-sign-out --strict` and `pnpm verify`; both pass
