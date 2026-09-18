## Why

The calendar looks odd and is uncomfortable to use (#162). The places with no day yet sit
in a collapsed bar above the days, and opening it pushes the days down. On a phone the
open list can take over a third of the screen. On a laptop you can't read the list and
the days together, even though that's the whole job of the screen: take a place from the
list and put it on a day.

## What Changes

- **On a laptop**, the places with no day become a column of their own on the left,
  beside the three days. It's always open, has nothing to expand, and scrolls by itself,
  so a trip with ninety undated places never pushes the days out of view. You pick from
  the left and watch the place arrive on the right.
- **On a phone** (the web app at phone width, and the mobile app), the screen gets two
  tabs directly under the header: **Days**, which shows the day controls and one day,
  and **No day yet**, which shows the list. The second tab shows how many places are
  waiting, so the count can be read without opening it. The day controls appear on
  **Days** only, and stay in place while a long day scrolls under them.
- **The phone always opens on Days.** It does not remember which tab was last used, so
  the calendar opens the same way every time.
- **The list is grouped by city**, with a count per city — "Kyoto · 46", "Tokyo · 45" —
  so a long list can be scanned. Places not filed under a city come last, in a group of
  their own.
- **The collapsed "N places with no day yet" bar is removed** from both applications.
- The list is still there when nothing is waiting, and says so.

Everything else stays as it is: the place card, stepping and choosing a day, the day the
screen opens on, the header, and the way back to the map.

Not in this change: reordering places within a day or the list, dragging a place onto a
day, and replacing the laptop's native date control (#145). The tab names follow
`PRODUCT.md`'s "wishlist, not itinerary", so neither tab is called "Itinerary".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trip-calendar`: *The places waiting for a day are shown with the days* is rewritten.
  The list moves from a collapsed bar above the days to a column beside them on a wide
  screen and a tab of its own on a narrow one, and it is grouped by city. It keeps being
  present when empty and keeps its count legible without being opened. *The calendar's
  shape follows the shape of the screen* is rewritten to match: the list is no longer
  "shown once, above the days", and the narrow shape gains the two tabs and the rule
  that it opens on **Days**.

## Impact

- `apps/web/app/_components/trip-calendar.tsx` and its stylesheet, and
  `apps/mobile/components/trip-calendar.tsx`.
- `@pinpoint/core` gains one small shared function that groups the waiting places by
  city, so the two applications cannot disagree about the grouping or its order.
- No data, database, or dependency changes.
