## Why

When a save from the phone's map is refused, or reading the trip again fails, the screen
puts back what the database refused and is meant to say so in a red note over the map
(#252). The note was drawn below the bottom of the screen, so the person was never told:
the change simply sprang back.

## What Changes

- **The refusal note appears at the top of the map**, under the trip's header, where the
  other notes over the map stand. Tapping it still dismisses it.

Reproduced on the simulator before the fix (note set, nothing on screen) and seen after
it (note at the top of the map).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The phone was not showing a refusal the specs already require it to show.

## Impact

- Mobile: `components/trip-workspace.tsx` only. The note takes the press through
  `MarkersOverlayNote`'s own `onPress` instead of a wrapping `Pressable`, the fix
  `AGENTS.md` records for the filter's note.
