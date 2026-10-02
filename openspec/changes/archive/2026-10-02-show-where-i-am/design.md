## Context

Neither app reads the device's location today. Both already have what this needs around
it:

- **A camera move to one point.** On the phone that is `flyTo(position, bottomInset)` on
  the `TripMap` handle (`apps/mobile/components/trip-map.tsx`). On the laptop it is the
  `frameTo` / `frameToken` path in `apps/web/app/_components/trip-map.tsx`. Both go
  through `frameAround` from `@pinpoint/map`, which already gives one point
  `SINGLE_MARKER_ZOOM` and keeps it out of the covered strip.
- **An edge stack.** `.edge` (web) and `styles.edge` (phone) are laid out bottom-up with an
  `md` gap. The phone hides the whole stack while a marker or form sheet is open.
- **Pins drawn as view markers.** MapLibre `Marker` with a React root on web, and
  `MapLibreMarker` on the phone. The dot can be one more of those.
- **A note over the map.** `MarkersOverlayNote` on the phone, which takes `onPress`, and
  the workspace's `problem` note on the laptop.

The look was settled on an HTML mockup in the session's scratchpad, which is not kept.
Everything it decided is written down here and in the specs.

## Goals / Non-Goals

**Goals:**

- One way per app to get permission, one position, and a stream of updates. #120 should
  be able to reuse it without changing it.
- Everything shared, such as the uncertainty radius and framing, stays a pure function in
  `@pinpoint/map`.

**Non-Goals:**

- Heading or compass, a camera that tracks the person, and background location.
- Distances to places (#120).

## Decisions

**1. Phone: `expo-location` for permission and position, with the dot drawn by us.**
`expo-location` gives permission state (including "denied, can't ask again"),
`getCurrentPositionAsync` with accuracy, and `watchPositionAsync`. Opening the
settings is `Linking.openSettings()`, which is already available.
*Alternative:* MapLibre React Native's own `UserLocation` puck. It brings its own blue
styling and its own location manager, and it is harder to keep under the pins. Choosing
it would give us the familiar blue dot we decided against.

**2. Laptop: `navigator.geolocation`.** `getCurrentPosition` gives the first fix, with
`{ enableHighAccuracy: true, timeout, maximumAge: 0 }`, and `watchPosition` gives the
updates. A `PERMISSION_DENIED` error is the "refused" case, and `POSITION_UNAVAILABLE`
or `TIMEOUT` is "not found". No new dependency.

**2a. The dot is a set of style layers on both platforms, described once.**
`locationLayers(position, mode)` in `@pinpoint/map` returns the circle layers (the
uncertainty circle, the halo and the dot) in the style specification's own paint terms,
which both renderers accept. Layers rather than a marker element: the renderer draws
every layer beneath every marker, so a pin at the person's position stays on top and
pressable; a layer takes no presses; and the circle scales with a pinch or a wheel frame
by frame. The phone mounts them as `GeoJSONSource` + `Layer` children. The laptop adds
them imperatively and re-adds them on `styledata`, because a theme change goes through
`setStyle` and the new document carries none of them.
*Alternative considered and dropped during apply:* a marker element under the pins. On
the laptop, keeping it under pins that are remounted on every filter change needed a
stacking rule of its own. On the phone, a view resized on settle lags a pinch.

**3. One hook per app, same shape, over one shared decision.**
`apps/mobile/lib/where-am-i.ts` and `apps/web/lib/where-am-i.ts` each export
`useWhereAmI()` returning `{ status, fix, locate(), dismiss() }`. The decisions every
press makes are in `locate()` in `@pinpoint/map`, which the platform is handed into:
refused or not found, and the bounded wait. A browser learns of a refusal only through
the position call, so its platform throws `LocationRefused` there. The status names
(`WhereAmIStatus`) are shared too, so both apps and #120 mean the same thing by them.
Each hook owns its watch, starting it on the first success and stopping it on unmount.

**4. Foreground only.** Phone: stop the watch when `AppState` leaves `active` and restart
it on return. `use-active-again.ts` already models that transition. Laptop: stop on
`visibilitychange` to hidden and restart when visible. Nothing is persisted, so a new
launch starts at `idle`.

**5. A 15-second bound on finding.** It is passed as the timeout on both platforms. It is
long enough for a cold GPS fix outdoors and short enough that indoors fails visibly.

**6. Shared uncertainty-to-pixels.** A new `accuracyRadiusPx(metres, latitude, zoom)` in
`@pinpoint/map` (`camera.ts`) uses the same `TILE_SIZE` the framing already uses. The
circle is drawn when the result is larger than the dot's radius. It redraws on zoom.

**7. "Map is on you" state.** The press records where it put the centre. On every
settle, `isCentredOn(centre, target, zoom)` from `@pinpoint/map` compares the two in
screen pixels. Zoom buttons keep the centre (see *Zoom is reachable from a visible
control*), so they leave the glyph filled. A pan, a pinch, a chosen city or a found
place each move the centre, so each empties it, without either app listing which
instrument moved the camera.
*Alternative:* branching on whether the person started the move. That misses the moves
the app makes on request (a city, a search result), which also take the map off the
person.

**8. Dot styling from tokens only.** Fill `ink`, ring `surface`, halo `ink` at low alpha,
and an accuracy circle `ink` at about 10% fill with a hairline. Both themes then come
from the existing pairs, and no new colour token is needed. The dot is 22 px to match
the mockup. Its size is `LOCATION_DOT_SIZE` in `@pinpoint/tokens` `layout.ts`, beside
`MARKER_SIZE`.

**9. Words.** New names: `map.whereAmI` (label), `map.locationOff` (phone, refused),
`map.locationBlocked` (laptop, refused), and `map.locationNotFound`. Each is written out
in `english.ts` and `spanish.ts`, using the drafts from the mockup. The iOS prompt
sentence is configured through the `expo-location` config plugin's
`locationWhenInUsePermission`. The Spanish version goes in an Expo `locales` file
(`apps/mobile/locales/es.json`), because iOS picks it by the *device* language, outside
`@pinpoint/wording`. The same exception applies to the Supabase emails.

## Risks / Trade-offs

- **[A new native module requires a fresh dev build]** → A task builds and installs it.
  Two gotchas in AGENTS.md matter here: run `expo prebuild` from `apps/mobile` (`pnpm
  --filter mobile exec expo prebuild`), and check that the simulator doesn't still hold
  the old `com.pinpoint.app` build.
- **[The iOS prompt follows the device language, not the app's language]** → Someone
  with an English iPhone and the app set to Spanish sees an English prompt. This is
  accepted because the platform owns that text.
- **[Laptops often only know their position to the neighbourhood]** → That is what the
  uncertainty circle is for, so it is shown rather than hidden.
- **[Browsers only give location on secure origins]** → Production is HTTPS and local
  development is `localhost`, so both qualify. Nothing to do.
- **[The phone hides the edge while a sheet is open]** → The button can't be pressed
  then, so the "lands in the uncovered part" requirement only ever applies to the bar's
  strip. That is intended, and the dot still draws under an open sheet.
