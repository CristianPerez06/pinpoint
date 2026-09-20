## Why

A trip can be narrowed by who wants to go and by whether a place has been visited. It
cannot be narrowed by **what kind of place** it is or by **the day it is planned for**,
so "show me the food" and "what are we doing Thursday, and is any of it near the rest of
it" are questions the map cannot answer. A hundred-place trip carries all eight kinds at
once, and `planned_on` has existed since September and is readable nowhere but the
calendar — which cannot put a day's places in their real positions relative to each
other, which is the whole point of asking.

There is also a promise already in force that is not kept. `marker-filtering` requires
that selecting the **Unassigned** group in the city list shows the unfiled places *"and
places filed under a city are not"*. Nothing hides — selecting a city or Unassigned only
moves the camera and biases place search. The row exists so somebody can check what went
unfiled, and it cannot answer that. Nobody has met it because the live trip has nothing
unassigned, which is exactly the state the row was built for.

## What Changes

- **A trip can be narrowed to one or more kinds of place.** Ticking *Food* and *Temple*
  shows places that are either — unlike *Wanted by*, where naming two people means the
  places they both want. A place is exactly one kind, so the other reading would always
  select nothing.
- **A trip can be narrowed by the day a place is planned for.** The trip's own days are
  offered as a list; ticking several shows the places planned for any of them, and they
  need not be next to each other. **No day yet** singles out the places carrying no day.
- **A trip can be narrowed to the places filed under no city.** This is the obligation
  above, moved to the control that declares its own narrowing and offers the way out.
- **Selecting a city does not hide anything, and the specification now says so.**
  Unassigned becomes a selection like any other city row: it frames and it biases search.
  **This corrects a requirement that describes behaviour the product does not have.**
- **No city axis in the filter, and the refusal is recorded with its evidence.** Measured
  on a real six-city trip, framing on Osaka puts seven of Nara's eight places on screen —
  the "genuinely around the corner" case that hiding by city would delete.
- **The narrowing controls state their own answers.** Each question becomes a row naming
  what it is set to — *You and Ana*, *Food, Temple*, *19–21 March* — expanding one at a
  time, so the way out stays in view on a trip large enough to fill the panel twice over.

Not being done: no date picker (the day list is the trip's own days, so #145's unsettled
date control stays out of this); no change to the laptop bar's width or its breakpoint
(#122, #127); no list view; and the calendar goes on showing every place on the trip
whatever the map is narrowed to.

## Capabilities

### New Capabilities

None. Every requirement here belongs to a capability that already exists.

### Modified Capabilities

- `marker-filtering`: three new narrowing questions — by kind of place, by day, and to
  the places filed under no city; the sentence naming which dimensions every application
  must offer; and a correction to what selecting the Unassigned group does, which today
  specifies hiding that the product does not do.

## Impact

- `packages/core/src/marker-filter.ts` — `MarkerFilter` gains three questions, and the
  predicate and the criteria count follow. This is the shared definition both
  applications read, so neither can disagree about what a filter selects.
- `packages/core/src/city.ts` — `markersSelectedBy` keeps its camera-and-search job; the
  hiding it was specified to do moves to the filter.
- `packages/map/src/marker-type.ts` — filtering by kind must go through the same
  read-side resolution the map draws with, or a place renders as one kind and filters as
  another.
- `apps/web/app/_components/filter-bar.tsx` and `apps/mobile/components/filter-sheet.tsx`
  — the same four questions, each in its platform's own form.
- Closes #57 (answered: no), #157 and #158. Leaves #123 as the look it always was.
