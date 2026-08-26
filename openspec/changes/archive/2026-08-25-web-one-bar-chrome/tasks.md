## 1. The bug fix, on its own

Written first and independently correct, so it survives if the reorganisation is
abandoned. See `design.md — Migration Plan`.

- [x] 1.1 Add `position: relative` to `.bar` in `trip-bar.module.css` and
      `city-bar.module.css`, each with a comment saying why — matching the one already
      on `.picker` in `filter-bar.module.css`
- [x] 1.2 Lift one `open` state to `TripWorkspace` covering the trip, city and filter
      panels, so `CityBar`'s separate `editing` flag can no longer coexist with an open
      `TripBar` panel; fire the refetch signals from the handler, never inside the state
      updater
- [x] 1.3 Confirm by hand that `People` and `Edit city` can no longer both be open, and
      that each panel now hangs from its own row rather than from the whole toolbar.
      Per-control anchoring is the primitive's job in group 2 — this step stops the
      panel resolving against `.toolbar`, it does not yet tie it to the button pressed

## 2. The menu primitive

- [x] 2.1 Add `Menu` to `ui.tsx`: a trigger plus panel, owning the relative anchor,
      `aria-expanded` and `aria-haspopup` on the trigger, `role="group"` and
      `aria-label` on the panel
- [x] 2.2 Move `filter-bar.tsx`'s `pointerdown`-outside and `Escape` dismisser into the
      primitive, keeping the comment explaining why it is `pointerdown` and not `click`
- [x] 2.3 Return focus to the trigger when the panel closes, in a layout effect
- [x] 2.4 Style the panel in `ui.module.css` from the existing detour tokens — `lg`
      radius, `lg` shadow, `surface`, hairline border — and settle on one width rather
      than the five in use today
- [x] 2.5 Verify by keyboard alone: open, tab through, Escape, focus lands back on the
      trigger

## 3. The filter becomes one menu that declares

- [x] 3.1 Move `Hide visited` and `Clear` inside the filter panel, alongside the
      `Wanted by` list and `Nobody has answered yet`
- [x] 3.2 Render the trigger as `Filter` when nothing is narrowed and `Filter · {n}`
      when it is, where `n` is `activeFilterCount` from `@pinpoint/core` — criteria,
      not choices, and defined once so both applications report the same number
- [x] 3.3 Give the count tabular figures so the control does not jitter as it changes
- [x] 3.4 Carry the narrowed state by fill **and** a dot, never by colour alone
- [x] 3.5 Check the closed control never names a member, and does not change width as
      more members are ticked — test with every member ticked, not two
- [x] 3.6 Check the count reads `1` for one criterion and `2` for both, does not move
      as more members are ticked, and that the "no places match this filter" overlay
      note still carries the matches-nothing case

## 4. The trip, city and account menus

- [x] 4.1 Rebuild `TripBar` as the trip's name opening a menu holding rename, people and
      new trip; the name carries a caret so it does not read as a label
- [x] 4.2 Keep the trip list inside that menu as the switcher when there is more than
      one trip, and drop the separate `<select>`/`<span>` branch so the name no longer
      changes shape when a second trip appears
- [x] 4.3 Rebuild `CityBar` as the city's name opening a menu holding the city choice
      and `Edit city`; remove the `CITY` micro-label
- [x] 4.4 Add the account menu holding `Sign out`, keeping the existing server action
      inside a `<form>` exactly as the header does today
- [x] 4.5 Remove the permanent `(4)` count from People and the `title` tooltips on the
      controls that now carry visible labels

## 5. One bar

- [x] 5.1 Move the header out of `<main>` in `page.tsx` so it exposes a `banner`
      landmark, and leave `page.tsx` owning only `<main>` and the loading, failed and
      empty states
- [x] 5.2 Build the bar in the workspace as a client component: trip and city on the
      left, search, drop and filter in the middle, the account on the right
- [x] 5.3 Let the trip name be the only element that yields, truncating rather than
      pushing the tools off the edge
- [x] 5.4 Delete `.narrowRow` and `.addRow`; keep the `max-width: 700px` holding rule
      with its comment saying it is temporary and belongs to #41
- [x] 5.5 Check no menu covers a control the bar keeps permanently reachable — the
      filter menu currently opens over the search field, and that is the defect this
      row count exists to remove

## 6. Documentation

- [x] 6.1 Amend DESIGN.md's Layout section: a laptop gets one bar, not a header plus a
      two-row toolbar
- [x] 6.2 Add the web header's menu to DESIGN.md's *Navigation & Chrome* entry, beside
      the phone header's, which already specifies one
- [x] 6.3 Note in the *Responsive* paragraph that the holding rule now belongs to the
      bar rather than to three rows

## 7. Look at it, because typechecking is not looking

The standing lesson from every change so far: each of the last two shipped three defects
that typechecked, rendered, and were wrong.

- [x] 7.1 Open the running app and check the bar in **both themes** — the `Filter`
      trigger fills with `accent-wash` and letters with `accent-ink`, which converge on
      the dark ground, so confirm the word is still there
- [x] 7.2 Check a sixty-character trip name, and a trip with one city and with several
- [x] 7.3 Check the narrow window: the holding rule still keeps every control reachable,
      and the marker panel does not swallow the zoom control at the widths where they
      overlap
- [x] 7.4 Walk the whole bar by keyboard with no pointer: every menu opens, dismisses,
      and returns focus; count the tab stops before the map and record the number
- [x] 7.5 Run `pnpm verify`, then `openspec validate web-one-bar-chrome --strict`
