## Why

A city can only be made while saving a place. So somebody who knows their trip covers
Kyoto, Osaka and Nara cannot say so until they have found somewhere to go in each — and
the city list, which exists to organise a trip, is read-only during the one activity it
is for.

On the calendar the same control offers *+ New city…* and **always fails**, because the
calendar deliberately cannot make cities and nothing stopped the option being drawn
anyway.

And the one screen that shows what was recorded about a place does not say which city it
is filed under — even though filing is decided by a rule rather than by hand, so a place
can land somewhere nobody chose.

## What Changes

- **A city can be made from the city list itself**, on the laptop and on the phone. It
  asks for a name and, if the city has one, a second currency — the same two things the
  place form already asks for, and the same two the list already lets you change later.
- **Creating a city does not switch to it.** It joins the list and waits. A city with
  nothing in it yet has nothing for the map to frame on, so switching to it would put its
  name over a map showing none of it.
- **The calendar stops offering to create a city.** The option is absent rather than
  present and refusing. The phone's calendar already does this.
- **A place's details show which city it is filed under**, on both applications. A place
  filed under none says `Unassigned` — the word the place form and the map's own grouping
  already use, rather than one of the card's `No … yet` phrases, because leaving a place
  unfiled is a fine place to leave it rather than a gap waiting to be filled.
- **The phone's empty city list stops teaching the old rule.** It currently says a city
  *"is created the first time you file a place under a new name while saving it"*, which
  this change makes untrue.

What this is **not**: it is not a way to filter the trip by city (that question is open
separately), it does not give a city a position of its own, and it does not change how a
place gets filed — position and what the geocoder reported still decide that, exactly as
they do today.

Worth recording, because it is the real payoff and it is easy to miss: `marker-capture`
already says that when the geocoder reports a place is in Nara **and the trip holds a city
named Nara, the form files it there whether or not that city holds any places yet**. So
naming the cities before the trip means searched places file themselves correctly from the
very first one. The rule is already in force; nothing could reach it, because a city could
not exist before a place did.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `marker-capture`: *A place is filed under a city chosen as it is saved* — creating a
  city gains a second route (the city control) and an exception (a surface that cannot
  create one does not offer to).
- `trip-calendar`: *A place opened from the calendar shows what it shows on the map* —
  states the one thing the calendar's place form deliberately does not offer, and why that
  is not the dead end the requirement exists to prevent.
- `workspace-chrome`: *The city being worked in is named beside the trip it narrows* — the
  control that names the city can also make one, and what creating does not do.
- `map-rendering`: *Selecting a marker shows what was recorded about it* — the city joins
  the fields a place shows, with its own wording for being unfiled.

## Impact

- **Web**: the city control (`apps/web/app/_components/city-bar.tsx`), the place form's
  city list (`marker-form.tsx`), the calendar that passes it a stub
  (`trip-calendar.tsx`), and the details card (`marker-details.tsx`).
- **Phone**: the city sheet (`apps/mobile/components/city-sheet.tsx`) including its empty
  state, and the details sheet.
- **Shared**: none expected. `createCity` in `packages/data/src/cities.ts` and
  `newCitySchema` in `packages/core/src/city.ts` already accept exactly what this needs,
  and the workspace already holds one creation path both surfaces can call.
- **Database**: no migration. No new column, policy or function.
