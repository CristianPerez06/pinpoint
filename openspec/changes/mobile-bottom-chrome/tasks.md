## 1. The menu

- [x] 1.1 Add a menu sheet component holding Sign out, built in the shape
      `filter-sheet.tsx` already uses — a transparent `Modal`, a backdrop that
      dismisses, a sheet carrying `insets.bottom` in its own padding.
- [x] 1.2 Remove Sign out from the header and add a `☰` control that opens the
      sheet, with an accessible label rather than relying on the glyph.

## 2. The header

- [x] 2.1 Replace the wordmark with the trip name, keeping the dot. The trip name
      keeps `flexShrink: 1` so it stays the element that yields.
- [x] 2.2 Remove the filter control and `Clear` from the header. It should end up
      holding the dot, the trip name and `☰` and nothing else.

## 3. The bottom row

- [x] 3.1 Add a bar over the bottom of the map carrying the filter control and
      `Clear`, with a top border and a surface behind it. (Built as floating pills
      first and reversed after looking at it on a phone — see design.md. The credit
      stays above the bar rather than inside it.)
- [x] 3.2 Move the filter control and `Clear` into it unchanged. `Clear` keeps
      being permanent, inert via `accessibilityState` when no filter is applied,
      and differing from its live state by more than colour.
- [x] 3.3 Do not render the row while a marker is selected. Not rendered rather
      than hidden, so nothing shows behind the sheet's rounded corners.
- [x] 3.4 Make the bar the floor at `bottom: 0` and lift the rest of the edge off
      it with one `lift` value — MapLibre's ornaments at `lift + SPACE.sm` via
      `logoPosition`/`attributionPosition`, our credit above those. (Revised twice
      during implementation; see design.md. Both earlier attempts tried to fit the
      bar between things already at that edge, and both put it over somebody's
      credit.)

## 4. Checks

- [x] 4.1 `pnpm typecheck:mobile`, `pnpm lint:mobile`, and the workspace checks.
      Treat green as the start of verification: the last three changes each
      shipped a defect that passed every static check.
- [x] 4.2 Grep for anything left behind — the old header styles, unused imports,
      and any style rule whose element no longer exists.

## 5. Looking at it

Every task here means holding a phone. None is satisfied by reading the diff.

- [ ] 5.1 The header holds the dot, the trip name and `☰`, and nothing else. On the
      narrowest device available, a long trip name truncates rather than pushing
      `☰` off the edge.
- [ ] 5.2 `☰` opens the sheet, Sign out works from it, and the backdrop dismisses.
- [ ] 5.3 The bar sits above the home indicator, not under it, reads as a surface
      rather than as floating controls, and both controls are comfortably reachable
      with one thumb.
- [ ] 5.4 Apply a filter from the row. `Clear` goes live, nothing moves, and the
      map narrows — the rule survived the move.
- [ ] 5.5 **The credits, both states.** With no marker selected, the bar is flush
      to the screen edge, MapLibre's wordmark and info button sit above it, and our
      OpenMapTiles credit above those — four things at one edge, none covering
      another. With a marker selected, the same holds against the sheet. This is a
      licence condition, so look at it rather than reasoning about the offsets.
- [ ] 5.6 Select a marker with a filter applied. The row disappears, nothing peeks
      out behind the sheet's rounded corners, and dismissing the sheet brings back
      both the filter control and a live `Clear`.
- [ ] 5.7 Both themes. Light and dark are separate designs here, and a change that
      only looks right on one is a defect this repo has shipped before.
- [ ] 5.8 With a filter applied that matches nothing, the map still says so and
      still offers a way out — the zero-match note is a different requirement from
      the row and is not replaced by it.
