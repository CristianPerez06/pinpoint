## Context

#282 proved Ferrostar's core can follow a route under Pinpoint's own map, on a
development-only trial screen (`apps/mobile/app/dev/follow.tsx`, which lazily loads
`components/follow-trial.tsx`). That trial asks Stadia only, through Ferrostar's
built-in Valhalla adapter. It feeds positions from `expo-location` into a
`SimulatedLocationProvider`, and uses Ferrostar's example values for when a step is done
and when the person counts as off the route.

The phone's map is `components/trip-map.tsx`. It owns the open place, the route state
(`street-route.ts` over `@pinpoint/routing`) and the `RouteOffer` passed to
`marker-details.tsx`, whose `Route` component draws the route card. The laptop's card is
`apps/web/app/_components/marker-details.tsx`.

Decisions settled with the user, and recorded in the specs: screen on, no voice, no
background; the routing service's turn words as they are; arrival says so and stops;
*Open in…* lists the apps on the phone, and the laptop opens Google Maps in a tab.

## Goals / Non-Goals

**Goals:** following on the phone as `route-following` describes; opening the route in
another maps app on both applications; Ferrostar never evaluated before *Start*; the
cause of #282's reload found.

**Non-Goals:** voice, background location, following on the laptop, our own turn
wording, Ferrostar's map package.

## Decisions

### Ferrostar is evaluated only when *Start* is pressed

All of following lives in `apps/mobile/components/following/`. Its entry is loaded from
`trip-map.tsx` with `lazy(() => import('@/components/following/follow-view'))`, rendered
only while following. Nothing else in the app imports `@stadiamaps/*`. A lint rule
(`no-restricted-imports` for `@stadiamaps/*` outside `components/following/`) keeps it
that way: the failure this prevents shows up somewhere else and passes every check of
the file that caused it.

In a production bundle Metro still includes the module. What `import()` delays is
evaluation, and evaluation is the part that installs Ferrostar's compiled core into the
JavaScript engine.

**Finding the reload's cause** is the first task, because the specs forbid shipping
until it is understood. Reproduce it in a development build by temporarily importing
Ferrostar eagerly from a route file, pressing *Calculate route*, and reading the native
log (`xcrun simctl spawn booted log stream --predicate 'process == "Pinpoint"'`, and
`adb logcat` on Android). What follows depends on what turns up:

- **Something only a development build does** (Fast Refresh or the dev-server's reload
  on a JS exception thrown at evaluation, for example): lazy loading is enough. Record
  the cause in `CLAUDE.md`'s gotchas.
- **A crash in Ferrostar's native code**: check that it does not also happen after a
  lazy load followed by *Calculate route*. If it does, that is a blocker; stop and say
  so.

### Routes while following come from a custom route provider with a fallback

Ferrostar's `RouteProvider` has a `custom` kind: `getRoutes(location, waypoints)`. We
supply one that tries, in order:

1. Stadia's `/route/v1` (`STADIA_ENDPOINT`, `config.stadia.apiKey`);
2. FOSSGIS's Valhalla (`VALHALLA_ENDPOINT`), with `X-Client-Id: pinpoint` and the app's
   `User-Agent`, as `street-route.ts` sends today.

For each, a request is built with `RouteAdapter.fromWellKnownRouteProvider(Valhalla …)`
plus the app language as Valhalla's `language` option, and the response is parsed with
the same adapter. The trial's adapter path already does this, but with no headers, no
timeout and no fallback. Each attempt is bounded by `ROUTE_TIMEOUT_MS`. A refusal or
timeout moves on to the next service; a Valhalla "no route" answer stops there, as
`place-route` requires.

FOSSGIS's OSRM is skipped. Ferrostar's well-known providers are Valhalla and
GraphHopper, and the OSRM public server does not return the step fields Ferrostar
needs. The spec allows this ("skipping any that cannot return the turns of a route").

The *Calculate route* line and the one followed come from separate requests. *Start*
asks again from where the person is now, with turns. That costs one Stadia route per
*Start*, which is already counted in #279's figure.

### Positions come from `expo-location`, fed to Ferrostar by hand

While following, `watchPositionAsync` (`BestForNavigation`, 2 m) forwards each fix to
Ferrostar's location provider. This is the trial's code, minus the simulation controls.
The subscription is removed when the app goes to the background and made again when it
comes back, using `use-active-again.ts` as `where-am-i.ts` does. No background mode, and
no new permission text.

Thresholds: Ferrostar's example values from the trial (step done at 30 m, off the route
past 50 m at an accuracy of 15 m or better, arrived within 10 m of the end of the last
step), and at least 5 s between new-route requests. Tuning happens on a walk, not at a
desk.

Testing without walking: the iOS simulator moves along waypoints with
`xcrun simctl location booted start --speed=1.4 <lat,lng> …`, which replaces the trial's
*Simulate* and *Leave the route* buttons. The trial screen and its `trial.follow.*`
sentences are deleted.

### The following view is drawn over the existing map, not as a new screen

`trip-map.tsx` gains `following: { place, mode } | null`. While it is set:

- the place's details are closed;
- the toolbar, the city line and the other edge controls are not rendered;
- presses on pins are ignored;
- the lazily loaded `FollowView` is rendered over the map with the turn card and the
  bottom bar.

The line drawn is the one Ferrostar is following (`routeGeometry`), through the existing
`ROUTE_SOURCE` and `routeLayers(mode, 'street')`, replacing the *Calculate route* line.

Staying on the same map keeps the camera, the style and the pins as they are. A new
route screen would mount a second map and a second style load.

**Camera.** On each position, `easeTo` the person, at zoom 16, bearing 0. The view's
centre is shifted with `offsetCenter` from `@pinpoint/map` by half the difference between
the card's measured height and the bar's, so the dot sits in the middle of what is
visible (see the gotcha on centring under a sheet). A drag that the map reports as the
person's own (`isUserInteraction` on region change) pauses following the camera, and
shows a round control on the map's edge that resumes it.

**Turn glyph.** An exhaustive record from Ferrostar's maneuver type and modifier to a
Lucide icon, in `components/following/`, with a straight-arrow default for anything not
listed.

**Words.** New named sentences under `follow.*` (start, starting, cannotStart, left,
arrive, offRoute, offRouteNone, arrived, stop, recentre) and `route.openIn*` /
`handoff.*`. The instruction text is passed through unchanged (`product-wording`).
`@pinpoint/core` gains `formatTimeLeft(language, minutes)`, which writes the time without
naming the way of travelling, reusing `formatTravelTime`'s rounding. The arrival time
uses `formatClock`, the 24-hour clock already used for opening hours. The turn distance
and the distance left use `formatWalkingDistance`, as Nearby does.

### Arriving and stopping go through one path

Ferrostar's trip state turning `Complete` and a press of *Stop* both call the same
`endFollowing(place, arrived)`. It stops navigation and the location subscription,
releases keep-awake, clears the route, and reopens the place's details. Only when
arriving does it also show the existing `overlay-note` with `follow.arrived` for 4
seconds.

### The screen stays on through `expo-keep-awake`

`activateKeepAwakeAsync('following')` when following begins, and
`deactivateKeepAwake('following')` in the cleanup of the effect that started it. A
cleanup means every way out (*Stop*, arrival, unmount, signing out) releases it. Added
to `apps/mobile/package.json` explicitly, even though Expo already pulls it in.

### Opening another maps app is an address, built in `@pinpoint/routing`

`handoffUrl(app, to, mode, name?)`, a pure function, so both apps share it and it can be
tested:

| app | address |
|---|---|
| `google` | `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=walking\|bicycling\|driving` |
| `apple` | `https://maps.apple.com/?daddr=<lat>,<lng>&dirflg=w\|d` (no `dirflg` for cycling, which it does not accept) |
| `geo` | `geo:<lat>,<lng>?q=<lat>,<lng>(<name>)` |

No origin is passed, so the other app starts from the person's position itself.
Google's `https` address is a universal link: the app opens it when installed, and the
browser opens it otherwise, so there is no "installed?" check and no
`LSApplicationQueriesSchemes`. This is opening a link, not using a Google service, so the
$0 rule is not touched.

Phone: `Linking.openURL`. The choice is the app's own `sheet.tsx`, not `ActionSheetIOS`:
Android has no equivalent, and the words have to come from the named sentences.
Laptop: an `<a target="_blank" rel="noopener noreferrer">` styled as the card's button.

## Risks / Trade-offs

- **Ferrostar's example thresholds may be wrong on real streets.** GPS in a city with
  tall buildings can drift past 50 m, and the person would be told they are off the
  route when they are not. → Walk a real route before archiving; adjust the values in one
  constant.
- **The reload's cause may not be found.** → If lazy loading demonstrably avoids it in a
  release build, record what was tried on #279 and go ahead. If it still happens after
  *Start*, stop: that is a blocker.
- **Valhalla's FOSSGIS server is slower and promises nothing.** A new route after a wrong
  turn may take several seconds. → The card says what is happening, and the old line
  stays.
- **Two requests per started route** (*Calculate route*, then *Start*). → Accepted. The
  budget has room, and reusing the first would mean `@pinpoint/routing` keeping the turns
  it currently throws away.
