## Why

After removing a city, editing one of the places it held can be refused with "someone
else changed this place", although nobody did (#188). Removing a city quietly updates
each of its places in the database, which moves their "last changed" time. The app only
unassigns them on its own copy and keeps the old times, so the next save of one of them
looks like it was made against an out-of-date copy.

## What Changes

- **Removing a city that held places reads the trip's places again afterwards**, on web
  and on the phone. The places still show as unassigned straight away, and the fresh
  copy replaces them a moment later. An edit made after that saves normally.
- This already happened when some of those places had a price in the city's second
  currency. It now happens whenever the city held any place.
- Removing an empty city reads nothing extra.

Not being done: re-reading after the other city edits. Renaming a city or changing its
currency doesn't touch its places, except when a second currency changes, and that
case already re-reads.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-freshness`: a write that the database carries on to other rows re-reads those
  rows afterwards.

## Impact

- Web and phone: removing a city, in each app's map workspace.
