## Context

The path from a search candidate to a marker is two handlers deep and consults nothing.
`onChoose` receives a `PlaceCandidate`, hands its position and name to `beginCreate`, and
`beginCreate` opens the form. The trip's markers are in scope at both call sites and are
never read.

Three facts already written down constrain what the fix can be.

**A saved marker carries no external identity.** `PlaceCandidate.id` says so in as many
words — *"not stable across queries and not stored anywhere: a saved marker's identity is
the row's, and tying it to an OSM id would make it break when OSM renumbers"* — and
`parse.ts` discards `osm_type`/`osm_id` past list keying. There is no column to compare
against and adding one would not help: it could never be backfilled for existing rows and
would always be null for a marker somebody dropped by pointing at the map.

**The map has already decided what "the same point" means.** `groupCoincident` collapses
markers at identical coordinates and states the rule and its limits directly: *"Equality
is exact, not 'within a few metres'. Two markers a block apart are two points that overlap
at low zoom and separate as you zoom in… only genuinely identical coordinates need this."*
It also records why exact equality is not the vacuous test it looks like: *"A geocoder
frequently answers with a building's centre rather than the place inside it, so two
markers can hold genuinely identical coordinates."*

**Both applications answer a selected pin the same way, and neither answers with a form.**
Web keeps `{ kind: 'details', groupKey, markerId }` in `trip-workspace.tsx`; the phone
keeps `{ groupKey, markerId }` inside `trip-map.tsx`. Both resolve it against the current
groups on every render, both hold `markerId: null` while several places on one point are
being chosen between, and both have a comment explaining that storing the group or an
index into it is a snapshot and was a defect.

## Goals / Non-Goals

**Goals:**

- A search candidate already saved on the current trip does not produce a second marker.
- The match is stated in the specification as a rule, not left as whatever a comparison
  happens to do.
- Both applications behave the same way, from one shared definition of the match.
- The camera behaves exactly as it does today, on both platforms.
- A match that the current filter is hiding is still opened, and says why the map around
  it looks empty.

**Non-Goals:**

- Recognising a place saved on a *different* trip. `#83` scopes matching to the current
  trip and the marker query is already trip-scoped, so this costs nothing to honour.
- Recognising a marker whose position was corrected after saving, or one added by pointing
  at the map. Both keep behaving as they do today. See the first decision.
- Merging, de-duplicating, or offering to merge anything already stored. Nothing existing
  is touched.
- Changing what search returns, how it ranks, or what a candidate carries. `#52` wants a
  structured city off the candidate; this change needs nothing new from the geocoder.
- Anything about the edit form. A match never opens one.

## Decisions

### The match is exact coordinate equality

**Decision:** two positions match when their longitudes and latitudes are equal, with `-0`
normalised to `0` — the same test `groupCoincident` applies, reusing the same
normalisation rather than restating it.

**Why it works at all:** a marker saved from search stores the geocoder's coordinates
unchanged, so the second search returns the same numbers. This is not a coincidence that
might stop holding — it is the same request against the same service for the same object.

**Alternatives considered:**

- *Within N metres.* Catches two cases exact equality misses: a marker nudged onto the
  right doorway after saving, and one dropped by pointing. It also fails `#83`'s own
  requirement that a different venue a few metres away is not swallowed. The distance
  between two shops on one street and the distance a pin gets nudged are the same
  distance; no N separates them. The two failures are not symmetrical, either — offering a
  duplicate is visible and correctable, while silently refusing to add a place is neither.
- *Matching by name.* Survives repositioning, and matches the wrong Starbucks. It also
  fails in the ordinary direction: a marker renamed *"Sushi — book ahead"* stops matching
  the candidate it came from, so name is not even reliably true of the case it was added
  for.
- *Position **and** name.* Strictly narrower than position alone and therefore matches
  less, at the cost of a second rule to explain. Position alone already has no false
  positives.
- *An OSM identity column.* Ruled out above, and it would reverse a decision recorded in
  `types.ts` for a reason that has not changed.

**Accepted cost:** two cases keep offering a duplicate. Both fail exactly as they do
today, so neither is a regression, and both are visible to the person and correctable in
one press. This is a deliberate floor, not an oversight: it is written into the
specification as position equality so that widening it later is a spec change with a
reason, rather than a constant somebody adjusts.

### The match function lives in `@pinpoint/map`, beside `groupCoincident`

**Decision:** a pure function taking a position and a set of markers and returning those
that sit exactly there, exported from `@pinpoint/map`, using the same coordinate
normalisation `groupCoincident` uses. Structurally typed on `MarkerViewInput` like
everything else in that file, so `Marker` from `@pinpoint/core` satisfies it without the
package taking a dependency.

**Why not `@pinpoint/core` beside `marker-filter.ts`:** `core` owns predicates over a
marker's *fields* — interest, visited, type. This is geometry, and more importantly it is
*the same geometry the map already computes*. Both cards are addressed by the `groupKey`
that `groupCoincident` derives; a match computed by a separately written comparison could
disagree with that key, and the resulting failure is a card opening on a group that does
not contain the marker it was opened for. One normalisation, used by both, makes that
disagreement impossible to write.

**Secondary reason:** `apps/web` has no test runner. A rule that lives in an application
gets no test; in a package it gets one, and the tests that matter here are the ones for
the cases nobody would think to click — `-0` against `0`, a position matching two markers,
a position matching none.

**Constraint honoured:** plain numbers in, plain data out. No renderer, no DOM API, no
native module. `pnpm check:cycles` and `typecheck:packages` cover it.

### A match opens the details card, not the edit form

**Decision:** route a match to the same state selecting the pin produces — `groupKey` plus
`markerId` — on both platforms.

**Why not the form**, which is what `#83` asks for literally:

- A coordinate match can match **more than one marker**, because a geocoder answers with a
  building's centre. The card is the screen that handles that, with a chooser and
  `markerId: null`; a form would have to pick one arbitrarily.
- It is what selecting the pin already does. Both platforms already agree on this and
  neither answers a pin with a form.
- It is the likelier question. Somebody searching a place they saved is usually asking
  whether they already saved it. The card answers that and leaves editing one press away;
  a form assumes an intent they did not express and buries the answer under a name field.

**Consequence for `markerId`:** where the match hits one marker, `markerId` is that
marker, so the card opens on the place itself rather than on a chooser of one. Where it
hits several, `markerId` is null and the chooser appears — identical to what selecting
that point does today.

### Matching reads the whole trip; the card resolves against the drawn set first

**Decision:** the match runs against every marker on the trip (`markers` on the web,
`held` on the phone), never against the filtered set.

Matching against the filtered set would let a *view* setting create a duplicate: filter to
food, search a saved temple, get a second temple. A filter decides what is drawn. It has
never decided what the trip contains, and this change must not be the first thing that
lets it.

That produces the case the rest of this change has to answer.

### A match the filter is hiding opens anyway, and says so

**Problem:** both cards resolve by looking a `groupKey` up in the groups built from the
*drawn* markers (`trip-workspace.tsx:580`, `trip-map.tsx:683`). A marker the filter is
hiding is in no group, the lookup returns nothing, and the card does not open. With the
camera already moved, the result is a fly-to over an empty patch of map and nothing else
— a screen where nothing happens, which reads as broken and is worse than the duplicate
this change removes.

**Decision:** the card gains a second way in. When the group lookup finds nothing, resolve
the marker by id from the full set, present it as a card of one, and say on the card that
this place is hidden by the current filter. The filter is not touched.

**Why not clear the filter:** it was set deliberately, the person would have to notice it
had been unset and set it back, and a product changing a setting to make its own output
make sense is the kind of silent side effect this repo already treats as a defect.

**Why not fall back to offering a new marker:** that is the bug, reintroduced for a subset
of cases and triggered by a setting unrelated to it.

**The subtlety this must not break.** Both files return null on a failed lookup on
purpose, and both say why: a group can shrink under an open card because another member
*removed* the marker, and the card must close rather than show something else. The new
fallback must distinguish **hidden** from **gone** — resolve by id against the trip's full
set, which a removed marker is no longer in — or it resurrects a card for a deleted place.
That is the single most likely way to get this wrong, and it type-checks either way.

**Scope of the note:** raised only on this path, where the application put a hidden place
on screen on the person's behalf. Nothing else in either application can open a card on a
marker the filter is hiding, so no other caller acquires the state.

**Corrected after looking, which is the point of looking.** The note alone was not enough.
On the phone — camera centred on the place, sheet over the lower half, nothing else on
screen — an empty map with a sentence over it read as the application having failed. The
laptop survived it only by luck of the surrounding pins. So the place is now **drawn** for
as long as its card is open, as one pin outside the drawn set: it frames nothing, counts
toward nothing, appears in no list, and goes when the card goes. The draft pin already has
exactly this standing and exists for the same reason, which is what made the mechanism
obvious once the screen had been seen. `marker-filtering` was reworded to match — the
filter still governs what the map reports the trip to contain, and one named place under
an open card is not that.

### The web's camera move comes out of `beginCreate`

`beginCreate(position, initial, moveThere)` sets the camera itself. A branch that opens a
card instead of calling it therefore loses the fly-to, and `#83` requires the zoom to be
unchanged. The move is lifted so both branches of `onChoose` perform it explicitly.

The phone needs nothing here: its `flyTo` is already in `onChoose`, before `beginCreate`,
and both branches keep it by construction. The platforms differ in what they *pass*,
though, and the first answer was wrong: the match branch was written to pass no inset at
all, reasoning that a details sheet is not the form and does not cover as much. Looking at
it settled the question — the sheet sat on top of the pin. The form opens at 52% of the
window (`DETENTS[0]`) and the details sheet is capped at 50% (`SHEET_CAP`); at the sizes
that matter they are the same, and the distinction the argument rested on does not exist.

Each branch now asks the sheet that is about to open for its own height, rather than one
borrowing the other's number — they are close today and nothing holds them there. The
details sheet answers with its **cap**, not the height it will take: it sizes to content,
the content is not known before it mounts, and an upper bound errs toward a place sitting
higher than it needed to rather than behind the sheet. Only one of those two is
recoverable by the person looking at it.

### The phone opens the card through the map's imperative handle

The phone keeps the card's open state inside `trip-map.tsx`, while `onChoose` runs in
`trip-workspace.tsx`. The parent cannot set that state directly.

**Decision:** add a third method to the handle the map already exposes beside `flyTo` and
`frameOn` — open the card for a given marker. Lifting the open state up into the workspace
would be the larger and more disruptive alternative, touching selection, framing and the
sheet's own lifecycle for one new caller.

## Risks / Trade-offs

- **The geocoder shifts a coordinate and matching silently stops working.** → The failure
  mode is today's behaviour, which is survivable and visible. The rule is stated in the
  specification as position equality, so widening it is a decision with a reason rather
  than a constant edit. Not mitigated further; a tolerance is the thing being avoided.
- **A card opens over a place with no pin under it.** → Happened, was looked at, and was
  worse than predicted on the phone. Resolved by drawing the place while its card is open;
  the note now explains a pin rather than an absence. The remaining risk is the inverse —
  that a pin outside the filtered set leaks into something that counts markers — which is
  why it is passed separately rather than merged into the drawn set at the caller.
- **The by-id fallback resurrects a card for a removed marker.** → Resolve against the
  trip's markers, not against a snapshot, so a removed marker is absent and the card still
  closes. Explicitly tested, because both current implementations return null here on
  purpose and the fallback is a change to that behaviour.
- **The camera regression on the web.** → Invisible to the type checker and to any test
  the web can run. Covered by a task that watches the fly-to on both branches in the
  running application.
- **The two applications drift on what a match is.** → One function, one package, one set
  of tests; neither application writes a coordinate comparison.

## Migration Plan

None required. No stored data changes, no schema moves, no configuration. The change is
inert for every candidate that does not match, so the behaviour it alters is reachable
only by searching a place the trip already holds.

Rollback is reverting the commit.

## Open Questions

- **The wording on the card when the place is hidden.** It has to say the place is on the
  trip and the filter is why the map looks empty, without reading as an error. Settled
  when the card is looked at, not before.
- **Whether that note offers to clear the filter.** Offering it is not the same as doing
  it, and the trip already exposes clearing from where the narrowing is visible
  (`marker-filtering`: *A narrowed view declares that it is narrowed*). Left out unless
  looking at the screen argues for it.
- ~~The camera inset on the match branch of the phone.~~ **Answered by looking.** No inset
  was wrong — the sheet covered the pin. The branch now passes the details sheet's own cap,
  exported from `marker-details.tsx` the way the form exports `openingHeight`.
