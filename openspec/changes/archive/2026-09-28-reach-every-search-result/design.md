## Context

The phone's search is a full-screen modal (`apps/mobile/components/place-search.tsx`):
a search row, then a body `View` holding the intro, the wait, the candidates and the
hint. The body has no scroll container and does nothing about the keyboard. The modal's
root is `flex: 1` inside a full-screen `Modal`, so it has a definite height — the
`ScrollView`-in-a-content-sized-container gotcha in `CLAUDE.md` does not apply, provided
the scroll view itself is given `flex: 1`.

No mobile screen uses `keyboardShouldPersistTaps` or `keyboardDismissMode` yet.

## Goals / Non-Goals

**Goals:** the body scrolls, clears the keyboard, lowers it on drag, and keeps one-tap
choosing (see `specs/place-search/spec.md`).

**Non-Goals:** virtualising the list — it holds at most `DEFAULT_LIMIT` rows; any change
to row layout, the wait's shells, or what search returns.

## Decisions

**The body becomes a `ScrollView` with `flex: 1`, its current padding and gap moving to
`contentContainerStyle`.** A `FlatList` buys nothing for at most a handful of rows, and
the body is not one list: it holds notes, the shells and the hint around the rows, which a
`ScrollView` wraps as they are.

**Keyboard clearance through the scroll view's own inset, not `KeyboardAvoidingView`.**
`automaticallyAdjustKeyboardInsets` makes iOS add the keyboard's overlap to the scroll
view's bottom inset, so the content ends where the keyboard begins and nothing about the
layout above it moves. `KeyboardAvoidingView` is the gotcha `CLAUDE.md` already records
(it overwrites `paddingBottom`), and it would resize a screen that has no reason to move.
Android's window resizes for the keyboard by default under Expo, so the same scroll view
ends above it there; that is verified on a device rather than assumed (see Risks).

**`keyboardDismissMode="on-drag"` and `keyboardShouldPersistTaps="handled"`.** The first
lowers the keyboard when the list is dragged. The second lets a tap on a `Pressable` row
reach it while the keyboard is up; the default, `"never"`, spends the first tap closing
the keyboard. `"handled"` rather than `"always"` so a tap on empty space still lowers it.

## Risks / Trade-offs

- [A React Native `Modal` on Android is its own window, and may not resize for the
  keyboard the way the main activity does] → Check on an Android build if one is at hand.
  If the last row is still covered there, pad the content's bottom by the keyboard height
  from `Keyboard` events, on Android only. The spec's scenarios are the test either way.
- [`keyboardShouldPersistTaps` applies to the whole scroll view] → The only pressable
  things in it are candidate rows, and choosing one closes the screen, so a keyboard left
  up after the tap is never seen.
