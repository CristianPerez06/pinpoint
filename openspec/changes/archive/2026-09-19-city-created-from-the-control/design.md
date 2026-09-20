## Context

See `proposal.md` — Why. What matters for the approach is what already exists:

- **One creation path already exists.** `addCity` in each app's trip workspace calls
  `createCity` from `@pinpoint/data` and appends the result to the list it holds. The place
  form reaches it as `onCreateCity`. The city control lives in the same workspace, so it can
  call the same function — there is nothing to extract and no second path to write.
- **`createCity` already takes what this needs.** `newCitySchema` is `{ tripId, name,
  currency }` with the currency defaulted to `null`. No migration, no schema change.
- **The phone already solves the calendar half.** `MarkerFormSheet` takes `onCreateCity?`
  and draws the option only when it is passed. The web form takes it as required and draws
  the option unconditionally, so the web calendar passes a stub returning `null`, which the
  form reports as a failed creation.
- **Neither details component can name a city.** Web's `MarkerDetails` and the phone's
  equivalent receive no cities and no city name.

Mock, reviewed before these specs were written:
https://claude.ai/artifact/5zouDLgbNA6gTxjhcjK6aW

## Goals / Non-Goals

**Goals:**

- One creation path, called from two places, so two routes cannot produce differently
  formed cities.
- A surface that cannot create a city says so by not offering, structurally rather than by
  remembering to.
- The details card names the city without being handed the whole trip's.

**Non-Goals:**

- No filtering by city (open separately, #57).
- No position for a city. `marker-capture` forbids resolving a city name to a position,
  and nothing here needs one.
- No change to how a place is filed. Position and the geocoder still decide.
- No new dependency, no migration, no shared-package change expected.

## Decisions

### Availability is carried by the callback's presence, not by a flag

**Decision:** make web's `onCreateCity` optional, exactly as the phone's already is, and
draw the `+ New city…` option only when it was passed. The web calendar stops passing a
stub and passes nothing.

**Why, over a `canCreateCity` boolean:** a flag can disagree with reality — a surface can
set it `true` and pass no handler, or pass a handler and forget the flag. With the
callback itself as the signal those two states cannot be expressed apart. It is also the
shape the phone already uses, so the two forms stop differing on this at all, which is
what let the defect exist: the phone's calendar carries a comment asserting the laptop's
calendar does the same, and it never did.

**Consequence worth stating:** a surface that wants the option must have somewhere for a
created city to go. That is the correct coupling — the offer and the ability to honour it
become the same fact.

### The create action is pinned below the list, not a row inside it

**Decision:** in both the laptop's popover and the phone's sheet, the list of cities
scrolls and the create action sits beneath it, outside the scrolling area.

**Why, over a row at the end of the list:** the trips this is for are the ones with many
cities. An action at the end of a scrolling list is furthest away exactly when the trip is
big enough to need it. `workspace-chrome` now requires it stay reachable without scrolling
past every city, so this is the shape that satisfies it rather than a preference.

Placing it above the list was rejected: the first row is where the current selection is
read, and an action there competes with the thing the control exists to show.

### The details card is given a city name, not the trip's cities

**Decision:** the details components take the resolved city name for the marker in hand,
not the array of cities.

**Why:** it is the convention already in that component, stated at its own prop —
`interestFor: (marker: Marker) => readonly MarkerInterest[]`, commented *"One marker's
records, so this component never sees the whole trip's."* Handing it every city would
break a narrowness the component already keeps, and it would put the lookup in the
presentation rather than beside the data.

The `Unassigned` wording is shared rather than written twice, as `map-rendering` requires
for the `No … yet` phrases it already shares.

### Creating does not select, and that is enforced where the city is created

**Decision:** the create handler adds the city to the list and returns; it does not touch
the selected city.

**Why:** the reasoning is in `workspace-chrome` — a city with no places has nothing for the
map to frame on. The mechanical point is where the rule lives: the place form's creation
path *does* apply the new city to the place being saved, and both paths call the same
`createCity`. So "apply it" belongs to the form's handler and "do not select it" to the
control's, rather than either being a behaviour of the shared function.

### The phone's empty state is rewritten, not deleted

It currently teaches the rule this change removes. It keeps a sentence, because a trip with
no cities is the moment somebody most needs to know what a city is for.

## Risks / Trade-offs

- **The web form's `onCreateCity` becomes optional, and TypeScript will not flag a caller
  that stops passing it by accident.** → The same risk the phone has carried since the
  calendar shipped. Mitigated by the scenarios: both calendars are asserted to leave the
  option out, and the map's form to keep it.
- **Two surfaces now create cities, so a second refusal path exists.** → Both call one
  function returning one `WriteOutcome`. The control renders the refusal the way the
  surface it is in already renders refusals — which on the laptop is the note over the map,
  and is the geometry #125 is open about. This change does not make that worse and does not
  fix it.
- **A city created and never used is now possible**, where before a city implied a place.
  → `marker-capture` already covers it: a city holding no markers claims nothing and is
  reported as such. This change makes a state reachable that the specification already
  described.
- **`Unassigned` now appears in a third place.** → It is read from one definition, so the
  three cannot drift.

## Migration Plan

None. No migration, no data change, nothing to roll back but the code.

## Open Questions

- Whether the city control should show a count of places beside each city. It appears in
  the mock to size the rows honestly and is **not** part of this change; the specs say
  nothing about it either way.
