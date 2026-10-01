## Why

Every date field on the laptop is the browser's own control. Its calendar opens wherever
the browser decides, often away from the form that opened it on a phone-shaped window, and
it is drawn in the browser's colours rather than the product's. The phone had the same
problem with iOS's built-in control and already solved it: our own field, and a calendar
centred on the screen in the product's colours. The laptop should do what the phone does
(#145).

## What Changes

- Every date field on the laptop becomes our own field, drawn as the phone's is: the date
  as `03/08/2027` on the left, a calendar icon on the right, and `No day yet` when empty.
- Pressing the field opens a calendar **centred on the screen**, over a dimmed backdrop, in
  the product's colours on both themes. Choosing a day closes it. Pressing outside it, or
  Escape, closes it without changing anything.
- Where a field can be emptied, a `Clear` sits beside it once it holds a date, as on the
  phone. The calendar band's own day field has no `Clear`, because the day being read is
  always a day.
- The calendar is used entirely by keyboard as well as by pointer, and a screen reader
  announces the day being moved to.
- Its month and weekday names are written in the language the product is being read in,
  English or Spanish, and weeks start on Monday.
- The calendar opens on the field's day, or on today when the field is empty. For `Until`,
  it opens on the place's first day.
- Affects all seven date fields on the laptop: a place's day and its `Until`, a trip's
  start and end dates in the trip menu and when creating a trip, and the calendar screen's
  day.
- The rule that a date field "raises nothing over the form" is replaced. The phone's
  calendar popup already breaks it, so the rule is rewritten to allow exactly this
  calendar and nothing else.
- Adds one free library for the month grid, chosen because it already handles keyboard use
  and screen readers.

Not being done:

- The phone does not change.
- The calendar does not show the trip's dates, and it does not pick a whole run of days in
  one go. `Day` and `Until` stay two separate fields, as on the phone.
- Dates can't be typed. As on the phone, a date is chosen from the calendar.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trip-calendar`: *A place is given its day on the place itself* no longer forbids a panel
  over the form. It allows a calendar centred on the screen, and the date fields on both
  applications now match. *A day is worded the same way wherever the product writes it*
  narrows its exception for platform-drawn controls to the phone, because the laptop's
  calendar is now ours and words its months and weekdays from the product's language.

## Impact

- `apps/web`: a new day field and calendar popup in `ui.tsx` replace `TextField`'s `date`
  type. Callers to update: `marker-form.tsx`, `trip-bar.tsx`, `trip-setup.tsx` and
  `calendar-screen.tsx`.
- `@pinpoint/core`: month and weekday names per language, beside the existing day wording.
- `@pinpoint/wording`: names for the calendar's spoken controls, such as "Previous month".
  `dayField.*` already exists.
- New dependency on `apps/web` only: `@daypicker/react`, MIT licence, with no signup, key
  or billing.
