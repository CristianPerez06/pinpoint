## Context

See `proposal.md` — Why. What shapes the approach:

- `markers.planned_on` is a single nullable `date`, added in
  `supabase/migrations/20260915120000_trip_and_marker_dates.sql`. That migration argues at
  length for `date` over `timestamptz`: a day somebody chose is not an instant, and an
  instant is a different calendar day depending on where it is read. The second column
  inherits that reasoning unchanged.
- `packages/core/src/marker-day.ts` already owns every answer about days — grouping,
  stepping, which day to open on — and states why: two implementations of "what is on
  Thursday" would eventually disagree, and it would surface as a place appearing on a
  laptop and missing on a phone. Every change here lands in that one module.
- `packages/core/src/marker.ts` derives the create and patch schemas from one shared field
  list, and the two treat an absent key oppositely on purpose: absent means "no day" on
  create and "leave it alone" on a patch.
- `marker-filter.ts`'s `matchesDay` was written for this: *"A place planned for several
  days matches when any one of them is chosen. No place can carry more than one day yet;
  the rule is here so that whatever adds that inherits it."*
- The date control in both forms is the platform's native one. #145 proposes replacing it;
  this change neither needs that nor blocks on it.

## Goals / Non-Goals

**Goals:**

- One stored place appears on every day of its run, identically on both applications,
  from one shared implementation.
- The form is unchanged for a place that is one day.
- Every existing place keeps working with nothing to backfill.

**Non-Goals:**

- Non-adjacent days. See `proposal.md`.
- Replacing the native date control (#145).
- Any change to the map, which has never read a place's day.
- A per-night model. A run is days, not nights; see *Days, not nights* below.

## Decisions

### A second nullable `date` column, not a join table or an array

`markers.planned_until`, nullable, beside `planned_on`.

A run is two dates, so two columns say it exactly. Every existing read of `planned_on`
keeps meaning what it meant — the first day — so nothing already written becomes wrong,
and there is nothing to backfill.

*Alternatives:* a join table pairing a place with each of its days expresses non-adjacent
days, but the proposal rules those out, and it would turn every read of a day into a join
and change "waiting for a day" from *no date* to *no rows* — a second definition of the
pile the calendar is built around. An array column expresses the same set more cheaply but
makes a single day harder to query and puts an unbounded list in a row. Both are the
shape to move to *if* non-adjacent days are ever wanted; a run converts into either
without anything decided here being revisited.

### The database states all four rules in one check

```
check (
  planned_until is null
  or (planned_on is not null
      and planned_until > planned_on
      and planned_until - planned_on <= 365)
)
```

That is: no end without a beginning; an end after the beginning and not equal to it; and
not longer than a year. One constraint rather than four, because they are one statement
about one pair of columns and a reader checking whether a pair is legal should have one
place to look.

Strictly `>` rather than `>=` is what enforces *a last day equal to the date is recorded
as absent*: with two representations of "one day" the calendar would have to handle both
everywhere, forever. The applications normalise an equal pair to `null` before writing, so
nobody meets this as a refusal; the constraint is the backstop for a caller the compiler
never sees, which is the population `marker.ts` already writes its defaults for.

The 365-day bound is enforced here rather than guarded in the drawing code, so that a
mistyped year is refused where it is typed instead of producing a place that silently
appears on some of its days. `marker-day.ts` already caps an enumerated trip span at 400
days for the same reason; this is that decision applied to the other date pair, moved to
the one place that can refuse rather than truncate.

No policy and no grant changes. Row-level security on `markers` resolves to trip
membership through `trip_id`, and a second date column does not change who a row belongs
to — the same argument the first migration makes. The table is already granted by
`20260921120000_data_api_grants.sql`; `pnpm check:tables` covers it.

`create_trip` is untouched. It writes trips and memberships, not places.

### Reads tolerate what writes refuse

The write schemas normalise and refuse; the read path does not validate the pair and does
not have to. A stored pair that somehow breaks the rules — written by something older, or
by hand — is read as a single day on `planned_on` rather than failing to parse, for the
reason `markers.ts` already does not validate a marker's `type`: a value written by an
older build must still render.

This is also why the run length is computed defensively at the point it is drawn rather
than trusted from the row.

### Where the fan-out happens: `groupMarkersByDay`, and nowhere else

One place puts a marker on several days. `groupMarkersByDay` walks a marker's run and adds
it to each day's list; everything downstream — `markersOnDay`, the counts, the ordering —
keeps working unchanged because it only ever reads the map that function builds.

`daysOffered` gains the same walk, so a run's days are offered by the day chooser and by
the filter even where the trip's own dates do not cover them. Both walks are bounded by
the check constraint above.

`byNameThenId` is untouched: the spec requires a spanning place to be ordered on each day
by the same rule as anything else, which is what already happens once it is in that day's
list.

`undated` is unchanged — still `plannedOn == null` — so the waiting pile, its grouping by
city and all of its counts need no thought. This is the main reason the first day stayed
in `planned_on` rather than the pair being modelled as something new.

### A new shared function answers "which day of how many"

Something like `runPositionOf(marker, day) → { index, total } | null`, returning null for
a place that is not part of a run. Both applications word it from that one answer, the way
both already word opening hours from one shared definition — so `Day 2 of 4` cannot come
out as `Day 2 of 3` on one platform.

The wording itself belongs to each application. `marker-day.ts` draws nothing and has no
opinion about language; `packages/core/src/day-wording.ts` is where a shared phrasing would
go if both turn out to want the identical string.

### The count goes on a second line, not in a pill beside the name

A place row today is one line: the type's mark, the name taking the space left over, then
whatever pills the place carries on the right — which is where `Visited` sits. Putting
`Day 3 of 5` there as a second pill is the smaller change and was the first instinct, and
it is wrong.

Those pills are `flex: 0 0 auto` and the name is `flex: 1 1 auto` with
`text-overflow: ellipsis`, so the pill keeps its width and **the name is what gives way**.
At 390px, `Kyōto International Manga Museum` loses most of itself to a five-character
count. It compounds exactly where this feature is used: a hotel halfway through a stay is
commonly also marked visited, so the row carries two pills and the name is squeezed from
both sides.

So the count goes beneath the name, inside the row's body, where it takes none of the
name's width. The cost is a taller row on the days a run appears, and a day that is mostly
a stay grows by that much — accepted, because a clipped name is a defect and a taller row
is a layout.

The spec states this as an obligation about the name rather than as "use a second line":
the requirement is that the name keeps its room, and the second line is one way of
honouring it. See `specs/trip-calendar/spec.md`.

This is also a reminder that `.placeName` ellipsising is the existing behaviour for long
names generally — the rule added here is only that the run's count must not be a *cause*
of it.

### Days, not nights

A stay from the 3rd to the 6th is four days and three nights, and the run counts days. A
hotel is the case this was built for, and nights are how a hotel is booked — but a run of
days is not only ever a hotel, and counting nights would make the count mean something
different depending on what kind of place it is. `Day 2 of 4` is true of anything. This is
worth writing down because "3 nights" is what the booking email says, and somebody will
propose matching it.

### The form reveals the second field rather than showing it

Specified in `specs/trip-calendar/spec.md`; the rationale is there. What the design adds:
the reveal is local state in the form, derived on open from whether the place already has
a last day, and clearing the field is the only way back out. No new control library and no
panel — a second native date input, matching the first.

`newMarkerSchema` defaults `plannedUntil` to `null` and `markerPatchSchema` does not, for
exactly the reason the file already gives about `plannedOn`: a default surviving
`.partial()` would clear the last day of every place edited by anything that did not
mention one.

The pair rule joins the schema as a `superRefine` beside `localPriceComesWithCurrency`,
which is the same shape of problem — two fields the database refuses separately, said
first in the client's own voice and naming the field.

## Risks / Trade-offs

- **A place is counted on each day of its run, so a trip's "places per day" figures now
  double-count a stay across days.** → Intended, and the spec says so: the place *is* on
  that day. The one count that must not change is the places waiting for a day, and it
  cannot, because it reads `plannedOn == null`.

- **Something reads a count of a day's places and assumes each place appears once across
  the trip.** → This is the invariant-that-was-never-written failure `AGENTS.md` describes
  at length. Before the fan-out lands, grep every reader of `groupMarkersByDay`,
  `markersOnDay` and `daysOffered` and check what each does with the result. A task covers
  this explicitly.

- **A phone build installed before this ships shows a spanning place on its first day
  only.** → Accepted, and named in the proposal. It reads `planned_on`, which still means
  the first day, so it opens and does not fail. The spec's standing obligation is that the
  other application not break on a date it does not present.

- **A run of 365 days is legal and would put one place on 365 day lists.** → Bounded and
  survivable; the trip-span enumeration already tolerates 400. Only a typo gets near it,
  and a typo within the bound is a place the person can see and fix.

- **Two dates in one form is one more thing to get wrong while editing under a stale
  read.** → No new rule needed: a save based on a stale read is already refused for every
  field, and the dates are two ordinary fields on that form.

## Migration Plan

One forward migration adding the column and the check. There is nothing to backfill: every
existing row has `planned_until` null, which is exactly "planned for one day", so the
product behaves identically for every place saved so far the moment the column exists.

Deploy order does not matter. The column is nullable and unconstrained when null, so the
current applications keep working against the new schema, and the new applications keep
working against a row that has no last day.

Rollback is dropping the column, which loses only the last days entered since it shipped
and leaves every place planned for its first day.

Verify the check with a rolled-back `do $$ … raise exception 'RESULT: %' … $$` probe, per
`AGENTS.md`: the four cases are an end without a beginning, an end before the beginning,
an end equal to the beginning, and an end more than 365 days out. Reasoning about a
constraint is how the composite-foreign-key entry in that file got written.
