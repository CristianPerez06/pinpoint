## Why

While following a route, the map keeps north at the top. Someone walking south then sees
the route run down the screen, and "turn left" is a turn to the right of the line as
drawn. GPS apps turn the map so the way ahead points up, and that is what someone
following a route on foot expects.

## What Changes

- While following, the map turns so the way ahead points up the screen. The direction
  comes from the route itself, about 40 metres ahead of the person, not from the phone's
  compass. So the map turns once at each corner and holds still in between, rather than
  wobbling as the person walks.
- While the map is turned, a small compass button shows which way north is. Pressing it
  puts north back at the top for the rest of that trip.
- *Back to where you are* brings the camera back and, unless north was chosen, turns the
  map again.
- When following ends, north is back at the top, as the rest of the map expects.

**Not done here:** following the phone's compass; tilting the map into a 3D view.

## Capabilities

### New Capabilities

### Modified Capabilities
- `route-following`: *Following shows the map around the person* turns the map to the way
  ahead instead of keeping north at the top, and offers the compass.

## Impact

- `@pinpoint/map`: `offsetCenter` takes the map's rotation, and a new `bearingAhead`
  works out which way the route runs from the person.
- `apps/mobile`: the camera while following, the compass button, north restored when
  following ends.
- `@pinpoint/wording`: one sentence, the compass button's name, in English and Spanish.
