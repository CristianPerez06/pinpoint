## Context

See `proposal.md` — Why. `@pinpoint/geocode` builds a biased request and parses
the response into candidates; `apps/web` renders them. Neither currently knows
how far a candidate is, although the bias point is right there in the request.

## Goals / Non-Goals

**Goals**

- Make a wrong result visible while scanning a list, not on inspection.
- Keep the "bias ranks, never restricts" rule intact.

**Non-Goals**

- Filtering, reordering, or scoring by distance. The person judges; the
  application informs.
- Pinning the search to a country. It would have fixed every wrong result in the
  sample and would also break a trip crossing a border, which is precisely the
  case currency-per-city exists to support.
- Cleaning up the query text before sending it. Stripping notes and parentheses
  recovered seven of thirteen failures in the sample and is worth doing — but it
  belongs to bulk import, where a person is pasting a list rather than typing,
  and where a guessed cleanup can be reviewed before anything is saved.

## Decisions

### Distance lives in `@pinpoint/map`

A great-circle distance between two `LngLat` points. Pure geometry, no
dependency, and it belongs at the base of the graph beside `boundsOf` and
`fitBounds` rather than inside the geocoder — "what is near me right now" is a
roadmap step, and it will want the same function.

Haversine on a spherical earth. The error against a proper ellipsoidal
calculation is a fraction of a percent, which is invisible at the precision this
is displayed to and irrelevant to the question being asked, which is "is this
result on the right continent".

### The geocoder stamps the candidate; the app formats it

`toCandidates` takes the bias point and sets `distanceKm` on each candidate, or
null when no bias was supplied. Rounding and units are a display concern and stay
in the application — `2.3 km` and `16,187 km` want different precision, and a
package that returns a formatted string cannot serve a second locale later.

**Alternative considered — compute it in the web component.** Fewer moving parts,
and it would put the same derivation in mobile the day mobile searches. The
candidate is the thing being judged, so the fact belongs on it.

### "Far" is one threshold, and it is a display hint

100 km. Beyond it a candidate is marked; below it, not.

The number is chosen from the sample rather than from theory: every correct match
was within 17 km, and the nearest wrong one was 270 km. Anything in that gap
separates them. 100 km sits in the gap and reads as "not near where you are
working", which is what the mark means — not "wrong". A Hiroshima result while
planning Osaka is 280 km and genuinely is far away; marking it is honest.

It is deliberately not a filter, so being wrong about the threshold costs a
misplaced emphasis and never a missing result.

## Risks / Trade-offs

**A marked candidate reads as "invalid" rather than "far".** → The mark carries
the distance itself rather than a warning word, so it states a fact rather than a
verdict.

**Distance is from the bias point, not from the person.** → That is what the
question needs: the bias point is where they are planning. "Near me right now" is
a different feature, and it will use the same shared function against a different
origin.

## Migration Plan

None. No stored data changes and no schema moves; a candidate is a transient
value that exists between a keystroke and a save.
