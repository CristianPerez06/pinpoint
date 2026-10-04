## Why

On the phone, the place form throws away whatever was typed the moment ✕ or Cancel is
pressed (#259). A stray tap loses everything entered. The laptop asks "Discard what you
typed?" first, and `workspace-chrome` (*Anything that opens can be dismissed without
hunting*) already requires asking wherever a panel holds entered work or a position found
on the map.

## What Changes

- **✕ and Cancel ask before discarding** when the form holds something: a field changed
  from what the form opened with, or a new place being saved from the map. The question
  is the laptop's, word for word, and it takes the place of Save and Cancel while it is
  shown, as on the laptop.
- **A new place always asks**, even with nothing typed, because the spot lined up on the
  map is the work. Decided with the user, matching the laptop and the spec.
- **Editing with nothing changed closes at once**, as it does now.
- **Over the calendar, a tap on the dark area behind the form now dismisses it**,
  through the same question. Today it does nothing, because the form could not ask.
- An edit that went out to the map to move its pin and came back still counts as
  changed.

Not being done:

- Tapping another pin while saving a new place still gives that new place up without
  asking. It is a different gesture from dismissing the form, and is noted as a finding.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The phone was not meeting `workspace-chrome` and `trip-calendar` as they stand.

## Impact

- Mobile: `components/marker-form.tsx` (the question and when it asks),
  `components/trip-workspace.tsx` (tells the form whether it is a new place and whether
  the pin was moved), `components/trip-calendar.tsx` (unchanged call, comment only if
  needed).
