## Why

On the phone, typing into a sheet leaves it at its resting height. The sheet sits on top of
the keyboard, so nothing is covered, but it is small: about half the screen, and on an
iPhone SE around 330 points for the title, the list and the field together. There is
little room to see what is being typed and what is around it (#290).

## What Changes

- While the keyboard is up, a sheet with a field in it grows to fill the room above the
  keyboard. It leaves a small gap at the top so it still reads as a sheet over the map.
- When the keyboard goes away, the sheet returns to the height it had before: half the
  screen for the fixed-height sheets, and whichever of its two heights the place form was
  resting at.
- This applies to every sheet on the phone that has something to type into: the form for
  saving a place, the cities, the people, the trips, and the currency picker opened from
  the place form and from the cities.
- The map behind the place form does not move while the sheet grows. It is behind the
  keyboard anyway, and re-framing the place into a sliver of map would only make things
  jump.

Not being done:
- Place details, Filter and Nearby have nothing to type into, so they are unchanged.
- The site, even at a phone's width, is unchanged. The issue is about the phone
  application, and a browser's keyboard behaves differently.
- No new resting height. The place form keeps its two heights; growing is temporary and
  only lasts while the keyboard is up.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-chrome`: *A panel raised on a phone-shaped screen rises from the edge* says
  the fixed-height sheets stand at half the screen "whatever they hold". That gains an
  exception for while the keyboard is up, and the place form gains the same behaviour.

## Impact

- `apps/mobile/components/sheet.tsx`: one shared way to know how much room is above the
  keyboard.
- `apps/mobile/components/city-sheet.tsx`, `people-sheet.tsx`, `trip-sheet.tsx`,
  `currency-field.tsx`, `marker-form.tsx`: take their height from it while the keyboard
  is up.
- No new dependency: `react-native-reanimated` and React Native's own keyboard events are
  already available.
