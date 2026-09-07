## Context

See `proposal.md` — Why.

Three constraints shape the approach, all of them already in the repository:

- **`packages/tokens` declares no third-party dependencies** and holds values, not code.
  `MARKER_SIZE` and `MARKER_ANCHOR` live in `src/layout.ts`, which is the precedent this
  change follows.
- **The icon scripts run on bare `node`** and cannot load TypeScript. That is why
  `check-icons.mjs` reads `colour.ts` with a regex rather than importing it.
- **`apps/web/app/icon.svg` is a Next file-convention route.** It is served as a static
  asset and can import nothing. Whatever it holds, it holds literally.

## Goals / Non-Goals

**Goals:**

- One definition of the path, consumed by both applications and by the tooling.
- `icon.svg` covered by the same regenerate-and-diff check as the rasters, so its
  colours stop being unchecked.
- The check gets smaller, not larger.

**Non-Goals:**

- Changing how any icon looks. If a pixel moves, that is a defect to investigate, not an
  improvement to accept.
- Moving the colours out of `colour.ts` or changing the token derivation.
- Promoting anything else out of the applications. This is the path, because the path is
  what is duplicated.
- Making `@pinpoint/map` the home. See below.

## Decisions

### The path lives in `packages/tokens/src/layout.ts`, not `@pinpoint/map`

`#92` proposes `@pinpoint/map` on the grounds that it "already carries the anchor". It
does not: `MARKER_ANCHOR` and `MARKER_SIZE` are *defined* in `@pinpoint/tokens/layout.ts`
and `markerView()` relays them into the marker description. The box the path is drawn in
is a token, so the path belongs beside it.

*Why it matters rather than being bookkeeping.* `@pinpoint/map` is where map *behaviour*
lives — camera derivation, marker geometry as data, style references. The path is not
behaviour; it is a value with no logic attached, and it is meaningless without the 32x42
box that is already a token. Splitting the two across packages would put a shape in one
place and its coordinate system in another.

### `icon.svg` is emitted by the generator, with its content unchanged

`build-icons.mjs` gains the SVG. It is text, so this is a template rather than a
rasteriser, and the existing check compares it as content like everything else.

*Why not leave it hand-written and add a colour assertion.* That was the cheaper option
and it is what `the-product-draws-one-mark` chose. It leaves the transform, the corner
radius and the `viewBox` unasserted, so the next hole is the same shape as this one. A
generated file has no unasserted parts.

*The thing to be careful about.* The committed `icon.svg` carries a long explanatory
comment, and that comment is worth keeping — it is where the reasoning about knockouts,
literals and one-asset-for-both-themes is written down. The generator emits it. If the
emitted file differs from the committed one by anything other than whitespace, stop and
find out why before accepting it.

### The scripts read the path from `layout.ts` by regex, as they already read `colour.ts`

The generator cannot import TypeScript. Rather than introduce a build step or a second
generated artefact for one string, it reads the constant the same way the colours are
already read, and fails loudly on an unreadable match rather than silently passing a
comparison it never made — the behaviour that is already tested.

*Alternative considered — emit the path into `src/generated/`.* The tokens package
already generates `native.ts` and `tokens.css`, so a JSON artefact would fit the pattern.
Rejected for now: it adds a generated file, a generation step and a staleness question,
for one string that one script reads. Revisit if a second script needs it.

### The check keeps a copy-detector, pointed the other way

Today it asserts three literals are equal. After this there is one literal, so the useful
assertion inverts: **no file outside `layout.ts` may contain the path**. That catches the
regression this change is about — somebody pasting the string back into a component —
which an equality check over a list of known copies cannot, because a fourth copy is not
on the list.

## Risks / Trade-offs

- **The emitted `icon.svg` differs from the committed one and it goes unnoticed** → Diff
  it explicitly as a task, before the generator is allowed to write it, exactly as the
  rasteriser was proved against the four committed web assets.
- **A regex over `layout.ts` breaks on a reformat** → Fails loudly and names the constant
  as unreadable; the same behaviour as the colour lookup, and tested the same way.
- **The path becomes a token and someone reads that as licence to share markup** → The
  amended requirement says what a path is and is not, and `styling` is unchanged.
- **Rebase pain** → This is stacked on `#98`. Merge that first; nothing here is urgent.
- **`pnpm check:cycles`** → No new edge. Both applications already depend on
  `@pinpoint/tokens`.

## Migration Plan

None. No data, no schema, no asset appearance change, nothing deployed differently. The
change is a move and a template.
