## Context

`MarkerFormSheet` (`apps/mobile/components/marker-form.tsx`) calls `onCancel` straight
from ✕ and Cancel. It cannot tell a new place from an edit, and its `initial` values are
replaced when the person goes out to the map to move the pin and comes back
(`adjustPosition` in `trip-workspace.tsx` hands the typed values back as the new
`initial`). Comparing against `initial` alone would forget changes made before that trip.

## Decisions

**The laptop's comparison, copied.** Something is entered when the form is saving a new
place, or a field differs from `initial`: name, note, city, type, link, first and last day
(`apps/web/app/_components/marker-form.tsx`, `entered`). Price and hours are left out on
the laptop and stay out here, so the two apps ask in the same cases.

**Two new props, both said by the workspace.** `capturing` says the form is saving a new
place, which always asks and picks the "place you found on the map" consequence.
`unsaved` says the form arrived already holding changes it cannot see: an edit whose pin
was moved, or whose values were changed before the trip to the map. The workspace knows
both from its panel and the marker. The calendar passes neither.

**The question replaces the footer**, as on the laptop, using the phone's existing
`Question`. Save is not live beside a question about throwing away what it would save.

**The dim's press goes through the same path.** `dimBehind` stops being a press that
does nothing and calls the same `leave` as ✕.

## Risks / Trade-offs

- [The question sits in the footer, below the keyboard if it is up] → pressing ✕ does not
  dismiss the keyboard by itself; the question is dismissed with the keyboard if needed.
  Checked by hand.
