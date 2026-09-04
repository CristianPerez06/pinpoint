## Why

Saving a place fills the city in for you, with whichever city you are working in.
`marker-capture` says why, and states the assumption plainly: *"because the place being
added is almost always part of the group they are working on."*

Almost always. When it is not — a day trip, a stopover, two cities planned in one sitting —
the default is applied anyway and nothing questions it. The result is not an unfiled place,
which would be harmless. It is a place filed under the **wrong** city, stated with complete
confidence. Cities exist to answer *which day are we spending where*, and a Nara temple
inside Kyoto answers it wrongly, silently, and possibly forever.

The fact needed to catch this is already in hand. Every search candidate carries a
position; every city's markers say where that city is — which is how search bias is already
derived, without any lookup. Comparing the two is arithmetic over data the product already
holds.

Tracked by `#52`.

## What Changes

**The city a place is filed under is guessed from where it is, not from what is selected.**
A city has no position of its own — `city.ts` is deliberate about that — so a city is
wherever its markers are. A place near those markers is very probably part of that group.

**Three outcomes, and only one of them is visible.**

- **Near the city you are working in** — nothing changes, nothing is said. This is the
  ordinary case and it must stay silent, or the feature becomes noise.
- **Near a different city on the trip** — the form pre-fills that city instead. Visible in
  the field you are about to look at, and one press to overrule.
- **Near nothing the trip holds** — the city is left empty and the form offers the city the
  place is actually in, named from the geocoder, one press from existing.

**When it cannot tell, it chooses nothing and says so.** Two cities near enough to both
claim a place is a real state, and picking the closer one would reproduce today's defect at
a lower rate — still confidently wrong, still silent. An empty city field is recoverable in
one press; a place sitting in the wrong city is a lie nobody is prompted to check.

This is the rule `markers` already states for a different case: *"Silently dropping the city
would file a place somewhere the person did not choose and give no sign of it."* Leaving a
place unassigned counts as substituting an answer too — so it is done out loud or not at
all.

**Dropping a pin is covered by the position half of the rule.** A dropped pin has
coordinates, which is all that half needs. Today it takes the same selected-city default and
inherits the same defect.

**The city list gains an Unassigned row.** `marker-capture` and `markers` both say an
unfiled place "appears among the trip's markers, **grouped as unassigned**". No such group
exists in either interface: the list shows *All places* and one row per city, so an
unassigned place belongs to no bucket that can be selected and is findable only by opening
it. That gap is survivable while unassigned places are rare accidents. It is not survivable
in a change that produces them deliberately.

**The geocoder's city is asked first, and position answers when it cannot.** Photon returns
a city with every result and `contextOf` already reads it before folding it into a display
string. Where the trip holds a city of that name, the place goes there — the service is
answering the question directly, and position is only ever a proxy for the same answer.

Where it matches nothing, position decides. It misses often — "Kyoto days", "京都", and a
ward rather than the city across most of a big metro — which is why both halves exist rather
than either alone.

**A city is never offered for creation under a name the trip already holds.** A city made
in the list before anything is filed under it has no markers, so it claims nothing by
position, so a place plainly inside it would be offered *"create Nara"* on a trip that
already has Nara. Two cities of one name, produced by the feature meant to prevent that.

**The two entry paths may disagree, and that is accepted.** A searched place knows the city
the service named it in; a dropped pin knows only where it is. Guaranteeing they agree means
discarding a fact the product holds.

**Selection stops deciding where a place is filed.** Today the form defaults to the selected
city, and to no city when the whole trip is in view. Both go: a place is filed by where it
is, whatever is selected. Selection keeps framing the map and biasing search, which are the
jobs it has. Selecting nothing was never a way of saying "file this nowhere" — it is the
value meaning *all places*, a view — and leaving that case out would preserve the defect in
the view where planning a multi-city trip actually happens.

**Not breaking**, with one behaviour deliberately changed: viewing the whole trip and saving
a place used to reliably leave it unfiled, and now files it where the rule says it belongs.
Choosing no city in the form remains one action away. Nothing stored changes, no schema moves, and every place already filed
stays where it is. A place near the city being worked in behaves exactly as it does today.

## Capabilities

### Modified Capabilities

- `marker-capture`: *A place is filed under a city chosen as it is saved* currently says the
  form defaults to the city being worked on. That becomes conditional on the place being
  near it, with the three outcomes above; the requirement gains the rule that a guess is
  never made silently — including a guess of "no city" — and drops selection as an input to
  filing, keeping it for framing and bias.

- `marker-filtering`: gains the Unassigned group. It is where narrowing a trip to a subset
  is defined, and *Every marker remains reachable* is the requirement an unlistable place
  contradicts — reachability is stated there for markers a filter excludes, and the same
  guarantee has to hold for one no city claims.

- `place-search`: a candidate already carries a distance from the search bias point. This
  adds that its position is also compared against the trip's cities, and that the
  geocoder's city name is carried through for naming rather than discarded at the parse
  boundary. What search returns, how it ranks, and how it fails are untouched.

`map-rendering` and `markers` are **not** modified. No camera behaviour changes and no
stored shape changes.

## Impact

**Shared packages** — `@pinpoint/core` gains the rule as a pure function: given a position
and the trip's cities with their markers, which city claims it, or none. It belongs beside
`marker-filter.ts` as another predicate over a trip's own data, it is the only way it gets
a test, and both applications must reach the same answer from the same trip.
`@pinpoint/geocode` carries the candidate's city as a field rather than only inside
`context`.

**Both applications** — the capture form's city default comes from the rule instead of from
the selection, on both entry paths; the form gains the offer to create the city a place is
actually in; the city list gains the Unassigned row.

**Database, dependencies, configuration** — none. No column, no query, no new service, no
extra request. The `$0` constraint is untouched.

**Verified by looking, and it has to be** — a threshold is a number that will look correct
while being wrong, and the ordinary case is defined by *nothing happening*, which no test
here can observe. The number should be derived from the real trip the way `FAR_AWAY_KM`
was: that comment records thirty-five Osaka places where every correct match landed within
17 km, and this change needs the same measurement across the cities actually on the trip.

**Adjacent** — `#83`, now merged, which also asks what the trip already knows about a
candidate but answers a different question about it (whether the place is already saved).
The two do not overlap: one compares a candidate to markers by exact position, this one
compares it to cities by proximity.
