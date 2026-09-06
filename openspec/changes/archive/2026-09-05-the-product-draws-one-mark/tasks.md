## 1. The rasteriser, proved against assets already known to be right

The four committed web assets are correct. Build the generator against them as an
oracle before it is allowed to overwrite anything.

- [x] 1.1 Write `.github/scripts/build-icons.mjs`: read the path literal and the two
      colour literals out of `apps/web/app/icon.svg`, flatten the two cubics and the arc
      to a polyline, fill even-odd by scanline with 4x supersampling at edges, deflate
      to PNG with `node:zlib`.
- [x] 1.2 Unit-test the flattener against values known analytically: the head circle's
      area within 0.5%, the path's bounding box at `x 3..29, y 2..41` in the 32x42 box,
      and the knocked-out head leaving a hole of radius 6 at (16, 15).
- [x] 1.3 Emit `apple-icon.png` at 180 and compare to the committed one, and the same
      for `icon-192`, `icon-512` and the three sizes inside `favicon.ico`. *Not to the
      pixel, as first written:* the four committed assets were cut at 41.1%, 41.7% and
      41.8% of their canvases, so there is no single fraction that reproduces all of
      them exactly. The criterion is the specification's own tolerance — two percentage
      points of the canvas — plus a mean per-channel difference under 3/255. Measured:
      every asset within 2px and a mean difference of 2.1/255.
- [x] 1.4 Only once 1.3 passes, let the generator write over those four files.

## 2. The mark, settled

- [x] 2.1 Emit `apps/mobile/assets/icon.png` at 1024: amber tile square to the edge,
      drop in `inkOnAccent` at 41% of the canvas width, bounding box centred on the
      canvas centre.
- [x] 2.2 Emit `apps/mobile/assets/adaptive-icon.png` at 1024: amber bleeding to every
      edge, drop at `0.41 x (72/108) x 1024` — about 280px wide — bounding box centred.
- [x] 2.3 Set `android.adaptiveIcon.backgroundColor` in `apps/mobile/app.json` to the
      accent's light value. *No comment:* `app.json` is strict JSON and Expo rejects one.
      The reasoning goes to `DESIGN.md` and the commit instead, and `check-icons.mjs`
      asserts the value against the token so it cannot drift silently.
- [x] 2.4 Assert in the generator's tests that every emitted drop lies inside its
      contract's safe region: the 80%-of-width circle for a manifest `maskable` icon,
      the middle 66 of 108 units for the Android adaptive layer.

## 3. The check that stops it recurring

- [x] 3.1 Write `.github/scripts/check-icons.mjs`: regenerate every asset in memory and
      compare decoded pixels — not file bytes — to what is committed.
- [x] 3.2 In the same script, assert the path literal in `apps/web/app/icon.svg`,
      `apps/web/app/_components/pin.tsx` and `apps/mobile/components/pin.tsx` are
      character-identical, naming the copies that disagree.
- [x] 3.3 Add `check:icons` to `package.json`, to the `verify` chain, and to the CI
      workflow. `AGENTS.md` requires all three; a check in only the workflow is how a
      PR ticks the checklist honestly and still fails.
- [x] 3.4 Break each of the three copies of the path in turn and confirm the check fails
      and says which. A check nobody has seen fail is not known to work.

## 4. Written down where the next change will read it

- [x] 4.1 Rename the 9px header dot to **the point** so "the mark" names only the
      teardrop tile — in `DESIGN.md`, in the `.mark` -> `.point` CSS class and its use in
      `workspace-chrome.tsx`, and in the mobile header's prose. Renaming it in the
      document alone would have left the code still calling it the mark.
- [x] 4.2 `DESIGN.md`: record the mark — the amber tile, the `inkOnAccent` drop, the
      three canvas contracts and the drop fraction each takes.
- [x] 4.3 `openspec/ROADMAP.md`, under Decided: the mark does not vary by platform, and
      the reason — the web assets and the native assets reach one home screen, so a
      platform-indexed rule contradicts itself on the surface it was written for.
- [x] 4.4 Record in the same entry that the dark tile was chosen against and why: it is
      the better drawing at launcher size and a speck at 16px, and `DESIGN.md`'s
      restraint thesis is scoped to screens with markers on them.

## 5. Looking at it

Budget for looking, not just for building — the standing lesson, and this change is
entirely about what things look like.

- [x] 5.1 `pnpm verify` green.
- [x] 5.2 Load the site and check the tab strip at 16px on both a light and a dark
      browser chrome. Both read as a solid amber block carrying a legible pin, and the
      `.ico` and `.svg` agree at 16 and 32. The four web rasters were re-emitted rather
      than left alone, so they were compared before and after: identical to the eye,
      mean difference 2.1/255.
- [x] 5.3 **Maintainer:** `expo prebuild --clean`, then an iOS build. Look at the home
      screen icon in both light and dark appearance.
- [x] 5.4 **Maintainer:** an Android build. Look at the launcher icon under a round mask
      and a squircle mask, which is where the crop would show.
- [x] 5.5 **Maintainer:** install the site to the Android home screen beside the
      application. Both tiles amber, both drops reading at the same size — this is the
      case the whole change is written for, and the only one that tests it.
- [x] 5.6 Put the browser tab, the iOS icon and the Android icon side by side and
      confirm they read as one product. Done at the asset level, compositing the Android
      background and foreground and masking to a circle and a squircle: one polarity,
      one drop size, nothing clipped under either mask. The device check is 5.3-5.5.

## 6. Close out

- [x] 6.1 Update the checklist on `#94` and note the two corrections: the Android hole
      was never white, and the maskable drop always cleared its own safe zone.
- [x] 6.2 `openspec archive the-product-draws-one-mark`.
