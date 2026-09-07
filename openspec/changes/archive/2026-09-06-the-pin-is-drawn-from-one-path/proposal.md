## Why

The teardrop is written out three times — `apps/web/app/_components/pin.tsx`,
`apps/mobile/components/pin.tsx`, and `apps/web/app/icon.svg`. `the-product-draws-one-mark`
added a check that the three agree, which is better than nothing and is not the same as
there being one of them. `#92` asks for the duplication removed rather than policed.

`#93` asks for a check that fails when `icon.svg` stops matching the pin **and the token
values it was cut from**. Only half of that is true today: the check compares the path
literal and never looks at the file's own colours. Set the tile in `icon.svg` to
`#00FF00` and `pnpm check:icons` exits 0. The favicon — the one asset that ticket names —
can go bright green and CI is happy.

Those are one change. `#92` names its own blocking question as *"does `icon.svg` stop
being a static file and become generated output?"*, and that is the same lever that
closes `#93`'s hole: a generated SVG carries the tokens' colours by construction, so the
gap disappears instead of needing a further assertion.

## What Changes

- **The path moves to `packages/tokens/src/layout.ts`**, beside `MARKER_SIZE`, and both
  `pin.tsx` files import it. Three references each, including web's `DraftPin`.

  The previous change asserted the opposite — that a shared path would be the shared
  rendered markup `styling` forbids — on the strength of a comment in `pin.tsx` rather
  than of the requirement. The requirement forbids sharing "styling code, class-name
  vocabulary, or component markup", and its target is a cross-platform styling *runtime*.
  A `d` attribute is a list of coordinates. The decisive evidence is one export away:
  `MARKER_SIZE = { width: 32, height: 42 }` — the box this very path is drawn in — is
  already a shared token, with recorded reasoning that both applications consume it
  rather than writing it "which is what let the previous defect survive being fixed on
  one platform". The path has the same failure mode.

- **`apps/web/app/icon.svg` becomes generated output**, emitted by `build-icons.mjs`
  alongside the six raster assets. `check:icons` then covers its colours, its transform
  and its corner radius rather than only its path literal.

- **`check-icons.mjs` gets smaller.** The three-copy comparison becomes reading one
  constant out of `layout.ts`, exactly as it already reads `colour.ts` for the two
  colours. What it loses in assertions it gains in there being less to assert.

- **`product-mark` is amended.** Its first requirement says the path "is already held
  once per application, which `styling` requires by forbidding shared rendered markup",
  and carries a scenario about copies disagreeing. Neither survives this change, so this
  is a specification amendment and not only a refactor.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-mark`: the mark is cut from one definition rather than from one of several
  copies held in agreement, and the generated set grows to include `icon.svg`.

## Impact

- `packages/tokens/src/layout.ts` — gains the path. No new dependency; the package still
  declares none.
- `apps/web/app/_components/pin.tsx`, `apps/mobile/components/pin.tsx` — import it,
  delete their local constants.
- `apps/web/app/icon.svg` — becomes generated. Its content should not change; if it does,
  that is a defect and not a nicer drawing.
- `.github/scripts/icon-assets.mjs`, `build-icons.mjs`, `check-icons.mjs` — the SVG joins
  the asset table, and the path is read from `layout.ts` rather than from `icon.svg`.
- `openspec/specs/product-mark/spec.md` — via the delta.
- No change to any icon's appearance, no change to the map, no change to `@pinpoint/map`.
  Both applications already depend on `@pinpoint/tokens`, so `pnpm check:cycles` gains no
  edge.
- **Stacked on `the-product-draws-one-mark` (`#98`).** Everything above edits files that
  change exists to create. It rebases onto `main` once that merges.
