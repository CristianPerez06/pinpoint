# The chrome renders from the first paint, inert, while only the map waits

## Why

Opening the web application shows a short grey band at the top of an otherwise empty
page, and then, all at once, an entire interface. Nothing about the first screen says
what the second one will be. The band is `LoadingState` sitting in `.full`
(`height: 100dvh`, `display: block`) — so the panel inside it is a block child that
shrinks to its own content and pins itself to the top, and the
`align-items: center; justify-content: center` written on it centre a spinner inside a
spinner-sized box. `Shell` → `.centred` loses the height the same way one level deeper,
which is why the failed state, the empty state and `TripSetup` do it too. `error.tsx` is
the one that gets it right, and the three lines `.boundary` has that `.full` does not are
the whole difference.

Filling those two containers would centre the spinner on an empty page. That is a
better-looking version of the same thing: the application still arrives in one jump, and
the shape of what is coming is still withheld until it is already there.

## What Changes

- The workspace's **chrome renders on the first paint**, before any trip data exists —
  the mark, the trip and city controls, the three tools, and the account menu, at both
  widths. Only the map waits.
- Every control in that chrome is **inert until the act it starts can complete**, which
  is a wider rule than "until its data arrives": `Search` and `Drop a pin` need no fetched
  data to draw, but one of them opens a form that needs the trip and the other arms a map
  that does not exist yet.
- Inert means `aria-disabled="true"`, a no-op handler, and inert styling — **never the
  `disabled` attribute**, which leaves the tab order and is skipped by screen readers.
- The two names are replaced by **drawn placeholder blocks**, not by text. `styling`
  requires inert control text to clear 4.5:1, so a greyed-out name is not available.
- **The chrome is not remounted when the data arrives.** One component renders both
  states, so the names fill in where the blocks were and nothing else on the bar moves.
  This is the reason the change is shaped as it is rather than as a separate skeleton
  component, which would be a second markup to keep in agreement with the first and would
  swap one for the other at the exact moment the transition is supposed to feel stable.
- The map's loader occupies **the map's own area**, on the map's own ground, rather than
  standing in for the whole screen.
- `.full` and `.centred` are fixed, so the failed state, the empty state and `TripSetup`
  occupy the screen they are standing in for. This outlives the shell — those three do
  not route through it.
- DESIGN.md's `clear-inert` token block is corrected from `ink-faint` to `ink-muted`. Its
  own prose already says Muted Ink, the shipped `filter-bar` already uses it with a
  comment explaining why, and `styling` forbids the value the block currently names. The
  change establishes the inert vocabulary, so it is the change that owes this.

**Not in scope.** The mock surfaced a defect in the shipped laptop bar: with a
thirty-seven character trip name and a twenty-three character city at 1000px, `All places`
and the account draw on top of one another — in the loaded state, with no skeleton
involved. `.scope` and `.city` are `flex: none`, so neither yields. #72 fixed exactly this
for the phone header; the laptop bar appears to still have it. Filed separately rather
than absorbed here, because it is a truncation rule and not a loading one — but it is
recorded in `design.md` so that this change is not blamed for it.

**Mobile is not in scope.** `apps/mobile` seeds its screen differently and its states are
`flex: 1`, so it does not have this defect. The rules added here are written for the web
application; whether the phone owes the same guarantee is a question for whenever mobile
gains a comparable wait.

## Capabilities

### New Capabilities

None. Both rules belong to specs already in force.

### Modified Capabilities

- `workspace-chrome`: gains the guarantee that the chrome is present and inert from the
  first paint rather than arriving with its data, that it is not replaced or remounted
  when the data lands, and that a state shown *in place of* the workspace occupies the
  screen rather than a band at the top of it.
- `map-rendering`: `The map distinguishes loading from empty` says the map indicates
  loading but not where. Gains the requirement that the indication occupies the map's own
  area, so that what is waiting is legible as the map rather than as the application.

## Impact

- `apps/web/app/_components/trip-workspace.tsx` — the header and tools band lift out into
  a chrome component that renders with or without data. The `<header>` must stay a
  **sibling** of `<main>`: a `<header>` inside `<main>` exposes no `banner` landmark, and
  `page.tsx` carries a comment saying so.
- `apps/web/app/_components/trip-workspace.module.css` — inert styling; the placeholder
  block.
- `apps/web/app/page.tsx` — the chrome renders outside the boundary that waits.
- `apps/web/app/loading.tsx`, `apps/web/app/page.module.css` — `.full` and `.centred`.
- `DESIGN.md` — the `clear-inert` correction.
- No new dependencies. Nothing in `packages/` moves, and nothing here is renderer-specific
  in a way that would not port.
