# One colour per place type

## Why

Sixteen place types resolve to five colours, and one of those five carries seven
of the sixteen — so a trip, which is mostly sightseeing, draws as a field of
identical slate pins. Telling a castle from a museum from a park is left entirely
to a 15px stroked glyph, and that glyph is the only channel carrying the
difference.

The obvious reading is that the palette is too small. It is not: `#89`
proposes spending the three colours left under the roughly-eight cap, and every
candidate spends them inside `see`, where the `styling` spec forbids them from
being loud. Two recessive colours cannot be told apart — hue reads weakly at low
chroma, lightness already means *visited*, and raising chroma is the thing that
is forbidden. The budget is not three colours. It is three colours *that may not
be seen*, which is no budget at all.

So this change goes the other way. Rather than finding more colours for a
taxonomy that outgrew the palette, it shrinks the taxonomy until every type has
its own colour. Sixteen types become seven, colour carries the whole distinction,
and the two-channel scheme — family for colour, type for icon — collapses into
one.

## What Changes

- **BREAKING** The `see`/`eat`/`buy`/`sleep`/`move` family channel is removed.
  `MarkerFamily`, `MARKER_FAMILIES` and `MarkerTypeDefinition.family` go, and
  `MarkerView` carries the type identifier where it carried a family. Colour is
  resolved from the type.
- **BREAKING** The sixteen types collapse into seven:

  | New type | Absorbs | Colour |
  | --- | --- | --- |
  | `place` | Place | **new neutral** — the fallback, and deliberately the least coloured pin on the map |
  | `culture` | Temple, Castle, Museum, Attraction | slate, unchanged value — inherits `see`'s recessive role |
  | `nature` | Park, Viewpoint | **new hue** — green |
  | `food` | Restaurant, Café, Bar, Street food | burnt orange, unchanged |
  | `shopping` | Shop, Market | violet, unchanged |
  | `stay` | Lodging | blue, unchanged |
  | `transport` | Station, Airport | teal, unchanged |

  Five of the seven keep a value that already exists, so most of a trip does not
  change colour. One hue is invented and one neutral is — not two hues, because
  there is no gap left on the wheel wide enough for a second one that does not
  crowd `food`, `shopping` or the amber accent. `design.md` argues why the seventh
  value is better spent on a null than on a colour.

  The recessive role moves with the majority. `see` was most recessive because it
  held eleven of the seeded Kyoto trip's fourteen markers; `culture` holds ten of
  those eleven, so it takes the slate and the rule that protects it is unchanged
  in substance. (`colour.ts` states this ratio as fourteen against four, which the
  seed migration does not bear out — worth correcting while the comment is being
  rewritten anyway.)

- The identifier `other` is renamed to `place` and keeps its meaning exactly:
  *we could not tell*. It is the fallback and now nothing else — `attraction`
  joins `culture` rather than sharing the fallback's colour, so a place somebody
  deliberately marked as worth seeing no longer looks identical to one nothing is
  known about. `place` becomes rare by construction, which is what a null should
  be.
- **BREAKING** Nine type identifiers stop existing. Stored values are remapped by
  an explicit old-to-new table rather than falling through
  `FALLBACK_MARKER_TYPE`, because the fallback would silently turn every saved
  temple into a generic slate pin — an appearance change that no error reports and
  no test catches.
- The icon channel stops being the thing that separates one place from another
  and becomes reinforcement of a colour that already says it. Seven glyphs remain,
  one per type; nine are retired.
- `guessMarkerType` maps Photon's OSM tags onto the seven rather than the sixteen.
  Its input vocabulary is unchanged and its targets shrink — except in one place,
  where they sharpen: `zoo` and `aquarium` were being flattened into `attraction`
  for want of anywhere better, and now go to `nature`. A stored `attraction` still
  resolves to `culture`, so a zoo saved before this change and one saved after it
  disagree. See `design.md` — the two tables answer different questions, and only
  one of them can see that a place was a zoo.
- The type grid in both capture forms goes from sixteen cells to seven.
- The `styling` spec's ranking rule survives, with the recessive role reassigned
  rather than removed: `place`, `culture` and `nature` together hold what `see`
  held, and `culture` — the largest of the three — keeps the slate and stays the
  most recessive coloured value. `nature` is chosen prominent enough to separate
  from `culture` and from `transport`'s teal, and quiet enough that a fortnight of
  parks and temples does not drown one restaurant.
- **The information the icon used to carry is deleted, not relocated.** After this
  change the map cannot say *castle*; it says *culture*, and the place's own name
  says the rest. This is the change's central trade and is argued in `design.md`.

## Capabilities

### New Capabilities

None. This changes how an existing capability is expressed, and introduces no
new one.

### Modified Capabilities

- **`markers`** — *Marker type is a code-defined value with a bounded set of
  display families* is the requirement this change is about. Family stops
  existing as a concept; the bound moves onto the type set itself, and the rule
  that a new type joins an existing family is replaced by a rule that a new type
  costs a colour and is therefore not free.
- **`map-rendering`** — *A marker's appearance is derived from its type by shared
  code* carries a scenario asserting that a temple and a castle share a colour and
  differ by icon. That is exactly what stops being true. The description's
  identifier-not-value rule is unaffected and is what makes the change cheap.
- **`styling`** — *A theme pair preserves the relationships the palette encodes*
  names five family colours and the single most-recessive family. It becomes seven
  type colours, with the recessive role held by `place`, and the two new hues
  need both grounds chosen rather than derived.

## Impact

**Shared packages**

- `packages/map/src/marker-type.ts` — the type list, the family union, and the
  icon list. The largest single edit, and the file whose header comment documents
  the decision being reversed.
- `packages/map/src/marker-view.ts` — `MarkerView.family` becomes the type
  identifier.
- `packages/map/src/marker-migrate.ts` *(new)* — the old-to-new table, shared so
  both applications and the geocoder cannot disagree about what a stored `temple`
  is now.
- `packages/tokens/src/colour.ts` — `MARKER_FAMILY_COLOURS` becomes seven entries
  keyed by type, two of them new values chosen against each ground.
- `packages/tokens/scripts/derive.ts` — emits `--pp-pin-*` in place of
  `--pp-family-*`; the completeness check moves with it. Not `--pp-type-*`: the
  typography scale already owns that prefix.
- `packages/geocode/src/type-guess.ts` — the OSM tag table's right-hand side.
- `packages/core/src/marker.ts` — `markerTypeSchema` reads the identifiers from
  `@pinpoint/map`, so it follows without an edit, but its tests name types
  directly.

**Applications**

- `apps/web/app/_components/` — `pin.tsx`, `marker-form.tsx`, `marker-details.tsx`,
  `place-search.tsx`, `marker-icon.tsx`. Every `var(--pp-family-*)` becomes
  `var(--pp-type-*)`.
- `apps/mobile/components/` — the same five, through `theme.markerFamily`.

**Data**

- No migration and no schema change. The type column is unconstrained text and
  stays that way; the remap happens on read, so a row written by an older build
  keeps rendering and nothing is rewritten in place.
- The disposable Kyoto seed migration holds the retired identifiers. It is
  covered by the remap like any other stored value, so it needs no edit — which
  is worth confirming rather than assuming, since it is the data every visual
  check is run against.

**Documentation**

- `DESIGN.md` — the *Secondary — The Marker Families* section, the *Sixth Family
  Rule*, the *Ranking Rule*, and the Do/Don't entries that say a new type never
  brings a colour. That sentence inverts: a new type now brings exactly one.
