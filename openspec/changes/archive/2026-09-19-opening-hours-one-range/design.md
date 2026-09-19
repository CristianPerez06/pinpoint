## Context

A place's hours are one nullable `jsonb` column on `markers`, keyed by open day:
`{ "mon": [["09:00","17:00"]], "wed": [["09:00","17:00"]] }`. The database checks only
that it is a non-empty object. Every rule about the ranges lives in `openingHoursSchema`
in `packages/core/src/opening-hours.ts`, which both apps and the data layer validate
through. Reads go through `openingHoursOf`, which turns anything the schema refuses into
`null`, so one bad row cannot fail a trip's read.

The form edits an `HoursDraft` of `{ days, usual, apart }`. `splitHours` and `joinHours`
convert between that and the stored week. The card's wording comes from `describeHours`.

## Goals / Non-Goals

**Goals:** one rule in `@pinpoint/core` for "one range, the same every open day"; a
simpler form draft; the card's one-line wording; no database change.

**Non-Goals:** changing the stored shape, and anything in #191 (the form's grouping and
labels).

## Decisions

**Keep the stored shape, and tighten the schema.** The week stays keyed by day, with one
range repeated under each open day. The schema requires exactly one range per open day,
and the same range on every open day. The overlap, second-range and midnight-crossing
checks go.

Rejected: storing `{ days, open, close }` instead. It states the rule structurally, but
it needs a migration that rewrites every row with hours, a new database check, and a
change to the data layer's read and write mapping. Every one of those is work and risk
for a shape nobody sees. The current shape also keeps the later "is this place open on
the day it's planned for" question a one-key lookup, as the original migration intended.

**Reads stay as strict as writes.** A stored week that breaks the new rule reads as no
hours, through the existing `openingHoursOf` fallback. That is the right result only
because the live data is checked first (task 1.1), and the check stops the work if any
such place exists. A lenient read path, one that tolerates the old shape, would keep
alive code the issue asks to remove.

**The form draft becomes `{ days, range }`.** `splitHours` takes the days and the one
range; `joinHours` writes the range under each day turned on. `setDayApart`, `rejoinDay`
and `daysNotApart` are deleted. `joinHours(splitHours(h))` still equals `h` for every
valid `h`, so saving an untouched place still writes back what it read.

**The card is one open line plus the `Closed` line.** `describeHours` names the open days
in week order, joining neighbours of two or more into a span (`Mon–Wed`) and separating
the rest with commas, or `Every day` for all seven. It keeps its `HoursLine[]` return
type, so both cards render it unchanged. Only the number of lines drops.

## Risks / Trade-offs

- [A place with a second range or different days exists after all] → Task 1.1 queries
  the live data before any code changes. If a row turns up, the work stops and the user
  decides.
- [An older build writes a second range after the change ships] → The web app deploys as
  one unit, and phone development builds load their JavaScript from Metro, so no older
  writer is still in use. If one were, its write would read as "no hours" rather than
  failing, and the stale-read check is unaffected.
- [The original migration's header still describes two ranges] → Migrations are history
  and are not edited. The schema's doc comment is the current statement of the rule.

## Migration Plan

None. No column, constraint or row changes. Rollback is reverting the code.
