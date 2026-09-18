## Context

The two applications move between the calendar and the map differently, and that shapes
everything here.

- **Web.** `/calendar` and `/` are separate routes. The calendar keeps its day in the
  address (`?day=`, written with `history.replaceState` so stepping never touches the
  router), but not which tab it shows on a phone-shaped window — `view` is plain state.
  The workspace already opens a place "by identity" for search: it sets its panel to
  `{ kind: 'details', groupKey, markerId, reveal: true }` and moves the camera there, and
  `reveal` is what lets a filtered-out place be drawn and explained.
- **Mobile.** The map (`index`) stays mounted and `/calendar` is pushed over it. Its way
  back is `router.back()`. The calendar's day and tab are plain state seeded by
  `dayToOpenOn(trip)`, so they are lost the moment the screen is popped. The workspace has
  the same reveal path for search.

Both place cards (`marker-details` on each platform) already have one optional action in
the spot the mock uses — `← Others at this point`, shown only for a group.

## Goals / Non-Goals

**Goals:**

- Reuse the search path for opening a place by identity, so a place the filter hides
  behaves exactly as it does for search, and the camera move is the one that already
  keeps the pin clear of the card (`offsetCenter`).
- Carry as little as possible between the screens: which place, and — only where the
  platform forgets it — which day and tab.

**Non-Goals:**

- No shared navigation abstraction between the apps. Each does this in its own idiom.
- No change to how either calendar opens on a fresh arrival.

## Decisions

### Web: go forward with the place, come back with the browser's own Back

"View on map" pushes the workspace address the calendar already builds for "Back to the
map" (`trip`, `city`), plus `place=<id>` and `from=calendar`. On arrival the workspace
reads both once, opens the place through the search path (`reveal: true`), moves the
camera as search does, and then removes both parameters with `history.replaceState`.

"Back to Calendar" is `router.back()`. The calendar's own address already holds the day,
so the step being reversed lands on it; the calendar additionally writes `view` into its
address beside `day`, the same way, so the tab comes back too.

Why: reversing the step is what `workspace-chrome` already asks a way back to do, and it
means the map never has to be told the day or the tab — the calendar's address remembers
them. Stripping the parameters after reading them makes a reload or a shared link an
ordinary arrival, and guarantees that whenever the button is on screen, the entry behind
it really is the calendar.

### Mobile: step back to the map with the place, push the calendar again with its day

"View on map" returns to the map underneath (`router.back()`) handing it the place to open
— through the note described below, read once — then opened through the search path. The calendar's day and tab travel with it (`day`, `view`) and are held by the
workspace only while that card is open.

"Back to Calendar" pushes `/calendar` with `day` and `view`; the calendar seeds its state
from them when present, and from `dayToOpenOn(trip)` otherwise, exactly as today.

Why: the phone's calendar is gone once popped, so its day has to be carried by someone;
the alternative — pushing a second map on top of the calendar — would mount a second
native map renderer for a glance. The map beneath is the one the person left, which is
what `workspace-chrome` requires of a return.

### The card takes one optional extra action, labelled by its caller

Each platform's card gains an optional action `{ label, onPress }` rendered in the same
place as `← Others at this point`: the calendar passes "View on map", the workspace passes
"← Back to Calendar" only while the open place arrived from the calendar. The card does
not know about either screen. When the extra action is passed it takes the slot outright:
`← Others at this point` is not rendered beside it (decided: the card shows only "Back to
Calendar"), so the two never compete.

Why: it is one slot, already styled on both platforms (quiet button on web, full-width
outline on the phone), and the mock settled both uses into it.

### The detour lives in the workspace's panel state, not in a separate flag

The workspace records "arrived from the calendar" on the details panel itself. Any change
of panel — closing it, opening another place, starting a drop — drops it, which is exactly
the spec's "closing the details ends the detour" with nothing extra to keep in sync.

### The phone closes the sheet after saving an edit, as the laptop does

The phone's workspace closes the map's open sheet when an edit made from it is saved.
This is the one place the change reaches beyond the detour: the laptop's `save` already
ends in `cancel()`, and the phone's form closing left the map's own `open` state behind, so
the sheet reappeared. Only edits started from the map's sheet are affected; the calendar's
own edit flow is untouched.

### Mobile hand-off is a small in-memory note, not a route parameter

Returning to the map underneath with parameters is not reliable in this router:
`dismissTo` with different parameters can fail to match the existing map and replace the
calendar with a second one. So "View on map" leaves a note — which place, which trip, which
day and view — in a module the workspace subscribes to, then goes back. The workspace takes
the note once, opens the place, and forgets it. "Back to Calendar" pushes `/calendar` with
`day` and `view` as before.

## Risks / Trade-offs

- [A place sharing its point with others loses its "Others at this point" while it shows
  "Back to Calendar"] → the others are still reached by selecting the point, which
  `map-rendering` requires anyway; once the card is closed the ordinary behaviour returns.
- [Web: `router.back()` could re-show a stale calendar] → the calendar re-reads per
  `data-freshness` when shown; the task list checks a day changed on the map is reflected.
- [Mobile: `day`/`view` params outlive their use if the calendar is later opened from the
  menu] → the menu's `router.push('/calendar')` carries none, so the calendar falls back to
  its opening day, as it does today.
- [The place is filed under a different city than the one being worked in] → the map is
  left in the city it was left in, as for search; the place is still drawn and framed.
