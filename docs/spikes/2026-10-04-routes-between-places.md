# Spike: can the apps show a route and travel distance between places? (#244)

Written 2026-10-04. Analysis only. Nothing in the code changed, and every number below
was measured today against the live services, with a Kyoto walk as the test case
(Kiyomizu-dera to Fushimi Inari, about 3.3 km in a straight line).

## The short answer

**Yes, for free, as long as the phone has signal.** Three public routing servers answer
with no key, no signup and no bill, and the laptop can call them straight from the
browser. All three give walking, cycling and driving. **None gives public transport**,
and nothing free does.

With no signal there is no free route. The honest offline answer is the straight-line
distance the apps already show in Nearby, plus a walking estimate, plus any route the
phone fetched earlier and kept.

**Recommendation: build it in two steps.** Step one is the straight line with a walking
estimate (works everywhere, no service, small). Step two draws a real route from the
FOSSGIS Valhalla server, falling back to their OSRM server, when the device is online.
Routing over the map tiles the phone already downloads was tested and does not work well
enough (approach 3 below).

## What the person would see

On a place's details, under the name, one line such as:

> 25 min walk · 1.8 km

With signal, the map draws the walking route from where the person is to that place as
a line, and the figures are real. Without signal, the line says *about 20 min walk ·
1.3 km in a straight line* and the map draws no route, unless this exact route was
fetched before and is still kept on the phone.

Three things are not decided here and are yours to settle before a change is proposed:

1. **From where to where.** From the person to the place being read is the obvious
   first case. Between two saved places (for *can we do these three in one afternoon*)
   would come after, probably from the calendar's day view. Both are cheap once the first
   exists.
2. **Which travel modes to offer.** Walking only is enough for the trip described in
   `PRODUCT.md`. Cycling and driving are free too, but each is a control to add.
3. **Whether a route line should show on the laptop at all**, or only the figures. The
   rule that nothing is reachable from one app alone says the capability must exist on
   both; how prominent it is may differ.

## Approach 1: straight line plus a walking estimate

**What it is.** The distance Nearby already computes (`distanceKm` in `@pinpoint/map`),
written beside an estimated walking time. No service, no network, works on both apps
today and with no signal.

**What the person sees.** *about 45 min walk · 3.3 km in a straight line*. The word
*about* and *straight line* stay, because the number is an estimate.

**How good is the estimate.** In a city, a real walk is typically 1.2 to 1.4 times the
straight line. Today's measurement: the straight line between the two Kyoto temples was
3.29 km and the three services' walking routes were 4.37, 4.42 and 4.62 km, so 1.33 to
1.40 times. Multiplying by 1.3 and walking at 4.5 km/h gives a figure within a few
minutes of what the routers say, and rounding to 5 minutes hides the rest.

**Cost.** Free. Smallest of the three to build: one pure function in `@pinpoint/map`, two
sentences in `@pinpoint/wording`, one line on each app's place details.

**Limits.** No route drawn on the map. Wrong across a river or a railway with no
crossing nearby, which is exactly where someone wants the answer most. The
`nearby-places` spec currently records that a walking distance "needs a routing service,
which the product's budget rules out"; that sentence is no longer true (see approach 2)
and should be rewritten whichever way this goes.

## Approach 2: a free public routing server, online only

**What it is.** When the device is online, ask a public server for the route between two
points, draw the returned line on the map, and show its real distance and time. Three
servers meet the $0 / no key rule. All three were called today and all three answered;
all three send the `Access-Control-Allow-Origin: *` header, so the laptop can call them
from the browser with no server of ours in between.

| Server | Travel modes | Result for the Kyoto walk | Policy, in one line | Policy link |
| --- | --- | --- | --- | --- |
| **FOSSGIS Valhalla** `valhalla1.openstreetmap.de` | pedestrian, bicycle, auto (also bus, truck). No transit: the multimodal request fails with "unconnected regions". | 4.42 km, 53 min | 1 call per user per second, 100 per second overall. Published apps must send an `X-Client-Id` header and say hello in a GitHub discussion. No uptime promise; a day-long outage was reported on 2026-09-02. | [valhalla/valhalla discussion #3373](https://github.com/valhalla/valhalla/discussions/3373), [Valhalla README, "Demo server"](https://github.com/valhalla/valhalla#demo-server) |
| **FOSSGIS OSRM** `routing.openstreetmap.de` | foot, bike, car | 4.37 km, 58 min | 1 request per second, valid User-Agent and Referer, attribution plus a "fix the map" link, "no scraping, no heavy usage", non-commercial. | [About routing.openstreetmap.de](https://routing.openstreetmap.de/about.html), [full terms, German](https://www.fossgis.de/arbeitsgruppen/osm-server/nutzungsbedingungen/) |
| **BRouter** `brouter.de` | hiking-mountain, trekking, shortest, several bike profiles, car | 4.62 km, 53 min | No written policy at all beyond the OSM data licence. Runs on one volunteer's goodwill. | [brouter.de](https://brouter.de/brouter/), API in [ServerHandler.java](https://github.com/abrensch/brouter/blob/master/brouter-server/src/main/java/btools/server/request/ServerHandler.java) |
| OSRM demo `router.project-osrm.org` | car, bike, foot | 5.48 km by car | "Reasonable, non-commercial use", best effort, "access shall be withdrawn at any time". Same operators as FOSSGIS OSRM. | [Demo server](https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server), [API usage policy](https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy) |

Ruled out by the budget, not by quality: OpenRouteService, GraphHopper, Stadia Maps,
Mapbox and Google all need a key, and the first three have a free tier that overflows
into billing.

**Which one.** Valhalla first, OSRM as the fallback. Valhalla is the only one with a
policy written for apps like this one (identify yourself, stay under one call a second),
it accepts the identifying header from a browser (checked today with a CORS preflight),
its walking profile knows about steps and footways, and it returns the route as a compact
encoded line. OSRM is run by the same association, so a fallback to it is not a second
relationship. BRouter is the best cycling router of the three but has no policy to lean
on, so it is the one to leave out.

**What this does to the rule in `PRODUCT.md`.** Both FOSSGIS services say
*non-commercial*. Pinpoint today is non-commercial with no users outside the founding
trip, so it qualifies. `PRODUCT.md` lists "what a stranger-facing product costs" as
undecided; if that is ever decided towards a public product, the routing server joins
Photon and Nominatim as a thing that would have to be paid for or self-hosted. The same
standing decision applies: the route is withdrawn rather than billed.

**The one-call-a-second limit.** It is per app, not per person, so with everyone on a
trip pressing at once the app has to queue. The shape that fits: one request when a
place's details open, never while the map pans, the result kept per (from, to, mode) so
reopening the same place asks nothing, and the person's own position rounded to about 50 m
before it is used as the start, so a standing person does not produce a new request every
time their GPS wanders.

**What happens with no signal.** The request fails and the line falls back to approach
1. A route fetched earlier is kept with the trip's copy on the phone (the same store the
`offline-use` spec already describes) and is drawn again if the same place is opened
offline, marked as fetched on a given day. Nothing is downloaded ahead of time: with
sixty places that is thousands of pairs, far past the one-a-second limit and against the
"no scraping" line.

**Cost.** Free. Medium to build: a new shared package shaped like `@pinpoint/geocode`
(build the request, parse the answer, the app supplies `fetch`), a route line as data in
`@pinpoint/map` the way the location dot already is (a GeoJSON feature plus layer
descriptions, each app binding them to its renderer), the kept-routes store on the phone,
and the sentence on the details sheet in both apps. Attribution: the map already credits
OpenStreetMap; the route needs "Routing by Valhalla / FOSSGIS" (and OSRM when it was the
fallback) added to the existing credits sheet, plus the "fix the map" link OSRM asks for.

**Risks.** The server may go away or block the app; the fallback and approach 1 are
what the person sees when that happens. Routes are only as good as OpenStreetMap's
footways in the place being visited; Kyoto's are good.

## Approach 3: route on the phone over the map tiles it already downloads

**What it is.** The offline map download (`offline-use`) already stores OpenFreeMap's
vector tiles for the trip's areas, and those tiles contain the streets and footways as
lines. The idea was to read those lines back, join them into a network and run a
shortest-path search on the phone. Fully offline, no service, no new download.

**Tested today and it does not hold up.** Three zoom-14 tiles covering eastern Kyoto were
fetched, their roads and footways joined into a network, and four walks computed against
the FOSSGIS OSRM walking route for the same points:

| Walk | Straight line | From the tiles | OSRM (reference) |
| --- | --- | --- | --- |
| Kiyomizu-dera to Fushimi Inari | 3.29 km | 5.00 km | 4.37 km (+14%) |
| Kiyomizu-dera to Yasaka Shrine | 1.13 km | 1.77 km | 1.20 km (+48%) |
| Kiyomizu-dera to Kōdai-ji | 0.72 km | 1.38 km | 0.62 km (+121%) |
| Yasaka Shrine to Chion-in | 0.43 km | 0.64 km | 0.62 km (+2%) |

Why: the tiles are drawn for looking at, not walking on. At zoom 14 OpenFreeMap drops the
small footways and merges many streets into single shapes, so the network comes out in
nearly 1,500 disconnected pieces per three tiles and the short cuts through the temple
district are simply not there. The long walk along main roads is close; the short walks,
which are the ones a person standing in the street actually asks about, are wrong by half
or more. Making it work would mean a second, different download of raw OpenStreetMap
data per area (from the Overpass public server, which has its own fair-use limits), plus
a tile-decoding library in each app, plus the stitching work. It would still be a worse
router than approach 2.

**Verdict.** Not now. Worth revisiting only if a routing engine ships a build that runs
inside a web page and a phone app from a free, downloadable data pack. None does today;
Valhalla's and GraphHopper's offline builds are native Android and desktop code.

## Against the ticket's acceptance criteria

- **Service that meets the cost rule, with its policy:** FOSSGIS Valhalla, fallback
  FOSSGIS OSRM. Links in the table above.
- **Travel modes:** walking, cycling and driving from either. No public transport from
  any free service.
- **No signal:** straight line and estimate, plus any route kept from earlier. No
  precomputed routes.
- **Recommendation:** build it. Approach 1 first because it is small and is also the
  offline fallback; approach 2 as the real feature on top. If you agree, the next step
  is a follow-up ticket (or `/opsx:propose`) for step one, and the three open questions
  above decide the shape of step two.

## Technical notes, for whoever builds it

- **Request shapes used today.** Valhalla:
  `GET https://valhalla1.openstreetmap.de/route?json={"locations":[{"lat":…,"lon":…},{"lat":…,"lon":…}],"costing":"pedestrian","units":"kilometers"}`
  with header `X-Client-Id: pinpoint`. Answer: `trip.summary.length` (km),
  `trip.summary.time` (s), `trip.legs[0].shape` as an encoded polyline with 6-decimal
  precision (the decoder is forty lines of pure arithmetic and belongs in the shared
  package). OSRM:
  `GET https://routing.openstreetmap.de/routed-foot/route/v1/foot/{lng},{lat};{lng},{lat}?overview=full&geometries=geojson`,
  answer `routes[0].distance` (m), `routes[0].duration` (s), `routes[0].geometry` as
  GeoJSON. The other profiles are `routed-bike` and `routed-car`.
- **Headers from the browser.** A page cannot set `User-Agent`; the browser sends the
  site's origin as `Referer`, which is what the OSRM policy asks for and what the place
  search already relies on. Valhalla's preflight allows `Content-Type` and `X-Client-Id`
  only, so send nothing else custom. OSRM's preflight allows `X-Requested-With` and
  `Content-Type`, so do not send `X-Client-Id` to OSRM from the browser or the request is
  refused before it is made. The phone sets any header it likes.
- **Where the code goes.** Request building and parsing in a new `packages/routing`
  (no dependencies, fetch injected, like `@pinpoint/geocode`). The route feature and its
  line layers in `@pinpoint/map` beside `locationFeature` and `locationLayers`. The
  offline store and the queue that keeps requests under one a second in each app, since
  they touch the network and storage. Nothing in a package returns a sentence; the apps
  word "25 min walk" from the language, the way Nearby words its distances.
- **Where the decision lives afterwards.** Rewrite the rationale in
  `openspec/specs/nearby-places/spec.md` (*Each row says what the place is and how far*)
  by copying the whole requirement, since a `MODIFIED` delta drops whatever is not carried
  forward. Record in `PRODUCT.md` that routing comes from FOSSGIS on the same
  withdraw-rather-than-bill terms as the geocoders, and that approach 3 was tested and
  rejected, with the table above, so it is not proposed again unchanged.
