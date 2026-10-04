## Why

#123 asked for a check nobody had run: does the phone's Filter still read as on with
colour turned off? Run on the simulator in greyscale, it does not. The amber label turns
the same grey as the other three tools, and the dot meant to survive greyscale is a 7-point
circle with a 2-point ring, leaving a 3-point speck of light amber. Somebody who doesn't
already know the dot exists can't tell the trip is narrowed. The laptop's bar at a phone's
width draws the same dot.

## What Changes

- **The dot on Filter becomes a badge**: 10 points instead of 7, filled with the darker
  amber on the light ground and the bright one on the dark, still ringed in the bar's
  colour. In greyscale it is now a dark dot on the light ground and a light one on the
  dark. On both apps.

Chosen by the user against a mock of a badge and a marker bar, in colour and greyscale.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `marker-filtering`: adds that the signal which is not a hue has to be seen in greyscale
  at a glance, not merely be present.

## Impact

- Mobile: `components/workspace-chrome.tsx` (`pip`).
- Web: `filter-bar.module.css` (`.pip`, below 700px).
