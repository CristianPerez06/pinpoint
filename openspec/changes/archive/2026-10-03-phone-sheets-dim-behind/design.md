## Context

Every sheet on the phone is a `Sheet` (`apps/mobile/components/sheet.tsx`): a
transparent `Modal` whose whole content slides up from the bottom edge (or, `floating`,
fades and rises a short way). Each sheet then draws its own full-screen `Pressable`
backdrop, with no colour, which catches a press outside the surface and closes it.
The shared `scrim` colour exists since #255; `DayField`'s iOS date calendar paints it on
its own backdrop, inside the moving content.

## Goals / Non-Goals

**Goals:** one place draws the dim; it fades rather than slides.

**Non-Goals:** changing how each sheet catches a press outside it, or the map's own
details sheet and capture form, which are not `Sheet`s and stay undimmed.

## Decisions

**The dim lives in `Sheet`, on by default, beside the moving content rather than inside
it.** `Sheet` already owns the `shown` value that drives the slide, so a full-screen
`scrim` view behind the content, with its opacity tied to that same value, fades exactly
as long as the sheet takes to slide — under reduce motion too, where both become a fade.
Putting it in each sheet's backdrop instead would make it slide with the sheet (the
backdrop is part of the content that moves) and would need eight copies.

The dim takes no presses of its own. Each sheet's existing transparent backdrop already
covers the screen above it and closes the sheet; inside a `Modal`, nothing beneath can be
reached either way. So the press behaviour the spec asks for already holds and stays in
the sheets.

A `dim` prop, default `true`, lets the one full-screen sheet — place search — opt out, so
it does not fade a dark layer under itself on close. `DayField`'s iOS calendar drops its
own scrim colour and takes the shared one, which also stops that dim moving the short
`floating` distance with the calendar.

## Risks / Trade-offs

- [Stacked dims on the dark ground make the map behind very dark] → accepted: the spec
  asks for it and the laptop already does it; looked at on the dark theme before archive.
