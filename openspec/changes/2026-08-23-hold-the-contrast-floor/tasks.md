## 1. The token

- [x] 1.1 Add `inkOnAccent` to `COLOUR` in `packages/tokens/src/colour.ts` as
      `{ light: '#241703', dark: '#171614' }`, with the reasoning for why the pair is
      near-neighbours rather than opposites (design.md — Decisions).
- [x] 1.2 Rewrite `inkFaint`'s comment so it states what the token is for — a hairline,
      a border, anything drawn rather than read — and records the two measurements that
      put it under the floor. The old wording is what licensed every misuse.
- [x] 1.3 Regenerate `src/generated/` and confirm the diff is only the new token: two
      lines in `tokens.css`, the record type and two values in `native.ts`.

## 2. Web — text on the accent

- [x] 2.1 `ui.module.css`: `.primary` reads `var(--pp-ink-on-accent)` instead of the
      `#241703` literal.
- [x] 2.2 `(auth)/auth.module.css`: `.submit` likewise.
- [x] 2.3 `filter-bar.module.css`: `.clear:hover` declares
      `color: var(--pp-ink-on-accent)` alongside its accent fill. Without it the rule
      inherits `accent-ink`, which is the same value as `accent` on the dark ground.

## 3. Web — recessive text

- [x] 3.1 Move the uppercase label rules to `var(--pp-ink-muted)`: `.label` in
      `ui.module.css`, `trip-bar.module.css`, `city-bar.module.css` and
      `(auth)/auth.module.css`; `.typesLabel` in `marker-form.module.css`;
      `.fieldLabel` in `marker-details.module.css`.
- [x] 3.2 Move both placeholders: `.control::placeholder` in `ui.module.css` and
      `.input::placeholder` in `place-search.module.css`.
- [x] 3.3 Move the dismiss glyphs in `marker-form.module.css` and
      `marker-details.module.css`, and `.caret` in `filter-bar.module.css`.
- [x] 3.4 Move `.absent` in `marker-details.module.css` and the inert
      `.clear[aria-disabled='true']` in `filter-bar.module.css`. The inert state keeps
      its border, fill and weight difference from the live one, so nothing about the
      declaration depends on the colour that changed.
- [x] 3.5 Leave the two `border-color` uses in `interest.module.css`. They are not text.

## 4. Mobile

- [x] 4.1 `components/ui.tsx`: `Button`'s primary ink reads `theme.colour.inkOnAccent`
      rather than `theme.colour.ground`, which was legible on dark and 2.26:1 on light.
- [x] 4.2 `app/login.tsx`: delete the `#241703` literal from `styles.submitText` and
      apply the token inline, where the theme is in scope.
- [x] 4.3 Move every `theme.colour.inkFaint` that colours text or a glyph to
      `inkMuted` — `interest.tsx`, `place-search.tsx`, `marker-details.tsx` (×5),
      `menu-sheet.tsx`, `ui.tsx`, `trip-workspace.tsx`, `login.tsx` (×4). No use of
      `inkFaint` remains in this application.

## 5. Verify

- [x] 5.1 Full CI set: `lint`, `lint:mobile`, three typechecks, `test`, `build`,
      `check:fonts`, `check:rls`, `check:cycles`, `check:specs`. All green — and all
      were green over every one of these defects before the change.
- [x] 5.2 Confirm the dark-theme `Clear` in a browser: apply a people filter so the
      control goes live, hover it, and read the resolved values out of the live DOM
      rather than judging by eye. `accentInk` and `accent` both report `#f0ae4a`, which
      is the defect; `Clear` letters at `#171614` on `#f0ae4a`, which is the fix.
- [x] 5.3 Confirm the same pass covers the primary button and a moved label:
      `+ Drop a pin` at `#171614` on `#f0ae4a`, `TRIP` at `#a09a91` rather than
      `#7c766d`.
- [ ] 5.4 Light theme by eye. Every light-ground ratio is computed and recorded in the
      proposal, but the browser used was in dark mode and no light rendering was seen.
