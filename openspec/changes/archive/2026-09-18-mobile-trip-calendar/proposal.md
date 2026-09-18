## Why

A trip's places can be arranged by day on the laptop and not on the phone. That was a
stated, temporary exception — the web draws both a wide and a narrow shape, so the
arrangement could be read in both before being built twice — and the specification
carries it as a requirement waiting to be replaced. This is the change that replaces it.

It also matters where somebody actually stands. Planning happens at a laptop; the trip
itself happens on a phone, and "what are we doing today" is a phone question asked while
standing up.

## What Changes

- **A calendar on the phone**, reached by tapping the trip's name, the same row the
  laptop offers. It shows one day at a time — the phone is always the narrow shape — with
  the places still waiting for a day collapsed above it, stating how many there are, and
  staying there when there are none.
- **Stepping and choosing.** Previous day, next day, and a day chosen directly. Each
  control says in words which day it leads to, so somebody using a screen reader hears
  the day rather than an arrow. Any day is reachable, including one outside the trip's
  dates.
- **A day on the place form**, beside the city, using the phone's own date control. Set
  it, change it, clear it back to no day.
- **A trip's dates on the phone** — start and end — both while a trip is being created
  and afterwards from the trip's own sheet. Neither is required, and an end date before
  the start is refused by field.
- **A place's day on its card**, so the day is readable without opening the form. The
  laptop already shows it.
- **Opening a place from the calendar** gives the same card the map gives, with the same
  actions: interest, visited, edit, remove.
- **The way back** is a `Back to the map` control on its own line under the trip's name,
  which is where the laptop puts it at phone width and where the phone's map puts the
  city. Returning lands on the same trip, in the same city, with the filter as it was.
- **The calendar ignores the map's filter**, as it does on the laptop: every place on the
  trip, counted in full.
- The specification's web-only exception is **removed** and replaced with the rule that
  either application is sufficient on its own.

Not in this change: the laptop's three-day view (the phone has no wide shape), any
reordering of places within a day, and the wider question of replacing the laptop's
native date control (#145) — the phone uses its platform's control for the same reason
the laptop uses the browser's.

## Capabilities

### New Capabilities

None. Every rule this needs already exists; one of them says it does not apply to the
phone yet.

### Modified Capabilities

- `trip-calendar`: the requirement that this capability is offered by the web application
  only is removed, and replaced with the both-applications rule that `marker-capture` and
  `trips` already carry. The requirement placing the way back is rewritten so it holds in
  both shapes of screen: it is written in terms of the laptop's bands, and the phone
  spends those bands differently.
- `marker-capture`: the requirement listing what the place form captures gains the day.
  The form has captured it on the laptop since the calendar was built, and that list was
  never updated.

## Impact

- `apps/mobile`, plus two specification files. Almost nothing shared changes: the
  grouping, the date arithmetic, the rule for which day to open on and the refusal of an
  end date before the start are already in `@pinpoint/core`, tested, and used by the
  laptop.
- The one thing that does: **how a day is worded moves into `@pinpoint/core`** so both
  applications read one definition, rather than the phone taking a copy of the laptop's.
  A day named differently on the two is the same defect the shared price formatter already
  exists to prevent. The laptop's copy is deleted, so this touches `apps/web` as well.
- One new dependency in `apps/mobile`, for the platform's date control. Free, no account,
  no key.
- The phone remembers which trip you are on in the map screen's own memory, which a
  second screen cannot read. That choice moves up one level so both screens see it —
  otherwise switching trip on the calendar would leave the map behind on the old one.
