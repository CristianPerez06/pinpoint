## Context

A marker is one row in `public.markers`, read and written through `@pinpoint/data`
(`MARKER_COLUMNS`, `toMarker`, `toInsertRow`, `toUpdateRow`) and validated by the zod
schemas in `packages/core/src/marker.ts`. `newMarkerSchema` and `markerPatchSchema` are
both derived from `writableMarkerFields`. Every update bumps `updated_at` through
`markers_touch_updated_at`, and that timestamp is what refuses a stale save.
`fieldErrorsOf` files an issue under the first segment of its path, so any issue inside
the hours lands under `hours`.

The card's empty wording comes from `EMPTY_FIELD_WORDING` in `@pinpoint/core`, and the
price wording from `formatPrice`, so both apps say the same thing. Hours follow the same
pattern. Both cards are reused by their app's calendar, so the calendar needs no work of
its own.

## Goals / Non-Goals

**Goals:** hours stored per day, so a later calendar warning can read them directly; one
shared function that words them for both cards; a form that turns stored hours back into
"usual + different days" the same way on both apps.

**Non-Goals:** translated day names (#45), the calendar warning, more than two ranges,
a 12-hour clock, importing hours from search.

## Decisions

**Stored as one nullable `jsonb` column, `markers.hours`, keyed by day.** The shape is
`{ "tue": [["12:00","15:00"],["19:00","23:00"]], "sat": [["10:00","14:00"]] }`. Only open
days are keys, a missing key is a closed day, and `null` is "not filled in". The
database checks only that the value is a non-empty object. The rules on ranges (to the
minute, at most two, in order, only the second crossing midnight, equal times being all
day and alone) live in one zod schema in `packages/core/src/opening-hours.ts`, which is
what both apps and the data layer already validate through. A table of ranges would take
a join on every place read and make a save more than one write, which the stale-read
check does not cover. Nothing ever queries inside hours today.

**The form's "usual hours" is not stored.** It is derived when the form opens
(`splitHours`): the usual hours are the ranges shared by the most open days, and a tie
goes to the earliest day with Monday first. Every other open day becomes a day set apart.
`joinHours` does the reverse on save. Both live in `@pinpoint/core` and are tested
together, including the round trip: `joinHours(splitHours(h))` equals `h` for every
valid `h`. That round trip is what makes "saving an edit that did not touch the hours
leaves them exactly as they were" true.

**The card's wording is one shared function, `describeHours(hours)`.** It returns the
lines as data, `{ days: 'Tue–Thu', text: '12:00–15:00, 19:00–23:00', closed: false }`,
and each card draws them in its own grid, with the closed line muted. `No hours yet`
joins `EMPTY_FIELD_WORDING` as `hours`. Day names are an English constant in the same
module, beside the `PRICE_LOCALE` pattern, so #45 has one place to change.

**Times are typed, on both apps.** Each time is a short text field on the number keypad
that accepts `9`, `900`, `0900` or `09:00` and shows `09:00` once you leave it. This is
the one choice here that you will see in use:
- The browser's own time box follows the computer's region, so a laptop set to the US
  shows `9:00 AM` whatever the page asks for, which breaks the 24-hour rule.
- A picker on the phone would raise a panel over a form that is already a sheet, which
  `trip-calendar` forbids for the day field for the same reason.

Typing four digits is also faster than scrolling a wheel twice per range. It is judged
on the device in the look-it-over task, and swapping it for a picker later changes no
stored data.

**The new field defaults to `null` on creation, as `plannedOn` does.** `newMarkerSchema`
gets `hours: …default(null)`, and `markerPatchSchema` leaves it optional with no default,
so an edit that doesn't mention hours doesn't clear them. This is the failure the
comment on `newMarkerSchema` records from when `plannedOn` arrived.

**Release order: migration first, then code.** Adding a nullable column breaks nothing
that doesn't read it, so an installed phone build and the deployed web app keep working
while the new code rolls out. That is the reverse of the price change's order, because
this migration adds and that one removed. Pushing to the live database is still
confirmed with you at that moment.

## Risks / Trade-offs

- **The database accepts any non-empty object**, so a client that skipped the shared
  schema could store a malformed range. Both apps and the data layer validate before
  writing, and the card treats anything it can't read as `No hours yet` instead of
  crashing.
- **Typed times are unfamiliar on a phone**, where people expect a wheel. It is judged on the device
  before archiving.
- **A place's hours change with the seasons**, and this stores one week. That is what
  the note is for.
