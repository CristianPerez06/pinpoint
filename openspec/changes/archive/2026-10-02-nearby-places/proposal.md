## Why

On the trip, standing in a street, the question is *what of ours is near me right now*.
Today the only way to answer it is to look at the map and estimate. #250 taught both apps
where the person is; this uses that to answer the question directly, as a list ordered by
distance. It is also the first list of a trip's places in the product, on either app.
(#120)

## What Changes

- **A fourth tool, Nearby** (*Cerca*), beside Search, Drop and Filter on the phone, and a
  matching button on the laptop. Its icon is a pin beside list lines.
- **It opens a sheet listing the trip's places, nearest first**, over the map on the
  phone and in a panel beside the button on the laptop. The current filter applies to it,
  so "near me" and "places we both want" combine.
- **The heading says what the order is measured from.** *Nearest to you* when the
  position is known; *Nearest to the middle of the map* otherwise. The list is never empty
  and never waits on a spinner: with no position it is already sorted from the map.
- **Location is offered, not demanded.** The first time, a line at the top of the sheet
  offers *Use my location*, and that press is what asks. Once allowed, opening Nearby
  finds the person by itself, even after the app was closed. Opening Nearby never moves
  the map; only "where am I" does.
- **When location can't be used, the sheet says why** and keeps the list: refused (on
  the phone, *Open Settings*; on the laptop, allow it from the address bar), not found
  within 15 seconds (*Try again*), or known only roughly (*only known to about 1.5 km*).
  The same situations and sentences as the map's "where am I".
- **Each row** shows the type's icon, the name, the city with *✓ Visited* when it is, and
  the distance: metres under 1 km (*350 m*), kilometres above (*1.2 km*), measured in a
  straight line. Visited places are dimmed and stay in distance order. Places over 50 km
  away are greyed. The count of places is in the heading.
- **While walking, distances update live but the order holds.** When it has drifted, a
  *Re-sort* appears at the top. Reopening the sheet always sorts fresh.
- **Tapping a row opens that place** and moves the map to it. Closing the place returns
  to the list at the same spot, in the same order.
- `PRODUCT.md` stops listing *a list view on web* as undecided.

Not in this change:

- Walking time or walking routes. They need a routing service, which the $0 budget rules
  out.
- Sorting by anything but distance, or searching inside the list.
- A count of places on the Nearby tool itself.

## Capabilities

### New Capabilities

- `nearby-places`: the Nearby sheet on both apps — what it lists, what it is ordered
  from, how location is offered inside it, what each row shows, how the order behaves
  while walking, and what tapping a row does.

### Modified Capabilities

- `device-location`: opening Nearby, once location has been allowed, counts as asking
  where the person is, and *Use my location* in the sheet is a second press that may
  ask. The iOS prompt sentence also mentions distances.
- `map-rendering`: choosing a place from Nearby joins the short list of things allowed to
  move the map.
- `workspace-chrome`: the session's tools become four, and Nearby is reachable without
  first opening something.

## Impact

- `apps/mobile`, `apps/web`: the sheet, the tool, and wiring to the `useWhereAmI` hook
  from #250. No new dependency and no new native module, so no new development build.
- `packages/map`: ordering places by distance from a point, as a pure function beside
  `distanceKm`.
- `packages/core`: distance written in metres under 1 km, beside `formatDistance`.
- `packages/wording`: the sheet's sentences, in English and Spanish.
- `PRODUCT.md`: § Explicitly undecided loses *A list view on web*.
- No database, API or cost change.
