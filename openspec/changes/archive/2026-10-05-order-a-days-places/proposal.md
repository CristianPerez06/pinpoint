## Why

Today a day in the calendar is a set of places listed by name, so it can say *what* is
planned for Thursday but not *in what order*. People want to turn a day into a plan —
temple first, then lunch, then the market — and see that plan on the map at a glance
(#278).

## What Changes

- **A day's places can be put in order in the calendar**, by dragging a place up or down
  within its day, on both the laptop and the phone. The list shows the new order
  immediately.
- **Dragging has a second route.** Keyboard and screen-reader users move a place up or
  down a step at a time, without dragging.
- **The order is saved one second after the last change**, as one save for the whole
  day. Several quick drags save once. If that save fails, the day goes back to the last
  saved order and a line says the order could not be saved.
- **Every place on a day has a position**, including those already there:
  - Places already planned keep the order they are shown in today (by name).
  - A place joining a day — newly given a day, or moved from another one — goes to the
    end of that day's list.
  - The day it left closes the gap, so a day never reads "1, 3, 4".
- **A place planned for several days has its own position on each day**, like any other
  place on that day. Moving the hotel on the 4th does not move it on the 5th.
- **With no signal, reordering is unavailable**, shown disabled with the usual line
  saying it needs a connection. The phone keeps each day's order with the rest of the
  trip, so the order still shows offline.
- **On the map, with exactly one day chosen in the filter**, each pin shows its position
  in that day's order (1, 2, 3…) instead of its type icon, keeping its colour. With no
  day, several days, or "no day" chosen, pins look as they do today. The map cannot
  change the order.
- **`PRODUCT.md`'s "Wishlist, not itinerary" is narrowed**: a day may now have an order,
  but never times. Times are #283, deliberately not this change.

Not done here: times of day (#283); dragging a place from one day to another (a place's
day is still changed on the place itself); reordering anywhere but the calendar.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trip-calendar`: a day stops being "a set rather than a sequence". Its places are
  shown in a stored order, which can be changed by dragging (or step by step) and is
  saved for the whole day.
- `map-rendering`: with exactly one day chosen, a pin draws its position in that day's
  order in place of its type icon.
- `offline-use`: reordering joins the controls unavailable with no signal, and the
  phone's kept copy holds each day's order.
- `data-freshness`: each day's order is one of the lists a trip is made of, and is
  re-read by the same rules as the others.

## Impact

- **Database**: a new table holding each day's order per trip, kept complete by the
  database when a place gains, changes or loses its day, with policies and a grant.
  Existing days are filled in by the migration.
- **`@pinpoint/core`**: the order a day's places are listed in now comes from the stored
  order rather than from the name.
- **`@pinpoint/data`**: read and save a trip's day orders.
- **`@pinpoint/map`**: a marker's description can carry a position to draw instead of
  its icon.
- **`@pinpoint/wording`**: sentences for the drag handle, moving up and down, and a
  failed save, in English and Spanish.
- **Web**: drag-to-reorder in the calendar, using `@dnd-kit` (free, MIT); numbered pins.
- **Mobile**: drag-to-reorder in the calendar, using `react-native-gesture-handler` with
  the Reanimated already installed. A new native module, so it **needs a new development
  build**. Numbered pins.
- **`PRODUCT.md`**: the positioning line.
