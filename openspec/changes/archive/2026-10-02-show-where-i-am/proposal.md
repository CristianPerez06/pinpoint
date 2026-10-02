## Why

On a trip, the question people ask most is "how far am I from that place?" Today the map
can't answer it, because neither app knows where the person is, so they have to work it
out themselves against the pins. Every other map app answers it with one button. (#250)

## What Changes

- A **"where am I" button** on the map's right edge, on the phone and the laptop. It has
  the crosshair icon other map apps use. On the phone the edge reads, from the bottom up:
  zoom, the new button, refresh. On the laptop, where there is no refresh, it sits above
  zoom.
- **The first press asks for permission**, through the phone's or browser's own prompt,
  with no screen of ours in front of it. Pressing the button is reason enough. Nothing
  asks when the app opens.
- **Once found, the map moves to the person** at the same closeness it uses for a single
  place, clear of whatever covers the bottom of the map. A **dot** marks the spot:
  near-black, or white on the dark theme, so it can't be mistaken for a hotel pin, which
  is blue. Pins draw over the dot so they can still be pressed. While the phone or browser
  is unsure of the exact spot, a shaded circle shows how big the uncertainty is.
- **The dot follows the person** as they walk, for the rest of the session. The map does
  not follow: only a press of the button moves it. The icon fills in while the map is on
  the person, and goes back to an outline once they pan away.
- **While the position is being found**, the button spins, as refresh does.
- **If permission is refused**, the map stays where it was and a note says why. On the
  phone, tapping the note opens the phone's Settings, because iOS won't ask a second
  time. On the laptop, the note says to allow it from the address bar.
- **If the position can't be found** (no signal, indoors, location services off), the map
  stays where it was, a note says so, and pressing the button again tries again.
- **Far from the trip**, the map simply goes to the person. Refresh, a city, or a pin
  brings the trip back.

Not in this change:

- How far away each place is, and a list sorted by distance. That is #120, which will
  reuse the permission and refusal handling built here.
- A map that keeps re-centring on the person, or turns with the direction they face.
- Showing where the *other* people on the trip are.

## Capabilities

### New Capabilities

- `device-location`: the "where am I" button, asking for permission, the dot and its
  uncertainty circle, following the person, and what the person is told when the
  position is refused or can't be found. #120 builds on this.

### Modified Capabilities

- `map-rendering`: the short list of things allowed to move the map gains a third item,
  pressing "where am I".

## Impact

- `apps/mobile`: adds `expo-location`, a native module, so a **new development build** is
  needed. It is free. The iOS permission sentence goes in the app's configuration, in
  English and Spanish.
- `apps/web`: uses the browser's own location feature. No new dependency.
- `packages/map`: one pure function that turns the uncertainty in metres into a size on
  screen, shared by both apps.
- `packages/wording`: the button's label and the notes for refused and not found, in
  English and Spanish.
- No database, API or cost change.
