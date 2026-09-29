## Why

Pinpoint is meant to be used on the trip — standing in a street, deciding what to do next —
and that is exactly where there is often no signal: abroad without roaming, underground, in
the mountains. Today the phone keeps a trip only in memory, and downloads the map's look and
streets as it goes. Open the app with no signal and the map is empty and the trip is gone,
at the one moment it was needed.

## What Changes

Phone only.

- **The trip opens with no signal.** Every time a trip loads online, the phone keeps a copy of
  it: its places with their notes, hours and prices, its cities, its calendar, its people and
  who wants to go where. The app opens on that copy at once and updates it as soon as the
  trip loads, so with no signal it shows the copy instead of an error. The map's look
  (colours, fonts) is kept the same way.
- **A note says the phone is offline**, and how old what is on screen is: *Offline · the trip
  as of 14:20*.
- **Two things still work offline: Visited and Who wants to go.** A tap shows at once, with
  *Sends when you are back online* under it, and is sent when the signal returns. A place
  marked visited is sent as *visited*, not as *the opposite of what it was*, so a tap
  queued offline never undoes somebody else's.
- **Everything else that changes the trip is greyed out**, with a line saying it needs a
  connection: Edit and Remove on a place, Search and Drop on the map, and adding or changing
  cities, the calendar, the trip and its people. Filtering still works, because it only
  uses what is already on the phone. Controls are greyed rather than hidden, so nothing seems
  to have disappeared.
- **Signing out removes the trip copies and queued taps from the phone.**

Not being done:
- **Downloading the map ahead of time.** The *Offline map* screen — a Download for offline
  button, the areas around the trip's places with their sizes, Update and Remove — was
  designed with this change but moved to #232. It waits on whether OpenFreeMap's terms allow
  it. Until then the streets show offline only where the map was recently looked at.
- **The laptop.** Planning happens online; a page that loads with no connection is a much
  larger piece of work for little use.
- **Editing offline.** Adding, moving, renaming or removing anything offline would need
  every change merged against everybody else's later, and every save today already checks
  whether somebody else changed the place first.

## Capabilities

### New Capabilities

- `offline-use`: what the phone keeps from a trip, what opens and what works with no
  signal, how taps made offline are sent later, and what is greyed out.

### Modified Capabilities

- `data-freshness`: *one place holds each list* gains the saved copy — it may fill that
  place at launch, until the first read replaces it, and is never a second list shown beside
  it. A re-read that fails offline keeps showing the copy, with the offline note.

## Impact

- `apps/mobile`: the copy kept on the phone, the queue of taps, the offline note and greyed
  controls.
- Storage: the trip copies and the queue are plain files on the phone. No database is
  added.
- One new dependency on the phone to know whether it is online.
- `@pinpoint/wording`: every new sentence, in English and Spanish.
- No database change. The laptop is untouched.
