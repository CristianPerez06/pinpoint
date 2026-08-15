## Why

Both applications are styled with whatever was needed to make the last feature work:
inline style objects on web, ad-hoc `StyleSheet` values on native, a cool grey palette
that nobody chose, and system fonts. `@pinpoint/tokens` holds nine colours and two
scales — enough to stop the literals being duplicated, not enough to describe how the
product looks. There is one theme, and it is the light one by default rather than by
decision.

That was the right trade while the question was whether the map could render at all.
It stops being the right trade now, because both remaining roadmap items are interface.
Interest and filters adds per-member marks and the Both / Either / Only one / Nobody
yet control; the mobile reader adds a second client's worth of screens to a phone that
currently shows one map and one sheet. Building either on an undesigned surface means
designing under pressure and retrofitting afterwards.

A visual direction has been settled and reviewed:
<https://claude.ai/code/artifact/924d46b4-0941-478c-b5f2-3a853893248f>. This change
establishes it in the shared packages and applies it to the surfaces that already
exist. It deliberately moves nothing on screen — the layout change is a separate
change that depends on this one.

## What Changes

- **Tokens gain a theme dimension.** Every colour becomes a light/dark pair. The
  palette moves from cool grey to warm neutral, and a single amber accent is
  introduced for primary actions, selection, and focus.
- **BREAKING: the five marker family colours become pairs.** The existing literals
  were chosen against white and several are close to unreadable on a dark ground —
  `sleep` at `#0B5FD0` on `#1D1B18` most of all. Any consumer reading
  `MARKER_FAMILY_COLOURS.see` as a string breaks. The *relationship* is preserved in
  both sets: `see` stays the most recessive value and the other four stay prominent,
  because that lopsidedness is a product decision rather than a palette.
- **Typography becomes a token.** Figtree ships on both platforms, with a shared type
  scale — size, weight, letter-spacing, and which roles use tabular numerals.
- **The basemap is patched rather than referenced.** `@pinpoint/map` gains a pure
  function from OpenFreeMap's positron style document to a themed one: land warmed to
  share the interface's ground in light, and a dark variant, since OpenFreeMap
  publishes no dark style. The style reference stops being a bare URL.
- **The map follows the interface theme.** A dark interface over a light basemap reads
  as a defect rather than a theme.
- **Pins change shape and anchor.** A teardrop anchored at its point rather than a
  disc centred on the coordinate, removing the ambiguity about which part of the pin
  is the position.
- **BREAKING: marker types stop carrying a renderable glyph.** `MARKER_TYPES[].icon`
  becomes an icon *identifier*; each application maps it to a monochrome line icon
  drawn in the foreground colour. Emoji carry their own colour, which competes with
  the family colour that the palette exists to communicate — and a package that
  declares no dependencies cannot hold an icon component.
- The existing surfaces on both platforms are restyled to consume all of the above.
  No screen gains, loses, or relocates a control.

## Capabilities

### New Capabilities

None. The visual language is what the `styling` capability already covers; this change
gives it the requirements it has been missing.

### Modified Capabilities

- `styling`: adds theming as a first-class concern (every colour token is a
  light/dark pair, resolved per platform without host-side resolution), adds
  typography to the set of shared tokens, and requires that a theme pair preserve the
  relationships the palette encodes rather than only its contrast. Also replaces the
  `TBD - created by archiving` purpose, which is an open loose end on the roadmap.
- `map-rendering`: the style reference becomes a derived document rather than a URL,
  with a stated failure mode when the upstream document no longer carries the layers
  the patch expects; the map's theme follows the interface's; the shared visual
  description returns family and icon *identifiers* for the application to resolve,
  rather than resolved colour and glyph values; and a marker's drawn form declares
  which point of it sits on the coordinate.
- `markers`: a marker type carries an icon identifier rather than a renderable glyph.
  Family still determines colour and type still determines icon — what changes is that
  neither is a literal the shared package hands over ready to draw.

## Impact

**Packages**

- `@pinpoint/tokens` — restructured around themes; gains typography. Still no runtime
  dependencies.
- `@pinpoint/map` — gains the style patcher and the new pin geometry; `marker-type.ts`
  loses its emoji. Still declares no dependencies, which is what the patcher being a
  pure data transform over a fetched document protects.
- `@pinpoint/core` — reads type identifiers from `@pinpoint/map`; unaffected unless the
  identifier list changes, which it does not.

**Applications**

- `apps/web` — needs a styling mechanism that carries two themes, hover and focus
  states; inline style objects do not. Adds `next/font` and an icon set.
- `apps/mobile` — adds `expo-font` and an icon set; restyles its map, detail sheet, and
  login.

**Dependencies** — all free, no signup, no key, consistent with the $0 constraint:
Figtree (SIL Open Font License, self-hosted, ~20 KB for the full weight axis at the
latin subset) and an MIT-licensed icon set with both a web and a React Native build.

**Not in scope** — the list rail, the mobile bottom sheet, and any layout change; the
design of the interest filter control. The first two follow in `rebuild-the-workspace`;
the third belongs to the interest and filters change, which is the next roadmap item.
