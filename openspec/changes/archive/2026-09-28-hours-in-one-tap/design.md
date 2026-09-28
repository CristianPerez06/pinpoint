## Context

Both hours fields edit a shared draft, `HoursDraft = { days, range }`, opened from stored
hours by `splitHours` and saved back through `joinHours` in `@pinpoint/core`. Both apps
use these helpers, so the two apps can't open the same place differently. Nothing stored
changes: open all day is already a range whose two times are equal.

The mock (2026-09-28, the phone at 375 points) settled the layout: `Every day` sits at
the right end of the line naming the days, and `24 hours` at the right end of the times
row, drawn as a switch.

## Goals / Non-Goals

**Goals:** one decision about where "24 hours is on" is kept, shared by both apps; a
switch that gives typed times back; untouched places saving back byte for byte.

**Non-Goals:** any change to storage, validation or the place cards.

## Decisions

**The switch is a field of the shared draft.** `HoursDraft` gains `allDay: boolean`.
- `splitHours` sets it when the stored times are equal, and keeps the stored range as it
  is.
- `joinHours` with `allDay` on writes the draft's range if its two times are already
  equal, and `00:00–00:00` otherwise. A place saved as 09:00–09:00 therefore saves back
  as 09:00–09:00, and a newly switched place saves as 00:00–00:00.
- While the switch is on, the range stays in the draft untouched. Turning it off just
  clears the flag, so the typed times come back without a second copy being kept. Two
  helpers in core, `setAllDay(draft, on)` and `setEveryDay(draft)`, hold the rules. That
  includes emptying the fields when the range they would give back is two equal times,
  so neither app re-implements them.
- The flag is never inferred while typing: equal times typed by hand leave it off, and
  `rangeHint` keeps saying `Open all day`.

**The phone uses React Native's own `Switch`**, coloured from the tokens: `accent` for
the track when it's on, `lineStrong` when it's off. It's the platform control, so it
already has the right size to tap and the right screen-reader role. The laptop has no
native switch, so it draws one: a `button` with `role="switch"` and `aria-checked`, the
same 44×26 track as the mock, with the visible text `24 hours` as its label.

**`Every day` is drawn like a day letter** (on: `accentWash` fill, `accent` border,
`accentInk` text), pill-shaped and 32 tall. The laptop marks it with `aria-pressed`, and
the phone with `accessibilityState.selected`, matching the letters. On the phone its tap
area is extended to 44 with `hitSlop`.

**On the laptop's narrow card the times row wraps.** That card leaves 268px (measured,
see `hours-field.module.css`). Two 76px fields, `to` and the switch need about 300. The
row therefore gets `flex-wrap: wrap`, and the switch drops under the times when it
doesn't fit, rather than shrinking the fields. The phone does the same. Measured on the
device, times and iOS's switch come to about 318 of the 319 points a 375-point phone
leaves, which is too close to rely on, so the phone's row wraps the same way.

**New wording names live under `hoursField.`**: `hoursField.everyDay` and
`hoursField.allDay`. Their sentences are the same as the card's `hours.everyDay` and
`hours.allDay` (`Every day` / `Todos los días`, `24 hours` / `24 horas`). They aren't
reused because they label a control, not a card line, and the two may diverge.

## Risks / Trade-offs

- A place saved with equal times that aren't midnight (09:00–09:00) keeps that odd pair
  in storage until someone changes the times. That's harmless, since every reader
  already treats it as open all day, and it's what "saving without changing anything
  leaves the hours as they were" requires.
- On the smallest phones the switch may sit on its own line under the times. That is
  the intended fallback, not a defect.
