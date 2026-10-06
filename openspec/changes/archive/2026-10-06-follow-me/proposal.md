## Why

Someone walking around a city with no destination in mind has no way to make the map keep
up with them: the dot moves, but the map stays where it was, north up and flat. Route
following already tilts the map, keeps the person in view and turns it with the way ahead —
but only with a route (#296).

## What Changes

- A new **Follow me** button on the phone's map, on the right edge between "where am I" and
  the re-read, with an arrow glyph. One press turns it on, the next turns it off. While on,
  it is drawn with the pale amber wash and dark amber arrow the filter uses to say it is
  narrowing.
- While Follow me is on, the map keeps the person in view as they move, tilted unless the
  flat view was chosen, and turned to the direction they have been walking over the last
  several metres. Standing still holds the last direction; before they have walked anywhere,
  north stays up. Small changes of direction do not turn it, so it turns at corners and
  holds between them.
- Everything else on the screen stays: the header, the bottom bar, the pins, the right-edge
  buttons. The *3D*/*2D* button and the compass from route following stand at the top
  right; they share the same remembered tilt choice, so a choice made in one carries to the
  other.
- Dragging the map lets the person look around; "where am I" brings the camera back and
  following resumes.
- Opening a place pauses Follow me: the map holds still while the place is open, and goes
  back to the person when it is closed. *Calculate route*, dropping a pin, choosing a city
  and showing the filter's matches turn it off. Turning it off lays the map flat with north up.
- Without location permission, pressing it shows a short note saying Follow me needs the
  location, which opens Settings. The map stays flat and works as before.
- It is not remembered: the map always opens flat, north up.
- It works with no connection: the position comes from the phone, and streets are drawn
  where the area was downloaded.

**Not done here:** Follow me on the laptop or in a phone's browser (decided in #291 and
#296); using the phone's compass for direction; remembering Follow me across launches.

## Capabilities

### New Capabilities
- `follow-me`: following the person on the phone's map with no route — the control, what
  the camera does, what pauses and ends it, and what is said without permission.

### Modified Capabilities
- `device-location`: the phone's map edge gains Follow me between "where am I" and the
  re-read; the camera moves with the person while Follow me is on, as it already does while
  following a route.

## Impact

- `@pinpoint/map`: a pure function giving the direction walked between two positions, or
  none when they are too close to tell.
- `apps/mobile`: the button and its states in `components/trip-map.tsx`, reusing route
  following's camera, tilt and compass without loading anything route following needs; the
  workspace's notes leave room for the top-right buttons and name Follow me when location
  is refused.
- `@pinpoint/wording`: the button's names and the refused note, in English and Spanish.
