## 1. Web — the filter control

- [ ] 1.1 Delete `summarise()` from `filter-bar.tsx` and give the closed control the
      fixed text `Wanted by`, folding the separate `Wanted by` label into it so there
      is one control rather than a label beside a button.
- [ ] 1.2 Delete the `Showing N of M` count: remove the `.narrowed` block's count
      span, and remove the `shown` and `total` props from `FilterBar` and from the
      call site in `trip-workspace.tsx`.
- [ ] 1.3 Render `Clear` unconditionally. When `isFiltered(filter)` is false it takes
      `aria-disabled="true"`, is styled inert, and its handler returns without calling
      `onChange` — not the `disabled` attribute, which would drop it from the tab
      order and silence it for screen readers (design.md — Decisions).
- [ ] 1.4 Trim `filter-bar.module.css`: `.narrowed` and `.count` go, the standalone
      label rule goes, and `.clear` gains an inert state alongside its live one that
      differs by more than colour.

## 2. Web — the toolbar rows

- [ ] 2.1 Restructure the toolbar in `trip-workspace.tsx` into two rows — city, filter
      and clear in row one; place search and drop-a-pin in row two.
- [ ] 2.2 Rewrite `.toolbar` in `trip-workspace.module.css`: drop `flex-wrap: wrap`,
      make it a column of two flex rows, and let search take the free space in row two
      with the button pinned right.
- [ ] 2.3 Add a holding rule for narrow windows: below the breakpoint, let each row
      wrap and let the search input take a full line, so a phone-width browser
      degrades to what it does today rather than clipping controls. Comment it as
      temporary and name its successor — the roadmap's "Responsive web" item
      replaces it with the phone layout, and this exists so that item is not a
      prerequisite for shipping the two rows.
- [ ] 2.4 Confirm the map overlay's "No places match this filter" and its inline way
      out are untouched — they are a separate requirement and stay.

## 3. Mobile

- [ ] 3.1 Delete the narrowed strip from `apps/mobile/components/trip-workspace.tsx`
      and its styles.
- [ ] 3.2 Add a permanent `Clear` to the header row beside the filter pill, inert when
      no filter is applied via `accessibilityState={{ disabled: true }}` and a no-op
      `onPress` — not `disabled`, for the reason in 1.3.
- [ ] 3.3 Delete the sheet's conditional `Clear` and `summariseFilter()` from
      `filter-sheet.tsx`, and give the header pill the fixed text `Filter`.

## 4. Checks

- [ ] 4.1 `pnpm typecheck`, `pnpm lint`, `pnpm build` — and treat green as the start
      of verification, not the end. Three consecutive changes have shipped a defect
      that passed all three.
- [ ] 4.2 Grep both applications for remaining references to the deleted props and
      functions, so nothing survives as an unused import or a dead style.

## 5. Looking at it

Every task here means opening a running application. None is satisfied by reading
the diff.

- [ ] 5.1 Web: apply a member filter and watch the toolbar. Nothing appears, nothing
      disappears, and no control beside `Clear` moves. Clear it and watch the same.
- [ ] 5.2 Web: at a wide window, confirm the toolbar is two rows and that row two's
      search grows rather than wrapping.
- [ ] 5.3 Web: at a phone-width window, confirm nothing is clipped or unreachable —
      every control is on screen and pressable. It is allowed to look cramped; it is
      not allowed to lose a control.
- [ ] 5.4 Web: tab to `Clear` with a filter applied and with none, using VoiceOver.
      It is reachable in both, and the announced state differs.
- [ ] 5.5 Web: view the toolbar in greyscale — macOS Display accessibility filters, or
      a `filter: grayscale(1)` on the body — and confirm a narrowed view is still
      distinguishable from an unfiltered one.
- [ ] 5.6 Web: apply a filter that matches nothing and confirm the map overlay still
      says so and still offers a way out.
- [ ] 5.7 Mobile: on a real device at the narrowest width, confirm the header holds
      wordmark, trip name, `Clear`, filter pill and sign out without overflow, and
      that the trip name is what truncates.
- [ ] 5.8 Mobile: apply and clear a filter from the sheet, and confirm the map gains
      the vertical band the strip used to occupy.
- [ ] 5.9 Both: narrow the same trip the same way on each and confirm the same markers
      are shown — untouched by this change, and the cheapest way to prove it.
