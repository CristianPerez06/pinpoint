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
- **A new *Offline map* screen**, opened from one line in the trip sheet (*Offline map ·
  Not downloaded*, or its size once downloaded). It lists the areas around the trip's
  places — one per group of nearby places, named after their city, with *N places with no
  city* for the rest — each with its size and a total. **Download** starts only when
  pressed, and warns when the phone is on mobile data. The download runs while Pinpoint is
  on screen and continues when the person comes back if they leave. Once done, the screen
  shows the size and date and offers **Remove from this phone**. When places are added
  somewhere not yet downloaded, it offers **Update** for just the new areas. With no signal,
  Download and Update are greyed out.
- **Signing out removes the trip copies and queued taps from the phone.** The downloaded map
  stays, since it holds nothing about the person.

Not being done:
- **The laptop.** Planning happens online; a page that loads with no connection is a much
  larger piece of work for little use.
- **Editing offline.** Adding, moving, renaming or removing anything offline would need
  every change merged against everybody else's later, and every save today already checks
  whether somebody else changed the place first.
- **Downloading in the background.** Leaving the app pauses the download; it continues on
  return.
- **Downloading on its own.** Nothing is downloaded without pressing the button.

## Capabilities

### New Capabilities

- `offline-use`: what the phone keeps from a trip, what opens and what works with no
  signal, how taps made offline are sent later, what is greyed out, and the *Offline map*
  screen with its download, update and removal.

### Modified Capabilities

- `data-freshness`: *one place holds each list* gains the saved copy — it may fill that
  place at launch, until the first read replaces it, and is never a second list shown beside
  it. A re-read that fails offline keeps showing the copy, with the offline note.

## Impact

- `apps/mobile`: the copy kept on the phone, the queue of taps, the offline note and greyed
  controls, the *Offline map* screen and its line in the trip sheet.
- Storage: the trip copies and the queue are plain files on the phone. No database is
  added. The map areas are stored by the map library itself.
- One new dependency on the phone to know whether it is online.
- `@pinpoint/map`: working out the areas from a trip's places, as a plain function.
- `@pinpoint/wording`: every new sentence, in English and Spanish.
- To confirm before building: that downloading areas in bulk from OpenFreeMap is within its
  terms of use. The $0 rule means there is no paid fallback.
- No database change. The laptop is untouched.
