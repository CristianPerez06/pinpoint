## 1. A pressed re-read can report its outcome

- [x] 1.1 Make `apps/web/lib/use-rows.ts`'s `refresh` resolve to whether the read
      succeeded instead of `void`, keeping the rule that a failed read leaves the rows
      alone; verify `pnpm typecheck` passes and every existing caller still compiles.
- [x] 1.2 Make web's `rereadEverything` resolve to whether all five lists succeeded, and
      leave `useVisibleAgain(() => void rereadEverything())` untouched; verify by reading
      the call site that the automatic trigger still ignores the result and reports
      nothing.
- [x] 1.3 Confirm the phone's `rereadEverything` already resolves to the five settled
      results and needs no change; if it does not, give it the same shape as web's.

## 2. The control on the phone

- [x] 2.1 Wrap the zoom group in `apps/mobile/components/trip-map.tsx` in a bottom-aligned
      container carrying the existing `bottom: lift + SPACE.md`, with `gap: SPACE.md`;
      verify the zoom pair still sits exactly where it did, with the bar, with the marker
      sheet open, and with the capture form open.
- [x] 2.2 Add the re-read as the container's first child — a round surface button of the
      same vocabulary as the zoom group (surface, hairline, `sm` lift, 44pt target), no
      fill — handed in from `trip-workspace.tsx` the way `bottomRow` already is; verify it
      presses and that all five lists are read.
- [x] 2.3 Gate the container on the map being shown, and leave the zoom group's own
      `currentZoom !== null` gate on the zoom group; verify the re-read is present before
      the first zoom settles and that both disappear together when a sheet opens.
- [x] 2.4 Give the press its pending state and report a failure through the same surface a
      refused write uses on this screen; verify by forcing a failed read with the device
      offline that the screen keeps what it was showing and the failure is said out loud.
- [x] 2.5 Remove the `Refresh` row, its `RefreshCw` import, its `usePending` and the
      `onRefresh` prop from `apps/mobile/components/menu-sheet.tsx` and its call site, and
      rewrite the file comment that explains why the row was there; verify the sheet still
      opens and that `Sign out` and the settings row are unchanged.

## 3. The control on the web

- [x] 3.1 Wrap the zoom group in `apps/web/app/_components/trip-map.tsx` in a container
      carrying the existing `calc(... + var(--pp-space-md))` offset, laid out as a
      bottom-aligned column with `gap: var(--pp-space-md)`; verify the zoom pair does not
      move at a laptop width, at a phone width, and with a panel open.
- [x] 3.2 Add the re-read as the container's first child, rendered at every width and
      hidden above 700px by the same media query that relocates the tools; verify with the
      window at 699px and 701px that it appears and disappears, and that at 701px it is
      absent from the tab order.
- [x] 3.3 Wire it to `rereadEverything({ force: true })` from `trip-workspace.tsx`, handed
      to the map as a prop; verify a press reads trips, markers, cities, members and
      interest.
- [x] 3.4 Give the press its pending state and report a failure the way a refused act is
      reported on this screen; verify offline that the map keeps its pins and the failure
      is reported.
- [x] 3.5 Confirm the calendar gains nothing: no control at any width, and `Back to the
      map` unchanged; verify by opening the calendar at a phone width.

## 4. The check

- [x] 4.1 Add a script under `.github/scripts/` that fails if
      `apps/web/app/_components/account-menu.tsx` mentions a re-read, with a message
      naming the requirement and this change; verify it fails on a deliberately
      reintroduced row and passes once removed.
- [x] 4.2 Wire it into `pnpm verify` among the checks that answer in milliseconds and into
      the CI workflow; verify `pnpm verify` runs it and that it is listed in both places.

## 5. Look at it

- [x] 5.1 Run the web application at a phone width on both grounds and read the map's
      right edge: the two controls are separate objects, the gap does not read as a seam,
      and neither the attribution nor the tools are covered. Record the verdict — if it
      reads as debris, the arrangement changes rather than the gap.
- [x] 5.2 Run the phone application on a device on both grounds and press zoom in
      repeatedly at speed; verify no press lands on the re-read, and that the re-read is
      still reachable one-handed without covering the pins.
- [x] 5.3 Check the whole edge at the narrowest supported width with a long trip name and
      a long city name, with the filter applied so the tools are at their busiest; verify
      nothing on that edge overlaps.

## 6. Close it out

- [x] 6.1 Run `pnpm verify`; verify it passes.
- [x] 6.2 Run `openspec validate re-read-from-the-map --strict`; verify it passes.
