## Why

The calendar wears a header of its own invention — a back link, the trip's name, and
the day controls, all in one band — while every other screen in the product wears the
same bar. Arriving at it feels like arriving somewhere else, and two things it should
offer are simply missing: there is no way to switch trips, and no way to reach settings
or sign out without going back to the map first.

## What Changes

- **The calendar's header becomes the one the map already has.** The mark, the trip's
  name as the control that opens everything belonging to that trip, and the account menu
  at the far end — in the same places, so the bar reads the same on both screens.
- **Switching trips from the calendar.** The trip's name opens the same list it opens on
  the map, and choosing another trip shows that trip's calendar.
- **A way back to the map, in the bar.** It sits where finding, dropping and filtering sit
  on the map — the middle of the bar — because that band is empty on the calendar and the
  way back is the only session control this screen has. Deliberately **not** beside the
  account menu: signing out lives in there, and the chrome keeps rare destructive controls
  away from frequent ones.
- **A second way back, in the trip's own menu.** The row that reads **Calendar** on the map
  reads **Map** on the calendar. It always points at the view you are not in, so the menu
  never offers to take somebody where they already are.
- **The day controls move out of the header** and become the first thing in the screen
  itself — the previous day, the date, the next day — pinned above everything that scrolls.
- **Switching trips lands where arriving fresh lands.** Today while that trip is happening,
  its start date otherwise, today for a trip with no dates. The day being read is not
  carried across; two trips rarely overlap, and a day from one means nothing in the other.

### What the calendar's header will not show

The city, search, dropping a pin, and the filter. None of them has anything to act on
here: there is no camera to frame, no map to narrow, and nowhere to drop. A control that
appears to offer more than it offers is something the chrome already forbids.

### One control the map's header loses

**The `Refresh` row goes from the account menu**, on both screens. Extracting that menu so
the calendar could wear it is what made the row visible as a defect rather than a feature:
`data-freshness` gives the by-hand re-read to the phone and says of this one that *the web
application SHALL NOT add one*, because reloading the page is a control the browser already
provides. The row landed in #74, eighteen pull requests after the requirement forbidding it
landed in #56, and nothing caught it because no check reads the rows of a menu.

On the map it looked harmless: the map already re-reads by itself when the tab is come back
to, so the row duplicated something that worked. On the calendar it was the *only* way to
re-read, because that screen never had the automatic trigger — which reads as the row being
load bearing rather than as the screen missing what the specification asks of every screen.
**So the calendar gains that trigger and the row goes.** Removing it is compliance with a
requirement in force rather than a new decision, which is why no specification changes.

### What is not being done

- No other change to the map's header. Every remaining control keeps its place.
- No change to the phone application, which has no calendar yet (#146).
- The calendar does not become "the workspace". It borrows the bar's shape and shows only
  what it can act on — which is why it needs saying out loud, so a bar with no city selector
  reads as a decision rather than an omission.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trip-calendar`: the screen gains the product's header, the day controls move below it,
  the trip can be switched from it, and the way back is stated as two routes rather than
  one link of the screen's own.

`workspace-chrome` is deliberately **not** modified. Its requirements are written about
"the workspace", and the calendar is a screen that replaces the workspace rather than one
of them — the distinction `marker-filtering` already draws. Saying so in `trip-calendar`
is cheaper and safer than reopening a twenty-requirement specification to add an exception
to each rule that would otherwise appear to bind.

## Impact

- **`apps/web`**: the calendar route grows the shared bar; `trip-calendar.tsx` loses its
  own header and gains a pinned day band; `trip-bar.tsx` gains the row that names the other
  view; the bar itself needs to be usable by a screen that has no map behind it. The
  account menu loses `Refresh`, and the calendar gains the re-read that row was standing
  in for — including the cities, which it displays in the edit form's chooser and in the
  currency a price is written in, and which `data-freshness` therefore does not allow it
  to leave out.
- **`@pinpoint/core`** gains `dayShown`, which is the one rule both arriving fresh and
  changing trip go through. No dependency changes.
- **No database or dependency changes.** Nothing below the interface moves.
