## Why

Since #214 the product's sentences are handed around under names, and a name is resolved
into words at the moment something is drawn. Forget to resolve one and it is not blank and
it is not an error — the screen reads **`[object Object]`**. Two of those shipped, both in
the phone's screen-reader labels, and both were found by somebody reading the code rather
than by anything in the build.

Nothing catches this today. The change that puts the product into Spanish (#45) moves
several hundred more sentences through exactly these paths, including every label a
screen reader announces, which is where looking at the app finds nothing. The cost of
turning the guard on rises with every sentence added; it is cheapest now, and right now
there is nothing to fix.

## What Changes

- **The build refuses a message used as if it were words.** A named sentence dropped
  straight into text is a build failure naming the file and the line, instead of a screen
  that reads `[object Object]`.

- **The eight shared packages get checked at all.** They have no linting today — no
  configuration, no step in CI, nothing. They are also where these named sentences are
  made and passed around, so they are the likeliest place to join one into text by
  accident. This change gives them a check and puts it in CI beside the two applications'.

- **Nothing to fix, and nothing to see.** The rule was run across both applications and
  all eight packages before this was written: it reports no violations anywhere. The two
  defects from #214 were already repaired and no third one is hiding. **Nobody using
  either application sees any difference** — this change installs a guard on a floor that
  is already clean, and proves it works by breaking the build on purpose once.

- **The same mistake written a second way is covered too.** Joining a sentence on with
  `+` rather than placing it into text produces the identical `[object Object]`, and is
  caught by a companion rule. It is equally clean today and costs nothing to turn on
  alongside.

The check needs the build to understand the *types* of things, which neither application
asked of it before. That is the real work here; the rules themselves are a few lines.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `product-wording`: a new requirement beside *A name with no sentence, or a sentence
  nothing uses, fails the build*. That existing check reads the repository as text and
  answers whether a name resolves; it deliberately cannot answer whether a particular
  value is words yet at the point it is drawn, which is a question about types. This is
  the other half: a named sentence used where words belong, without being resolved, fails
  the build.
- `monorepo-structure`: the requirement *Automated checks gate every change* lists what
  CI verifies, and says "linting and typechecking for each application". The shared
  packages are absent from that sentence and are consequently linted by nothing. They come
  under it.

## Impact

- `apps/web`, `apps/mobile` — each gains type-aware checking in its lint configuration,
  plus the two rules. No source file changes.
- **New** shared lint configuration for `packages/` — the eight shared packages need no
  framework rules, only these, so one configuration serves all of them.
- `packages/tokens` — one build script sits outside any TypeScript project and has to be
  included in one, or the check cannot read the file.
- `pnpm verify` and the CI workflow — a step for the packages, added in both, as the
  repository's own rule about new checks requires.

Not in this change: any other lint rule for the shared packages beyond these two, Spanish,
and the English still written directly in the two applications' own components. Those
belong to #45.
