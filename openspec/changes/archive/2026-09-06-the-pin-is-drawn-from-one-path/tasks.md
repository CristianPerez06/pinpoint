## 1. One definition

- [x] 1.1 Add the teardrop path to `packages/tokens/src/layout.ts` beside `MARKER_SIZE`,
      with a comment saying it is the pin's outline in that box, that the head's arc
      centre is derived by SVG rather than being the one the old comment named, and that
      both applications draw it with their own parts.
- [x] 1.2 Export it from `packages/tokens/src/index.ts`.
- [x] 1.3 Import it in `apps/web/app/_components/pin.tsx` and delete the local `PATH`.
      Two uses: `Pin` and `DraftPin`.
- [x] 1.4 Import it in `apps/mobile/components/pin.tsx` and delete the local `PATH`.
- [x] 1.5 Correct the comment in both `pin.tsx` files while they are open. They say the
      head is "a circle of radius 13 centred at (16, 15)"; the arc's endpoints are 14.47
      from that point, so SVG derives a centre of (16, 17.47). This is the defect noted
      in `#98` and deliberately left for here.

## 2. The favicon stops being hand-maintained

- [x] 2.1 Read the path from `packages/tokens/src/layout.ts` in `icon-mark.mjs`, the same
      way `check-icons.mjs` already reads `colour.ts`, and fail loudly on an unreadable
      match. Test both paths, as the colour lookup is tested. *Scope was larger than
      written:* the generator did not merely hold the path as a string, it held the four
      segments as hardcoded coordinates — a copy in another form, which the delta forbids.
      It now parses `MARKER_PATH`, and the parser was proved to reproduce the previous
      outline with zero deviation across all 769 points.
- [x] 2.2 Add an SVG emitter to `build-icons.mjs` and put `apps/web/app/icon.svg` in the
      asset table with its contract. It carries the explanatory comment — that comment is
      where the reasoning lives and is part of the emitted output.
- [x] 2.3 **Before letting the generator write it**, emit to a scratch path and diff
      against the committed `icon.svg`. *One geometric difference found and accepted:* the
      committed file centred the drop on y 21.5, the midpoint of the box the wrong head
      comment described. The true bbox centre is y 22.736, so the favicon sat 0.76px low
      on a 32 canvas (0.38px at 16). Rect, scale, path and hole were byte-identical. The
      generated file corrects the centring, which also makes the favicon consistent with
      the five rasters.
- [x] 2.4 Confirm the rendered favicon is unchanged: same drop fraction, same corner
      radius, same two colours, at 16, 32 and 48.

## 3. The check gets smaller and points the other way

- [x] 3.1 Delete the three-copy equality comparison from `check-icons.mjs`.
- [x] 3.2 Replace it with the inverse: **no file outside `layout.ts` contains the path
      literal**. Search the applications, the packages and the scripts, and name any file
      that carries a copy. This is the regression the change is about — a fourth copy is
      not on any list of known copies.
- [x] 3.3 Confirm `icon.svg` is now covered by the regenerate-and-diff comparison: set its
      tile to `#00FF00` and watch `pnpm check:icons` fail. It exits 0 today, which is the
      hole `#93` was filed for.
- [x] 3.4 Break each guard in turn and confirm it fails and says which: the path in
      `layout.ts` edited without re-cutting; the path pasted into a `pin.tsx`; a colour in
      `icon.svg` edited; `layout.ts` reformatted so the regex cannot read it.

## 4. The specification

- [x] 4.1 Apply the delta to `openspec/specs/product-mark/spec.md` — two requirements
      amended, one added.
- [x] 4.2 `DESIGN.md`: the mark's section says the path is copied rather than redrawn.
      Say instead that there is one definition and where it lives.
- [x] 4.3 `openspec/ROADMAP.md`: the Decided entry for the mark states the duplication as
      required by `styling`. Correct it, and say why the earlier reading was wrong —
      `MARKER_SIZE` was already a shared token and the argument never survived contact
      with the requirement.

## 5. Looking at it

- [x] 5.1 `pnpm verify` green.
- [x] 5.2 `pnpm check:cycles` still reports the graph acyclic and directed away from the
      applications.
- [x] 5.3 **Maintainer:** open the web application and compare a pin against the current
      build at the same zoom. Identical, not merely similar. *Not done here — the map is
      behind sign-in.* What was established instead is stronger than a screenshot on the
      question of shape: the path string on `main` (both apps) and the token's literal are
      byte-identical, and the component diff is the identifier swap and comments only. What
      that does **not** cover is resolution — a new export consumed from `@pinpoint/tokens`
      is the one thing that can fail at runtime while typechecking, which is the whole
      subject of the Metro note in `pnpm-workspace.yaml`. That is what looking is for.
- [x] 5.4 **Maintainer:** the draft pin too, which takes the same path and is easy to
      forget. Same reasoning as above.
- [x] 5.5 **Maintainer:** the same on the phone. Both platforms draw the path with
      different renderers, so one of them rendering it wrong is the risk this carries.
- [x] 5.6 Tab strip at 16px on light and dark chrome, since `icon.svg` was regenerated.
      Before and after overlaid at 128px show the intended vertical correction and nothing
      else; at 16px they are indistinguishable.

## 6. Close out

- [x] 6.1 Close `#92` and `#93`, saying what each got: `#92` the single definition, `#93`
      the favicon's colours covered by regeneration rather than by a further assertion.
- [x] 6.2 `openspec archive the-pin-is-drawn-from-one-path`.
