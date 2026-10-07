## Why

On the phone, dragging the form for saving a place up to its full height puts its top
edge — the handle and half of the title — under the trip header (#293). With the handle
hidden the form can no longer be dragged back down, and the cut-off title makes it look
broken. The only ways out are ✕ and Cancel.

The full height is 92% of the whole screen, but the form sits in the space below the trip
header. On every phone the header takes more than 8% of the screen, so the full height is
always taller than the room the form has.

## What Changes

- At its full height, the form for saving or editing a place stops a small gap below the
  trip header (the same gap it leaves when it grows over the keyboard). The handle and the
  whole title stay visible, and the handle can drag it back down.
- On a tall screen where 92% of the screen already fits below the header, nothing
  changes.

Not being done:
- The lower height (about half the screen) is unchanged; it already fits.
- The other sheets stand at half the screen and are not affected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-chrome`: adds a requirement that the place form at its full height stays
  below the trip header, with its handle reachable.

## Impact

- `apps/mobile/components/marker-form.tsx`: the full height is capped by the room the form
  stands in.
- `apps/mobile/lib/sheet-height.ts` and its test: the arithmetic, as a pure function.
- No new dependency.
