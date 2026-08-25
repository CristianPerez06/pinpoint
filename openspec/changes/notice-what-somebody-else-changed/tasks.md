## 1. Mobile can ask again, and can be told

- [x] 1.1 `apps/mobile/lib/use-query.ts`: add `refetch` and a setter. A re-run with
      unchanged dependencies must not return to `loading`, and a failed re-run must leave
      the last good result in place.
- [x] 1.2 Hold the floor on the list, not on the listener: each query records when it was
      last read and declines a re-read inside the interval, whichever trigger asked. One
      named constant, one place. A re-read asked for by hand bypasses it.
- [x] 1.3 Add `apps/mobile/lib/use-active-again.ts`: `AppState` `background` → `active`
      only.

## 2. Mobile stops keeping writes in a second pile

- [x] 2.1 `apps/mobile/components/trip-workspace.tsx`: delete `renamed`, `invited`,
      `cityWrites`, `markerWrites` and `visitedWrites`, and the four merges at `:354`,
      `:373`, `:397` and `:434`. Every write sets the query's data instead.
- [x] 2.2 Keep the two behaviours the merges were carrying: a marker whose city was just
      removed shows as unassigned, and a refused write restores what was displayed before.
- [x] 2.3 `apps/mobile/app/index.tsx`: retire `createdCount`, key the trips query on
      `[session]`, and have `onCreated` and `onTripsChanged` call `refetch`.
- [x] 2.4 Re-read all five lists on return.
- [x] 2.5 Re-read the list a sheet shows as it opens — trips, people, cities. It goes
      through the list's own floor, so opening one straight after a return reads nothing.
- [x] 2.6 `apps/mobile/components/menu-sheet.tsx`: a `Refresh` item beside Sign out that
      re-reads everything. It answers its press the way `write-feedback` requires of a
      fetch somebody is waiting on, which is the one re-read in this change that is not
      silent.
- [x] 2.7 `pnpm --filter @pinpoint/mobile typecheck` and `lint` clean.

## 3. Web re-reads into the state it already holds

- [x] 3.1 `apps/web/app/_components/trip-workspace.tsx`: hold the trips list in state like
      the other four, and delete the derived override at `:305-308`.
- [x] 3.2 Add one function that re-reads all five lists through the existing client at
      `:154` and sets the five states. Nothing else about the twenty-two write sites
      changes.
- [x] 3.3 Add `apps/web/lib/use-visible-again.ts`: `visibilitychange` to `visible`. The
      floor lives with the five lists, the same as mobile — not in this hook.
- [x] 3.4 Re-read the list a panel shows as it opens — People, and the city editor. The
      trip picker is a native `select` with no open moment; leave it to the visibility
      trigger and say so in a comment rather than reaching for a pointer listener.
- [x] 3.5 Check the `notice` guard at `:861` still behaves — it reads `markers.length`, and
      a re-read now changes that list.
- [x] 3.6 `pnpm --filter @pinpoint/web typecheck`, `lint` and `build` clean.

## 4. Look at it, with two accounts

Everything below needs two accounts on one shared trip and a real second device or browser
profile. None of it is observable with one session, and the last three changes each shipped
defects that were green on every static check.

- [ ] 4.1 A renames a trip B is not viewing; B's list shows the new name after returning to
      the application, and not before. Both platforms.
- [ ] 4.2 A archives a trip; B's list stops offering it after returning. A restores it; it
      comes back. Both platforms.
- [ ] 4.3 A adds B to a new trip; it appears in B's list after returning. Both platforms.
- [ ] 4.4 A edits a marker, a city and their interest; B sees each after returning. Both
      platforms.
- [ ] 4.5 B renames a trip, then A renames the same trip; after returning, B sees A's name
      rather than their own.
- [ ] 4.6 Background and foreground repeatedly, and flick a tab back and forth: one round of
      reads per ten seconds, not one per event. Then return and immediately open the trips
      sheet — no second read of trips. Network panel on web, Supabase logs or a proxy on
      mobile.
- [ ] 4.7 Open the trips, people and cities sheets after A has changed each one, without
      backgrounding: each list is right when it opens. Both platforms, for the two web
      panels that have an open moment.
- [ ] 4.8 Go offline, return to the app so a re-read fails, come back online, and use
      `Refresh` in the menu: the lists arrive without force-quitting, and the press is
      answered rather than silent.
- [ ] 4.9 Return with the device offline: the map keeps showing what it was showing, nothing
      blanks, and no failure is reported.
- [ ] 4.10 Toggle interest and edit a marker on both platforms after this change and confirm
      nothing that used to appear instantly now waits for a round trip — the override maps
      that are being deleted were what made those instant on mobile.

## 5. Record what was decided

- [x] 5.1 `ROADMAP.md`: realtime as a loose end with the revisit condition from the design,
      and the "web still does the snapshot, which is the weaker of the two" note corrected —
      neither application snapshots after this.
- [x] 5.2 `openspec validate notice-what-somebody-else-changed --strict`.
- [x] 5.3 `pnpm check:cycles`, `pnpm check:tokens`, and the full test run at the root.
