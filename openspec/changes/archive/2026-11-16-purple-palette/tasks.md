## 1. Settle the colours in the mock

- [x] 1.1 Extend `mock/directions-mock.html` (Purple highlight only, light and dark) with the calendar, the laptop layout, an error state, and a form showing the "something changed" notice; verify by opening the file and seeing all four in both modes
- [x] 1.2 Add a worst-case map screen to the mock: all eight pin types crowded on the land, on a park and on water, a selected pin with its halo, and a very long place name; verify every pin is told apart at a glance in both modes
- [x] 1.3 Darken the light gold until it clears 3:1 on the light land, and nudge the control edge so it clears 3:1 on a field with margin; verify with computed ratios written into the mock beside the swatches
- [x] 1.4 Measure the gold's hue distance from `food` and `nature` in CIE LCh, both modes; move it toward yellow if under 40° and re-run 1.3; verify the figures are written into the mock
- [x] 1.5 Compute every text pairing (4.5:1), control edge (3:1) and pin on land (3:1) for the final values, and the dark basemap's L* distances from the land (floor about 4.5); verify a table in the mock shows no failing row
- [x] 1.6 Show the mock to the user and get approval of the final values before editing any token; verified by their yes

## 2. Tokens

- [x] 2.1 Replace the values in `COLOUR`, `BASEMAP_COLOUR` and `MARKER_TYPE_COLOURS.shopping` in `packages/tokens/src/colour.ts` with the approved ones, set `MARK_LAND` to the darker purple, and rewrite the comments that explain a value by amber or by warmth; verify `pnpm --filter @pinpoint/tokens test` passes
- [x] 2.2 Retint the light-mode shadow colours in `packages/tokens/src/elevation.ts` to the new ink; verify the alphas are unchanged in the diff
- [x] 2.3 Regenerate `src/generated/` and verify `pnpm check:tokens` passes
- [x] 2.4 Extend `packages/tokens/src/colour.test.ts` to assert the text floors for `ink`, `inkMuted`, `accentInk` and `inkOnAccent` on the surfaces they are drawn on, and 3:1 for every pin against the land, in both modes; verify the test fails on the old gold and passes on the new one

## 3. The mark, the icons and the globe

- [x] 3.1 Update `TILE`, `DROP` and `LAND` in `.github/scripts/icon-mark.mjs` and `icon-globe.mjs` and their comments, then recut with `node .github/scripts/build-icons.mjs`; verify `pnpm check:icons` passes and `apps/web/app/icon.svg` shows the purple tile
- [x] 3.2 Update the three background colours in `apps/mobile/app.json` (light ground, dark ground, icon tile); verify no old hex remains in the file
- [x] 3.3 Update `apps/mobile/lib/splash/land.test.ts` and any colour stated in `apps/mobile/lib/splash/scene.ts` to the new mark colours; verify `pnpm test` passes

## 4. Words that say amber

- [x] 4.1 Rewrite the code comments that explain a rule by saying "amber" or "not white on amber" (both apps' `ui`, auth, filter bar, trip bar, city bar, interest, marker form, states, workspace chrome, `packages/map/src/marker-type.test.ts`) so they are true of purple; verify `grep -rin amber apps packages .github/scripts` returns only deliberate history
- [x] 4.2 Rewrite `PRODUCT.md` Brand Commitments: accent purple with its two values, neutrals purple-tinted, eight type colours with Shopping gold; verify no sentence there names amber or a warm bias as current
- [x] 4.3 Rewrite `DESIGN.md` — frontmatter values, the overview's "Warmed Basemap" framing, Colors, the named rules (Amber Pair, Converged-Pair), The Mark — and regenerate or update `.impeccable/design.json` to match; verify every hex in the frontmatter equals the token source
- [x] 4.4 Add one line to the `accentInk`/`accent` gotcha in `AGENTS.md` and `CLAUDE.md` saying the pair no longer converges on the dark ground, keeping the lesson; verify both files carry the same text

## 5. Emails

- [x] 5.1 Replace the six colours in `supabase/templates/confirm-signup.html` and `reset-password.html` with the approved light values (ground, ink, muted ink, wash, accent edge, accent text); verify `grep -in "fbfaf8\|e39a2b\|8a5a0b\|fbf1df\|1a1917\|6e6a63" supabase/templates` returns nothing, and that opening each file in a browser shows a lilac ground with a purple code box
- [x] 5.2 Ask the user before touching the hosted project, then paste both templates into the Supabase dashboard (or have the user do it); verify in the dashboard's template preview that both show the new colours, and by a real email for whichever of the two is switched on at the time (sign-up confirmation is dormant in `supabase/config.toml`, and password reset waits on #229)

## 6. Look at the running apps

- [x] 6.1 Web, light and dark, at laptop and phone widths: map with pins, an open place, the filter bar with a filter on, the calendar, sign-in, an error state, the loading globe; verify each matches the approved mock and nothing is still beige or amber — accepted with gaps (2026-11-16): web sign-in and error states not seen; phone sign-in and the danger colours were.
- [x] 6.2 Web: hover and focus every control in the bar and in a form in both modes; verify no label vanishes on a fill and the focus ring is visible over a panel and over the map — accepted with gaps (2026-11-16): Clear on hover, the focus ring on a panel and the checkbox checked; not every control.
- [x] 6.3 Web and phone: view the bar with a filter on in greyscale, both modes; verify the narrowed tool stands apart from its neighbours
- [x] 6.4 Phone: build a fresh native binary with `pnpm --filter mobile exec expo prebuild` (never a bare `expo prebuild` at the root) and run it; verify the home-screen icon, the still launch image and the opening's first frame are the same purple, in light and dark
- [x] 6.5 Phone, light and dark: map, place sheet, capture form, calendar, filter sheet, following a route; verify each matches the mock and the selected pin's halo reads on land, park and water — accepted with gaps (2026-11-16): following a route not checked; everything else seen in both modes.
- [x] 6.6 Both apps: put a Shopping pin beside a Food pin and beside a selected control; verify gold is told from orange and neither reads as the highlight
- [x] 6.7 Both apps: trigger the form's "something changed" notice; verify it reads as a notice and not as a selected row, and record it in `findings.md` if it does not — accepted without a check (2026-11-16): needs a concurrent edit to trigger.

## 7. Close

- [x] 7.1 Run `grep -rin "amber\|warm" openspec/specs PRODUCT.md DESIGN.md supabase/templates`; verify every remaining hit is history, not a current rule
- [x] 7.2 Run `openspec validate purple-palette --strict` and `pnpm verify`; verify both pass
