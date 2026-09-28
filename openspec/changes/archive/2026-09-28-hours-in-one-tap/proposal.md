## Why

The two most common kinds of opening hours are the slowest to enter (#221). A place open
every day needs all seven day letters tapped one by one. A place that never closes has
no option of its own: you have to know that the same opening and closing time means
"open all day", and nobody would guess that.

## What Changes

- An **`Every day`** button sits at the right end of the line under the day letters. One
  tap turns all seven days on. It's highlighted while all seven are on, and tapping it
  then turns every day off, which hides the times the way turning the last day off does
  now.
- A **`24 hours`** switch sits at the right end of the row with the times. It appears
  with the times, once any day is on. When it's on, the two time fields are replaced by
  `Open all day`, and the place is saved as open all day.
- Turning `24 hours` off brings back whatever times were in the fields before it was
  turned on. If none had been typed, the fields are empty.
- A place already saved with equal times opens with `24 hours` on. Saving it without
  touching the hours leaves them exactly as they were.
- Same on the laptop and the phone, laid out as the phone does it (settled in the mock
  on 2026-09-28).
- Both controls have words in English and Spanish.

Not being done:
- No change to what is stored. Equal times already mean open all day.
- No other shortcuts, such as "weekdays" or preset times.
- Typing equal times by hand keeps working as it does now: the form says `Open all day`
  and does not turn the switch on while you type.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `marker-capture`: the hours requirement in the place form gains the `Every day` button
  and the `24 hours` switch, and says how the switch opens, saves and gives back times.

## Impact

- `@pinpoint/core`: the shared form draft for hours (`HoursDraft`, `splitHours`,
  `joinHours`) learns about "open all day", so both apps open and save a place the same
  way.
- `@pinpoint/wording`: two new names for the button and the switch, in both languages.
- `apps/mobile/components/hours-field.tsx` and `apps/web/app/_components/hours-field.tsx`
  (plus its stylesheet): the two controls.
- No database, storage or validation change.
