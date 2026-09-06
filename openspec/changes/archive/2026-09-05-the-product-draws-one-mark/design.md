## Context

See `proposal.md` — Why. What matters here is how the assets are produced.

The five raster assets in the repository were cut by hand with a tool that is not in
it. There is no script, no source file other than `icon.svg`, and no check. That is the
whole mechanism by which two drawings appeared: the web assets were cut in one sitting
and the mobile ones in another, and nothing could have reported the disagreement.

The teardrop's path exists three times already — `apps/web/app/_components/pin.tsx`,
`apps/mobile/components/pin.tsx`, and `apps/web/app/icon.svg`. The first two are
duplicated on purpose: `styling` forbids sharing rendered markup between the platforms,
and an SVG path in a shared package is exactly that. So the constraint is not "hold the
path once" — that is ruled out — but "hold it many times and prove they agree".

No rasteriser is available. `sharp` is disabled in `pnpm-workspace.yaml` by a recorded
decision, and `rsvg-convert`, ImageMagick and Inkscape are all absent from the machine.
The `$0` constraint and the repository's zero-dependency habit both point away from
adding one.

## Goals / Non-Goals

**Goals:**

- The raster assets become derived artefacts with a checked-in generator, so the next
  surface is cut rather than drawn.
- The path's copies are verified equal by CI, turning a sanctioned duplication into a
  checked one.
- The generator runs with nothing installed beyond Node.

**Non-Goals:**

- Sharing the path from a package. `styling` forbids it and this change does not reopen
  that.
- A general SVG rasteriser. The generator renders one known shape, not arbitrary
  documents.
- Byte-reproducible output across Node versions. The check compares decoded pixels.
- Changing the pin on the map. The mark follows the pin; nothing flows the other way.

## Decisions

### The generator is a zero-dependency Node script that rasterises the shape itself

`.github/scripts/build-icons.mjs` emits every raster asset from the path literal and the
two colour literals. It flattens the two cubics and the arc to a polyline, fills by
even-odd scanline with 4x supersampling at the edges, and deflates the result into a PNG
with `node:zlib`. An ICO is a container of three PNGs behind a 22-byte header.

*Why not add a rasteriser.* `sharp` is off by a recorded decision, and the alternatives
are system packages a fresh checkout would not have. A hard dependency for two files is
the wrong trade, and a soft one that silently skips is worse than none.

*Why not keep cutting by hand.* Hand-cutting is the mechanism that produced the defect.
A change whose purpose is to stop the assets drifting cannot leave the drift mechanism
in place.

*Alternative considered — headless Chrome via Playwright.* Correct output, and the
project has no browser automation today. It would be the largest dependency in the
repository, added for two PNGs.

*Cost, stated plainly.* This is the bulk of the work: roughly 150 lines that have to be
right about arc parameterisation and fill rule. It is testable, which is the mitigation
— the shape's area and bounding box are known analytically and can be asserted.

### The generator owns all five raster assets, not only the two that are wrong

`apple-icon.png`, `icon-192.png`, `icon-512.png` and `favicon.ico` are re-emitted even
though they are visually correct. They change bytes and do not change appearance. This
supersedes the proposal's narrower reading that no web asset is touched: no web asset is
*re-cut*, but all of them are re-emitted by the generator that now owns them.

*Why.* Two production methods for one mark is the state this change exists to end. If
the web assets stay hand-cut, half the family is still unowned and the check can only
speak for the other half.

*Trade-off.* It widens the diff and puts correct assets at risk of a regression from a
new rasteriser. Mitigated by the reference test below: the committed originals are the
oracle the generator is measured against before it replaces them.

### `icon.svg` stays hand-written and becomes an input

The favicon is text, it is the one asset a host renders itself, and it is already
correct. The generator reads its path literal rather than owning it, and `check:icons`
asserts that literal equals the two `pin.tsx` copies.

### The drop's size is stated per contract, and the Android figure follows from it

The specification fixes the drop at 41% of the region the host renders. An Android
launcher renders the middle 72 of a 108-unit adaptive layer, so on a 1024 canvas the
drop is `0.41 x (72/108) x 1024` — about 280px, against 254px today. The web `maskable`
icons are rendered essentially whole under their mask and stay at 41% of the file.

*Why this is stated against the rendered region.* It is the only formulation under which
two hosts that crop differently produce icons that look the same size, and it is
measurable rather than judged.

### The issue's second concern is recorded rather than acted on

The issue asks whether the adaptive foreground's drop survives the launcher's crop. It
does, with room. So does the web maskable drop, once measured against the 80%-of-width
circle its own specification names rather than against Android's 66-of-108. Both
measurements are in `proposal.md` so the question is not re-opened.

## Risks / Trade-offs

- **A hand-rolled rasteriser draws the shape subtly wrong** → Before the generator
  replaces anything, assert its output against the four committed web assets: same
  bounding box to the pixel, same colour histogram within an anti-aliasing tolerance.
  The existing assets are correct, so they are a free oracle. Only then overwrite them.
- **Anti-aliasing differs from the original tool and reads as a regression** → Expected,
  and stated in the commit. The check compares the generator to itself from then on, so
  it happens once.
- **The icon inverts for anyone with the app installed** → Unavoidable and intended; it
  is the change. The application is on two phones belonging to people who can be told.
- **`check:icons` fails on a machine whose Node deflates differently** → Compare decoded
  pixels, not file bytes. Two PNGs of one image may legitimately differ in compression.
- **The generator becomes a fourth copy of the path and drifts** → It holds no copy: it
  reads the literal out of `icon.svg`, and the check compares that literal to both
  `pin.tsx` files.
- **`expo prebuild` is not run and iOS keeps the old icon** → The maintainer runs the
  native build. The task list says so at the point it matters rather than at the end.

## Migration Plan

No data, no schema, no deploy sequencing. The web assets change bytes only; a browser
picks up new icons on its own schedule and nothing depends on the old ones. Mobile
requires `expo prebuild --clean` and a fresh development build, which the maintainer
runs.

Rollback is `git revert`. Nothing outside the repository holds state about the mark.
