## 1. The value the menu is handed

- [x] 1.1 Add a helper in `apps/web` that takes the trip's members and the reader's member
      id and returns that member, or `null`. Both screens do this inline today, in one
      duplicated line each.
- [x] 1.2 Change `AccountMenuLiveProps` so the live form carries the reader's name and
      address as one value rather than `youAre: string`. A caller must not be able to
      supply the name without the address.
- [x] 1.3 Use the helper in `trip-workspace.tsx` and `trip-calendar.tsx`, deleting both
      copies of the `youAre` line and the duplicated comment above them. Keep the
      `?? 'Account'` behaviour for the name, and replace the comment with the reason it is
      unreachable rather than the current claim that it is ordinary.

## 2. The menu

- [x] 2.1 In `account-menu.tsx`, wrap the name in a column beside the initials and add the
      address beneath it, matching the phone's hierarchy — name at title weight, address
      quieter.
- [x] 2.2 In `account-menu.module.css`, give that column `min-width: 0` and truncate the
      address rather than letting it widen the panel. The panel's width is fixed; a grid
      or flex item's floor is its own content unless told otherwise.
- [x] 2.3 Leave the trigger untouched, including its collapse to the glyph below the phone
      breakpoint.
- [x] 2.4 Added on request while looking at it: the trigger was a flat `width: 13ch`,
      which is wider than most names. Size it to its content between a floor and the
      ceiling it already had, so a short name does not leave a gap and a long one is
      still cut rather than widening the bar.
- [x] 2.5 Follows from 2.4: the waiting placeholder was pinned to the same `13ch` the name
      used to be, and would now visibly collapse when the real name arrived. Set to `8ch`,
      near the middle of the name's range, so the step is small either way.

## 3. Look at it

- [x] 3.1 On the laptop, in both themes: open the menu from the map and from the calendar.
      The name and the address are both shown, and the two screens show the same thing.
- [x] 3.2 With a long address, at the narrowest width the menu is drawn at: the address
      truncates and the panel does not grow. Measure the panel's computed width rather
      than judging it by eye.
- [x] 3.3 At a phone width: the trigger is the glyph, and opening it still shows both
      lines.
- [x] 3.4 Open the phone's menu beside the laptop's and confirm they now say the same
      thing. The phone is not changed by this work; this is the check that it did not need
      to be.

## 4. Finish

- [x] 4.1 `openspec validate the-account-says-who-you-are --strict`.
- [x] 4.2 `pnpm verify`.
- [x] 4.3 Restore the dark theme if any light-theme checking left it switched.
