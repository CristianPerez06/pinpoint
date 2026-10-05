## Why

The straight line from #274 answers *roughly how far*, but it crosses rivers and railways
and only knows walking. On the trip, the question is how long it really takes to get there,
on foot, by bike or by car. The spike for #244 found free routing servers that answer it
whenever the device has a connection. #275 settled how that should look on both apps
before it was built, and #276 is the build.

## What Changes

- With a connection, the route follows the streets. The line on the map is **solid** and
  the figures are real, for example *53 min walk · 4.4 km along the streets*. The estimate
  stays **dotted** and keeps saying *About* and *in a straight line*, so the words tell the
  two apart as well as the line does.
- The route card gains three buttons, **Walk · Bike · Car**, under the figures. Pressing
  one redraws the route for that mode and changes the figures and the icon. The chosen one
  is filled, so the choice doesn't depend on colour.
- The phone and the laptop each remember the last mode used, and new routes start with it.
- Right after pressing, the dotted line and the walking estimate show at once with
  *Finding the way along the streets…*. The street route replaces them when it arrives.
  If it doesn't arrive, the estimate stays.
- **With no connection, Bike and Car can't be pressed.** They stay visible, with a dashed
  outline, and one line says *Bike and car need a connection.* Walking shows the
  straight-line estimate exactly as it does today.
- If the connection drops while Bike or Car is chosen, the route switches to walking and
  says so. It stays on walking when the connection comes back.
- Driving and cycling times are shown at any distance. The 50 km cutoff stays for
  walking.
- The routing service is credited in the map's credits, next to OpenStreetMap.

Not in this change: routes between two saved places, or through several (a day's order is
#278); public transport, which no free service offers; keeping street routes on the phone
for use with no connection; turn-by-turn directions; the line following the person as they
walk.

## Decisions

All settled on 2026-10-04 in the #275 exploration and its mock (`mock/directions-mock.html`):

1. **From where to where:** from the person to one place. Chains of places belong to
   #278's day order.
2. **Travel modes:** walking, cycling and driving.
3. **No connection:** cycling and driving can't be pressed. Walking falls back to the
   straight line.
4. **A route kept from earlier doesn't count.** With no connection, cycling and driving
   stay off even if that route was fetched before. One rule, with no exceptions.

The mock also settled these four, which were shown for checking and not overruled:

5. A street route is a solid line, and the estimate stays dotted.
6. The estimate shows first and is replaced when the street route arrives.
7. When the connection returns, the mode stays on walking.
8. The mode buttons sit under the figures, inside the route card.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `place-route`: the route follows the streets when online, offers walking, cycling and
  driving, remembers the mode, says what it does with no connection, and credits the
  routing service.
- `nearby-places`: the rationale that a walking distance "needs a routing service, which
  the product's budget rules out" is no longer true. The rule itself, a straight line in
  Nearby, does not change.

## Impact

- **New package** `@pinpoint/routing`, shaped like `@pinpoint/geocode`: it builds the
  request and reads the answer for FOSSGIS Valhalla, falling back to FOSSGIS OSRM. The
  apps supply the network call. It has no dependencies.
- `@pinpoint/map`: a street route as line data with solid layers, beside the dotted
  straight line.
- `@pinpoint/core` and `@pinpoint/wording`: figures for all three modes and the new
  sentences, in English and Spanish.
- `apps/web` and `apps/mobile`: the mode buttons, fetching and showing the street route,
  the no-connection behaviour, the remembered mode, and the new credits.
- **A new outside service**, free with no key: FOSSGIS Valhalla, with FOSSGIS OSRM as the
  fallback. Both ask for at most one request per second and for non-commercial use.
  `PRODUCT.md` records them on the same terms as the geocoders: if either ever has to be
  paid for, the street route is withdrawn rather than billed, and the straight line
  remains.
