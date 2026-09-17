## Why

A trip's places are saved and grouped by city, which answers *where*. Nothing answers
*when*. Deciding that Tōdai-ji is Thursday happens in somebody's head or in a message
thread, and then it is not anywhere.

`PRODUCT.md` already settles the shape this may take: pinpoint is a wishlist, not an
itinerary, and if days arrive they arrive as a **second, independent grouping** beside
City rather than underneath it. A place can be "Kyōto" *and* "Thursday". This change
builds the smallest version of that.

## What Changes

- **A trip can record the dates it runs between.** Both are optional, and they constrain
  nothing — they only decide which day the calendar opens on. Offered when a trip is
  created, changeable afterwards, and skippable at both moments.
- **A place can be given a date.** Optional, one date at most, set on the place itself in
  the same form that already holds its city — because a date and a city are the same kind
  of thing. A place's date may fall outside the trip's dates, and is never moved or
  cleared when those dates change.
- **A new calendar screen on the web application.** A date picker and previous/next day
  controls at the top; below them, a card holding the places with no date yet, and then
  the day itself. A wide window shows three days — the previous, the current and the next.
  A narrow one shows the current day alone.
- **Opening a place from the calendar shows what the map already shows.** The same panel,
  with the same Edit button, leading to the same form. Changing the date there moves the
  place to its new day.
- **A one-off script to fill in dates on the trips already in the database.** Not a
  migration — nothing needs it, since the dates are optional. It is a convenience for the
  existing trips, and it is deleted afterwards, as the seed migrations were in #138.

### What is not being done

- **No times, no ordering within a day, no dragging.** A day is a set of places, not a
  schedule. Moving a place between days is done by changing its date.
- **No filtering the map by day.** That is the good next step and it is deliberately not
  here: it adds a fourth criterion to the filter control, which is the one control this
  product calls the product.
- **A place holds one date, not several.** "Tuesday or Thursday" is a decision not yet
  made, and its place stays undated.
- **Places cannot be created from the calendar.** Only places already on the trip can be
  given a day.

### The phone does not get this yet, and that is a deliberate exception

"Either application is sufficient on its own" is a standing rule, and this change breaks
it on purpose and temporarily: putting places on days is reachable from the web
application only until a follow-up change brings it to the phone. The web application has
both a wide and a narrow layout, so the design can be validated in both shapes before it
is built twice.

There is precedent for saying this out loud rather than leaving it implied. `marker-capture`
carried a requirement that capture was offered by the web application only, and a later
change replaced it with the both-applications rule — which is why that rule now exists as
a positive statement instead of an absence. The same route is taken here.

## Capabilities

### New Capabilities

- `trip-calendar`: the calendar screen and everything reachable from it — setting a trip's
  dates, giving a place a date, the day being looked at and how it is changed, the places
  with no date yet, and the fact that all of it is offered by the web application only for
  now.

### Modified Capabilities

- `trips`: a trip may carry an optional start and end date. Model only — what may be
  stored, and that changing it never alters a place's date. Setting them is `trip-calendar`.
- `markers`: a marker may carry an optional date. Model only, for the same reason.
- `marker-filtering`: the requirement that a filter applies to every view of the trip at
  once is bound to the views that sit together in the workspace, so the calendar is not
  obliged to hide places the map's filter hides. A calendar that hid them would show a day
  as emptier than it is, and would under-count the places still waiting for one.

`marker-capture` is deliberately **not** modified. Its list of the form's fields binds both
applications, and the date field is on web only until the follow-up change. That is when
the list is rewritten — by editing a full copy of the requirement, because a `MODIFIED`
delta deletes every sentence not carried forward.

`workspace-chrome` is deliberately not modified either. It already governs what this needs:
a rare action lives behind the name of what it acts on, and a chrome control that leaves
the workspace must lead somewhere with a visible way back that restores the trip and the
city on return.

## Impact

- **Database**: two optional date columns on `trips`, one on `markers`. Row-level security
  is unchanged — both tables already resolve to trip membership.
- **`packages/core`**: the trip and marker schemas gain the new optional fields.
- **`packages/data`**: reading and writing them.
- **`apps/web`**: a new `/calendar` route; a date field in `marker-form.tsx` beside the
  city; the date shown in `marker-details.tsx`; date fields in trip creation and a way to
  change them from the trip's name menu in `trip-bar.tsx`.
- **`apps/mobile`**: no user-facing change. It reads and writes the same rows and ignores
  the new fields.
- **Dependencies**: none added. Dates are entered with the platform's own date input.
