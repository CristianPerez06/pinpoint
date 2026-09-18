## Why

`#173`: a place's link is shown on its details card in full, however long it is. Links
copied from a map, a booking site or a social network often run to hundreds of
characters of tracking parameters, so the link takes over the card and pushes the fields
below it out of view while telling the reader nothing.

The phone has the same problem, and draws the whole address over as many lines as it
needs — as plain text that cannot be tapped.

## What Changes

- **The link takes one line on both apps, cut short with "…" at the end.** A link that
  fits is shown whole, with no "…".
- **The start of the address is kept**, not just the site's name: two links to the same
  site are told apart by what follows it. *Decided by the user.*
- **On the laptop, resting the pointer on the link shows the full address**, and clicking
  it still opens the full address in a new tab. *Decided by the user.*
- **The phone gets the same one line, and the link becomes tappable.** It was plain
  text, so the only way to open it was to copy it out through Edit. Now it is drawn in
  the same amber as the laptop's and a tap opens it in the browser. *Decided by the
  user.*
- **`map-rendering` states it**, alongside the note's rule in *Selecting a marker shows
  what was recorded about it*.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `map-rendering`: a link on a selected marker takes one line, is cut short when it does
  not fit, and can be followed on every application.

## Impact

- `apps/web/app/_components/marker-details.tsx` and `.module.css` — the link's field and
  anchor.
- `apps/mobile/components/marker-details.tsx` — the link's `Field` is one line and opens
  the address when tapped.
- `openspec/specs/map-rendering/spec.md` — via the delta.
- No change to the packages or the database.
- Closes `#173`.
