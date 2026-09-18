## 1. Groundwork the rest depends on

- [x] 1.1 Add a session-level holder for the trip being read: a context provider in
  `apps/mobile/app/_layout.tsx` inside `SessionProvider`, exposing the chosen trip id and
  a setter. Verify `app/index.tsx` no longer holds that state and the map still opens on
  the first trip and still follows a trip chosen from the trip sheet.
- [x] 1.2 Move the three day wordings into `packages/core/src/day-wording.ts` with the
  locale still pinned, carrying across why it is pinned and why it is `en-GB`, and add the
  fallback to the `YYYY-MM-DD` string that `price.ts` has for the same reason. Verify with
  tests beside it that each format is what it was on the laptop for a known day, and that
  a runtime that cannot format still returns something readable.
- [x] 1.3 Delete `apps/web/lib/day.ts` and point its call sites at `@pinpoint/core`.
  Verify the web calendar words every day exactly as before — the day band, the column
  headings and the full names the step controls announce — and that a cold load reports no
  hydration mismatch in the console.
- [x] 1.4 Install the platform date picker with `npx expo install
  @react-native-community/datetimepicker`, then rebuild the development build with `pnpm
  --filter mobile ios`. Verify the app launches on the device or simulator — Metro alone
  will not pick up a native module, and `expo run:ios` needs Xcode 26.6 or newer.
- [x] 1.5 Add a `DayField` to `apps/mobile/components/ui.tsx`: drawn like `TextField`,
  showing `No day yet` when there is no day, opening the platform picker on press, given
  the resolved theme so it does not draw in the device's appearance, and carrying its own
  `Clear`. Verify that setting a day, changing it and clearing it each report the value
  back, and that clearing yields no day rather than today.

## 2. The day on a place

- [x] 2.1 Add the day to `MarkerFormValues` and to the form's fields in
  `apps/mobile/components/marker-form.tsx`, beside the city, using `DayField`. Verify
  saving a new place with a day stores it and saving one without records the day as
  absent.
- [x] 2.2 Carry the day through the workspace's save in
  `apps/mobile/components/trip-workspace.tsx`, for both creating and editing. Verify
  editing a place to another day and then clearing it back leaves the place with no day,
  and that nothing else about the place changes.
- [x] 2.3 Show a place's day on its card in `apps/mobile/components/marker-details.tsx`,
  as the web card does, and say nothing when there is none. Verify a dated place reads its
  day on the card without the form being opened.
- [x] 2.4 Correct the comment on `newMarkerSchema` in `packages/core/src/marker.ts`, which
  says the phone has no day control. Verify `pnpm --filter @pinpoint/core test` still
  passes and no behaviour changed.

## 3. The trip's dates on the phone

- [x] 3.1 Extract the trip menu's writes out of `trip-workspace.tsx` into
  `apps/mobile/lib/use-trip-actions.ts` — rename, create, invite, archive, restore, reveal
  archived, and setting the dates — taking where choosing a trip goes as an argument, as
  the web hook does. Verify every existing row of the trip sheet still works from the map:
  rename, new trip, People, archive, reveal archived, restore.
- [x] 3.2 Add the start and end date fields to the trip sheet in
  `apps/mobile/components/trip-sheet.tsx`, using `DayField`. Verify setting both, changing
  one, and clearing both, and that an end date before the start is refused with the
  offending field named and everything else preserved.
- [x] 3.3 Offer both dates while a trip is being created, in `CreateTripForm` in
  `apps/mobile/components/trip-setup.tsx`, with neither required. Verify a trip created
  with no dates is created and usable, and a trip created with both carries them.

## 4. The calendar screen

- [x] 4.1 Add the route `apps/mobile/app/calendar.tsx`: the signed-in guard, the five
  reads the screen shows (trips, markers, cities, members, interest) through `useQuery`,
  and `useActiveAgain` re-reading all five when the application returns to the foreground.
  Verify a place dated on the web appears after backgrounding and returning, without the
  app being relaunched.
- [x] 4.2 Draw the header: the trip's name opening the trip sheet, the point, and the
  account, as the map draws them — with no city control — and `Back to the map` on its own
  line beneath the trip's name. Verify the two lines against the web bar at phone width,
  and that the back control is reachable without scrolling or opening anything.
- [x] 4.3 Draw the day band pinned between the header and the scrolling body: previous
  day, the day being read as a `DayField`, next day. Verify stepping and choosing agree
  with each other, that scrolling the body never changes the day, and that each step
  control announces the day it leads to in full.
- [x] 4.4 Open on the day the trip makes sense on, through `dayShown`/`dayToOpenOn`.
  Verify all three cases: a trip happening now opens on today, a trip whose dates do not
  include today opens on its start date, and a trip with no dates opens on today.
- [x] 4.5 Draw the places waiting for a day above the day: collapsed, stating its count,
  still present and saying so when it holds nothing, and its open list capped to a
  fraction of the window so it scrolls inside itself. Verify with a trip holding many
  undated places that the day below it is still visible, and verify the region stays after
  the last undated place is dated.
- [x] 4.6 Draw the day itself: every place dated to it, in the order `groupMarkersByDay`
  gives, each named with its type and saying `Visited` in words where it is. Verify an
  empty day states that it holds nothing and is not drawn as a failure.
- [x] 4.7 Open a place from this screen into the existing `MarkerDetails` sheet, wrapping
  the one place as the web does, with interest, visited, edit and remove all working.
  Verify recording interest and marking visited from here land the same as from the map.
- [x] 4.8 Reuse `MarkerFormSheet` for editing from this screen, with adjusting the
  position and creating a city not drawn. Verify a day changed from here moves the place
  off the day being read without the screen being read again, that the day being read does
  not follow it, and that a save refused because somebody else changed the place keeps
  what was typed.
- [x] 4.9 Read every place on the trip regardless of any filter set on the map. Verify
  with a filter applied that every place still appears on its day and the waiting count is
  the trip's full count.

## 5. Reaching it, and getting back

- [x] 5.1 Add the row that reaches this screen to the trip sheet, naming the view the
  person is not in — the calendar from the map, the map from the calendar. Verify neither
  screen offers to take somebody where they already are.
- [x] 5.2 Make `Back to the map` return to the map with the same trip and the same city,
  and the filter as it was left. Verify by selecting a city, narrowing the map, opening the
  calendar and coming back.
- [x] 5.3 Make the trip switcher on this screen show that trip's calendar, on the day a
  fresh arrival would be given. Verify that going back afterwards shows the map on the trip
  switched to, not the one arrived with.

## 6. Looking at it running

- [x] 6.1 Read every new surface on the phone in **both themes** — the day field in the
  place form, the trip's dates in the trip sheet and in trip creation, and the whole
  calendar screen. Verify no text sits on a fill it cannot be read against, and that the
  system date picker is drawn in the theme the app is in rather than the device's.
- [x] 6.2 Step to a day outside the trip's dates and confirm a place dated there is
  reachable and shown on it.
- [x] 6.3 Set a day on the web, confirm it on the phone, then change it on the phone and
  confirm it on the web — nothing re-entered in either direction.
- [x] 6.4 Read the day band and the step controls with VoiceOver, and confirm each states
  the day it leads to rather than a glyph.

## 7. Checks before the pull request

- [x] 7.1 Run `openspec validate mobile-trip-calendar --strict` and verify it passes.
- [x] 7.2 Run `pnpm verify` and verify every step passes.
