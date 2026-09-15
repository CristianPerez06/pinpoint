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
its own colour. Sixteen types become eight, colour carries the whole distinction,
and the two-channel scheme — family for colour, type for icon — collapses into
one.

**Extended after the implementation landed.** The collapse first went to seven,
folding Temple into `culture`. That reproduces the original complaint one level
down: a trip that is mostly temples cannot tell a temple from a museum, and
telling them apart is exactly what a fortnight in Kyoto is spent doing. Temple
is taken back out as the eighth type. It takes `culture`'s slate — the quiet
value follows the majority, and the majority is temples — and `culture` buys the
last colour the wheel has room for. Eight types, eight colours, and the
roughly-eight cap now reached rather than avoided; `design.md` argues that.

## What Changes

- **BREAKING** The `see`/`eat`/`buy`/`sleep`/`move` family channel is removed.
  `MarkerFamily`, `MARKER_FAMILIES` and `MarkerTypeDefinition.family` go, and
  `MarkerView` carries the type identifier where it carried a family. Colour is
  resolved from the type.
- **BREAKING** The sixteen types collapse into eight:

  | New type | Absorbs | Colour |
  | --- | --- | --- |
  | `place` | Place | **new neutral** — the fallback, and deliberately the least coloured pin on the map |
  | `temple` | Temple | slate, unchanged value — inherits `see`'s recessive role, because it inherits `see`'s majority |
  | `culture` | Castle, Museum, Attraction | **new hue** — deep rose |
  | `nature` | Park, Viewpoint | **new hue** — green |
  | `food` | Restaurant, Café, Bar, Street food | burnt orange, unchanged |
  | `shopping` | Shop, Market | violet, unchanged |
  | `stay` | Lodging | blue, unchanged |
  | `transport` | Station, Airport | teal, unchanged |

  Five of the eight keep a value that already exists, so most of a trip does not
  change colour. Two hues are invented and one neutral is. `design.md` argues why
  the neutral is better spent on a null than on a colour, and why the second hue
  fits where the first pass concluded nothing would.

  The recessive role moves with the majority, and the majority is narrower than
  the first pass assumed. `see` was most recessive because it held the bulk of a
  sightseeing trip; of the eighteen places the Kyoto seed carried, eight were
  temples and four were the rest of sightseeing put together. So `temple` takes
  the slate, `culture` drops to a minority type and is free to take a prominent
  hue, and the rule that protects the majority is unchanged in substance.

  (That seed was deleted in #138, so the counts above are read from its last
  revision in the history rather than from anything a database still holds.
  `colour.ts` states the ratio as fourteen against four and attributes it to a
  trip that no longer exists — worth correcting while the comment is being
  rewritten anyway.)

- The identifier `other` is renamed to `place` and keeps its meaning exactly:
  *we could not tell*. It is the fallback and now nothing else — `attraction`
  joins `culture` rather than sharing the fallback's colour, so a place somebody
  deliberately marked as worth seeing no longer looks identical to one nothing is
  known about. `place` becomes rare by construction, which is what a null should
  be.
- **BREAKING** Eight type identifiers stop existing. `temple` is not among them:
  it is retired from the list and then put back, so the identifier survives
  unbroken and every row ever written with it still means what it said. Stored
  values for the eight are remapped by an explicit old-to-new table rather than
  falling through `FALLBACK_MARKER_TYPE`, because the fallback would silently turn
  every saved castle into a generic slate pin — an appearance change that no error
  reports and no test catches.
- **One window of markers cannot be recovered, and is not.** Between the first
  implementation landing and this extension, a temple saved through the app was
  stored as `culture`, and `culture` is also what a museum was stored as. Nothing
  can separate them afterwards: the stored value is all there is. Those pins come
  back as Culture and are re-picked by hand. The alternative is guessing at a
  meaning the row does not carry, which is the same mistake as letting a retired
  identifier fall through to the fallback.
- The icon channel stops being the thing that separates one place from another
  and becomes reinforcement of a colour that already says it. Eight glyphs remain,
  one per type; eight are retired. `temple` takes the columned facade `culture`
  held — it is the glyph that actually draws a temple — and `culture` takes the
  castle, which is one of the glyphs the first pass had retired.
- `guessMarkerType` maps Photon's OSM tags onto the eight rather than the sixteen.
  Its input vocabulary grows in one place and its targets shrink everywhere else,
  except where they sharpen:
  - `zoo` and `aquarium` were being flattened into `attraction` for want of
    anywhere better, and now go to `nature`. A stored `attraction` still resolves
    to `culture`, so a zoo saved before this change and one saved after it
    disagree. See `design.md` — the two tables answer different questions, and
    only one of them can see that a place was a zoo.
  - `temple`, `shrine`, `monastery` and `place_of_worship` go to `temple`, and
    `church`, `cathedral`, `chapel`, `mosque` and `synagogue` are added, which the
    table did not carry at all. Temple means *a place of worship you would go and
    look at*, not only a Buddhist or Shinto one — because the tag is very often
    just `place_of_worship`, and a narrower reading would send most of Kyoto to
    `culture` and defeat the type. The cost is that a cathedral is labelled
    Temple; `design.md` records it as accepted rather than unnoticed.
- The type grid in both capture forms goes from sixteen cells to eight.
- The `styling` spec's ranking rule survives, with the recessive role reassigned
  rather than removed: `place`, `temple`, `culture` and `nature` together hold
  what `see` held, and `temple` — the largest of the four — takes the slate and
  is the most recessive coloured value. `culture` and `nature` are both chosen
  prominent enough to separate from it and from each other, and quiet enough that
  a fortnight of temples does not drown one restaurant.
- **The information the icon used to carry is mostly deleted, not relocated.**
  After this change the map cannot say *castle*; it says *culture*, and the
  place's own name says the rest. The one distinction bought back is the one a
  sightseeing trip is actually made of. This is the change's central trade and is
  argued in `design.md`.

## Capabilities

### New Capabilities

None. This changes how an existing capability is expressed, and introduces no
new one.

### Modified Capabilities

- **`markers`** — *Marker type is a code-defined value with a bounded set of
  display families* is the requirement this change is about. Family stops
  existing as a concept; the bound moves onto the type set itself, and the rule
  that a new type joins an existing family is replaced by a rule that a new type
  costs a colour and is therefore not free. `temple` is what that rule looks like
  being paid rather than waived: it is added because the colour is worth
  spending, not because the list had room.
- **`map-rendering`** — *A marker's appearance is derived from its type by shared
  code* carries a scenario asserting that a temple and a castle share a colour and
  differ by icon. That is exactly what stops being true. The description's
  identifier-not-value rule is unaffected and is what makes the change cheap.
  Replaced as *A marker's colour and icon are derived from its type by shared
  code*, because OpenSpec cannot rename a scenario inside a modified requirement.
- **`styling`** — *A theme pair preserves the relationships the palette encodes*
  names five family colours and the single most-recessive family. It becomes
  eight type colours, with the recessive role held by `temple`, and the three new
  values need both grounds chosen rather than derived. Replaced as *…beyond
  contrast alone*, for the same reason.

## Impact

**Shared packages**

- `packages/map/src/marker-type.ts` — the type list, the family union, and the
  icon list. The largest single edit, and the file whose header comment documents
  the decision being reversed.
- `packages/map/src/marker-view.ts` — `MarkerView.family` becomes the type
  identifier.
- `packages/map/src/marker-migrate.ts` *(new)* — the old-to-new table, shared so
  both applications and the geocoder cannot disagree about what a stored `castle`
  is now. `temple` is deliberately absent from it: the identifier is live again,
  so it resolves directly and must not be redirected.
- `packages/tokens/src/colour.ts` — `MARKER_FAMILY_COLOURS` becomes eight entries
  keyed by type, three of them new values chosen against each ground.
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
- The disposable Kyoto seed migration used to hold the retired identifiers and
  was the data every visual check was run against. It was deleted in #138, so the
  visual checks need a real trip with a place of each type standing in for it.

**Documentation**

- `DESIGN.md` — the *Secondary — The Marker Families* section, the *Sixth Family
  Rule*, the *Ranking Rule*, and the Do/Don't entries that say a new type never
  brings a colour. That sentence inverts: a new type now brings exactly one.
- `PRODUCT.md` — *five fixed colour groups* and *Colour is carried by five fixed
  families, icons by a growable type list* both describe the scheme this change
  removes, and were left behind when the implementation landed.
