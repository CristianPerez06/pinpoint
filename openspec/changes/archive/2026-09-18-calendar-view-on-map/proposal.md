## Why

The calendar is where places get moved between days, and whether a place belongs on a
given day depends mostly on where it is. Today the card opened from the calendar says
nothing about location, so checking means leaving the calendar, finding the pin by eye,
and coming back — to a calendar that has started over on its opening day rather than the
day being read. (#163)

## What Changes

- A place's card opened from the calendar gains a **View on map** button. On the laptop
  it sits to the right of Edit and Remove; on the phone it takes the full-width slot
  beneath them.
- Pressing it shows the map with that place's card open and its pin in view, not covered
  by the card or the sheet. It works for a place the map's filter is hiding, the same way
  a place found through search does: shown, drawn, and said to be hidden, with the filter
  left alone.
- That card, on the map, carries **← Back to Calendar** in the same slot. It is there only
  for as long as that card is open; closing the card ends the detour and leaves the
  ordinary map.
- Back to Calendar returns to the calendar on **the day that was being read**, with no
  card open. On a phone-shaped screen, somebody who started from the **No day yet** tab
  comes back to that tab.
- The calendar's existing **Back to the map** is unchanged.
- Saving an edit to a place on the map closes its card on **both** apps. The laptop already
  does this; the phone brought the card back, and now matches. (Decided while building:
  the two apps should end an edit the same way, and the detour ends with the card.)

Not being done:

- The calendar does not reopen the place's card on return (decided: only the day).
- No way back to the calendar survives once the card is closed, and none appears on a
  card opened on the map in the ordinary way.
- No map inside the calendar, and no change to what the calendar or the map show.

The mock this was settled on: https://claude.ai/artifact/TwV9RG251xkK5GUUB51uC3

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `trip-calendar`: a new requirement — a place opened here can be looked at on the map,
  and the way back returns to the same day (and, on a phone-shaped screen, the same tab).
- `marker-capture`: *A marker can be edited and removed by any member of the trip* — saving
  an edit made from the map closes the place's card, the same on both applications.
- `marker-filtering`: *A place addressed by identity stays reachable while a filter is
  applied* gains its second path. It currently names search as "today the only one".

## Impact

- `apps/web`: the calendar and the workspace — the card's action row, the map opening a
  place it was sent to, and the calendar keeping its tab in the address beside its day.
- `apps/mobile`: the same, on the calendar screen and the workspace; the calendar learns to
  open on a given day and tab when it is returned to.
- The place card on both applications gains an optional extra action in the slot
  "← Others at this point" already uses.
- No database, package or dependency changes.
