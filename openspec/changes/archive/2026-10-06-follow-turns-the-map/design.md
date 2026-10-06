## Context

`trip-map.tsx` follows the person with `easeTo({ center, zoom, bearing: 0 })`. The centre is
shifted with `offsetCenter` from `@pinpoint/map` by half the difference between the card's
height and the bar's, so the dot sits in the middle of what they leave visible.
`offsetCenter` shifts in screen pixels and assumes north is up.

## Decisions

### The way ahead is a pure function over the route line

`bearingAhead(line, here, metres)` in `@pinpoint/map`:
1. finds the point of the line nearest to `here`;
2. walks `metres` (40) along the line from that point;
3. returns the compass bearing from the nearest point to the one reached.

It returns null for a line of fewer than two points. It's pure, so it is tested in the
package, and the phone only decides when to use it.

A look-ahead rather than the current segment's bearing, because the street routes are
drawn with short segments that wiggle; 40 metres spans those without missing a real
corner by much. A turn smaller than 15 degrees from the bearing in use is ignored, so the
map turns once per corner.

### `offsetCenter` takes the map's bearing

A shift "down the screen" points a different way on the ground once the map is turned.
`offsetCenter(center, zoom, dx, dy, bearing = 0)` rotates the screen offset by the bearing
before applying it. The default keeps every existing caller unchanged.

### North comes back when following ends

The rest of the map, and its framing, assumes north is up. `endFollowing` frames the place
with `bearing: 0`, and the compass sets a `northUp` flag that lasts until following ends.

### The compass is the map's own control, drawn by us

A round button in the re-read's shape, top right under the turn card, with an arrow
pointing north (`navigation-2`, rotated by the negative of the bearing). It's drawn by
us rather than by MapLibre's compass ornament, so it follows the tokens and the named
sentences on both grounds.
