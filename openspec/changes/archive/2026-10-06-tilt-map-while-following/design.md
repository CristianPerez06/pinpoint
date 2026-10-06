## Context

`followCamera` in `apps/mobile/components/trip-map.tsx` eases the camera to the person with
`{ center, zoom: 16, bearing }`. The centre is shifted with `offsetCenter` from
`@pinpoint/map` by `(bottom - top) / 2` screen pixels — half the difference between the bar
and the turn card — turned with the map's bearing, so the dot lands in the middle of what
the two leave uncovered.

That shift treats a screen pixel as a fixed distance on the ground, which is only true of a
flat map. Tilted, the ground near the top of the screen is further away and each pixel
covers more of it; near the bottom, less. So `offsetCenter` on its own would put the dot in
the wrong place once the map leans back.

## Decisions

### A pure function converts the screen shift into a ground shift

`groundOffset(screenOffset, pitch, height)` in `@pinpoint/map` answers: "a point drawn this
many pixels above the middle of the view — how far is it on the ground from the middle, in
the pixels the zoom measures the map in?" The caller hands that to `offsetCenter` in place
of the screen distance.

Both renderers draw with the same camera: a field of view of about 36.87° (MapLibre's
`0.6435011087932844` rad, in GL JS and in native), which puts the eye `1.5 × height` from
the middle of the view, and a zoom that measures the map at the middle. A point `s` pixels
above the middle is seen at an angle `a = atan(s / D)` off the camera's axis, with
`D = 1.5 × height`. The camera sits `D·cos(pitch)` above the ground and `D·sin(pitch)`
behind the middle, so that point is

    D·cos(pitch)·tan(pitch + a) − D·sin(pitch)

ahead of the middle on the ground. At pitch 0 this is exactly `s`, so a flat map is
unchanged, and it is tested to be. Negative `s` (the dot below the middle) works the same
way.

This rather than MapLibre's camera `padding`, which `CLAUDE.md` rules out: padding persists
in the camera state and changes what `center` means, which the drop sight on the phone
depends on staying geometrically true.

This rather than giving `offsetCenter` a pitch argument: `offsetCenter`'s offsets are in
screen pixels on either axis, and under a tilt the sideways scale changes with the height on
screen as well. A separate function for the one axis following needs keeps `offsetCenter`
honest about what it does.

### The tilt changes on its own, before any move that changes it

On iOS, `@maplibre/maplibre-react-native` works out a move's centre and height at the
tilt the camera is leaving and applies the new tilt afterwards (`_makeCamera` in
`CameraUpdateItem.m`). A single move that also changes the tilt therefore lands in the
wrong place at the wrong zoom: *Stop* framed a point half a kilometre from the place,
and *Start*, *2D* and *3D* each drew one wrong frame. Android applies them together.

`leanTo(pitch)` in `trip-map.tsx` sends an instant tilt-only move first whenever the
tilt is about to change; the library runs moves in order, so the move that follows is
computed on the tilt it is for. Found by running the change on the iPhone simulator.

### 60° of tilt

The mock used about 60°, and it is MapLibre native's default ceiling. It is one constant
(`FOLLOW_PITCH`) beside `FOLLOW_ZOOM`, to be revisited after a real walk if it leans too far.

### The choice is a preference, tilted by default

`followTilted: boolean` in `apps/mobile/lib/preferences.tsx`, under its own key
(`pinpoint.preference.followTilted`), read inside the launch gate like the others, written
on the person's press without waiting on the disk. A missing or unreadable value is
`true`, because tilted is what *Start* does (#295). Follow me (#296) will read the same
value.

### The control sits above the compass, always there while following

A round button of the compass's shape, directly under the turn card, showing *3D* or *2D*.
The compass, which comes and goes with the bearing, moves below it, so the button never
jumps when the compass appears. Pressing it while the camera follows the person re-runs
`followCamera`; while the person is looking around, it only changes the pitch so their view
is not taken away from them.

### Flat again when following ends

`frameRoute`, which frames the place after *Stop* and arrival, already sets `bearing: 0`;
it now also sets `pitch: 0`. Every other camera move assumes a flat map and cannot happen
while following.

## Risks / Trade-offs

- If a renderer's field of view differs from 36.87°, the dot drifts a little from the middle
  of the uncovered strip. Checked on a running device rather than assumed: the dot must sit
  between the card and the bar at the start and after a corner.
