## Context

See `proposal.md` — Why. The constraints that shape the approach:

- `packages/data` is the only thing that talks to Supabase, and `packages/core` holds the
  zod schemas both applications validate against. Optional fields there are **nullable
  rather than absent** (`markerSchema` says so explicitly), and that convention holds here.
- The web workspace already keeps the trip and the city in the address, as `?trip=` and
  `?city=` (`apps/web/app/_components/trip-workspace.tsx`). `workspace-chrome` requires
  that returning from a screen restores both, and its rationale names dropping the city on
  the way back as the specific failure.
- The place form (`marker-form.tsx`) and the details panel (`marker-details.tsx`) already
  exist on web, and the panel already carries an **Edit** button into the form.
- $0 to build and run, and no new runtime dependency.

## Goals / Non-Goals

**Goals:**

- A day means the same day to everybody reading it, wherever they are.
- Grouping places by day is written once, in a shared package, so the phone's change is a
  rendering change rather than a re-derivation.
- The calendar reads the trip the way the workspace already reads it, with no per-day
  request.

**Non-Goals:**

- No change to how markers are fetched, cached or authorized. The new columns ride along
  on reads that already happen.
- No new row-level security. `trips` and `markers` already resolve to trip membership, and
  a date column does not change what a person may see.

## Decisions

### A day is a Postgres `date`, never a timestamp

`markers.planned_on` and `trips.starts_on` / `trips.ends_on` are `date`. In `packages/core`
they are `z.iso.date().nullable()`.

A timestamp carries an instant, and an instant is a different calendar day depending on
where it is read. A place dated Thursday while planning in Buenos Aires would be read as
Wednesday in Kyōto — on the trip, on the phone, in the street, which is the exact moment
the product is meant to be trusted. A `date` has no zone to convert and cannot drift.

The same applies to formatting: the day is rendered from its own year-month-day, never by
constructing a `Date` from the string and reading it back, because that parses as UTC
midnight and prints as the day before anywhere west of it.

### Which day is "today" comes from the device, not the server

The screen opens on today where the trip's dates contain it. That is deliberately the
reader's own today: somebody standing in Japan should open on the day it is where they are
standing. Computed from the device clock, in local time, formatted straight to year-month-day.

### The day being read lives in the address, alongside the trip and the city

The route is `/calendar?trip=<id>&city=<id>&day=<YYYY-MM-DD>`.

`day` is there so refreshing, or returning to a link, lands on the day that was being read.
`city` is there for one reason and it is the one `workspace-chrome` calls out: the way back
has to restore the city, and a link that navigates to `/` rather than reversing the step
that left it silently lands the person on a different city than they were working in. The
calendar carries the city through untouched and hands it back.

### Grouping by day is a pure function in `@pinpoint/core`

`packages/core` gains the grouping — markers in, a day-keyed grouping and the undated set
out — with its own tests, beside `marker-filter.ts`. The phone needs precisely this and
nothing platform-specific is involved, so it is written shared now rather than extracted
after it has been written twice differently.

Explicitly **not** in `@pinpoint/map`: nothing here is map behaviour.

### The calendar reads all of a trip's markers once and groups them in memory

No per-day query. A trip holds tens to low hundreds of places, the workspace already loads
all of them, and a day-at-a-time query would make the undated count a second request that
could disagree with the first.

It also makes the unfiltered rule fall out rather than having to be enforced: filtering
lives in `marker-filter.ts` and is applied by the workspace. The calendar simply does not
call it.

### The date field is a native `<input type="date">`

No dependency, and it is what satisfies the requirement that the field raises no panel of
our own over the form: the browser anchors its own picker to the field on a laptop, and a
phone raises the OS date control. A picker of our own would be a second layer over a form
that is already raised over the map.

The cost is that the control looks slightly different across browsers. Accepted — it is the
same trade already taken for `<select>` in the city field two rows above it.

### The backfill is a script, not a migration

`supabase/backfill-trip-dates.sql`, run by hand, deleted when this change is archived.
Nothing needs it — the dates are optional and every trip is valid without them — so
encoding it as a migration would make a permanent schema step out of a one-off convenience.
This is what #138 did with the seed migrations.

## Risks / Trade-offs

- **The `marker-filtering` delta is `MODIFIED`, so any sentence not carried forward is
  deleted from the specification at archive time** → the delta was written by copying the
  entire requirement and adding to it; the original is four paragraphs and one scenario,
  and all of them are present.
- **A date column read as a timestamp anywhere in the stack reintroduces the drift the
  first decision exists to prevent** → the value is carried as a `YYYY-MM-DD` string end to
  end and never passed through `new Date()`. Worth checking in the browser with the device
  clock set west of UTC, not only by reading the code.
- **The wide layout is three day-columns plus a full-width region above them, which is
  exactly the shape `AGENTS.md` records two flex defaults getting wrong** → a `min-width`
  floor overflows rather than wrapping, and a `flex: 0 1 auto` container takes its width
  from content. Measure the computed width of a column and of its container at 1024px,
  1440px and 2560px rather than trusting that it looks right on one of them.
- **A person on a trip that crosses the date line sees "today" change under them** → this
  is correct rather than a defect: the day it is where they are standing is the day they
  mean. Recorded so it is not later "fixed".
- **Two members dating the same place at once** → already handled: a date change is an
  ordinary marker edit and inherits the stale-read refusal.

## Migration Plan

1. One migration adds `trips.starts_on`, `trips.ends_on` (both `date null`) and
   `markers.planned_on` (`date null`), plus the check that an end date does not precede a
   start date. All nullable, so it applies to existing rows without a default and without
   a rewrite.
2. No policy changes.
3. The disposable backfill script is run by hand afterwards, against the trips already in
   the database.
4. Rollback is dropping the three columns. Nothing reads them until the web application
   ships, and the phone never does.
