## 1. The list scrolls

- [x] 1.1 In `apps/mobile/components/place-search.tsx`, turn the body `View` into a `ScrollView` with `style={{ flex: 1 }}` and the current `body` padding and gap moved to `contentContainerStyle`; verify `pnpm typecheck:mobile` passes and the intro, wait, shells, candidates and hint render unchanged for a short query
- [x] 1.2 Add `automaticallyAdjustKeyboardInsets`, `keyboardDismissMode="on-drag"` and `keyboardShouldPersistTaps="handled"` to it; verify with the running app in 2.x

## 2. Look at it on the phone

- [x] 2.1 iOS, dark ground: search "Castillo de Osaka" (eight results) with the keyboard up; scroll until the last row and the hint are both visible above the keyboard
- [x] 2.2 iOS: tap the last row once — it opens the place or its capture form in one tap
- [x] 2.3 iOS: tap a row near the top with the keyboard up — one tap chooses it
- [x] 2.4 iOS: drag the list — the keyboard goes down, and the query and results stay
- [x] 2.5 iOS: a query with three results looks and behaves as before; the empty field's intro, the wait and a failure still show as before (failure not triggered — same container, no condition changed)
- [x] 2.6 Repeat 2.1–2.4 on the light ground — accepted by the user without a separate light run: the change adds no colour
- [ ] 2.7 Android, if a build is at hand: repeat 2.1–2.4; if the last row stays behind the keyboard, apply the fallback in design.md (Risks) and repeat — skipped: no Android build at hand

## 3. Close out

- [x] 3.1 Run `openspec validate reach-every-search-result --strict` and `pnpm verify`; both pass (`check:unarchived` clears on archive)
