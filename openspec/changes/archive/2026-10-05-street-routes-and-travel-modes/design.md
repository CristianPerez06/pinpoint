## Context

The straight-line route (#274) already holds the shape this change grows into. Each app
keeps `{ markerId, from }` beside the open place: on the laptop in
`apps/web/app/_components/trip-workspace.tsx`, and on the phone in
`apps/mobile/components/trip-map.tsx`. Each builds a `routeOffer` for `MarkerDetails`.
`@pinpoint/map` describes the line (`routeFeature`, `routeLayers`), and each app binds it
under the location dot. Framing goes through `frameAround`, plus the laptop's sideways fit
beside the card, and both already take any number of points.

`@pinpoint/geocode` is the model for talking to a free public service: the caller passes
in `fetch`, nothing throws, every outcome is a tagged result, and pacing and a small cache
live in the package. The phone knows when it is offline (`useOnline()` in
`apps/mobile/lib/connectivity.tsx`). **The laptop has no such signal today.** The phone
remembers preferences in AsyncStorage (`apps/mobile/lib/preferences.tsx`); the laptop uses
cookies (`pp-theme`, `pp-language`).

The services, the request shapes and the limits were measured in the spike
(`docs/spikes/2026-10-04-routes-between-places.md`, "Technical notes").

## Goals / Non-Goals

**Goals:**
- One shared implementation of the request, the answer, the pacing and the cache, so the
  two apps cannot ask differently or show different figures.
- Stay inside both services' published terms: at most one request a second, the client
  identified, credit given.
- Keep the straight line as the floor: whatever fails, the person still sees the estimate.

**Non-Goals:**
- Keeping street routes for use with no connection (proposal, decision 4).
- Routes between two places, or turn-by-turn directions.

## Decisions

**A new package, `@pinpoint/routing`, shaped like `@pinpoint/geocode`.**
It holds `buildValhallaUrl`, `buildOsrmUrl`, the two answer parsers, the encoded-polyline
decoder (precision 6, pure arithmetic), and `createRouter(fetcher, { clientId })`, which
returns `route(from, to, mode, signal)`. The result is
`{ kind: 'ready', km, minutes, line } | { kind: 'none' } | { kind: 'failed' } | { kind: 'aborted' }`.
`'none'` means the service answered and found no way; `'failed'` covers no answer,
refusal and bad data. The app shows the same thing for both, but the tests tell them
apart. It depends on `@pinpoint/map` for `LngLat` only. It is added to both apps'
dependencies and to `transpilePackages`. Putting this in `@pinpoint/map` was rejected,
because that package may perform no I/O at all.

**Valhalla first, OSRM as the fallback, chosen per request.**
Modes map to `pedestrian`/`bicycle`/`auto` for Valhalla and `foot`/`bike`/`car` for OSRM
(`routed-foot`, `routed-bike` and `routed-car`). OSRM is tried only when Valhalla
*fails*. When Valhalla finds no way, that answer is kept, because asking a second router
the same question costs a request and only rarely gets a different answer. The bounded
wait is 8 seconds in total across both attempts, through one `AbortController`.

**Headers follow each service's preflight, not a common set.**
Valhalla gets `X-Client-Id: pinpoint` from both apps. OSRM gets no custom header from the
browser, because its preflight refuses `X-Client-Id`. The phone sends its existing
`User-Agent` to both. That string is built in `apps/mobile/components/place-search.tsx`
today, so it moves to `apps/mobile/lib/user-agent.ts`, used by search and routing alike.
The browser cannot set `User-Agent`, and sends `Referer`, which OSRM's terms ask for.

**Pacing and the cache live in the router, one per app.**
Requests go through a queue at least 1000 ms apart, the same mechanism as
`createEveryLanguageSearch`. Results are cached per `(from, to, mode)` in an LRU of 50.
`from` is rounded to a 50 m grid for the key, so a person standing still whose GPS wanders
reuses the answer. Only `ready` and `none` answers are cached; a `failed` one may be asked
again. The router is built once at module level in each app, so all routes share it.

**The route's state grows by mode and street route, and stays beside the selection.**
`{ markerId, from }` becomes `{ markerId, from, mode, street: StreetState }`, where
`StreetState` is `idle | finding | ready(line, km, minutes) | none`. Changing the mode
aborts any request in flight, sets `finding` and asks again. Selecting another place,
closing or *Clear* still remove it all in one update, and abort what is in flight.

**The card is derived from that state by one pure function.**
`routeFigures({ km, mode, street, online })` in `@pinpoint/core` returns the names and
values the card shows: main line, sub line, the note (finding, none found, needs a
connection, switched to walking) and which modes are available. Both apps resolve it with
`say`. This is where the rules live: the walking estimate only for walking, distance
alone for bike and car on the straight line, `About` only on the estimate. A function
here keeps the two cards from disagreeing in wording, which is exactly what each app
choosing its own sentence would allow. The street-route time is rounded and formatted by a
new `formatTravelTime(language, minutes, mode)` beside `formatWalkingTime`.

**Two line styles from one description.**
`routeLayers(mode, form)` where `form` is `'straight' | 'street'`. The straight form keeps
today's layers exactly. The street form keeps the same casing and ink, with no dash and a
line width of 4.5 over a casing of 9. `routeFeature` gains a form that takes the decoded
line instead of two points. Framing passes every point of the street line to the existing
`frameAround`/`fitBounds` calls, which already take any number of points. Each app frames
once when the straight line is drawn and once more when the street route arrives.

**The laptop learns it is offline from the browser.**
A small `useOnline()` in `apps/web/lib/connectivity.ts` reads `navigator.onLine` and
listens for `online` and `offline` events, with the same name as the phone's hook. It is
coarse: `navigator.onLine` is true on a network with no internet. That case is caught by
the request failing and falling back to the straight line, which is the correct outcome
anyway.

**The connection dropping while Bike or Car is chosen is handled in the state, not the
view.**
An effect on `online` going false sets `mode: 'walk'`, `street: idle` and a
`switchedForConnection` flag that the card's note reads. When `online` goes true and the
mode is walking, it asks for the walking route. The remembered preference is written only
from the press handler, never from this effect.

**The remembered mode: an AsyncStorage key on the phone, a cookie on the laptop.**
On the phone, `TRAVEL_MODE_KEY` in `preferences.tsx`, read in the launch gate with the
others. On the laptop, a `pp-travel-mode` cookie read on the client. Nothing paints from
it before a press, so there is no need to read it on the server. This uses the cookie
rather than `localStorage` so the laptop keeps one place for preferences.

**Credits: two new entries in `MAP_CREDITS`, and the count comes out of the blurb.**
`Valhalla` (`credit.valhalla`, routing by FOSSGIS) and `OSRM` (`credit.osrm`, routing by
FOSSGIS). `credits.blurb` says "Four projects", which becomes false, so it is reworded
not to count. OSRM's terms also ask for a "fix the map" link. That goes in the credits
beside the OSRM entry, pointing to `https://www.openstreetmap.org/fixthemap`.
Checked on 2026-10-04: OSRM's page asks for one request a second, a valid user agent and
referrer, "the required attribution" and that link. Valhalla's discussion asks for one
call per user per second, an `X-Client-Id`, and credit to "OpenStreetMap, Valhalla and
FOSSGIS", which is why both roles name FOSSGIS.

## Risks / Trade-offs

- [A volunteer server goes down. A day-long Valhalla outage was reported in September] →
  OSRM is the fallback, and the straight line is the floor. Nothing about the route
  breaks; it gets less precise.
- [Several people on one trip pressing at once hit the per-app limit] → The limit is per
  user for Valhalla and per client for OSRM. The 1 s queue keeps any one device inside it.
  If a service starts refusing, the person sees *no route along the streets* and the
  estimate, not an error.
- [Both services say *non-commercial*] → True of Pinpoint today. `PRODUCT.md` records
  routing beside the geocoders under the same withdraw-rather-than-bill rule.
- [`navigator.onLine` reads true on a captive portal] → The request fails and the
  straight line stays, so Bike and Car look available but give *no route found*.
  Accepted.
- [Valhalla's route starts at the nearest street, not at the dot] → The decoded line is
  drawn as returned, and the dot sits a few metres off its start. Prefixing the person's
  position to the line was rejected, because it draws a walk through a building.
