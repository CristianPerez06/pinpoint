## Why

When a place opens over the calendar, or a date calendar opens over a form, the layer
on top uses the same colours as the screen under it, so the two read as one surface
(#255). The laptop's date calendar already darkens what is behind it. The rest don't:
the phone's date calendar has no dim even though the spec asks for one, the phone's
calendar shows a place with nothing behind it, and the laptop's calendar fades to
white behind a place instead of darkening.

## What Changes

- **A place opened over the calendar darkens the calendar**, on both apps, whether it
  is showing its details or its edit form. Tapping the dark area closes it, the way
  tapping outside any other dimmed sheet does (the edit form still asks before
  throwing away changes, as it already does).
- **The phone's date calendar darkens what is behind it**, as the laptop's already
  does and the spec already requires. On Android the system's own date dialog
  already dims, and stays as it is.
- **The laptop's calendar uses the same dark wash** as everything else, in place of
  the pale wash in the background colour that lightens the screen on the light theme.
- One darkness everywhere: the one the laptop already uses for its sheets and its date
  calendar, kept as a shared colour value so both apps draw the same thing.

Not being done:

- The map's place sheet and the form saving a place keep **not** dimming. The map
  rule exists so the pin stays visible, and nothing here changes it.
- The phone's other sheets (Filter, Nearby, trips, cities, people) don't dim today
  either, though `workspace-chrome` says they should set the screen back. That is a
  separate fix and is left for its own ticket.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trip-calendar`: adds that a place opened over the calendar, its details or its
  form, sets the calendar back with the same dim the date calendar uses, on both
  apps. The date calendar's existing "over a dimmed backdrop" is unchanged. The phone
  not meeting it is a bug fixed here, not a rule change.

## Impact

- `@pinpoint/tokens`: one new colour pair for the dim.
- Web: `trip-calendar.module.css` (the calendar's wash), `ui.module.css` (the two
  places that hardcode the dim switch to the token).
- Mobile: `components/ui.tsx` (`DayField`'s iOS popup backdrop),
  `components/trip-calendar.tsx`, `components/marker-details.tsx` and
  `components/marker-form.tsx` (a dimmed backdrop when shown over the calendar, and
  only there).
