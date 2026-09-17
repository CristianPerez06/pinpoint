## 1. Make the bar shareable

- [x] 1.1 Move the account menu out of `workspace-chrome.tsx` into its own component,
      keeping both of its states — the address spelled out where there is room, the glyph
      where there is not. Verify the map's header is unchanged at a laptop width and a
      phone width, in both themes.
- [x] 1.2 Extract the `<header>`, the mark, the grid and its breakpoint into a bar that
      takes what goes in each position rather than one bindings object. Move the code; do
      not retype it. Verify the map's bar renders identically to before — same controls,
      same order, same two-row shape on a phone — and that `pnpm typecheck` and
      `pnpm lint` pass.
- [x] 1.3 Make the grid collapse to one row when there is no city, rather than leaving an
      empty cell. Verify by measuring the row's computed height with and without a city at
      the phone breakpoint — `AGENTS.md` records that widths here are decided by flex
      defaults nobody wrote.

## 2. The calendar's header

- [x] 2.1 Render the shared bar on `/calendar` with the mark, the trip's name and the
      account, and nothing else. Verify no control for the city, search, dropping a pin or
      the filter appears.
- [x] 2.2 Put the way back to the map in the session band — the middle — and remove the
      link the screen draws for itself today. Verify it is visible without opening
      anything, and that it is not adjacent to the account menu.
- [x] 2.3 Give `TripBar` one prop naming the other view rather than `calendarHref` plus a
      flag, so the map's menu offers **Calendar** and the calendar's offers **Map**.
      Verify neither menu offers the view it is already in.

## 3. Switching trips from the calendar

- [x] 3.1 Wire the trip's name on the calendar to show the chosen trip's calendar rather
      than returning to the map. Verify a person belonging to one trip is not asked to
      choose.
- [x] 3.2 Drop `?day=` when the trip changes, so the opening-day rule decides afresh.
      Verify with a test: switching to a trip with dates that exclude today lands on its
      start date, and switching to a trip with no dates lands on today — neither lands on
      the day that was being read.

## 4. The day band

- [x] 4.1 Move the previous-day, date and next-day controls out of the header into a band
      pinned between the header and the scrolling body. Verify the controls are the first
      thing below the header and are not among its own.
- [x] 4.2 Verify the band stays put: scroll to the end of a day holding many places, on a
      narrow window and a wide one, and confirm stepping and choosing are still reachable.

## 5. Looking at it running

- [x] 5.1 Read the map first, before the calendar: laptop and phone widths, both themes,
      every control present and in its place. This change refactors the bar the map
      depends on, and the map is the screen the product is.
- [x] 5.2 Read the calendar at both widths in both themes — the bar, the day band, the
      undated card and the columns.
- [x] 5.3 Switch trips from the calendar and confirm the day shown is the one a fresh
      arrival would have been given, not the day that was being read.
- [x] 5.4 Leave for the map from the header and from the trip's menu; both return to the
      same trip and the same city.

## 6. Closing out

- [x] 6.1 Run `pnpm verify` and confirm it passes.
- [x] 6.2 Run `openspec validate calendar-header-chrome --strict` and confirm it passes.
