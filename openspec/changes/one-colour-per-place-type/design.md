## Context

See `proposal.md — Why` for the motivation. What matters here is the shape of the
box the palette is in.

Three things already constrain any colour added to this product, and they were
each written down for a reason that still holds:

- **The cap.** Roughly eight simultaneously distinguishable colours
  (`marker-type.ts:9-16`). Five families are spent; the accent and `danger` are
  two more hues that can appear on or beside the map, so the real count in play
  is closer to seven than five.
- **The ranking.** The family holding the majority of a trip's markers is the
  most recessive value, so the minority — the one restaurant among fourteen
  temples — is the thing that stands out (`styling` spec, *A theme pair preserves
  the relationships the palette encodes*).
- **The wheel is crowded.** The existing hues sit at roughly 40° (`eat`), 180°
  (`move`), 250° (`see`, at chroma ~8), 275° (`sleep`), 300° (`buy`), plus the
  amber accent at ~75°. The only genuinely open region is 100–150 — the greens.
  Everything else is within 30° of something.

`#89` treats the cap as the binding constraint and concludes three colours are
available. The ranking is what actually binds: colours spent inside `see` may not
be loud, and two quiet colours are two greys. This design does not argue with the
ranking; it removes the need to spend anything inside `see` by making `see` stop
being a bucket.

## Goals / Non-Goals

**Goals:**

- One channel carries type. Colour says what a place is; the icon repeats it.
- Every pair of types is separable by colour alone at normal zoom, in both themes,
  on every basemap the app draws.
- Invent as little palette as possible. Values that already exist keep their
  meaning wherever the collapse allows.
- A stored type written by any earlier build renders as the right new type, not as
  the fallback.

**Non-Goals:**

- **Raising the cap.** Seven types is one under it, deliberately. This design does
  not establish that eight is fine; it spends the seventh slot and stops.
- **Fixing the visited pin.** `VISITED_OPACITY = 0.45` blends fill *and* glyph
  toward the basemap, so a visited slate pin measures about 1.58:1 against the
  land and its white glyph about 1.66:1 against the pin — both channels gone at
  once. That is a real defect and it is a different one; it survives this change
  unchanged and should be filed separately. Named here so it is not mistaken for
  something this change fixed or something it caused.
- **Retuning the glyph.** `MARKER_GLYPH_SIZE = 15` at an effective ~1.5px stroke
  is thin. It matters much less once the glyph is reinforcement rather than the
  sole discriminator, which is precisely why it is out of scope.
- **A legend, or filtering by type.** Both are reasonable answers to "I cannot
  find things among the temples" and neither is this change.

## Decisions

### The seventh value is a neutral, not a colour

Seven types need seven values. Five exist. The two new ones cannot both be hues:
after `nature` takes the green region, the remaining gaps are 340–20 (crimson,
within 20° of `eat`'s burnt orange), 320–340 (rose, within 30° of `buy`'s violet)
and 50–70 (bronze, which is the accent's neighbourhood and forbidden outright by
the *Sixth Family Rule*'s reasoning — an accent that reads as a type makes the
map's vocabulary ambiguous, and so does a type that reads as the accent).

So `place` takes a warm neutral instead, and this is better than a compromise
hue rather than worse than one. `place` is the fallback: an unmatched import, a
hand-dropped pin, a geocoder result too vague to classify. A pin that means *we
do not know what this is* should look like the least classified thing on the map,
and a near-colourless pin says that without being told.

**Alternative considered — `place` keeps the slate and `culture` takes a new
hue.** Rejected on the ranking. `culture` is the majority in any real trip (the
seeded Kyoto trip is fourteen sightseeing markers against eleven of everything
else), and the ranking rule exists to keep the majority quiet. Giving the majority
a fresh hue and the fallback the recessive slate inverts exactly the relationship
the rule protects.

**Alternative considered — six types, folding `nature` into `culture`.** Cheapest
of all, and it re-creates the problem: a bucket holding temples, castles, museums,
parks and viewpoints is five of the sixteen originals back in one colour. The
indoors/outdoors seam is the one seam in `see` that a person navigates by — *what
can we do if it rains* is a real question a trip asks — so it is the seam worth
the last colour.

### `place` and `culture` are two greys, and that is acceptable

This design criticised `#89` for proposing colours that cannot be told apart, and
then ships two low-chroma neutrals side by side. The difference is what the
confusion costs.

```
  BEFORE                              AFTER
  ────────────────────────────        ────────────────────────────
  temple  ┐                           culture  ── slate
  castle  │                           nature   ── green
  museum  │                           place    ── warm neutral
  park    ├─ all one slate                       ↑
  viewpt  │                                      └ softly confusable
  attract │                                         with culture, and rare
  place   ┘  7 types, 1 colour        7 types, 7 values
             every distinction lost   one soft distinction, the rest hue-separated
```

Every confusion that mattered is gone: a restaurant and a temple, a shop and a
station, a hotel and a viewpoint are now full hues apart. What remains is
`place` against `culture` — *we could not tell* against *a museum* — and that
pairing is the cheapest one in the set to get wrong. Both mean somewhere to go
and look at, and both lead to the same next action: read the name.

`attraction` sits in `culture` rather than in `place`, which is what makes this
argument hold rather than merely sound plausible. Had the fallback also carried
every vaguely-noted sightseeing place, the soft pair would have been two *common*
values and the collapse would have re-created a smaller version of the problem it
is fixing. As the fallback alone, `place` is rare by construction — it appears
only where nothing at all is known — so the one weak distinction in the palette is
also the one that comes up least.

The two are separated by hue direction (warm against cool) rather than by
lightness, so neither reads as a faded version of the other and neither collides
with the visited channel.

### `nature` is green, and green has one collision to clear

Green is the only open region, so `nature` goes there. Two checks it must survive,
neither of which is satisfied by looking at a swatch:

- **Against `transport`'s teal** (`#00857A` / `#16A99C`). A leaf green at ~135° and
  a blue-green at ~180° are 45° apart, which is comfortable at full chroma and
  much less so on a 32px teardrop. `nature` should be pushed yellow rather than
  blue to buy the distance.
- **Against the basemap's park fill** (`#E1E5DC` / `#1F241F`). A green pin on green
  land is the one placement where the pin loses its ground, and `BASEMAP_COLOUR`'s
  own comment records that park was got wrong once already by judging a fill from
  a swatch instead of from the area it covers. A viewpoint in the middle of a park
  is not a hypothetical — it is where viewpoints are.

Candidate values, offered as a starting point rather than as the answer:
`nature` `#3F7A32` light / `#6FB45C` dark; `place` `#8B857A` light / `#A8A197`
dark. Both clear the glyph against them at roughly the same ratio the slate does
(~3.6:1 white on light, ~7:1 near-black on dark). They are candidates because
this repo has learned twice that a palette decided in a text file is decided
wrongly — see the dark basemap that measured fine and rendered a black rectangle.
An HTML mock against real seeded data settles them, and that is a task.

### The remap is shared, explicit, and not the fallback

`markerTypeOf` resolves an unknown stored string to `FALLBACK_MARKER_TYPE`, which
is correct for a value no build ever wrote and wrong for the nine this change
retires. Falling through would turn every saved temple into a generic `place` —
an appearance change that typechecks, renders, throws nothing, and is only
visible by opening the app and recognising that a map looks wrong. That is the
exact failure mode the roadmap's standing lesson is about.

So a table, not a fallback:

```
  temple, castle, museum,
    attraction                  → culture
  park, viewpoint               → nature
  other                         → place
  restaurant, cafe, bar,
    street-food                 → food
  shop, market                  → shopping
  lodging                       → stay
  station, airport              → transport
```

It lives in `@pinpoint/map` beside the type list, because both applications and
`@pinpoint/geocode` resolve stored types and three copies of this table is three
chances for one of them to disagree about what a `temple` is.

**Resolved on read, not written to the database.** No migration, no schema change,
and the type column stays unconstrained text. A rewriting migration would have to
be correct on the first attempt against rows this project cannot restore, buys
nothing a read-time table does not, and would leave any client running older code
writing retired identifiers into a column that had just been cleaned.

The remap is permanent, not transitional. Retired identifiers keep resolving for
as long as a row might carry one, which is forever.

### The tag table and the remap table answer different questions

Two mappings land on the seven types and it is easy to read them as one. They are
not, and conflating them produces a wrong answer in a way nothing reports.

- **The remap table** takes a *stored identifier* written by an earlier build and
  says what it means now. Its input is one of the sixteen. It is lossy by
  construction: `attraction` is all it can see, so `attraction` → `culture` is the
  best available reading of a value that may once have described a zoo.
- **`guessMarkerType`** takes an *OSM tag* from Photon and says what a place being
  saved right now is. Its input is far richer — `zoo` and `aquarium` are distinct
  tags that were being flattened into `attraction` only because there was nowhere
  better for them to go.

Now there is. `zoo` and `aquarium` map to `nature`, directly, rather than through
`attraction`. Somewhere you go to look at living things belongs with parks and
viewpoints, not with museums, and the tag table has always known which is which —
the old type list is what threw that away.

The coarse keys, matched when a tag's value says nothing, follow the same reading:
`natural` and `leisure` both go to `nature`, `tourism` and `historic` to
`culture`, `shop` to `shopping`, `railway` and `aeroway` to `transport`.

`leisure` → `nature` is worth one line because it looks like a decision and is
not. `leisure` already resolved to `park`, and `park` is one of the two types
`nature` absorbs, so the two mappings compose to exactly this — a sports pitch
has always been grouped with parks and continues to be. Keeping `leisure`
distinct would have been the change; sending it to `nature` is the status quo
written under a new name.

`theme_park` continues to route through `attraction` to `culture`, which is the
weakest cell in either table and is left alone deliberately: it is neither
culture nor nature, and inventing an eighth type for it would spend the cap on
the rarest thing on the map.

**The consequence, stated rather than discovered.** A zoo saved before this
change is stored as `attraction` and renders as `culture`; a zoo saved after it is
stored as `nature` and renders as `nature`. The two disagree, permanently, and
nothing can reconcile them — the earlier row does not record that it was a zoo.
This affects only rows already written, only zoos and aquariums among them, and
the alternative is a migration that guesses at meaning it does not have. Accepted,
and worth one sentence in the change rather than a later question about why one
zoo is slate.

### `MarkerView` carries the type, not a new field

The custom property is `--pp-pin-<type>`, not `--pp-type-<type>`. The typography
scale already owns the `--pp-type-` prefix — `--pp-type-body-size`,
`--pp-type-title-weight` — and putting two unrelated vocabularies under one
namespace is how a stylesheet stops being readable. `--pp-pin-` is free, and says
what the value colours. (`--pp-marker-` was the other candidate and is taken by
the pin's *geometry*: width, height, glyph, badge, foreground.)

`MarkerView.family` becomes `MarkerView.type`. The `map-rendering` requirement
that the description carries *identifiers rather than values* is what makes this
a rename plus a token key change rather than a rewrite: no application holds a
family's colour as a literal, so nothing that draws a pin needs to learn anything
new. `--pp-family-see` becomes `--pp-pin-culture`, `theme.markerFamily` becomes
`theme.markerType`, and every call site is a mechanical substitution.

Keeping `family` as a name for a one-member grouping was considered and rejected:
a channel that always equals the type is a channel that will be quietly given a
second meaning later, which is the thing `marker-view.ts:106-110` explicitly
forbids.

## Risks / Trade-offs

- **The map can no longer say *castle*.** → Accepted, and it is the change's
  central trade. The place's own name identifies it far better than a 15px glyph
  ever did — *Himeji Castle* is unambiguous where a stroked turret at 15px is not
  — and the type's job on a map is coarse orientation, not identification. The
  icon still distinguishes the seven and now agrees with the colour instead of
  carrying the load alone. If this turns out to be wrong it is wrong in a
  recoverable direction: types can be re-added, and the remap table means the
  stored strings that named them were never lost.

- **Someone deliberately chose `Temple` on a place and it now says `Culture`.** →
  Real, and unmitigated by anything except that the note field exists. Worth
  saying plainly in the change rather than discovering it as a complaint.

- **The type set has no room left.** → By design, and it is the point: a new type
  now costs a colour, so adding one is a palette decision rather than a free list
  edit. The old scheme made types free and that is how sixteen of them arrived.
  The `markers` spec must say this explicitly or the seventh slot will be spent by
  someone who reads the list and sees room for one more.

- **Green fails against the park fill or the teal.** → Caught by the mock task, not
  by review. If it fails both, the fallback position is six types with `nature`
  folded into `culture`, which is worse but shippable, and that should be decided
  by looking rather than by re-arguing.

- **A stored identifier is missed by the remap.** → The table is exhaustive over
  the sixteen by construction, and a test asserts every retired identifier resolves
  to a live type and that none resolves to the fallback by accident. The generic
  fallback stays for genuinely unknown strings.

- **`DESIGN.md` and the specs disagree with the code for the length of the
  branch.** → Both are in the task list rather than deferred. The *Sixth Family
  Rule* inverts and cannot be left standing: it currently reads *new types join an
  existing family and never bring a colour*, which after this change is exactly
  backwards.

## Migration Plan

No deploy sequencing and no data migration. The remap is read-time, so an old
client and a new client can run against the same rows: the old one writes
`temple` and the new one reads it as `culture`, which is the intended meaning.
Rollback is reverting the branch — nothing has been written that an older build
cannot read, because nothing has been written at all.

The one ordering constraint is internal to the branch: `@pinpoint/tokens` emits
the new `--pp-type-*` keys before either application is switched onto them, or
both apps render pins with no fill and the CSS custom property fails silently to
nothing. That is a build-order fact, not a deploy step.

## Open Questions

- **The two new values.** The candidates above need a mock with real seeded data
  before they are committed. This is deferrable because it changes no requirement
  and no task — the tasks already say *choose these by looking* — only which six
  hex digits land in `colour.ts`.
