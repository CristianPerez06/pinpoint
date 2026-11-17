## Why

In dark mode the menus, cards and sheets that sit on the map are almost the same colour as the map: the card colour measures 1.06:1 against the map's land, and the shadow that separates them in light mode is black, so it can't be seen on a near-black map. Nothing marks where a menu ends and the map begins.

## What Changes

- In dark mode, cards, menus and sheets become one clear step lighter than the map. The rows, fields, chips and selected-row highlight inside them move up with them, so they still stand out from the card.
- This applies everywhere in the dark app, not only over the map. Calendar, settings and sign-in cards get the same lighter colour, so there is one card colour throughout (the person's choice).
- Anything raised over the map — menus, place card, place form, sheets on the phone, the "no places match" note — gets a thin, faint, light outline in dark mode, where a shadow can't be seen.
- Light mode does not change. The map does not change in either mode.
- Both apps change together, because they share the colour values.

Not being done: no change to the map's own colours, to the marker colours, to shadows, or to the map controls (zoom, locate, compass), which already have their own visible edge.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `styling`: adds a requirement that anything raised over the map stands apart from it on both grounds, with a visible outline on the dark ground.

## Impact

- `@pinpoint/tokens`: dark values of the surface family (`surface`, `surfaceMuted`, `line`, `lineStrong`, `accentWash`, `dangerSurface`), one new colour token for the outline over the map, and tests for the new rule.
- `apps/web`: the shared menu panel, the place card / form panel, the search results list, the map note and the phone-width bottom sheets switch their border to the new outline.
- `apps/mobile`: every bottom sheet, the place card, the place form and the map note switch their border to the new outline.
- `DESIGN.md`: the dark values it lists for these tokens.
