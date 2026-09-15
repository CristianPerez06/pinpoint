## Context

See `proposal.md — Why` for the motivation. What matters here is the shape of the
box the palette is in.

Three things already constrain any colour added to this product, and they were
each written down for a reason that still holds:

- **The cap.** Roughly eight simultaneously distinguishable colours
  (`marker-type.ts:9-16`). Five families are spent; the accent and `danger` are
  two more hues that can appear on or beside the map, so the real count in play
  is closer to seven than five. This change reaches that cap rather than staying
  under it — see *The eighth type is Temple, and it takes the slate*.
- **The ranking.** The family holding the majority of a trip's markers is the
  most recessive value, so the minority — the one restaurant among fourteen
  temples — is the thing that stands out (`styling` spec, *A theme pair preserves
  the relationships the palette encodes*).
- **The wheel is crowded.** The existing hues sit at roughly 40° (`eat`), 180°
  (`move`), 250° (`see`, at chroma ~8), 275° (`sleep`), 300° (`buy`), plus the
  amber accent at ~75°. The only genuinely open region is 100–150 — the greens.
  Everything else is within 30° of something.

  Those figures are estimates, and the span through the reds is much wider than
  they imply. Measured in **CIE LCh** from the committed values: `food` 44°,
  `nature` 136°, `transport` 185°, `temple`'s slate 262° at chroma 9, `stay`
  289°, `shopping` 310°. The stretch from `shopping` round to `food` is
  therefore **94° wide and completely empty** — not the near-nothing the
  estimates implied. Its middle is about 356°, and a value there clears 46° of
  `shopping` and 48° of `food`. For scale, `nature` against `transport` — the
  closest pair in the set and one already judged acceptable — is 49°. That is
  where the eighth colour comes from, and it is why the first pass concluded
  there was nowhere to put one.

  **The space matters, and this is the second time it has.** These numbers are
  CIE LCh because `mock/palette.html` measures in CIE LCh and every threshold
  this palette has been judged against is a CIE LCh threshold. A draft of this
  section reasoned in OKLCH instead, where the same gap reads 100° wide and
  centred near 345°; the two spaces disagree about where violet sits by roughly
  15°, and the value that followed came out **33°** from `shopping` when the
  mock measured it. Not wrong arithmetic — the wrong ruler, and a number that
  looks like every other number in the document. Quote the space or the figure
  means nothing.

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

- **Raising the cap.** Eight types is *at* it. This design spends the last slot
  and stops; it does not establish that nine is fine, and the next type proposed
  has no colour waiting for it. That is now the binding constraint rather than a
  comfortable margin, and the mock is what confirms eight holds at pin size.
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

### The eighth type is Temple, and it takes the slate

The collapse first went to seven and folded Temple into `culture`. That is the
one merge in the table that reproduces the problem the change exists to fix. A
sightseeing trip is not evenly made of museums, castles and temples; the Kyoto
seed carried **eight temples against four of everything else sightseeing**, so
folding them together makes the majority indistinguishable from its own
minority — a field of identical pins, one level down from the field of identical
pins in *Why*.

So Temple comes back out, and the colour it takes is not a new one. It takes the
slate, because **the ranking rule follows the majority and the majority is
temples**. `culture` — now castles, museums and galleries — drops to a minority
type and is free to be prominent, which is what the rule wants of a minority.
Nothing about the ranking is bent to allow this; the rule is applied to a count
that was measured rather than assumed.

This is what makes it different from the alternative rejected below. That one
gave the majority a fresh hue and the fallback the slate, inverting the rule.
This one leaves the majority on the slate and moves the *name* of the majority.

**What it costs, stated rather than discovered.** Eight types is *at* the
roughly-eight cap rather than under it. The first pass deliberately stopped at
seven and wrote down that it did not establish eight was fine. This spends the
last slot on the one distinction a sightseeing trip is actually made of, and the
mock is what decides whether eight values hold apart at pin size. If they do not,
the thing to give up is `nature`, not this — a park and a temple are far apart by
name, where a temple and a museum are the pair somebody is standing in the street
choosing between.

### `culture` takes the last colour on the wheel

Measured rather than estimated, the span between `shopping` at 310° and `food` at
44° is 94° wide and completely empty. Its middle is about 356°: a deep rose, 46°
clear of `shopping`'s violet on one side and 48° clear of `food`'s burnt orange
on the other. That is not a compromise slot — `nature` against `transport` is the
closest pair in the set at 49°, and it was judged acceptable.

**Settled at `#B43F72` light / `#E57DA5` dark**, against the mock rather than in
this file. The glyph clears comfortably on both — white at 5.39:1 on the light
value and near-black at 6.72:1 on the dark — where the slate it replaces manages
3.61:1 and 7.06:1. Being *more* legible than the value it replaces is expected
and correct: `culture` is a prominent type now.

**How the first candidate was wrong, because the shape recurs.** It was `#A83C81`,
chosen at OKLCH hue 345° on the reasoning above when that reasoning was still in
OKLCH. Measured in CIE LCh — which is what the mock and every existing threshold
use — it sits 33° from `shopping`, under the 40° floor, and the mock reported it
thin on both grounds. Nothing about the argument was wrong except the ruler, and
a hue in degrees looks identical whichever space produced it. This is the whole
reason the tasks say *choose these by looking* and the reason the mock re-measures
rather than displaying what it was told.

One thing the mock cannot settle:

- **Whether a rose is the right colour for a museum.** Every number clears. That
  a castle, a gallery and a museum should be filed under a deep pink is a
  judgement about the product, not about separation, and it belongs to whoever
  is looking at 1.7.

### `place` takes a neutral, not a colour

Eight types need eight values. Five exist and three are invented: `nature`'s
green, `culture`'s magenta-rose, and this one.

`place` takes a warm neutral, and this is better than a compromise hue rather
than worse than one. `place` is the fallback: an unmatched import, a hand-dropped
pin, a geocoder result too vague to classify. A pin that means *we do not know
what this is* should look like the least classified thing on the map, and a
near-colourless pin says that without being told.

An earlier version of this section reached the same answer by a weaker route —
that the wheel had no room left for a third hue, the rose band being "within 30°
of `buy`'s violet". Measurement says otherwise: the rose band was open, and it
has been spent on `culture`. The neutral stands on what `place` *means*, which
is the reason that was load-bearing all along.

**Alternative considered — `place` keeps the slate and `culture` takes a new
hue.** Rejected on the ranking. The slate is the majority's colour, and the
ranking rule exists to keep the majority quiet; handing it to the fallback and
giving the majority a fresh hue inverts exactly the relationship the rule
protects. Note what this does *not* rule out, and what the eighth type does
instead: moving the slate to a different, correctly-identified majority.

**Alternative considered — folding `nature` into `culture`.** Cheapest of all,
and it re-creates the problem: a bucket holding castles, museums, attractions,
parks and viewpoints is five of the sixteen originals back in one colour. The
indoors/outdoors seam is the one seam in `see` that a person navigates by — *what
can we do if it rains* is a real question a trip asks — so it is a seam worth a
colour. It is also the value to give up first if eight will not hold apart at pin
size, which is a judgement the mock makes and this file does not.

### `place` and `temple` are two greys, and that is acceptable

This design criticised `#89` for proposing colours that cannot be told apart, and
then ships two low-chroma neutrals side by side. The difference is what the
confusion costs.

```
  BEFORE                              AFTER
  ────────────────────────────        ────────────────────────────
  temple  ┐                           temple   ── slate
  castle  │                           culture  ── magenta-rose
  museum  │                           nature   ── green
  park    ├─ all one slate            place    ── warm neutral
  viewpt  │                                       ↑
  attract │                                       └ softly confusable
  place   ┘  7 types, 1 colour                       with temple, and rare
             every distinction lost   8 types, 8 values
                                      one soft distinction, the rest hue-separated
```

Every confusion that mattered is gone: a restaurant and a temple, a shop and a
station, a hotel and a viewpoint are now full hues apart, and so are a temple and
a museum. What remains is `place` against `temple` — *we could not tell* against
*a temple* — and that pairing is the cheapest one in the set to get wrong. Both
mean somewhere to go and look at, and both lead to the same next action: read the
name.

The pair is structurally the one this section always described. The slate belongs
to the majority type and the warm neutral to the fallback; the eighth type
changed which type holds the slate, not the shape of the pairing. The two
measure L 0.622 and L 0.619 — near-identical lightness, separated by hue
direction alone — which is deliberate, because lightness already means *visited*
and a `place` pin reading as a faded `temple` would be read as one already seen.

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
is correct for a value no build ever wrote and wrong for the eight this change
retires. Falling through would turn every saved castle into a generic `place` —
an appearance change that typechecks, renders, throws nothing, and is only
visible by opening the app and recognising that a map looks wrong. That is the
exact failure mode the roadmap's standing lesson is about.

So a table, not a fallback:

```
  castle, museum, attraction    → culture
  park, viewpoint               → nature
  other                         → place
  restaurant, cafe, bar,
    street-food                 → food
  shop, market                  → shopping
  lodging                       → stay
  station, airport              → transport

  temple                        → not here: it is a live type again
```

**`temple` must not be in this table**, and that is the one entry worth a line.
It was retired to `culture` by the first pass and un-retired by the eighth type,
so a row carrying it resolves directly, the way it always did. An entry left
behind would take precedence over nothing — `markerTypeOf` checks the live types
first — but it would be a standing claim that `temple` means `culture`, which is
the opposite of true, and the test that asserts every retired identifier resolves
to a live type would pass while asserting the wrong thing.

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

Two mappings land on the eight types and it is easy to read them as one. They are
not, and conflating them produces a wrong answer in a way nothing reports.

- **The remap table** takes a *stored identifier* written by an earlier build and
  says what it means now. Its input is one of the fifteen identifiers this change
  retires. It is lossy by
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
culture nor nature, and inventing a type for it would spend a colour there is no
longer one of on the rarest thing on the map. The eighth slot went to the
distinction a sightseeing trip is made of; this is the one it was spent instead
of.

### Temple means any place of worship, and the label is the cost

`temple`, `shrine`, `monastery` and `place_of_worship` route to `temple`, and
`church`, `cathedral`, `chapel`, `mosque` and `synagogue` are added to the value
table, which did not carry them at all — today a church matches no value and no
key and arrives as the fallback.

The scope is the wide one deliberately. Photon's tag for a religious building is
very often just `amenity=place_of_worship`, with nothing saying which religion,
and a great many of Kyoto's temples come back exactly that way. A `temple` type
that took only the explicit `temple` and `shrine` values would leave most of the
places it exists for arriving as `culture`, to be corrected by hand one at a
time — which is the type failing at the only job it was added to do.

**The cost is the label.** A cathedral saved through the search is called
*Temple*. That is wrong as English and right as behaviour: it is a place of
worship you go and look at, it is coloured and grouped with the others, and the
place's own name says *Notre-Dame* directly underneath. Accepted, and recorded
here rather than left to be found. If it grates enough to be worth changing, the
change is the label and not the grouping — the type would be renamed to
something like *Worship*, which costs a word and no colour.

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
  icon still distinguishes the eight and now agrees with the colour instead of
  carrying the load alone. If this turns out to be wrong it is wrong in a
  recoverable direction: types can be re-added, and the remap table means the
  stored strings that named them were never lost. **That direction has already
  been used once**, by this change's own extension — `temple` was retired, the
  stored string survived it, and putting the type back cost nothing but a colour.

- **A temple saved between the first implementation and this extension is stored
  as `culture` and cannot be recovered.** → Real, and accepted. The row holds
  `culture` and so does a museum's; nothing distinguishes them afterwards,
  because the meaning was discarded at write time rather than at read time. Those
  pins come back as Culture and are re-picked by hand. Guessing — say, treating
  every `culture` row saved inside the window as a temple — would write a meaning
  the data does not carry, which is the same mistake as letting a retired
  identifier fall through to the fallback, in the opposite direction. The window
  is small and the correction is one tap per place.

- **The type set has no room left.** → By design, and it is the point: a new type
  costs a colour, so adding one is a palette decision rather than a free list
  edit. The old scheme made types free and that is how sixteen of them arrived.
  The `markers` spec must say this explicitly or the next slot will be spent by
  someone who reads the list and sees room for one more. This is now literal
  rather than cautionary: eight is the cap, the wheel's last open span is spent,
  and a ninth type has no colour waiting for it.

- **Eight colours do not hold apart at pin size.** → The risk the cap was there
  to prevent, and taken knowingly. It is settled by the mock and not by this
  file. If it fails, the value to give up is `nature`: a park and a temple are
  far apart by name and by context, where a temple and a museum are the pair
  somebody is choosing between while standing in a street.

- **Green fails against the park fill or the teal.** → Caught by the mock task, not
  by review. If it fails both, the fallback position is six types with `nature`
  folded into `culture`, which is worse but shippable, and that should be decided
  by looking rather than by re-arguing.

- **A stored identifier is missed by the remap.** → The table is exhaustive over
  the fifteen by construction, and a test asserts every retired identifier
  resolves to a live type and that none resolves to the fallback by accident. The
  sixteenth, `temple`, is live and is asserted to resolve to itself — the one case
  where an entry in the table would be the defect rather than an omission from it.
  The generic fallback stays for genuinely unknown strings.

- **`DESIGN.md` and the specs disagree with the code for the length of the
  branch.** → Both are in the task list rather than deferred. The *Sixth Family
  Rule* inverts and cannot be left standing: it currently reads *new types join an
  existing family and never bring a colour*, which after this change is exactly
  backwards.

## Migration Plan

No deploy sequencing and no data migration. The remap is read-time, so an old
client and a new client can run against the same rows: the old one writes
`castle` and the new one reads it as `culture`, which is the intended meaning.
Rollback is reverting the branch — nothing has been written that an older build
cannot read, because nothing has been written at all.

`temple` is the one identifier that reads correctly in *both* directions, since
it is live on either side of the extension. What does not survive is the window
in between, where the seven-type build wrote `culture` for a temple; see *Risks*.

The one ordering constraint is internal to the branch: `@pinpoint/tokens` emits
the new `--pp-pin-*` keys before either application is switched onto them, or
both apps render pins with no fill and the CSS custom property fails silently to
nothing. That is a build-order fact, not a deploy step. (`--pp-pin-`, not
`--pp-type-`: the typography scale owns that prefix, as *`MarkerView` carries the
type* records.)

## Open Questions

- **The three new values.** The candidates above need a mock before they are
  committed. This is deferrable because it changes no requirement and no task —
  the tasks already say *choose these by looking* — only which six hex digits land
  in `colour.ts` for each.

- **What the mock is run against.** It was written to be read beside the seeded
  Kyoto trip, and that seed was deleted in #138. Whatever replaces it needs at
  least one place of every one of the eight types, and a lopsided count rather
  than an even one — an even eight would make the ranking look fine when the
  ranking is precisely what a lopsided trip tests.
