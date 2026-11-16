## Context

See `proposal.md` for why. The direction, "Purple highlight", was picked from
`mock/directions-mock.html`, which shows one phone screen.

Every colour both apps draw comes from `packages/tokens/src/colour.ts` — three groups:
`COLOUR` (interface), `BASEMAP_COLOUR` (map) and `MARKER_TYPE_COLOURS` (pins), each value
a `{ light, dark }` pair, generated into `src/generated/`. So the change is mostly one
file. What is not in that file, and has to be found by hand:

- **Copies the icon scripts keep on purpose**: `TILE` and `DROP` in
  `.github/scripts/icon-mark.mjs`, `LAND` in `icon-globe.mjs`, and `MARK_LAND` in the
  tokens. `pnpm check:icons` compares them to the tokens.
- **Launch and icon backgrounds** in `apps/mobile/app.json` (`#FBFAF8`, `#171614`,
  `#E39A2B`), which only take effect in a new native build.
- **Shadow colours** in `packages/tokens/src/elevation.ts`, tinted with the warm ink.
- **Tests that state a value**: `apps/mobile/lib/splash/land.test.ts` (`#B8741A`).
- **The two email templates** in `supabase/templates/`, which write the beige ground,
  the ink, the muted ink and the amber wash, edge and text as lowercase hex in inline
  styles. An email cannot read a token, so these are copies by necessity, and nothing
  checks them. The hosted project does not read these files: `supabase/config.toml` says
  the body is pasted into the dashboard by hand as well.
- **Prose**: `PRODUCT.md`, `DESIGN.md` (frontmatter and body), `.impeccable/design.json`,
  the token file's own comments, and about twenty code comments that explain a rule by
  saying "amber".

The rules the new values have to pass already exist in `styling` and `map-rendering`:
text 4.5:1, a control's edge 3:1, a pin 3:1 against the land, dark-end separation judged
in CIE L*, hue distances judged in CIE LCh.

## Goals / Non-Goals

**Goals:**

- Every colour chosen twice, against its own ground, and passing the existing floors.
- One pull request in which the tokens, the icons, the specs and the brand documents all
  say purple.

**Non-Goals:**

- Renaming tokens. `accent`, `accentInk`, `accentWash` and the rest keep their names, so
  no component changes which token it reads.
- Any new token, mode or setting.

## Decisions

**1. Settle the values in a mock before touching the tokens.** Extend
`mock/directions-mock.html` to the calendar, the laptop layout, an error state and the
worst-case screens (a long place name, all eight pin types crowded together, a selected
pin on a park and on water), in both modes. The tokens are edited only once that mock has
been looked at and approved. A token edit repaints both apps at once and is slow to judge
on a simulator; a mock shows every case side by side.

**2. Start from the mock's values, and treat them as unverified.** Measured against the
floors, the starting values pass with one exception:

| Pair | Light | Dark |
| --- | --- | --- |
| Text on a filled button | 5.84 | 6.89 |
| Purple text on a panel / on the selected-row wash | 7.84 / 6.52 | 8.16 / 6.77 |
| Secondary text on a panel / on a field | 6.09 / 5.20 | 6.56 / 5.68 |
| A control's edge on panel / ground / field | 3.60 / 3.30 / 3.07 | 3.82 / 4.22 / 3.31 |
| **Gold pin on the land** | **2.88 — fails 3:1** | 9.30 |

So the light gold `#B8860B` must go darker before it ships. The control edge on a field
(3.07) passes with no margin and should be nudged too.

**3. The gold is placed by measurement, in CIE LCh.** It has to sit clear of `food`
(hue 44°) on one side and `nature` on the other. The palette's accepted minimum between
neighbours is the 46°–49° already recorded for `culture` and for `nature`/`transport`.
Gold near 80° is about 36° from `food`, under that precedent, although it was judged
distinguishable by eye in the mock. Measure it; if it is under 40°, move it toward yellow
until it is not, then re-check 3:1 on the light land. The white glyph on gold (3.25:1) is
the thinnest glyph pairing and is checked on a rendered pin.

**4. Text on the accent becomes opposite on the two grounds.** Amber was a light fill in
both modes, so its lettering was dark in both. Purple is a dark fill in light mode and a
light fill in dark mode: `inkOnAccent` becomes white in light and near-black in dark. No
component changes, because they already read the token. The comments that say "not white
on amber" become wrong and are rewritten.

**5. `accentInk` and `accent` stop being the same value in dark mode.** They converged on
amber. In purple the readable text value is lighter than the fill, so they differ on both
grounds. The existing rule (a state that fills with the accent also sets its lettering)
stays in force; the gotcha in `AGENTS.md`/`CLAUDE.md` is kept as history with one line
saying the pair no longer converges.

**6. The mark takes the light pair, as now.** Tile = `accent.light`, drop =
`inkOnAccent.light` (white), on both grounds. `MARK_LAND` becomes a darker shade of that
same purple. Check the purple tile against the dark ground and against a dark home-screen
wallpaper: amber was light on everything, and this purple is mid-dark.

**7. Colours that used amber to mean something keep using the accent.** The "something
changed while this form was open" notice is amber-washed today as a not-an-error signal.
It becomes purple-washed. It is checked by eye in the looking tasks, since purple reads
less like "look at this" than amber did; if it reads as merely selected, that goes to
`findings.md` rather than growing a new colour here.

**8. Shadows and the scrim lose their warm tint with the neutrals.** The light-mode
shadow colour is the warm ink with alpha; it takes the new ink.

**9. The emails take the light values, and only the light ones.** An email is drawn on
whatever its reader's mail program gives it and cannot follow the app's mode, so the
templates use the light ground, ink, muted ink, `accentWash`, `accent` (the code box's
edge) and `accentInk` (the code). The repository's files are edited, and then both are
pasted into the hosted project's dashboard by the user or with their go-ahead — that is
a change to a live service, so it is not done silently as part of applying.

## Risks / Trade-offs

- [Purple-tinted land makes the violet-adjacent pins (`culture` rose, `stay` blue) sit
  closer to their ground] → the worst-case mock screen puts all eight on the land, the
  park and the water in both modes; `styling` already requires this be judged rendered.
- [Blue water against the `stay` and `transport` pins, green parks against `nature`] →
  keep basemap fills at low chroma (the Area Rule in `DESIGN.md`); same mock screen.
- [The filter's "narrowed" signal must read in greyscale (`marker-filtering`)] → purple
  is darker than amber, so its lightness against the bar changes; view the bar in
  greyscale in both modes on both apps.
- [The email files are updated and the hosted copies are not, so real emails stay amber
  while the repository says purple] → a task checks the dashboard's own preview, and a real email where one is being sent; sign-up confirmation is dormant and password reset waits on #229, so today a preview may be the only proof.
- [A stale word "amber" left in a spec or brand document] → final grep task.
- [The icon change is not visible until a native rebuild] → task says so; a JavaScript
  reload proving nothing here is the known trap.
