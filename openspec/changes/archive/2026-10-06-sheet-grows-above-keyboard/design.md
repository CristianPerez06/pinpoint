## Context

Five sheets in the phone app hold a field: the cities, the people and the trips
(`sheetHeight()`, a fixed half of the window), the currency picker (its own
`SHEET_HEIGHT` of 0.8 of the window), and the place form (`marker-form.tsx`, an
`Animated.Value` that springs between two detents, 0.52 and 0.92).

All five already raise themselves over the keyboard with a bare `KeyboardAvoidingView`
(`behavior="padding"`) around a surface `View` that holds a definite `height`. Two
`AGENTS.md` entries constrain any change here: the `KeyboardAvoidingView` stays a bare
positioner, and the surface must keep a definite height or its `ScrollView` collapses.
Both still hold if only the *value* of that height changes, which is all this change does.

The form also reports its height through `onHeight`, and `trip-map.tsx` re-frames the
draft whenever that number changes (`visibleCentre(draft, zoom, formHeight)`).

## Goals / Non-Goals

**Goals:**
- One shared rule for "how tall is a sheet right now", used by all five.
- The sheet moves in step with the keyboard, not after it.

**Non-Goals:**
- Scrolling the focused field into view. Every field is near the top of its sheet's
  scroller except the people panel's invite form, and the taller sheet should be enough.
  Checked on the device in the tasks; adding scroll-into-view only if it isn't.

## Decisions

**Keyboard height comes from React Native's own `Keyboard` events.** A hook beside
`Sheet` in `components/sheet.tsx` (`useKeyboard`) listens to `keyboardWillShow` /
`keyboardWillHide` on iOS and `keyboardDidShow` / `keyboardDidHide` on Android (Android
sends no "will" events), and returns the keyboard's height, or 0, plus the duration of
its animation. No new dependency.

**The keyboard's height comes with its top edge, and the sheet is sized from the edge.**
First written as `window − keyboard height − …`. On Android, under edge-to-edge, those
two numbers don't add up to where the keyboard actually starts, and Cities ran into the
status bar on the emulator. The edge (`endCoordinates.screenY`) is the number
`KeyboardAvoidingView` itself uses to lift the sheet, so sizing from it lines up on both
platforms.

**The grown height is "room above the keyboard", worked out in one place.** A second
function there, `useSheetHeight(resting, open)`, returns `resting` while the keyboard is down,
and otherwise `keyboard's top edge − top safe area − a spacing token for the gap`. It is exactly
that room, even for a sheet resting taller than it: the currency picker at 0.8, or the
form at its full 0.92, would otherwise be lifted onto the keyboard with its top, and its
field, above the top of the screen. (First written as "never less than `resting`", which
would have kept exactly that defect for those two.)
The arithmetic is a pure function in `lib/sheet-height.ts`, so it can be tested with
vitest like `lib/splash/geometry.ts`. The hook only feeds it numbers.
The fixed-height sheets and the currency picker pass their resting height through it; the
`KeyboardAvoidingView` keeps lifting the surface exactly as it does now.

**While grown, the surface drops the home-indicator inset from its bottom padding.**
The keyboard covers the home indicator, so `SPACE.md + insets.bottom` would waste about
34 points of the room this change is trying to give back. It becomes `SPACE.md` while
the keyboard is up.

**The sheet moves with the keyboard's own timing.** The fixed sheets set their height
with `LayoutAnimation.configureNext` using the event's duration and the `keyboard`
easing. That is the same call `KeyboardAvoidingView` makes for its padding, so both
changes land in one animation. The form already animates its height with an
`Animated.Value`, so it runs `Animated.timing` to the grown height over that duration.
When the keyboard goes down it springs back to `heights[detent]` as it does after a drag.
Following the keyboard is not decorative motion. The keyboard moves whatever reduce
motion says, and a sheet that lagged behind it would be worse.

**The place form lifts itself instead of using `KeyboardAvoidingView`.** On the
emulator, typing into the form left `Save place` under the keyboard, and checking
showed two separate reasons. The sheet was pinned with `position: absolute; bottom: 0`,
which ignores the padding `KeyboardAvoidingView` adds, so it was never lifted at all.
And `KeyboardAvoidingView` compares its own layout, which is measured from its parent,
against the keyboard's position, which is measured from the screen. The form stands
below the trip header, so even in normal flow it under-lifted by the header's height.
Now the form's host measures itself on screen (`measureInWindow`) and lifts the sheet by
`host bottom − keyboard top` with an animated `marginBottom`. The sheet stands at the
bottom through `justifyContent: 'flex-end'` instead of absolute positioning. The grown
height is measured from the host's top, not the screen's, because the form is drawn
under the trip header and could not show anything above it. The modal sheets keep their
bare `KeyboardAvoidingView`: they fill the screen, so its parent-relative measurement
happens to be right for them.

**The form keeps reporting its resting height while grown.** `onHeight` is not called
with the grown height, so `trip-map.tsx` sees no change and the camera stays put. The
spec states this requirement.

**A drag on the form's grabber while typing puts the keyboard away first.** On grant,
the pan responder calls `Keyboard.dismiss()`, then the drag settles to a detent as it
does now. Otherwise the drag would resize a sheet whose height is being held by the
keyboard, and nothing would visibly happen.

## Risks / Trade-offs

- [The `LayoutAnimation` from the hook and the one from `KeyboardAvoidingView` are
  configured in separate listeners and may not share a frame.] → Check on the device. If
  the sheet visibly lags, have the hook's listener configure the animation and let the
  `KeyboardAvoidingView` ride the same one, since both update in the same tick.
- [Android edge-to-edge reports the keyboard differently from iOS.] → The code comments
  record that `padding` measured correctly on an Android emulator. Check the grown height
  there too, not only on iOS.
- [A picker opened over a grown sheet (currency, from the cities' creator) stacks one
  modal sheet on another while the keyboard is up.] → Each reads the same keyboard height
  independently, so both size themselves correctly. Check it on the device.
