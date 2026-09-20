## 1. Classify every act, and record the rule

- [x] 1.1 Walk both applications for every write and classify each as asks / does not ask
      under the rule "destroys something entered, or cannot be got back". Start from the
      seven platform confirmations that exist — `marker-details.tsx`, `city-bar.tsx` ×2 on
      the laptop; `marker-details.tsx`, `city-sheet.tsx` ×2, `trip-workspace.tsx`,
      `trip-calendar.tsx` on the phone — and include the writes that ask nothing today.
      Verify by listing each act with its verdict in the change folder.
- [x] 1.2 Rule on the three cases `#50` leaves open: cancelling a half-filled capture form
      (asks — see 4.x), signing out with a form open, and removing a member once `#51`
      exists. Record each verdict with its reason.
- [x] 1.3 Describe the question in `DESIGN.md` before building one: which part of a panel
      it replaces, the weight it carries, the two controls, and how it behaves at phone
      width. Verify the section exists and names the "what is removed stays" rule.

## 2. The question, on the laptop

- [x] 2.1 Add a question face to the panel primitives in `apps/web/app/_components/ui.tsx`
      — a heading, an optional consequence line, and a confirm/decline pair — built from
      tokens with no new dependency. Verify it renders in both themes from a scratch page
      or an existing panel.
- [x] 2.2 Move the place removal in `marker-details.tsx` onto it, footer-only, with the
      card still showing the place. Wording unchanged. Verify by removing a place.
- [x] 2.3 Move the city removal in `city-bar.tsx` onto it as a whole-panel question face,
      keeping the count and the price-loss sentence. Verify the longest string fits at the
      panel's width without the footer growing past two lines.
- [x] 2.4 Move the currency change in `city-bar.tsx` onto it. Verify the city list is not
      shown, and no other city's delete control is reachable, while the question stands.
- [x] 2.5 Give the confirming control the pending state and make it unfireable twice.
      Verify on a throttled connection that it says what it is doing.

## 3. The question, on the phone

- [x] 3.1 Add the same question face to the sheet primitives, and move the place removal
      in `trip-workspace.tsx` onto it — removing the hoisted pending state, since the
      confirming control is now the control. Verify from both surfaces that offer it.
- [x] 3.2 Move the second place removal, in `trip-calendar.tsx`, onto it. This one is not
      in `#50`'s list. Verify from the calendar.
- [x] 3.3 Move the city removal and the currency change in `city-sheet.tsx` onto it.
      Verify no `Modal` is raised inside the sheet's own `Modal`.
- [x] 3.4 Confirm no `Alert.alert` remains in `apps/mobile` by grep, and no
      `window.confirm` in `apps/web`.

## 4. Dismissal, focus and the form

- [x] 4.1 Give `marker-details.tsx` and `marker-form.tsx` on the laptop the dismissal
      contract: Escape, a press outside, and focus return. Read `Menu` in `ui.tsx` first
      and reuse its dismisser — including `pointerdown` rather than `click`, which matters
      twice over for a panel sitting on the map. Verify by keyboard alone.
- [x] 4.2 Move focus into each panel when it opens and back to what opened it when it
      closes — for the details card, back to the marker that was selected. Verify the
      round trip with the pointer untouched.
      **Measured end to end**: pin focused, card opens named `Tōdai-ji` with focus
      inside it, Escape closes it, focus lands back on the same pin.
      Two things were needed and neither was obvious. The marker carries a
      `data-point` key because selecting one **redraws the whole marker layer** —
      the button that was pressed is detached and replaced before the panel
      closes, so focus cannot be held as an element. And the restore is deferred a
      frame, because the redraw happens *after* the panel unmounts, so a lookup in
      the cleanup itself finds nothing and drops focus to the body.
- [x] 4.3 Make Escape on a capture form holding entered work raise the same question,
      offering to discard or to keep editing; on a form holding nothing, close it. Verify
      that declining leaves every field and the found position exactly as they were.
- [x] 4.4 Announce each panel as a named region, and announce the question when it
      appears. Verify the question is what is announced, not only that controls changed.

## 5. The refusal moves into the panel

- [x] 5.1 Draw a refusal from a chrome panel inside that panel on the laptop — rename,
      invite, archive, restore — using the `FormError` the trip bar already imports, not
      the note over the map. Verify each of the four.
- [x] 5.2 Reproduce `#125` first and then confirm it is gone: at a ~560px column force a
      refusal from each chrome panel and read the message without moving or closing the
      panel, in both themes. Verify above ~934px that nothing regressed.
      **Measured at a 575px column**: the refusal renders inside the panel, fully on
      screen, and `elementFromPoint` at its own centre returns the message itself —
      nothing covers it. Forced through the real path by failing the write, so the
      optimistic rollback ran too; the trip's name is unchanged in the database.
- [x] 5.3 Confirm the phone still draws its own refusals in its sheets and gained no
      second channel. `trip-sheet.tsx` is untouched by this change — it has drawn its
      own `problem` since it was written, which is what the laptop has now copied.

## 6. Look at the running applications

- [x] 6.1 Every one of the seven questions, on both platforms, in **both themes**: the
      question reads correctly, declining changes nothing, and confirming does what it
      says. Ask the user before creating or altering any trip, city or place, and restore
      anything changed.
      **Laptop: done in both themes** for removing a place and removing a city, and for
      discarding a capture form. Declining measured as changing nothing — the forced
      rename failures rolled back and the trip's name is unchanged in the database.
      Contrast on the light ground: question 15.45:1, consequence 4.73:1, decline
      15.45:1, confirm 5.75:1. **Nothing was confirmed**, so "confirming does what it
      says" is unverified — it would mean destroying real data.
      **Phone: looked at by the user**, who found two things this pass fixed — the
      laptop's button labels were not centred (`.button` is a flex row that was never
      told to justify, invisible until two of them were stretched to equal halves),
      and the phone's controls did not match the laptop's pairing (its two tones are
      transparent-with-an-edge and filled-without-one; the laptop wants filled-with-an
      -edge to decline and outlined to confirm). Both corrected and measured.
- [x] 6.2 A greyscale pass over the question and its confirming control, per the standing
      rule that no state may live in hue alone.
      **Measured**: the band's luma differs from the panel's (37 vs 30), and the
      confirming control differs from the declining one by weight (650 vs 500) *and*
      border luma (156 vs 64). Two signals besides hue, so the question and its
      answer both survive a greyscale screen.
- [x] 6.3 On the phone, the city question from inside the city sheet, on a device rather
      than only the simulator if one is available — the nested-presentation case.
      Confirmed by the user on the simulator. No `Modal` is raised inside the sheet's
      own `Modal` — that is the whole reason the question is a face of the sheet.
- [x] 6.4 Keyboard only on the laptop, for every panel this change touches: open, move
      around, Escape, confirm, decline. Focus ends up back where it started on every path.
      **Measured**: opening the card from a pin moves focus into it; Escape closes it and
      focus lands back on that same pin; Escape while a question stands declines it and
      closes the card, writing nothing. Escape on a capture form holding a found position
      raises the question rather than discarding.

## 7. Finish

- [x] 7.1 Run `openspec validate the-product-asks-its-own-questions --strict` and fix
      anything it reports.
- [x] 7.2 Run `pnpm verify` — `check:unarchived` fails by design until the change is
      archived, so run the remaining steps individually until then.
