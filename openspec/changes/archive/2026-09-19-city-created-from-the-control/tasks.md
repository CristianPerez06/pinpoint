## 1. The calendar stops offering to create a city (#189)

- [x] 1.1 Reproduce it first: open a trip's calendar on web, edit a place, open the City
      list, choose `+ New city…` and press `Create city` — confirm it answers "Could not
      create that city." A fix for a defect nobody has seen fail is a guess.
- [x] 1.2 Make `onCreateCity` optional on the web place form and draw the `+ New city…`
      option only when it was passed, matching the phone's shape. Verify by typechecking
      and by the option disappearing from the calendar's City list.
- [x] 1.3 Remove the `async () => null` stub the web calendar passes, so it passes nothing.
      Verify the calendar's City list holds only the trip's cities and Unassigned, and
      that the form opened from the map still offers `+ New city…` and still creates.
- [x] 1.4 Correct the comment in the phone's calendar that claims the laptop's calendar
      already leaves these out — it asserted a parity that did not exist, which is what let
      this survive. Verify by reading it against what the web calendar now passes.

## 2. A city can be created from the city control (#149)

- [x] 2.1 Add the create action to the laptop's city control, pinned beneath the scrolling
      list of cities rather than inside it. Verify with a trip of a dozen cities that it is
      reachable without scrolling to the end.
- [x] 2.2 Give it a name field and a second-currency field, reusing the currency control
      the place form already uses. Verify a city created with a currency carries it, and
      one created without gets `null` rather than an empty string.
- [x] 2.3 Call the workspace's existing `addCity` rather than adding a second creation
      path. Verify by grep that `createCity` from `@pinpoint/data` still has exactly one
      caller per app.
- [x] 2.4 Leave the selected city unchanged when one is created, and leave the camera
      where it is. Verify by creating a city while a different one is selected, and while
      `All places` is selected — neither changes.
- [x] 2.5 Refuse an empty name and a name the trip already holds, in the product's own
      words, naming the field, without losing what was typed. Verify each refusal by hand.
- [x] 2.6 Do the same on the phone's city sheet, with the action pinned beneath the list.
      Verify it is reachable with the keyboard up, and that the sheet does not collapse —
      see the `ScrollView` and `KeyboardAvoidingView` entries in `AGENTS.md`.
- [x] 2.7 Rewrite the phone's empty-city-list copy, which currently teaches that a city
      comes only from saving a place. Verify the new wording appears on a trip with no
      cities and still says what a city is for.
- [x] 2.8 Confirm the payoff the change is for: create a city named for somewhere with no
      places yet, then save a searched place the geocoder reports as being in it, and check
      the form defaults to that city. This is the behaviour `marker-capture` already
      specifies and nothing could reach.

## 3. A place's details name its city (#151)

- [x] 3.1 Add the shared `Unassigned` wording beside the existing `No day yet` /
      `No note yet` / `No link yet` definitions, so both apps read it from one place.
      Verify the existing wording test covers it.
- [x] 3.2 Show the city on the web details card, above the day, taking the resolved name
      rather than the trip's cities. Verify a filed place names its city and an unfiled one
      reads `Unassigned`.
- [x] 3.3 Do the same on the phone's details sheet. Verify both apps read identically for
      the same place.

## 4. Specs and checks

- [x] 4.1 Run `openspec validate city-created-from-the-control --strict` and fix what it
      reports.
- [x] 4.2 `pnpm verify` stops at `check:unarchived`, which fails by design until archive
      — so lint, typecheck, test and build never run under it. Each was run directly
      instead: `lint`, `lint:mobile`, `typecheck`, `typecheck:mobile`,
      `typecheck:packages`, `test` (279 in core, 67 in data, 18 in auth) and `build`. All
      pass. See findings.
- [x] 4.3 `Unassigned` is tested in `@pinpoint/core`. The other half — that the place
      form offers creation only when it can — was **deliberately not tested**: neither
      app has any component test, and adding the first would mean new dev dependencies
      and a test harness per app. Decided against as a detour; the behaviour was checked
      by hand on both applications instead.

## 5. Look at it running

- [x] 5.1 On **web**, in **both themes**: create a city from the control on a trip with no
      cities and on a trip with a dozen, with a long name among them. Check the control
      does not overflow and the create action stays reachable.
- [x] 5.2 On the **phone**, in **dark**: the sheet, the pinned action, the creator, the
      empty-name refusal and the keyboard-up case all checked on an iPhone 17 simulator.
      **Light theme not checked** — the new lettering uses `accentInk` on `surface`, the
      same pair as the `Done` control beside it, so it is argued rather than seen.
- [x] 5.3 Checked on **web**: the calendar's City list holds only the trip's cities and
      Unassigned, the map's form still offers `+ New city…`, and a place can still be
      filed under an existing city from the calendar. **The phone's calendar was not
      opened** — it passed no `onCreateCity` before this change and still does, so its
      behaviour is unchanged and only its comment was corrected.
- [x] 5.4 Look at a filed place and an unfiled one on both apps, both themes, and confirm
      the city line reads as an answer rather than as missing information.
- [x] 5.5 Check a city created from the control and never used: it claims nothing, and a
      place near nothing is still reported as belonging to no city.
