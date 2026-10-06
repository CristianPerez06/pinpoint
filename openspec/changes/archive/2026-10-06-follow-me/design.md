## Context

Route following (`route-following`, #291, #295) already does most of this in
`apps/mobile/components/trip-map.tsx`: `followCamera(here, bearing, pitch)` eases the camera
to the person at `FOLLOW_ZOOM`, tilted by the remembered `followTilted`, shifted clear of
what covers the map with `groundOffset` and `offsetCenter`; `leanTo` changes the tilt on its
own first so iOS computes the move at the right tilt; the *3D*/*2D* button and the compass
are drawn there. None of that code touches Ferrostar, which only loads inside the lazy
`components/following/` view. The position comes from `useWhereAmI`, whose watch keeps
`fix` current in the foreground every 5 metres.

What route following has that Follow me does not is a line to read the way ahead from.

## Decisions

### The direction walked is a pure function over two positions

`walkedBearing(from, to, accuracy, metres = WALKED_M)` in `@pinpoint/map`, beside
`bearingAhead`: the compass bearing from `from` to `to`, or `null` when they are closer than
`max(metres, accuracy)`. `WALKED_M` is 15.

The phone keeps an anchor: the position the direction was last measured from. On each new
position it asks `walkedBearing(anchor, here, accuracy)`. `null` leaves the anchor and the
direction alone, so slow walking accumulates until it is far enough to tell, and a position
wavering while the person stands still never reaches the distance — the map does not spin.
A bearing moves the anchor to `here` and turns the map if it differs from the direction in
use by `TURN_THRESHOLD_DEG` (15°) or more, the same threshold route following uses. Before
the first bearing, the direction is 0: north up.

Using the accuracy as a floor is what keeps a poor fix — 30 metres of uncertainty indoors or
between tall buildings — from reading its own noise as a walk.

### Follow me reuses `followCamera`, with what covers the map as its argument

`followCamera` reads `followCovered` (the turn card above, the bar below). It takes the
covered band as an argument instead, so route following passes the card and its bar and
Follow me passes `{ top: 0, bottom: barHeight }` — the header is above the map, not over it.
The zoom becomes an argument too: route following keeps `FOLLOW_ZOOM`; Follow me starts at
`FOLLOW_ZOOM` and then uses the map's current zoom, so the zoom buttons change how close it
follows instead of being undone by the next position.

Nothing new is imported, so nothing following needs is loaded by Follow me (`route-following`,
*Calculating a route never restarts the application*).

### One "looking around" and one compass, for both

`lookingAround`, `northUp`, the shown bearing and the tilt button already exist for route
following. Follow me uses the same state: a hand-made move sets `lookingAround` when either
is under way; the tilt and compass buttons are drawn when either is; route following's
place for them is under the turn card, Follow me's is `SPACE.md` from the top of the map.
Only one of the two can be under way, because *Calculate route* turns Follow me off before
*Start* can be pressed.

The way back is "where am I" rather than a new button: with Follow me on, its press clears
`lookingAround` and runs `followCamera` at the person instead of framing them as today. Its
crosshair is filled while Follow me is following.

### Pausing is derived, not stored

The camera follows only when `followMe && !lookingAround && selection === null`. Closing
the details makes that true again, and an effect on that value runs `followCamera` once,
which is the resume. Opening a place from search or Nearby is covered by the same
condition.

### Turning off is explicit at each place that turns it off

`stopFollowMe()` sets Follow me off, clears `lookingAround` and `northUp`, and leans the map
flat and north up with the centre where it is. Called by the button, by `calculateRoute`
(whose own framing is already flat and north up), by an effect on the `dropping` prop when
the sight is armed, and by the handle's `frameOn`, which is how the workspace frames a
chosen city and the filter's matches. All of them are inside `TripMap`, so the workspace
needs no new call.

### Refused location says Follow me

The press goes through `whereAmI.locate()`, which sets `status: 'refused'`. The workspace
already shows the refused note for that status; `TripMap` reports which control asked
(`onLocationAsked('followMe' | 'whereAmI')`), and the workspace shows `map.followMeLocationOff`
instead of `map.locationOff` when it was Follow me. Pressing it opens Settings as the other
does.

### Notes leave the top-right column free

`MarkersOverlayNote` gets an optional `besideControls` that moves its right edge in by one
44-point button and a gap. The workspace passes it while Follow me is on, which `TripMap`
reports through `onFollowMeChange`, the way it reports `onFollowingChange`.

### The button's on state is a wash

`accentWash` beneath `accentInk`, as the filter declares narrowing, because `styling` forbids
an accent fill on chrome at rest. The mock showed a solid amber fill; this is the allowed
form of the same signal.

## Risks / Trade-offs

- At a slow stroll the map turns only after 15 metres of walking in the new direction, which
  is about ten seconds. Faster would mean reading noise. It is one constant, to revisit after
  a real walk.
- A city framing or a found place while paused flies the camera elsewhere; closing its
  details brings the camera back to the person. That is what "pause, then resume" means, and
  the person can turn Follow me off to stay.
