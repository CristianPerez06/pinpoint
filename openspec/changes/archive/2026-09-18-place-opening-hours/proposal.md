## Why

Opening times are among the things people check most often about a place, and today the
only place to put them is the free-text note. A note can't be scanned at a glance, and
nothing else in the app can read it. People end up looking the hours up again while
planning, and again on the day (#176).

## What Changes

- **A place can record which days it is open and at what hours**, on web and on the
  phone, when it is saved and when it is edited. The decisions below were made in the
  options review on #176 and in the mock in `mock/opening-hours-mock.html`.
- **In the form**, a new `Hours (optional)` part sits after the day. A row of day
  letters, `M T W T F S S` with the week starting on Monday, can be tapped on and off.
  A line under the letters names the picked days in words ("Open Tue to Sat"), because
  two letters repeat. The time fields only appear once a day is picked.
  - **Usual hours** are one time range that covers every picked day.
    **Different on some days** sets one picked day apart with its own hours.
  - **Up to two ranges per day**, for a place that closes midday. The second range stays
    hidden behind "Add a second range" until someone taps it.
  - **Past midnight:** a closing time earlier than the opening time means the next
    morning. The form says "Closes 02:00 the next day" as you type it.
  - **Open 24 hours:** the same opening and closing time (00:00 to 00:00) means open all
    day. The form says "Open all day".
  - Times are written on a 24-hour clock.
- **On the card**, an `Hours` field sits between Day and Note. Days in a row with the
  same hours are grouped (`Tue–Thu 12:00–15:00, 19:00–23:00`). Seven identical days read
  `Every day`. The days a place is closed share one `Closed` line. A place open all day
  reads `24 hours`. A late close reads plainly, `19:00–02:00`, under the night it opens.
- **"Not filled in" and "closed" never look alike.** A place with no days picked reads
  `No hours yet`, the same way as the empty day, note and link. "Closed all week" can't
  be entered at all.
- **Hours are the place's local time**, and are never converted.
- **Every place saved before this change** opens and saves normally, with no hours.

Not being done: Spanish day letters (they arrive with translations, #45), a warning in
the calendar when a place is planned for a day it is closed (a later ticket), more than
two ranges a day, a 12-hour clock, and filling hours in from search results.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markers`: a new requirement that a marker may carry the hours it is open, and what an
  empty set of hours, a missing day, a late close and an all-day range mean.
- `marker-capture`: a new requirement for the hours part of the place form: the day
  letters, usual hours, different days, the second range and the hints.
- `map-rendering`: a new requirement for how the card shows the hours, including
  `No hours yet`.

## Impact

- Database: one migration that adds a nullable hours column to places. It is additive,
  so every existing place reads as having no hours and older app builds keep working.
- `@pinpoint/core`: the hours model and its validation, the wording the card shows, and
  `No hours yet` beside the other empty-field wording.
- `@pinpoint/data`: place reads and writes carry the hours.
- Web: the place form and the place card, which the calendar's card also uses.
- Phone: the place form sheet and the place card, which the calendar's card also uses.
- `PRODUCT.md`: hours join the list of what a place records.
