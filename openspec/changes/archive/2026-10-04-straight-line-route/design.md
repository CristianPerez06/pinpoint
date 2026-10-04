## Context

Everything this change needs already exists in pieces. Each app has a *where am I* hook
(`apps/web/lib/where-am-i.ts`, `apps/mobile/lib/where-am-i.ts`) whose `locate()` resolves
with a position or `null` and keeps the refused and not-found status that drives the notes
over the map. `@pinpoint/map` already describes the person's dot as data
(`locationFeature`, `locationLayers`) that both `trip-map.tsx` files bind to their renderer,
and already frames points clear of a covering surface (`frameAround`). `@pinpoint/core`
already writes a distance the way Nearby does (`formatWalkingDistance`).

## Goals / Non-Goals

**Goals:**
- One shared description of the line, the estimate and its wording, so the two apps cannot
  disagree on a figure or a colour.
- Reuse the existing location path end to end, so permission, waiting, refusal and the dot
  behave exactly as *where am I* does.

**Non-Goals:**
- Any network call. The street route is #276.
- Keeping a route across sessions or devices. It lives as long as the open place.

## Decisions

**The estimate is a pure function in `@pinpoint/map`, beside `distanceKm`.**
`walkingMinutes(km): number | null` lengthens by 1.3, walks at 4.5 km/h, rounds to 5 and
floors at 5, and returns `null` beyond `NEARBY_FAR_KM`. Reusing that constant rather than
declaring a second 50 keeps "a day trip, not a walk" one number. The alternative, computing
it in each app, is how the two framings drifted apart before (`frameAround`'s comment).

**The line is data in `@pinpoint/map`, beside the dot.**
`ROUTE_SOURCE`, `routeFeature(from, to)` (a GeoJSON LineString) and `routeLayers(mode)`: a
casing in `surface` under a round-dotted line in `ink`. Ink and surface because the dot
already uses that pair, it reads on both grounds by construction, and no marker type's
colour can be mistaken for it. Each app adds the layers beneath its markers, as it does the
dot's.

**The words are named sentences, formatted in `@pinpoint/core`.**
New names: `route.calculate`, `route.calculateNamed` (accessible name), `route.finding`,
`route.clear`, `route.walkMinutes`, `route.walkHoursMinutes`, `route.straightLine`. A
`formatWalkingTime(language, minutes)` in `@pinpoint/core` picks between the two walking
sentences, beside `formatWalkingDistance`. Packages hand back names and values only; each
app resolves them with `say`.

**The route's state lives where the selection lives.**
Each workspace holds `{ placeId, from }` beside the open place. Selecting another place or
closing the details clears it in the same update that changes the selection, so the line
can never outlive the place it is about. `from` is copied from the fix once, which is what
keeps the line still while the dot keeps following the person.

**Pressing calls the existing hook's `locate()`.**
It returns `null` on refusal or timeout, and the hook has already set the status that shows
the right note, so the button needs no failure handling of its own beyond staying offered.
While the promise is pending the button is inert with `aria-busy` (web) and
`accessibilityState={{ busy: true, disabled: true }}` (native), following *Inert, not
absent*.

**Framing uses `frameAround` with both points.**
The phone passes the sheet height it already uses for a selected place. The laptop's card
sits in a corner and covers no band, so the two points are fitted into the part of the map
beside the card, and the centre is shifted by half the card's reach, the sideways version of
what `frameAround` does for a band. The lift that keeps a single selected place clear of the
card stands down while a route is drawn, or it would undo that framing. Camera `padding` is
not used (AGENTS.md).

## Risks / Trade-offs

- [The words promise a route and draw a straight line] → The figures always say *in a
  straight line* and *About*. The words were kept on purpose (proposal, decision 1).
- [A line across water or rail reads as walkable] → Accepted for the MVP. #276 replaces it
  with a street route when online.
- [The dot follows the person but the line does not, so they separate as the person
  walks] → This was decided (proposal, decision 5). If it is overruled, `from`
  becomes the live fix and nothing else moves.
