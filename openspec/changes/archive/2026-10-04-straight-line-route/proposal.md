## Why

On the trip, standing in a street, the question is *how far is that place from here, and
how long on foot*. Today the apps can show where you are and where the place is, but
nothing joins the two, so the answer is a guess from the map. This is the first step of
directions (#274), chosen in the spike for #244: a straight line needs no service, costs
nothing and works with no signal.

## What Changes

- A selected place's details gain a **Calculate route** button, on the laptop and the phone.
- Pressing it finds where the person is, the same way *where am I* does, including asking
  for permission the first time and the same notes when location is refused or not found.
- With a position, the map draws a straight line from the person to the place, and frames
  both so neither is hidden behind the details.
- The details then show an estimated walking time and the straight-line distance, for
  example *About 25 min walk · 1.3 km in a straight line*, with a **Clear** button.
- Beyond 50 km, the distance is shown without a walking time.
- With no signal it works the same, because nothing is fetched.

Not in this change: a real street route (#276), travel modes other than walking, routes
between two saved places, and the line following the person as they walk.

## Decisions

The mock (`route-mock`, shown 2026-10-04) raised five questions. All five were decided
on 2026-10-04 to keep the recommended answer:

1. **The button's words:** *Calculate route*. The figures say *in a straight line* and
   *About*, and the street route comes with #276.
2. **Where the button sits:** under the name and tags, so it shows without scrolling on
   the phone.
3. **What clears the line:** *Clear*, closing the place, or selecting another place.
4. **Walking time for far places:** dropped beyond 50 km, where Nearby already calls a
   place a day trip.
5. **Whether the line follows the person:** no. It is drawn once, from where they were
   when they pressed.

## Capabilities

### New Capabilities

- `place-route`: from a selected place, a straight line from the person to it, with its
  distance and an estimated walking time, on both apps and with no signal.

### Modified Capabilities

- `device-location`: the new button becomes one of the presses that may ask for location.

## Impact

- `@pinpoint/map`: the walking estimate, and the line as map data with its style layers,
  as pure functions each app draws with its own renderer.
- `@pinpoint/wording`: the new sentences, in English and Spanish.
- `apps/web` and `apps/mobile`: the button in the place's details, the line on the map,
  framing, and clearing.
- No new dependency, service, cost or stored data.
