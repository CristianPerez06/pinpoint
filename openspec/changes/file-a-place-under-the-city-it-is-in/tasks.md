## 1. Measure before deciding anything

The threshold is the whole rule. `FAR_AWAY_KM` was taken from thirty-five real places
rather than from theory, and this needs the same treatment — with one difference worth
holding on to: being wrong about `FAR_AWAY_KM` costs a misplaced highlight, and being wrong
here files a place under a city it is not in.

- [x] 1.1 For every city on the real trip, record the distance from each of its markers to
      the nearest *other* marker filed under the same city. This is how tightly a city's
      places actually cluster
- [x] 1.2 Record the distance from each marker to the nearest marker of a *different* city.
      This is how close two cities get to each other in practice
- [x] 1.3 Find the gap between the two distributions. The threshold lives in it. **If there
      is no gap, stop** — the rule needs rethinking, and a number chosen to paper over an
      overlap would file places wrongly and look measured while doing it
- [x] 1.4 Take the same readings against the centre of each city's markers as well as the
      nearest marker. The design chose nearest-marker on reasoning; this is where that gets
      confirmed or overturned before any code depends on it
      — **cannot be discriminated by this trip.** Its two cities are 360 km apart, so both
      metrics give the same answer for all 35 places. The choice stands on the reasoning in
      `design.md` and is untested
- [x] 1.5 Record how many places on the trip today would change city under the rule, and
      name them. A rule that would refile a third of the trip is not describing this trip
- [x] 1.6 Keep every reading in this change directory

## 2. The rule, in `@pinpoint/core`, with tests

- [ ] 2.1 Add the function: a position and the trip's cities with their markers in, the
      claiming city or nothing out. Structurally typed so `Marker` and `City` satisfy it
      without new dependencies
- [ ] 2.2 Distance from `@pinpoint/map`'s `distanceKm` — the same function search already
      measures with, so the two cannot disagree about how far apart two points are
- [ ] 2.3 Return the three outcomes as one closed value rather than a city-or-null: claimed
      by one, claimed by none, claimed by several. A caller that has to infer which case it
      is from a null is a caller that will get the third one wrong
- [ ] 2.4 The name half: a city of the reported name takes the place, whatever the distance;
      comparison is normalised for case, whitespace and accents and is **not** fuzzy; a
      pointed position carries no name and uses position alone
- [ ] 2.5 Never offer a name the trip already holds. Test the case that found this: a city
      that exists with no markers claims nothing by position, and must still not be offered
      for creation a second time
- [ ] 2.6 Tests for each outcome, and for the ones nobody would click: a city with no
      markers claims nothing; a trip with no cities claims nothing; a place equidistant from
      two cities is ambiguous rather than resolved by list order; a place well outside
      everything is claimed by none
- [ ] 2.7 A test that the ordinary case is stable — a place among a city's own markers is
      claimed by that city and by nothing else
- [ ] 2.8 `pnpm test`, `pnpm check:cycles`, `typecheck:packages`

## 3. The candidate's city, in `@pinpoint/geocode`

- [ ] 3.1 Carry the service's city as its own field on `PlaceCandidate`, beside `context`
      rather than parsed back out of it
- [ ] 3.2 Null where the service gave none. Do **not** fall back to county, state or
      country — offering those as a city to create makes a group nobody meant to make
- [ ] 3.3 Tests, including a feature with no city and one where the city equals the place's
      own name
- [ ] 3.4 Confirm nothing about ranking, ordering or what is returned changed

## 4. The form, on both platforms

- [ ] 4.1 The city default comes from the rule rather than from the selection, on **both**
      entry paths and **whether or not a city is selected**. Delete the selection default
      rather than leaving it as a fallback — a fallback is how it comes back
- [ ] 4.2 Confirm selection still frames the map and biases search. Those read the same
      value and must not be disturbed by removing its third job
- [ ] 4.3 The "claimed by none" case offers the candidate's city for creation, prefilled and
      editable, through the create-a-city path that already exists in the form
- [ ] 4.4 The "claimed by several" case offers the claimants and selects none
- [ ] 4.5 The ordinary case says nothing. No badge, no confirmation, no note — this is a
      requirement, not an absence, and it is the one most easily lost while building the
      other two
- [ ] 4.6 A dropped pin has no candidate and therefore no city name. The "claimed by none"
      case there offers creation without a name to prefill; decide what it says against the
      screen rather than in review

## 5. The unassigned group

- [ ] 5.1 Add **Unassigned** to the city list on both platforms, with its count, selecting
      the places no city holds
- [ ] 5.2 Decide whether it appears when nothing is unassigned. **The live trip has zero
      unassigned places**, so on real data the row is empty until this feature first
      declines to guess — a row reading `0 places` would be permanent furniture until then. A row reading `0 places` is
      noise and a row that comes and goes moves the list under the pointer —
      `marker-filtering` has answered this shape of question once already, for the filter
      control, and that reasoning is the place to start
- [ ] 5.3 Confirm the counts account for the whole trip: the cities plus unassigned equal
      the total
- [ ] 5.4 Confirm selecting it frames those places the way selecting a city does

## 6. Look at it, on both platforms and in both themes

The ordinary case is defined by *nothing happening*, which no test here can observe.

- [ ] 6.1 Save a place while the whole trip is in view. It is filed where the rule says,
      not left unfiled — this is the behaviour that changed, and the one somebody may be
      relying on
- [ ] 6.2 Save a place near the city being worked in. The form defaults to it and says
      nothing. Do this several times — this is the case that must not become noise
- [ ] 6.3 Save a place near a different city on the trip. The form shows that city, and the
      change is noticeable without being loud
- [ ] 6.4 Save a place near nothing. The offer names the right city, creating it files the
      place there, and nothing typed is lost
- [ ] 6.5 Two cities claiming one place, using a real pair from the trip if the readings in
      section 1 found one. If they did not, say so rather than manufacturing one
- [ ] 6.6 A place whose city the trip already has by name is filed there even when that
      city's other places are far away
- [ ] 6.7 Pointing and searching at one position may land differently. Confirm that both
      answers are defensible rather than that they agree — the guarantee that they would was
      dropped deliberately
- [ ] 6.8 A city with no markers claims nothing, and a place belonging to it is reported as
      belonging to no city
- [ ] 6.9 The Unassigned row: its count, selecting it, and that it agrees with the map
- [ ] 6.10 Both themes, both platforms, for every new thing drawn

## 7. Close out

- [ ] 7.1 `openspec validate file-a-place-under-the-city-it-is-in --strict`
- [ ] 7.2 `pnpm verify`
- [ ] 7.3 Write the measured threshold and its readings into the spec's rationale, so the
      next person reads the number and the data behind it together
- [ ] 7.4 Record anything the looking turned up that this change deliberately did not fix
