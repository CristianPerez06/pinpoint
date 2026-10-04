## 1. The token

- [x] 1.1 Set `lineStrong` to `#8F8C84` / `#767068` in `packages/tokens/src/colour.ts`, with a comment on what it is for and why, and regenerate. Verified by `pnpm --filter @pinpoint/tokens derive` and `pnpm check:tokens` in verify
- [x] 1.2 Add `packages/tokens/src/colour.test.ts` measuring `lineStrong` against `surface`, `ground` and `surfaceMuted` on both themes. Verified: 6 cases pass
- [x] 1.3 Update the recorded values in `DESIGN.md` and `.impeccable/design.json`. Verified by grep finding neither old value

## 2. Looking at the apps

- [x] 2.1 Phone (iOS), light: Filter's checkboxes have a clearly visible edge
- [ ] 2.2 Laptop, both grounds, and the phone on the dark ground: buttons, chips, fields, the off switch, and the offline map's total line don't compete with content — not done: the browser available to this session stopped loading the trip, and the phone app is set to light. The mock shows the values on both grounds

## 3. Done

- [x] 3.1 Run `openspec validate control-edges-clear-contrast-floor --strict` and `pnpm verify`, and both pass
