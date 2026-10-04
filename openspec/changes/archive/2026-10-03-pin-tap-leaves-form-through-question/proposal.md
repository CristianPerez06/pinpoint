## Why

On the phone, tapping a saved pin while the place form is open on the map closes the
form without asking and opens the pin (#265). A new place loses the spot lined up on the
map, and an edit loses its changes. #259 made ✕, Cancel and the dim ask first, and this
is the same loss through a different gesture.

`workspace-chrome` (*Anything that opens can be dismissed without hunting*) already says
what such a press should do: it dismisses the panel, asking first where there is work to
lose, and "the press SHALL NOT act on the map … no marker is … selected". The laptop
already works that way.

## What Changes

- **A tap on a pin while the place form is open leaves the form the way ✕ does.** It
  asks "Discard what you typed?" when there is something to lose: always for a new
  place, and for an edit only when something changed. Otherwise it closes.
- **That tap does not also open the pin.** After the form is gone, a second tap opens
  it. This is what the laptop does.
- Tapping a pin while the sight is armed, before the form opens, is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The phone was not meeting `workspace-chrome` as it stands.

## Impact

- Mobile: `components/marker-form.tsx` (lets the workspace start leaving),
  `components/trip-map.tsx` (a pin tap with the form open leaves it instead of
  selecting), `components/trip-workspace.tsx` (connects the two).
