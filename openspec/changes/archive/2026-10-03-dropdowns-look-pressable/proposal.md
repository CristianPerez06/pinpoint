## Why

A dropdown at rest looks like the surface around it (#256). The trip's name in the
header reads as a title, the city as a caption, and the Filter questions as a list.
Only a small arrow says any of them opens something, and that is easy to miss.

## What Changes

- **The trip and city choosers sit on a soft fill** on both apps, on the phone in the
  map's header and on the calendar's, and on the laptop in its bar. The fill is the
  pale one text fields already use.
- **The Filter questions (Wanted by, Kind of place, Day) sit on the same fill** on
  both apps, as separate rounded rows.
- On the laptop, pointing at one or opening it deepens the fill, so rest, hover and
  open stay distinguishable. The phone keeps its press feedback.
- The arrow stays.

Decided with the user against a mock: a fill rather than an outline, on both apps,
with the Filter questions included.

Not being done:

- The laptop's Filter and Nearby tools, the account menu and the map credits already
  read as controls and are unchanged.
- The faint outline colour (#124) is a separate palette change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-chrome`: adds that a control which opens a choice, and is shaped like the
  value it shows, carries a resting fill.

## Impact

- Web: `ui.tsx` and `ui.module.css` (a `chooser` look for `Menu`), `trip-bar.tsx`,
  `city-bar.tsx` and the waiting placeholder in `ui.tsx`, `filter-bar.module.css`.
- Mobile: `workspace-chrome.tsx`, `calendar-screen.tsx`, `filter-sheet.tsx`.
- No new token.
