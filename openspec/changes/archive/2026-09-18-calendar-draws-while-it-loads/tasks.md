## 1. Laptop: one screen for both states

- [x] 1.1 Move the markup of `apps/web/app/_components/trip-calendar.tsx` into a `CalendarScreen` that takes `live | null` for the header and `days | null` / `waiting | null` for the lists; `TripCalendar` keeps all state, reads and writes and renders it. Verify: `pnpm typecheck` passes and the loaded calendar looks unchanged at 1280px and 600px, both themes
- [x] 1.2 Draw the waiting header: `TripBar waiting`, `AccountMenu waiting`, and "Back to the map" inert (`aria-disabled`, the chrome's inert look, no link). Verify: at 1280px and at 600px the header matches the loaded one in position and size, with bars where the names go
- [x] 1.3 Draw the waiting day controls: both step buttons and the date field inert, with a `NamePlaceholder` in the field where the date goes. Verify: stepping and choosing do nothing and are announced as unavailable
- [x] 1.4 Give `PlaceRow` a waiting form (chip block and one-line name block) and draw three per day and two city groups of three and two under "No day yet", with bars for day and city names and for the count, in the tab and the column heading. Blocks are `surface-muted`, `line` on the neighbouring days. Verify: rows have the same height as real rows (DevTools), no animation, both themes
- [x] 1.5 Mark the waiting `<main>` `aria-busy` with a visually hidden "Loading the calendar" status, and every block `aria-hidden`. Verify with the accessibility tree in DevTools
- [x] 1.6 Add `apps/web/app/calendar/loading.tsx` rendering the waiting `CalendarScreen`, and use the same screen as the `<Suspense>` fallback in `calendar/page.tsx`. Verify: with the network throttled, opening the calendar from the map shows the waiting calendar, never the map's header or "Loading your trip"

## 2. Phone: one screen for both states

- [x] 2.1 Add `NamePlaceholder` to `apps/mobile/components/ui.tsx` (11px `inkFaint` bar, centred in the replaced text's line height, in a box of that text's width). Verify: `pnpm typecheck:mobile` passes
- [x] 2.2 Move the markup of `apps/mobile/components/trip-calendar.tsx` into a `CalendarScreen` with the same `live | null`, `days | null`, `waiting | null` shape; `TripCalendar` keeps the state, queries and writes. Verify: `pnpm typecheck:mobile` passes and the loaded calendar looks unchanged in the simulator, both themes
- [x] 2.3 Draw the waiting header (bar for the trip's name, menu and "Back to the map" inert), the tabs with a bar for the count, the inert day controls with a bar for the date, and the day with three waiting rows and a bar for its name; "No day yet" with two city groups of three and two. Verify in the simulator against the mock
- [x] 2.4 Pass `days` and `waiting` as `null` from `TripCalendar` until the places and the cities have both finished their first read, and never again after that. Verify: on a cold start no day shows as empty before its places, and a re-read (leave and come back to the app) does not bring the grey rows back
- [x] 2.5 In `apps/mobile/app/calendar.tsx`, render the waiting `CalendarScreen` instead of `LoadingState` while the session and the trips are read; the two redirects are unchanged. Verify: opening the calendar goes straight to the calendar's shape, with no "Loading your trips" screen
- [x] 2.6 Mark the waiting body busy with the accessible label "Loading the calendar" and hide the blocks from VoiceOver. Verify with VoiceOver in the simulator

## 3. Checks

- [x] 3.1 Look at both apps in both themes during the wait and after it, side by side with the mock (https://claude.ai/artifact/5ut7MtaYQjDmtTyqEkNCyS): nothing moves or resizes when the data lands, at 1280px, 1000px, 600px and on the phone
- [x] 3.2 Run `pnpm verify` and `openspec validate calendar-draws-while-it-loads --strict`; both pass
