## Why

On an Android phone, a pin near the top of the map is drawn over the header, covering the
trip name and the city line, instead of being cut off where the map ends (#231). That header
is where the trip and the city are chosen, so a pin sitting on it hides the names and can
take a tap meant for them. Nothing in the specifications says what the map draws stays inside
the map, which is how it could hold on one platform and not the other.

## What Changes

Phone, and a rule both applications keep.

- **A pin at the edge of the map is cut off at that edge.** It is never drawn over the
  header, over the note that the trip is offline, or over anything else outside the map.
- **The header stays readable and tappable** with pins right beneath it: the trip name and
  the city line answer the tap, not the pin.
- **The same holds on every side of the map**, not only the top, and in both themes, online
  and offline.

Not being done:
- **Keeping a pin whole when it is half off the map.** A pin whose point is past the edge is
  cut off, as a map normally does. Pushing it back inside would move it off its place.
- **The laptop.** It already cuts pins off at the map's edge; this only writes that down.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `map-rendering`: adds a requirement that everything the map draws — pins included — stays
  inside the map's area and never covers what is drawn around it.

## Impact

- `apps/mobile/components/trip-map.tsx`: the map's outer frame cuts off what spills past it.
- No shared package, data or wording changes.
- Needs checking on a real Android phone as well as iOS, because the defect only showed on
  Android.
