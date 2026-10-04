## 1. The breakpoint

- [x] 1.1 Change `max-width: 1024px` to `1108px` in `apps/web/app/_components/chrome-bar.module.css` and `trip-workspace.module.css`, with their comments. Verified by `grep -rn 1024 apps/web/app` finding only the historical note
- [x] 1.2 Reconcile `DESIGN.md` § Responsive: 1108px, derived from 868px and 240px, and say it was 1024px until #127

## 2. Looking at the app

- [ ] 2.1 Laptop at 1109px and 1108px, both grounds: one row with the field at 240px or more above; two rows below — not done: the browser available to this session stopped loading the trip after the earlier measurements and could not be resized. The two-row bar itself was measured at 720px and 760px in #122

## 3. Done

- [x] 3.1 Run `openspec validate bar-wraps-at-its-derived-width --strict` and `pnpm verify`, and both pass
