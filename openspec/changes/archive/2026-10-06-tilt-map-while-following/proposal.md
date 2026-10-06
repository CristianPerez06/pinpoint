## Why

While following a route, the phone looks straight down at the map, which feels flat. A
car sat-nav leans the map back so you look ahead along the street, and in the local mock
(option D) that tilted view was the one that felt most like using a GPS (#295).

## What Changes

- Pressing *Start* leans the map back, about 60°, so the streets ahead run towards the top
  of the screen. *Stop* and arriving bring it back flat, with north at the top, as the rest
  of the map expects.
- The person stays visible in the middle of what the turn card and the bottom bar leave
  uncovered, tilted or not, at the start and after every corner.
- Everything else about following stays: the map turns at corners and holds still between
  them, the compass puts north at the top, and *Back to where you are* returns to the
  tilted view after the map was dragged.
- A new button next to the compass switches between the tilted and the flat view. It shows
  *3D* while the map is flat and *2D* while it is tilted. The choice is remembered on the
  phone, so it is still there after the app is closed and opened again. Tilted is what a
  phone starts with.
- The button's names are in English and Spanish.

**Not done here:** Follow me with no route (#296), which will reuse this tilt and the same
remembered choice; tilting the map anywhere outside following; tilting on the laptop, which
has no following (#291 decided this and it is not reopened).

## Capabilities

### New Capabilities

### Modified Capabilities
- `route-following`: *Following shows the map around the person* tilts the map, keeps the
  person visible under the tilt, offers the button that switches between tilted and flat,
  remembers that choice, and brings the map back flat when following ends.

## Impact

- `@pinpoint/map`: a pure function that turns a distance on the screen into the distance
  on the ground under a tilted camera, so the existing shift that keeps the person clear of
  the card and the bar stays right when the map leans back.
- `apps/mobile`: the camera while following gets a tilt; the new button beside the compass;
  the tilt choice in `lib/preferences.tsx`; the map flat again when following ends.
- `@pinpoint/wording`: the button's names in English and Spanish.
