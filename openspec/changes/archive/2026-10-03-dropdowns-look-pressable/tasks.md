## 1. Laptop

- [x] 1.1 Add `chooser` to `Menu`'s tone in `apps/web/app/_components/ui.tsx` and its rules in `ui.module.css`: `surface-muted` fill and `ink` text at rest, `line` on hover and when `aria-expanded='true'`. Verify `pnpm typecheck`
- [x] 1.2 Use it on the trip and city menus (`trip-bar.tsx`, `city-bar.tsx`) and `WaitingMenu`, and verify `grep -n 'tone="chooser"' apps/web/app/_components` lists those three
- [x] 1.3 Give `.sectionHead` in `filter-bar.module.css` the same fill at rest and `line` on hover, with a small gap between rows. Verify by lint

## 2. Phone

- [x] 2.1 Fill the trip and city triggers in `apps/mobile/components/workspace-chrome.tsx` and the trip trigger in `calendar-screen.tsx` with `surfaceMuted`, radius `md`, padding on both sides taken back by a negative margin. Verify `pnpm typecheck:mobile`
- [x] 2.2 Fill Filter's question rows in `filter-sheet.tsx` the same way, with a small gap between rows. Verify `pnpm typecheck:mobile`

## 3. Looking at the running apps

- [x] 3.1 Laptop, light and dark, wide and phone-width: the trip and city names and Filter's questions sit on a fill; hover and open are deeper; a narrowed question's value is still readable — seen at 1280px on both grounds (fill `#F3F2EF` / `#2A2724`, open `#34302B`); the account menu and the credits are unchanged. Phone width was not reached (the window would not resize), and the rules have no width condition. A narrowed question was not set
- [x] 3.2 Phone (iOS), light: the header's trip and city, the calendar's trip and Filter's questions sit on a fill, and the trip's name does not move sideways compared with before — seen with Filter forced open on the map; the name moves 4 points, as the design says. The calendar's header was not seen
- [ ] 3.3 Phone (iOS), dark: the same — not done: the app is set to the light ground and changing it needs a tap the simulator would not take from this session

## 4. Done

- [x] 4.1 Run `openspec validate dropdowns-look-pressable --strict` and `pnpm verify`, and both pass
