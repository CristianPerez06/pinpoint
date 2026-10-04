## 1. The badge

- [x] 1.1 Make the phone's `pip` in `apps/mobile/components/workspace-chrome.tsx` 10pt with a 2pt ring, filled with `accentInk`, offsets moved out to match. Verified by `pnpm typecheck:mobile`
- [x] 1.2 Make the laptop's `.pip` in `filter-bar.module.css` the same numbers in `accent-ink`. Verified by measuring it at 390px: 10px, `#F0AE4A` on the dark ground, ringed in `surface`

## 2. Looking at the apps

- [x] 2.1 Phone (iOS), light ground, greyscale: with Filter forced on, the badge is a clear dark dot on Filter and nothing marks the other tools
- [x] 2.2 Laptop at 390px, dark ground: the badge is a clear bright dot on Filter
- [ ] 2.3 Phone on the dark ground, and the laptop at phone width on the light ground — not seen: the phone app is set to light and the laptop to dark here, and neither could be switched from this session. `accentInk` is the lightness-contrasting amber on each ground by definition

## 3. Done

- [x] 3.1 Run `openspec validate filter-on-reads-in-greyscale --strict` and `pnpm verify`, and both pass
