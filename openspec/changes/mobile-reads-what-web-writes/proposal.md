# The phone records interest and filters, like the laptop does

## Why

The roadmap now says the phone gets everything the laptop has, reversing the asymmetry
the first four changes were built on. This is the first change under that decision, and
it is deliberately the smallest: interest, visited and filtering are already defined once
and shared, so the phone needs to draw controls rather than decide anything.

It is first because it is the one that tests a promise. Both "web application only"
requirements were written stating that lifting them should be *"a change to one
application rather than a reimplementation"*. If that holds, this change is small and the
two larger ones are predictable. If it does not, that is worth discovering here rather
than halfway through mobile capture.

There is already one thing it does not hold for. The mobile screen has no client-side
state: `useQuery` returns a read-only result and markers pass straight from the query into
the map. The web workspace holds markers in state precisely so a write appears without
re-reading the trip, and every optimistic write depends on that. The phone has nowhere to
put one, and this change is where that arrives.

## What Changes

- **Recording interest on the phone.** Each member's state on the marker sheet, the
  reader's own row interactive, everybody else's read-only — the same rule as web, drawn
  as a sheet rather than a card.
- **Marking a place visited on the phone.** The control that most belongs here: visited is
  decided standing outside a place, not at a laptop, and until now it could only be
  recorded on the machine nobody has with them.
- **Filtering on the phone**, by who wants to go and by visited, using the same predicate
  the laptop uses, so the two cannot disagree about what a trip contains.
- **Client-side marker state on mobile**, so an optimistic write shows immediately and
  reverts on failure. This is new to the platform rather than a port: nothing on mobile
  currently holds what a query returned.
- **BREAKING (specification only):** the requirement that recording interest and marking
  visited are offered by the web application only is removed, not amended. Nothing in the
  product breaks — a restriction is being lifted — but a requirement that other changes
  may have relied on stops existing.

**Not in this change:** adding, editing or removing a place on the phone; anything to do
with location or "what's near me"; a distance-sorted list. Those are the next two roadmap
items, and the middle one carries a design question about lists that this change must not
answer by accident.

## Capabilities

### New Capabilities

None. Everything here is behaviour the specifications already describe; what changes is
which applications offer it.

### Modified Capabilities

- `marker-interest`: removes the requirement scoping recording and visited to the web
  application, and replaces it with one requiring both applications to offer them while
  leaving each free to draw them in its own idiom.
- `marker-filtering`: adds a requirement that both applications offer filtering. The
  existing requirements are already platform-neutral — they say what a filter selects, not
  who offers one — so without this, a phone that silently never filtered would satisfy
  every word of the specification.

## Impact

- `apps/mobile` — the whole of the work. Interest rows and a visited control on the marker
  sheet, a filter control with nowhere obvious to live (the header is a wordmark, a trip
  name and a sign-out button, with no toolbar beneath it), and marker state that survives
  a write.
- `packages/core`, `packages/data`, `packages/map` — expected to need **no change at all**.
  `matchesFilter` is a pure function, `recordInterest`, `withdrawInterest` and
  `setMarkerVisited` already take a client, and `MarkerView` already carries visited. If
  any of them needs editing, the portability claim was weaker than stated and that is the
  finding rather than a detour.
- `apps/web` — untouched. Parity here means the phone catching up, not the two converging
  on something new.
- No migration. No new dependency. No schema change.
