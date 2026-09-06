## Why

The product draws itself two ways. Three web assets put a dark teardrop on an amber
tile; two mobile assets put an amber teardrop on a dark one. No specification covers
the mark at all, so the next surface will invent a third drawing and be no more wrong
than the two that exist.

The reason to close it now rather than at leisure: the two drawings already meet. A
person who installs the site to an Android home screen and the application beside it
gets an amber tile and a dark tile, side by side, as one product. That is not a
disagreement between platforms that a platform-shaped rule could settle — it is one
launcher, and it falsifies any rule indexed on platform before such a rule is written.

## What Changes

- **The mark is settled: one drawing, everywhere.** An amber tile, the teardrop in
  `inkOnAccent`, its head knocked through to the tile. That is what `icon.svg`,
  `apple-icon.png` and the two manifest icons already draw; the two mobile assets are
  re-cut to it. **BREAKING** for anyone with the application already installed — the
  home-screen icon inverts.

  The dark tile is the better drawing at launcher size and was a close second when the
  web mark was picked. It loses on the surface the mark cannot afford to lose on: at
  16px in a tab strip the amber tile is a solid block of the one colour that is not a
  place type, and the dark tile is a speck. `DESIGN.md`'s restraint thesis — saturated
  colour reserved for the pins — argues for the dark tile, and is scoped to *on
  screen*, where marker colour is the signal. A launcher has no markers to compete
  with, so the thesis does not reach it.

- **Scale stops being per-asset and starts being per canvas contract.** Three
  contracts already exist in the repository without being named: a canvas drawn as
  given, a canvas whose corners the host cuts, and a canvas the host crops to an
  arbitrary mask. The drop is sized as a fraction of *the region that survives the
  contract*, so every asset reads at one size however its host treats it.

- **`apps/mobile/assets/icon.png` and `adaptive-icon.png` are re-cut** at 1024, square
  to the edge, from the same path `pin.tsx` draws. The adaptive foreground's drop grows:
  it is 24.8% of the canvas today, which is 37% of the region an Android launcher
  actually shows, where every other asset reads at about 41%.

- **`adaptiveIcon.backgroundColor` stops being `#1A1917`.** That is `ink.light`, a text
  colour standing in as a ground — the shape `styling` already warns about, and the one
  its own recorded lesson says recurs. It becomes the accent, which is the token the
  drawing uses on the other three surfaces.

- **The assets stop being hand-cut.** A zero-dependency generator emits every raster
  asset from the path and the two colour literals, and `pnpm check:icons` joins the
  other `check:*` scripts in `verify`. The path is held three times by decision —
  `styling` forbids sharing rendered markup — so the check also asserts the three copies
  are identical. Hand-cutting is the mechanism that produced two drawings; leaving it in
  place would leave the defect free to recur.

- **The word "mark" stops naming two things.** `DESIGN.md` gives it to the 9px accent
  dot in the header; `#95` gives it to the teardrop tile. One is renamed.

### Verified and deliberately not changed

Written down because each looks like a defect and is not, and re-finding them costs
another afternoon:

- **The Android hole is not white.** Every pixel of `adaptive-icon.png` is `#E39A2B`
  at some alpha; the hole is `a=0` and composites to `adaptiveIcon.backgroundColor`.
  It renders dark, exactly as iOS does. The two mobile assets already agree with each
  other — there are two drawings, not three.
- **The web maskable icons clear their safe zone.** A manifest `maskable` icon's safe
  zone is a circle 80% of the image width, not Android's native 66-of-108dp. Measured
  against the correct figure, `icon-512.png`'s drop reaches 158px from centre against
  a 204.8px radius. `apple-icon.png`, `icon.svg` and `favicon.ico` are correct as
  drawn. No web asset is re-cut — though the four raster ones are re-emitted by the
  generator that now owns them, changing bytes and not appearance. See `design.md`.
- **`ios/` is gitignored Expo prebuild output.** A blank `App-Icon-1024x1024@1x.png`
  in a local checkout is stale detritus, not a committed asset.

## Capabilities

### New Capabilities

- `product-mark`: what the product's icon is, in what colours, and how large the drop
  is drawn on each canvas contract. Covers every asset a host may show as the product
  — favicon, apple touch icon, manifest icons, iOS app icon, Android adaptive icon —
  and the rule that a new one is cut to an existing contract rather than drawn fresh.

### Modified Capabilities

None. `styling` already requires a colour to be chosen against the surface it is drawn
on; this change applies that requirement to the icon assets rather than altering it.

## Impact

- `apps/mobile/assets/icon.png`, `apps/mobile/assets/adaptive-icon.png` — re-cut.
- `apps/mobile/app.json` — `android.adaptiveIcon.backgroundColor`.
- `.github/scripts/build-icons.mjs`, `check-icons.mjs` — new. `package.json` — a
  `check:icons` script, added to `verify` as `AGENTS.md` requires of any new CI step,
  and to `.github/workflows`.
- `apps/web/app/apple-icon.png`, `favicon.ico`, `apps/web/public/icon-192.png`,
  `icon-512.png` — re-emitted, byte changes only.
- `DESIGN.md` — the renaming, and the mark recorded where a designer will read it.
- `openspec/ROADMAP.md` — the decision, so the fourth surface does not re-open it.
- No application code, no package, no new dependency. `@pinpoint/map` and
  `@pinpoint/tokens` are unchanged; the mark carries `accent` and `inkOnAccent` as
  literals for the same reason `icon.svg` already does — an icon is fetched outside the
  document and inherits no custom properties.
- The native build is the maintainer's to run. `expo prebuild --clean` regenerates the
  gitignored `ios/` icons from `assets/icon.png`; nothing under `ios/` is edited here.
