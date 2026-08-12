## Context

See `proposal.md` — Why. The reviewed direction is
<https://claude.ai/code/artifact/924d46b4-0941-478c-b5f2-3a853893248f>; where prose
here and that page disagree about a value, the page is what was agreed.

Three pieces of the current state shape everything below.

`@pinpoint/tokens` is consumed directly as TypeScript by both applications. There is
no derivation step, so the `styling` spec's requirement that platform representations
be *derived* from a neutral definition is satisfied only because there is exactly one
representation. Adding a second — web wants custom properties, native cannot have them
— is what makes the derivation real for the first time.

`@pinpoint/map` declares no third-party runtime dependencies — only `@pinpoint/tokens`
— and both new pieces of work land in it. That constraint is what decides their shape:
a style transformation can live there only as a pure function over a document somebody
else fetched, and an icon cannot live there at all.

The web application has no styling system. Five components carry roughly forty lines
of inline style each, factored into `app/_components/ui.tsx` with a comment saying
inventing one is a different change. This is that change.

## Goals / Non-Goals

**Goals:**

- One authoritative token definition covering both themes, with genuinely derived
  platform representations and a check that the derived files are current.
- A web styling mechanism that carries two themes, hover and focus states, without
  adopting a styling toolchain the `styling` spec would reject.
- A basemap transformation that survives the upstream document being edited by
  somebody else, and fails in a way that names what broke.
- Both applications restyled with no change to what any screen does.

**Non-Goals:**

- **No explicit theme control.** The theme follows the device. A toggle needs a
  settings surface that does not exist, and the spec permits either.
- **No animation system.** Transitions are per-component CSS; motion tokens can wait
  until something needs to share one.
- **No change to which markers exist, what they store, or what any control does.**
  Layout is `rebuild-the-workspace`.

## Decisions

### Tokens: one TypeScript definition, two derived representations

The authoritative definition stays TypeScript in `packages/tokens/src/`, restructured
so each colour is a `{ light, dark }` pair. Two representations are derived from it by
a script:

- **Native** — a generated TypeScript module holding both themes as literals. Native
  gets literals or it gets nothing, which is what the existing literal requirement is
  about.
- **Web** — a generated stylesheet declaring both themes as custom properties, under
  `:root` and a `prefers-color-scheme` block. Web components reference the properties
  and never import a colour.

Alternatives considered. *Consume the TypeScript directly on web too*, as today: this
keeps one representation but forces every themed colour through JavaScript, so a
theme change re-renders the tree rather than being handled by the cascade. *Emit CSS
custom properties as the only representation and have native read them*: this is the
exact failure the spec names, and it is silent.

The generated files carry a header identifying them as generated, and CI regenerates
and diffs them. Without the diff, "derived" degrades to "was derived once".

### The active theme: the cascade on web, a hook on native

Web needs no JavaScript for colour. `prefers-color-scheme` selects the custom property
block, and components are theme-agnostic. Native has no cascade, so a `useTheme()` hook
reads React Native's `useColorScheme()` and returns one theme's literal set.

This is the styling spec working as intended: the same token values, each platform
applying them in its own idiom, and no shared styling runtime.

### Web styling: CSS Modules

Next.js supports CSS Modules with no configuration and no runtime. Class names are
scoped per component, the generated custom properties are just values, and hover and
focus states are ordinary CSS rather than event handlers reimplementing them.

Alternatives considered. *Tailwind*: a large vocabulary to adopt for one application's
non-map interface, and it would want its own theme configuration alongside the token
definition — two sources for one palette. *A CSS-in-JS library*: a runtime cost and a
styling toolchain the spec is explicitly wary of. *Keep inline style objects*: they
cannot express `:hover`, `:focus-visible`, or a media query, all of which this
direction needs.

### The basemap patch matches by category, not by layer id

`@pinpoint/map` exposes a pure `themeStyle(document, theme)`. The applications fetch
the upstream style document and pass it in; the package performs no I/O, so it stays
dependency-free and testable without a network.

The transformation classifies each layer — land, water, park, road casing, road fill,
building, label — from its existing paint properties and source layer, then rewrites
colours per category. It does **not** hold a list of layer ids to find.

This is the important call. An id list is simpler and breaks the first time upstream
renames `water_line` to `waterway`, and it breaks *quietly*, leaving one category
unthemed. Matching by category degrades differently: it either classifies a layer or
it does not, and the function asserts that every category it knows about matched at
least one layer, throwing with the empty category named. A rename usually still
classifies; a restructure fails loudly. The spec requires the loud failure and this is
how it is obtained.

### Fetching the style adds a round trip, and that is accepted

Today the style URL goes straight to MapLibre, which fetches it. Patching means the
application fetches it first, transforms it, and hands over a document. That adds a
request before the map can draw and creates a new failure mode — the style being
unreachable — which the spec now covers.

Alternatives considered. *Commit a patched document*: `style.ts` argues against
inlining because it pins the style at build time and loses upstream fixes, and that
reasoning still holds. *Patch after load via MapLibre's runtime setters*: doubles the
work across two renderer APIs with different method names, and the map visibly
repaints from the unthemed style to the themed one.

Mitigation is the cheap one: the document is small, cache-friendly, and fetched once
per session, and the map already has a loading state to sit in.

### Icons: a per-application mapping the type-checker completes

`MarkerTypeDefinition.icon` changes from an emoji `string` to a `MarkerIconName` union.
Each application holds a `Record<MarkerIconName, IconComponent>` built from its own
icon set — `lucide-react` on web, `lucide-react-native` on native. An exhaustive
`Record` makes a missing entry a type error, which is the automated check the spec
asks for; it costs nothing and runs on every build.

Both packages are MIT and tree-shake to the icons actually referenced.
`lucide-react-native` needs `react-native-svg`, which Expo ships.

### Pin anchoring is carried in the visual description

The shared description gains a normalised anchor — `{ x: 0.5, y: 1 }` for a teardrop —
plus its drawn size. Web passes it to MapLibre's `Marker` anchor option; native passes
it to the annotation's anchor. Neither application hard-codes an offset, which is what
kept the previous drift defect alive: the offset was in the app, so fixing one platform
left the other wrong.

### The typeface is bundled, and a check asserts it is

Figtree ships as a variable woff2 on web through `next/font/local`, and as a ttf on
native through `expo-font`. A repository script asserts both files exist and report the
same family and version.

The failure this prevents is the reason the check exists rather than being assumed: a
missing font file falls back to a system face silently, changing every measurement on
the screen while breaking no build and no type-check.

### The dark family colours

The five families become pairs. Light values are unchanged; dark values are chosen
against `#1D1B18` rather than derived from the light ones.

| Family  | Light     | Dark      |
| ------- | --------- | --------- |
| `see`   | `#7C8896` | `#98A3B0` |
| `eat`   | `#D2451E` | `#F0653A` |
| `buy`   | `#8A3FFC` | `#A97BFF` |
| `sleep` | `#0B5FD0` | `#4A8FE8` |
| `move`  | `#00857A` | `#16A99C` |

`sleep` is the one that forces the issue: `#0B5FD0` on a near-black ground is close to
invisible. The ranking is preserved — `see` stays the most recessive in both, which is
the relationship the spec now requires and the reason the palette is lopsided.

## Risks / Trade-offs

- **Upstream restructures the positron style** → category matching survives renames;
  the assertion that every category matched turns a restructure into a named failure
  instead of a half-themed map.
- **The style fetch fails or is slow** → a new failure mode, and precisely the symptom
  of a bug already fixed once from a different cause: correctly-placed pins over a
  blank canvas. Handled explicitly, and worth recognising by shape when it appears.
- **The font falls back silently** → the asset check above. Cheap, and the only thing
  that catches it short of measuring rendered pixels.
- **Two themes double what has to be looked at** → both themes get opened on both
  platforms before this is called done. The roadmap's standing lesson is that this
  class of defect type-checks, renders, and is wrong; three of them surfaced only by
  looking in each of the last two changes.
- **The warm land tint is judged against a drawn approximation, not real tiles** →
  it may need adjusting once it is over actual OpenStreetMap geometry. It is one
  constant in one function.
- **Restyling every surface in one change touches a lot of files at once** → the
  offsetting property is that behaviour is unchanged, so anything that stops working
  is a styling regression rather than a logic one, and the existing tests still bound
  it.

## Migration Plan

Both breaking changes are internal to this repository; every consumer is in-tree and
updated in the same change. There is no external contract and nothing is published.

1. Restructure the tokens and add the derivation script; regenerate.
2. Update `@pinpoint/map` — icon identifiers, anchor and geometry, `themeStyle`.
3. Update `@pinpoint/core` if the type-identifier list moved (it does not, but the
   import surface changes).
4. Restyle each application against the new tokens.

Rollback is a revert. No data is touched, no migration runs, and nothing stored
depends on any of it.

## Open Questions

- The exact dark values above may need adjusting once they are seen over real tiles
  rather than the drawn approximation. This changes constants, not the approach.
- Whether the map's label colours need a third value between land and ink to stay
  readable at low zoom in dark. Answerable by looking, and local to `themeStyle`.
