## 1. The shared description

- [x] 1.1 In `packages/tokens/src/layout.ts`, add `MARKER_SELECTED_SCALE = 1.2` beside
      `MARKER_SIZE` and `MARKER_ANCHOR`, with a comment saying it is the laptop's existing
      value kept rather than re-derived. Export it from `packages/tokens/src/index.ts`.
- [x] 1.2 In `packages/map/src/marker-view.ts`, remove `VISITED_OPACITY` and the `opacity`
      field of `MarkerView`; add `form: MarkerForm` where `MarkerForm = 'solid' | 'hollow'`,
      set to `'hollow'` when the marker is visited. Keep `visited`, and say in the comment
      why both exist — one is the fact, the other is how it is drawn.
- [x] 1.3 Re-export `MarkerForm` from `packages/map/src/index.ts`.
- [x] 1.4 Update `packages/map/src/marker-view.test.ts`: replace the opacity assertions
      with form assertions, and add one that an unvisited marker is `'solid'`.
- [x] 1.5 `pnpm --filter @pinpoint/map test` and `pnpm --filter @pinpoint/tokens test`.

## 2. The laptop

- [x] 2.1 In `apps/web/app/_components/pin.tsx`, drop the `opacity: view.opacity` style and
      set `data-form={view.form}`.
- [x] 2.2 In `pin.module.css`, replace the opacity treatment with the hollow form:
      `.pin[data-form='hollow'] .drop` fills with `--pp-surface` and strokes `--family` at
      3px; `.pin[data-form='hollow'] .glyph` strokes `--family`. Leave the tick alone.
- [x] 2.3 Drive `.pin[data-selected]`'s `scale(1.2)` from `MARKER_SELECTED_SCALE` rather
      than the literal, so the two platforms cannot drift.
- [x] 2.4 Check the drop shadow still follows the outline on a hollow pin, and that the
      selection ring still paints outside the 32×42 box.

## 3. The phone

- [x] 3.1 In `apps/mobile/components/pin.tsx`, drop `opacity: view.opacity` and draw the
      hollow form: `fill` becomes `theme.colour.surface`, `stroke` the family colour at 3,
      and the glyph takes the family colour instead of `theme.markerForeground`.
- [x] 3.2 Grow the selected pin by `MARKER_SELECTED_SCALE`: draw the `Svg` and the wrapping
      `View` at the scaled width and height. Keep the explicit size — the iOS annotation
      derives its frame from it and bails out on a zero dimension.
- [x] 3.3 Scale the glyph's position with it, so it stays on the teardrop's head rather
      than drifting toward the box's centre.
- [x] 3.4 In `apps/mobile/components/trip-map.tsx`, render the selected group last so it
      draws above its neighbours, following the ordering the revealed and draft pins
      already use. Do not add a z-index.
- [x] 3.5 `pnpm --filter mobile typecheck`.

## 4. Look at it

- [x] 4.1 On the laptop, on a trip with visited and unvisited places of a quiet family
      (`temple`, `place`) and a loud one (`food`): a visited pin is still identifiable as
      its type, and still reads as taken down beside an unvisited one.
- [x] 4.2 The same on the phone.
- [x] 4.3 Both applications, both themes.
- [x] 4.4 **A draft pin and a visited pin on screen at once** — the risk `design.md`
      names. Done on the laptop, where they read as plainly different objects: the draft
      is dashed, white and carries a plus, the visited pin a solid coloured outline and
      its type glyph. **Not done on the phone**, which indicates a position with a fixed
      sight rather than a draft pin, so the pair does not arise there in the same way;
      called out in the pull request rather than claimed.
- [x] 4.5 A selected pin in a tight cluster, on both applications: findable, above its
      neighbours, and not hiding them.
- [x] 4.6 A pin that is selected *and* visited, on both applications.
- [x] 4.7 Select a pin and zoom: it stays on its coordinate as it grows.
- [x] 4.8 The map in greyscale on both applications: visited is still distinguishable from
      unvisited without colour.

## 5. Finish

- [ ] 5.1 `openspec validate how-a-pin-shows-its-state --strict`.
- [ ] 5.2 `openspec archive how-a-pin-shows-its-state --yes`, then confirm the master
      `map-rendering` spec still holds every sentence of the visited requirement that was
      not deliberately replaced.
- [ ] 5.3 `pnpm verify` end to end, after archiving — it cannot pass before, because
      `check:unarchived` is its third step.
- [ ] 5.4 Close #143 with what the look found, quoting the greyscale figures from
      `design.md`.
