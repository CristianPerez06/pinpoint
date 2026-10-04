## Why

On the phone, Filter, Nearby, the trips, the cities and the people open over the map
with nothing between them and it (#260). The map stays at full strength, so it is hard
to tell where the sheet ends, and nothing says the map is waiting on the choice being
made. `workspace-chrome` already asks for the rest of the screen to be set back while
such a panel is open, and the laptop at a phone's width already does it.

## What Changes

- **The phone's sheets darken the map behind them** while they are open: Filter,
  Nearby, the trips, the cities, the people, the menu, the map's credits and the
  currency list chosen from inside a city. The darkness is the same one the calendar
  and the date calendar already use (#255).
- **The dark fades in and out** as the sheet slides up and down; it does not slide with
  the sheet.
- **A tap on the dark area closes the sheet** and does nothing to the map under it, so
  a tap over a pin does not also select that pin.
- A list chosen from inside a sheet — a trip's dates, a city's currency — stacks a
  second dim over the first, as the laptop already does.

Not being done:

- A place's details and the form saving one, opened on the map, keep **not** dimming,
  so the pin they describe stays visible.
- Place search is a full screen of its own, not a sheet over the map, and is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-chrome`: *A panel raised on a phone-shaped screen rises from the edge*
  now says the setting back is the same darkening everything else uses, that it fades
  with the panel rather than moving with it, and that a press on it closes the panel
  without reaching anything beneath. The phone not dimming at all was a bug against the
  existing text.

## Impact

- Mobile: `components/sheet.tsx` (draws the dim, once, for every sheet), and the sheets
  that opt out of it — `place-search.tsx` — or already drew their own — `ui.tsx`'s date
  calendar.
- No change to the laptop, to the tokens, or to any data.
