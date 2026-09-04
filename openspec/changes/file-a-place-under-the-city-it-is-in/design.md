## Context

The capture form defaults its city to whichever city is selected. That default is right
almost always and wrong silently, and `#52` is about the wrong half: a day trip, a
stopover, or two cities planned in one sitting produces a place filed under a city it is
not in, asserted with total confidence and never questioned again.

Three facts already written down shape what the fix can be.

**A city has no position.** `packages/core/src/city.ts` states it as a design decision, not
an omission: *"nothing depends on it being one [a real city] — no lookup resolves it to a
position, because the markers filed under it already say where the group is."* So "where is
Kyoto" is only answerable as "where are the places filed under Kyoto", and a city with no
markers is not answerable at all.

**The product already reasons this way.** Search bias derives the point to rank around from
the selected city's markers, without any lookup. This change asks the same data a different
question.

**Substituting an answer without a sign is already a defect.** `markers/spec.md`: *"A marker
whose city reference is rejected SHALL NOT be stored at all, rather than being stored
unassigned. Silently dropping the city would file a place somewhere the person did not
choose and give no sign of it."* That rule counts "no city" as a substitution too, which is
what stops "leave it unassigned when unsure" from being a free answer.

## Goals / Non-Goals

**Goals:**

- A place near the city being worked in is filed there, silently, as today.
- A place near a different city on the trip is filed there instead, visibly.
- A place near no city the trip holds is left unfiled, with the city it is actually in one
  press from existing, and never a second city under a name the trip already has.
- Where the rule cannot tell, it asserts nothing and says so.
- The same rule covers both entry paths, because both have a position.
- An unfiled place is findable.

**Non-Goals:**

- Refiling anything already saved. Every existing marker stays where it is.
- Resolving a city name to a position, by lookup or by any other route. That is the
  decision `city.ts` records, and this change depends on it rather than reversing it.
- Guaranteeing that pointing and searching reach the same city. They can differ, because
  one of them knows the city's name and the other cannot.
- Deciding what is *close enough to visit in one outing*. `city.ts` says the map answers
  that, not a field, and that is unchanged.
- Any new request, service, or stored column.

## Decisions

### The geocoder's city is consulted first, and position answers when it cannot

**Decision:** a trip city whose name matches the city the geocoding service reported takes
the place. Where there is no such city — or no reported city at all — position decides.
A city SHALL never be offered for creation under a name the trip already holds.

**Why the name leads.** "Which city is this place in" is the question being asked, and the
service answers it directly. Proximity to a trip's own markers is a proxy for that answer —
a good one, but it is inferring the city from wherever somebody happened to save things,
and when the direct answer is in hand, preferring the proxy is strange.

**Why not the other order** — geometry first, the name only where geometry is silent. It
differs only when the two disagree, and where they do the name is the better witness: a trip
holding a city called Nara, and a service reporting the place is in Nara, is not a
coincidence to be overruled because the other Nara places happen to be filed further away.

**Why the name cannot be the whole rule.** It misses "Kyoto days", misses "京都", and across
most of a large metropolitan area the service answers with the ward — "Shibuya", not
"Tokyo". Those misses are ordinary rather than exotic. They fall through to position, which
is why both halves exist.

**The defensive half is not optional, and finding that out is what settled this decision.**
An earlier draft had the name label a city and never select one. It has a bug: a city
created in the list before anything is filed under it holds no markers, so it claims
nothing, so a place plainly inside it reaches the "no city claims this" branch and is
offered *"create Nara"* on a trip that already has Nara. Two cities, same name, one of them
made by the feature meant to prevent exactly this. Once the name has to be consulted to
avoid that, refusing to let it also select the city it found is arbitrary.

**Matching is on normalised text** — case folded, surrounding whitespace removed, accents
normalised. It is not fuzzy. "Kyoto days" against "Kyoto" stays a miss and falls through to
position, which is the correct outcome rather than a shortfall.

**Consequence, accepted deliberately:** the two entry paths can disagree. A searched place
carries a city name and a pointed one does not, so at a boundary the same position added
two ways may default differently. An earlier draft guaranteed they would not, which is only
achievable by discarding a fact the product holds. Search is better informed, and saying so
is better than levelling down to what pointing can know.

### Selection stops deciding what a place is filed under

**Decision:** the rule applies whether or not a city is selected. Selection keeps framing
the map and biasing search, and stops being an input to filing.

**Alternative considered — apply the rule only while a city is selected**, leaving "no
selection" to mean "no city" as it does today. It preserves a behaviour somebody may rely
on, and it leaves the defect intact in a common view: planning a whole trip with everything
on screen is exactly when places from several cities get added, and it is the view where
noticing matters most.

**Alternative considered — let a selected city win when it also claims the place.**
Indistinguishable from the rule alone in that case, and where they differ it lets the
selection file a place into a city it is plainly not in, which is `#52` verbatim. It fixes
the bug everywhere except where it was reported.

**Why "nothing selected" was never an instruction.** There is no way to select *nothing* as
a mode; null is the value that means **all places**, a viewing state. Treating a view as a
statement about filing held together only while selection was the whole rule.

**What it costs.** Selecting the whole trip used to be a dependable way to get an unfiled
place, and stops being one. Choosing no city in the form is still one action away and is now
the only thing that means it — which is the honest arrangement, since it is the only one of
the two that was ever about filing.

### A city claims a place within a distance of its nearest marker

**Decision:** distance is measured to a city's **nearest** marker, not to the centre of its
markers.

**Alternative considered — the centre** (`fitBounds(markers).center`, which search bias
uses). One point per city, stable, already computed. It fails where a city's markers are
spread or fall in two clusters: a place at the edge of a sprawling Kyoto is a kilometre from
the nearest Kyoto marker and eight from the centre, and a bimodal city has its centre in
empty ground between the two clusters.

Nearest-marker also matches the question being asked. A city is *"whatever the person chose
for a group of nearby places"*, so the honest test is "is this near the places already in
that group", which is what nearest-marker measures literally.

**Its own failure:** two cities whose markers interleave — someone filing "Kyoto" and
"Higashiyama" as separate groups over the same ground — will flip between them. That is a
trip modelled in a way the product does not encourage, and it lands in the ambiguous branch
rather than producing a confident wrong answer, which is the acceptable direction.

### The threshold: 15 km, floored by measurement rather than derived from it

**Decision:** a city claims a place within **15 km** of its nearest marker. The readings
behind it are in `readings.md`, taken against the live trip before any code was written.

What the data gives:

```
nearest place in the SAME city        max  4.61 km
nearest place in a DIFFERENT city     min  360.78 km
```

The distributions do not overlap, which clears the stop condition the task list carried —
no gap, no threshold, rethink the approach. 4.61 km is the floor: below it, places that
plainly belong together stop being claimed.

**What the data does not give is the number.** Any value between about 5 km and 360 km
behaves identically on this trip, because its two cities are Tokyo and Kyoto and they are
360 km apart. The case this rule was designed to survive — neighbouring cities about 35 km
apart, where a threshold could reach across — is absent from the data entirely.

So 15 km is *chosen*: three times the observed maximum, so a sparser city than either of
these still holds together, and comfortably under 35 km, so two neighbours cannot claim each
other's places.

**This is deliberately weaker than `FAR_AWAY_KM` and must be described that way.** That
number came from a distribution with a meaningful edge — every correct match inside 17 km,
the nearest wrong one at 270 km — so the value sat in a gap the data itself defined. Here
the gap is so wide it cannot discriminate. Writing "measured" in the specification would let
a later reader believe the boundary case had been tested when nothing in this trip touches
it, which is the same failure as a token described by how it should feel: an accurate
sentence that licenses a wrong reading.

**Revisit condition:** a trip whose cities are close enough to be day trips of one another.
That is the shape of trip that can falsify this number, and no amount of data from this one
will.

### Ambiguity is "more than one city claims it", and it chooses nothing

**Decision:** cities are not ranked and the nearest is not preferred. Each city either
claims the place or does not, and:

```
exactly one claims it   →  that city
zero claim it           →  no city, and the geocoder's city offered for creation
two or more claim it    →  no city, and the claimants offered
```

**Why not pick the closest of two claimants:** it reproduces `#52` at a lower rate. Still a
confident answer, still silent, still wrong sometimes — and a rule that is wrong rarely is
harder to distrust than one that is wrong often.

**Why comparing margins was rejected:** "nearest, unless the second is within X% of it"
needs a second threshold with no data behind it, and is far harder to explain than a place
being inside two circles.

**Why ambiguity is affordable:** at a city-sized radius, cities 35–40 km apart — Kyoto to
Nara, Kyoto to Osaka — barely overlap. The branch should fire seldom, which is the condition
for it being allowed to cost a press.

### Choosing nothing is only honest if it is visible

**Problem:** `marker-capture` and `markers` both say an unfiled place "appears among the
trip's markers, grouped as unassigned". No such group exists. The city list offers *All
places* and one row per city, so an unassigned place is in no selectable bucket and is
findable only by opening it or by noticing the row counts do not sum to the total.

**Decision:** the city list gains an **Unassigned** row, inside this change.

It is tempting to file that separately, and wrong: this change deliberately produces
unassigned places, so shipping it without the row moves the silent failure rather than
fixing it. The gap already exists and is survivable only because unassigned places are
currently rare accidents.

### Silence is a requirement, not an absence

**Decision:** the ordinary case — a place near the city being worked in — says nothing at
all. No badge, no confirmation, no note.

This is worth stating because it is the case that cannot be tested here and the one most
easily lost. A feature that announces itself on every save is noise, and noise is how a
signal that matters three times a trip gets ignored.

## Risks / Trade-offs

- **The threshold is wrong for a trip that is not this one.** → The rule fails toward "say
  so" rather than toward a wrong city, and every outcome is visible in a field the person is
  already looking at. Revisit with data from a second trip rather than by adjusting the
  number on a hunch.
- **A city with no markers is invisible to the rule.** → It cannot claim anything, so a
  place that belongs to it lands in the "say so" branch and is filed by hand. Accepted:
  the state is transient, ending with that city's first marker.
- **The ordinary case becomes noisy.** → The largest risk to the feature's worth. Guarded by
  making silence a stated requirement and by measuring the threshold rather than guessing.
- **A dropped pin near a different city now files itself there.** → A change to a path
  nobody complained about. It is the same defect as the search path, and leaving it would
  make the same place land in two different cities depending on how it was added.

## Migration Plan

None. Nothing stored changes and no marker is refiled — the rule applies to places being
saved from the moment it ships, and every place already on a trip stays exactly where it is.
Rollback is reverting the commit.

## Open Questions

- **The threshold itself.** Deliberately not chosen here; the measurement is a task.
- **What the third outcome says when the geocoder gave no city.** A rural place can come
  back with only a county or a state. Offering "create Kyoto Prefecture" is worse than
  offering nothing, so the form probably falls back to leaving the field empty and saying
  nothing further. Settled when the wording is written against the screen.
- **Whether the Unassigned row appears when nothing is unassigned.** A row reading `0
  places` is noise; a row that appears and disappears moves the list under the pointer.
  `marker-filtering` has already answered this shape of question once, for the filter
  control, and that reasoning should be read before deciding.
