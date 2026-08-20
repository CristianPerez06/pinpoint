## 1. The menu

- [ ] 1.1 Add a menu sheet component holding Sign out, built in the shape
      `filter-sheet.tsx` already uses — a transparent `Modal`, a backdrop that
      dismisses, a sheet carrying `insets.bottom` in its own padding.
- [ ] 1.2 Remove Sign out from the header and add a `☰` control that opens the
      sheet, with an accessible label rather than relying on the glyph.

## 2. The header

- [ ] 2.1 Replace the wordmark with the trip name, keeping the dot. The trip name
      keeps `flexShrink: 1` so it stays the element that yields.
- [ ] 2.2 Remove the filter control and `Clear` from the header. It should end up
      holding the dot, the trip name and `☰` and nothing else.

## 3. The bottom row

- [ ] 3.1 Add a row of pills floating over the map at the bottom, carrying the
      filter control and `Clear`, clearing `insets.bottom`. Pills rather than a
      solid bar — there is no text field to give a surface to yet (design.md).
- [ ] 3.2 Move the filter control and `Clear` into it unchanged. `Clear` keeps
      being permanent, inert via `accessibilityState` when no filter is applied,
      and differing from its live state by more than colour.
- [ ] 3.3 Do not render the row while a marker is selected. Not rendered rather
      than hidden, so nothing shows behind the sheet's rounded corners.
- [ ] 3.4 Adjust the attribution's unselected offset in `trip-map.tsx` to clear the
      new row. The selected case must stay exactly as it is — that is the reason
      the row hides rather than sharing the space, and the case count staying at
      two is the thing to preserve.

## 4. Checks

- [ ] 4.1 `pnpm typecheck:mobile`, `pnpm lint:mobile`, and the workspace checks.
      Treat green as the start of verification: the last three changes each
      shipped a defect that passed every static check.
- [ ] 4.2 Grep for anything left behind — the old header styles, unused imports,
      and any style rule whose element no longer exists.

## 5. Looking at it

Every task here means holding a phone. None is satisfied by reading the diff.

- [ ] 5.1 The header holds the dot, the trip name and `☰`, and nothing else. On the
      narrowest device available, a long trip name truncates rather than pushing
      `☰` off the edge.
- [ ] 5.2 `☰` opens the sheet, Sign out works from it, and the backdrop dismisses.
- [ ] 5.3 The bottom row sits above the home indicator, not under it, and both
      controls are comfortably reachable with one thumb.
- [ ] 5.4 Apply a filter from the row. `Clear` goes live, nothing moves, and the
      map narrows — the rule survived the move.
- [ ] 5.5 **The attribution, both states.** With no marker selected it clears the
      new row and is fully legible. With one selected it sits exactly where it does
      today. This is a licence condition, so look at it rather than reasoning about
      the offsets.
- [ ] 5.6 Select a marker with a filter applied. The row disappears, nothing peeks
      out behind the sheet's rounded corners, and dismissing the sheet brings back
      both the filter control and a live `Clear`.
- [ ] 5.7 Both themes. Light and dark are separate designs here, and a change that
      only looks right on one is a defect this repo has shipped before.
- [ ] 5.8 With a filter applied that matches nothing, the map still says so and
      still offers a way out — the zero-match note is a different requirement from
      the row and is not replaced by it.
