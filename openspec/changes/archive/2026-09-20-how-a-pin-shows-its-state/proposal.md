## Why

A pin on the map carries two states beyond what kind of place it is: whether the trip
has already been there, and whether it is the one whose card is open. Both are drawn
badly, and for the same underlying reason — neither was ever written down as a rule, so
each application answered it on its own.

**A visited pin disappears.** It is drawn as the whole pin at 45% strength, fill and
glyph together, which takes away both of the things that say what kind of place it is.
On the light ground every one of the eight families ends up between 1.58:1 and 1.98:1
against the land it sits on, where the floor for something that is not text is 3:1. The
ticket that filed this (#121) blamed the quiet colours and named `culture`; `culture` was
recoloured since, and the measurement now says the mechanism fails for all eight. Turning
the number up does not rescue it — an unvisited pin only clears 3.11:1 to begin with, so
even at 85% the worst pin reaches 2.54:1 and is by then indistinguishable from an
unvisited one. Muting is meant to be a comparison; this is an erasure.

**A selected pin is a different thing on each device.** The laptop grows it and draws a
ring around it. The phone draws the ring only. Nothing in `map-rendering` says a selected
pin is drawn any particular way, so neither application is wrong today — which is exactly
how they drifted apart, and it is what #178 asks to fix without knowing the laptop
already does half of it.

## What Changes

- **A visited pin is emptied rather than faded.** Its family colour moves to its outline
  and its glyph, and the body of the pin goes hollow. Nothing is made fainter, so nothing
  is lost: the place still shows what kind of place it is, and "we have been here" is
  carried by the pin's *shape* — which survives a greyscale screen, both grounds, and
  being looked at from a distance. The tick stays.
- **The selected pin is drawn the same way on both applications**: the amber ring it
  already has, and grown to 1.2×, which is what the laptop does today. The phone gains
  the growth. Both draw the selected pin above its neighbours, so a pin in a tight cluster
  is never half-covered by the one in front.
- **The eight place-type colours are confirmed rather than changed.** The look #143 asks
  for was done on a bench built from the live tokens: every family clears the floor on
  both grounds, the accent does not read as a ninth kind of place, and nothing needs
  recolouring. Two greyscale collapses nobody had predicted were found and are recorded
  in `design.md` rather than fixed — the glyph is the second channel and covers them.

Not being done: no new colour token per type for the visited state (sixteen hand-tuned
values, and a new type would then cost two); no change to which types exist or what
colour any of them is; no animation of the selection beyond what each platform already
does.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `map-rendering`: the requirement **A visited marker is drawn as visited, without
  changing its colour** is replaced by **…without changing its colour or its strength**.
  It currently requires the muting to be an amount ("how much a visited marker is muted"),
  which is the mechanism being replaced, and one of its scenarios requires both
  applications to mute "by the same amount". The delta removes and re-adds it rather than
  modifying it, because a `MODIFIED` delta cannot drop a scenario — every other sentence
  is carried forward verbatim, and that was checked line by line rather than by eye.
  A new requirement, **The selected marker is drawn so it can be found**, is added; there
  is no requirement about the selected pin today.

## Impact

- `packages/map` — `VISITED_OPACITY` and the `opacity` field of the drawn description are
  replaced by a description of the visited treatment both applications read. Covered by
  `marker-view.test.ts`, which changes with it.
- `apps/web/app/_components/pin.tsx` and `pin.module.css` — draws the hollow form; its
  selection behaviour is already correct and becomes specified rather than incidental.
- `apps/mobile/components/pin.tsx` — draws the hollow form, and grows the selected pin.
- `apps/mobile/components/trip-map.tsx` — draws the selected annotation above its
  neighbours.
- No token changes, so `packages/tokens/src/generated/` is untouched.
- Closes #121, #178 and #143.
