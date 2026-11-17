## 1. Colours

- [x] 1.1 In `packages/tokens/src/colour.ts`, set the new dark values for `surface`, `surfaceMuted`, `line`, `lineStrong`, `accentWash` and `dangerSurface` from design.md, updating each token's comment where it quotes a measurement; verify `pnpm --filter @pinpoint/tokens test` passes
- [x] 1.2 Add `panelEdge` (light `#E3DEF0`, dark `#5E5680`) with a comment saying what it is for, regenerate the platform files, and verify `pnpm check:tokens` passes
- [x] 1.3 Add tests to `colour.test.ts` for the new styling requirement: dark `surface` lighter than every dark map area fill (land, block, water, park), dark `panelEdge` lighter than `surface` and every non-label dark map colour, light `panelEdge` equal to light `line`; verify they pass, and fail when `surface` is set back to `#1D192B`

## 2. Laptop

- [x] 2.1 Switch the border of the shared menu panel (including its phone-width sheet form), the place card/form panel, the search results list and the map note to `--pp-panel-edge`, leaving dividers inside them on `--pp-line`; verify `pnpm typecheck` and the web lint pass

## 3. Phone

- [x] 3.1 Switch the border of every bottom sheet (menu, filter, nearby, city, trip, people, attribution, handoff), the place card and the overlay note to `panelEdge`; verify `pnpm typecheck:mobile` passes
- [x] 3.2 Change the place form's fill from `ground` to `surface` and its border to `panelEdge`; verify `pnpm typecheck:mobile` passes

## 4. Docs

- [x] 4.1 Update the dark values listed in `DESIGN.md` and add `panelEdge` there; verify no old dark value from design.md's table remains with `grep`

## 5. Look at the running apps

- [x] 5.1 Laptop, dark: open a trip and check the trip, city, filter and account menus, search results, place card, place form and the "no places match" note each stand apart from the map with a visible outline; check light mode looks as before
- [x] 5.2 Laptop, dark: check the calendar, settings and sign-in screens — cards lighter, selected rows, fields and error messages still readable
- [x] 5.3 Phone, dark: open every sheet over the map, the place card and the place form, and check each stands apart with an outline; check the calendar and settings; check light mode looks as before
- [x] 5.4 Run `pnpm verify` and `openspec validate dark-panels-over-map --strict`; both pass
