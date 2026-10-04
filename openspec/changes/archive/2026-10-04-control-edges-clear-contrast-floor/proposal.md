## Why

The edge drawn around buttons, chips, fields, checkboxes and the off switch measured about
1.5:1 against what it sits on, on both grounds (#124). WCAG 2.2 AA, the bar `PRODUCT.md`
sets, asks 3:1 for what shows where a control is. So every outlined control had an edge
you had to already know was there, and since `+ Drop a pin` lost its fill (#63), the bar's
own buttons were found by their words alone.

## What Changes

- **Every control's edge is clearly visible**, on both apps and both grounds: darker on the
  light ground (`#8F8C84`), lighter on the dark (`#767068`). Both clear 3:1 against the
  surface, the background and the muted fill. Mixed from the old edge toward the palette's
  muted grey, so it stays the same warm grey.
- The few other things drawn in this colour (a spinner's ring, the off switch's track,
  the line above the offline map's total) get the same weight. All are marks meant to be
  seen.
- Lines between rows keep their faint hairline; they never used this colour.
- A test in `@pinpoint/tokens` measures the edge against its three grounds, so it cannot
  drift back under the floor unnoticed.

Chosen by the user against a mock of today's edges and the raised ones.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `styling`: adds that the token identifying a control's edge clears the 3:1 non-text
  floor, which the text requirement already names but nothing stated.

## Impact

- `packages/tokens/src/colour.ts` (`lineStrong`), regenerated `src/generated/`, a new
  `colour.test.ts`.
- `DESIGN.md` and `.impeccable/design.json` (the recorded values).
- No component code: every consumer reads the token.
