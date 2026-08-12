## Why

Place search will offer a result on another continent and give no sign that it
has. Run a real list of thirty-five Osaka places through it and six come back
confidently wrong — a park in Spain, a temple in Peru, a fire hall in Canada —
each rendered exactly like a correct match and each one saveable.

The cause is not a bug in the query. It is that a saved place is usually written
down with a note attached to it — "El Parque de la Expo 70", "Barrio Shinsekai",
"Katsuo-ji - El templo de los Daruma" — and those extra words are what the
geocoder matches on. A person cannot tell from the name alone that "Parque
Suigetsu" resolved to Galicia, because the list shows a plausible name and a
plausible-looking place and nothing else.

The one fact that separates every wrong result from every right one is already
known at the moment the list is drawn, and is simply not shown: how far away it
is. The correct matches were all within 17 km of the city being planned. The
wrong ones ranged from 270 km to 16,187 km.

## What Changes

- Every candidate carries its distance from the point search was biased toward,
  and the search list shows it.
- A candidate well away from where the person is working is marked, so a wrong
  match is visible while scanning rather than only on inspection.
- Distance is presented and **never** used to filter. A trip contains day trips;
  Osaka to Hiroshima is 280 km and a perfectly ordinary thing to save. Excluding
  by distance would break the requirement that bias ranks rather than restricts,
  which exists for exactly that reason.
- Nothing is pinned to a country. `countrycode` would have fixed every wrong
  result in the sample and would also break a trip that crosses a border, which
  is the case the currency-per-city decision was made to support.

## Capabilities

### Modified Capabilities

- `place-search`: a candidate gains its distance from the bias point, and the
  requirement that candidates carry enough to become a marker extends to
  carrying enough to be *judged*. Distance is display, never a filter.

## Impact

**`@pinpoint/map`** gains a great-circle distance between two points. It belongs
there rather than in the geocoder: it is pure geometry, both platforms will want
it the moment anything asks "what is near me", and that package is the base of
the graph.

**`@pinpoint/geocode`** stamps each candidate with its distance when a bias point
was supplied, and leaves it null when none was — no bias means no reference, and
inventing one would be worse than saying nothing.

**`apps/web`** renders the distance in the result list and marks the far ones.

No database change, no new dependency, and no change to what is stored: this is
entirely about what a person is shown before they choose.
