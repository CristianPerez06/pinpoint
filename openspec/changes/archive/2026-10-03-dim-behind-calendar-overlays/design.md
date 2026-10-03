## Context

The laptop already has the dim this change wants: `#00000063`, written twice as a
literal in `ui.module.css`, once behind a menu's sheet at phone width and once as the
date calendar's `::backdrop`. The phone has no dim anywhere. Every sheet's backdrop is
a colourless `Pressable`, and the iOS date calendar's `dayBackdrop` is the same.

The calendar screens show a place differently on each app:

- **Laptop**: `trip-calendar.tsx` wraps the details card and the form in `.panel`, a
  fixed full-screen wrapper whose background is the wash. A press on it lands on the
  wrapper, outside the card, so `useDismissible` already dismisses and nothing beneath
  is reachable. Only the colour is wrong: `color-mix(var(--pp-ground) 72%, transparent)`.
- **Phone**: `trip-calendar.tsx` renders `MarkerDetails` and `MarkerFormSheet` directly.
  Both are the map's components, absolutely positioned at the bottom and built to let
  touches through to the map above them. Nothing sits between them and the calendar.

The phone's form has no discard question. Its ✕ calls `onCancel` straight away.

## Goals / Non-Goals

**Goals:** one dim value shared by both apps; the phone's two map components gain a
dim only when the calendar asks for one, so the map is untouched.

**Non-Goals:** dimming the phone's other sheets, and adding a discard question to the
phone's form. Both go to `findings.md`.

## Decisions

**The dim becomes a token, `scrim`, in `@pinpoint/tokens`.** It's a `{ light, dark }`
pair, both `#00000063` to start, which is the laptop's existing value. Both laptop
literals switch to `var(--pp-scrim)`, and the phone reads `theme.colour.scrim`. A pair
rather than one value so the dark ground can be deepened alone if black at 39% turns out
too faint over a near-black screen. That is a check in the tasks, not a guess made here.

**On the laptop, only the colour of `.panel` changes**, to the token. The fade, the
dismissal and the press-swallowing are already right.

**On the phone, the two components take an optional `dimBehind` prop**, which only the
calendar passes. With it, each component draws a full-screen `Pressable` filled with
`scrim` behind its own surface:

- `MarkerDetails`: the press calls `onDismiss`.
- `MarkerFormSheet`: the press is swallowed and does nothing, because the form has no
  question to ask before discarding (see the spec: a press does nothing where the app
  does not ask).

The component draws the dim, rather than the calendar drawing one beneath them, so the
dim enters and leaves with the surface's own animation and the form keeps control of
what its own dismissal means. Without the prop, both stay exactly as on the map:
`box-none` and nothing drawn.

**The iOS date calendar's `dayBackdrop` gets `backgroundColor: theme.colour.scrim`.**
It sits inside the `floating` `Sheet`, which fades its whole content, so the dim fades
with the calendar. Android keeps the system dialog, which dims on its own.

## Risks / Trade-offs

- [The dim on iOS fades in with the calendar's rise, rather than separately] → That
  matches the laptop, where `::backdrop` fades with the dialog. Nothing to do.
- [On the phone the date calendar opened from the form over the calendar stacks two
  dims, so the calendar ends up darker] → This is what the spec asks for, and the
  laptop already does it. Check that it still reads and isn't black, on the dark
  ground especially.
- [The phone and laptop differ on a press behind a form holding changes: the laptop
  asks, the phone ignores the press] → Neither loses work. Closing the gap means the
  phone's form needs its discard question first, which goes in findings.
