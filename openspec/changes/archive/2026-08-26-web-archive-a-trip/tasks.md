## 1. The workspace's three handlers

Everything here is in `apps/web/app/_components/trip-workspace.tsx`. No package and no
migration is touched: `updateTrip` and `fetchTrips` already take what these need.

- [x] 1.1 Hold the revealed archived trips as `useState<readonly Trip[] | null>(null)` —
      null rather than an empty array, because "nobody has asked" and "there are none"
      are different answers and only one of them is worth a line saying so
- [x] 1.2 Add `revealArchived()`: read `fetchTrips(supabase, { includeArchived: true })`,
      keep the rows where `archived` is true, and set `message` on `failed` rather than
      leaving the press unanswered. Return the promise so the row that started it can
      await it
- [x] 1.3 Add `archiveTrip()`: drop the trip from `trips` optimistically, call
      `updateTrip(supabase, trip.id, { archived: true })`, restore `trips` exactly and
      set `message` if refused. Awaited by the caller. **Does not navigate** — group 3
      owns that, and only on success
- [x] 1.4 Add `restoreTrip(tripId)`: put the trip into `trips` optimistically, call
      `updateTrip(supabase, tripId, { archived: false })`, take it back out exactly if
      refused, and replace it with the row the write returns on success. **Leave the
      archived row in place until it settles** — it is the control that started the
      write, and removing it on the press destroys the only thing that can report. Built
      the other way first and `Putting back…` could never render; caught in 5.7
- [x] 1.5 Leave the archived list as the optimistic removal left it when a restore
      settles — **not** dropped to `null`, which is what the phone does and what this did
      until it was opened. The phone's reveal collapses back to a row, so null renders as
      "ask again"; here it is a page that stays open, and null renders as *Nothing
      archived.* — restoring one of three claimed there were none. The next press of
      `Archived trips` re-reads it, so nothing goes stale where anybody can see it
- [x] 1.6 Every one of these clears `message` first, so a note about a write that failed
      a minute ago cannot outlive one that has just succeeded — the pattern every other
      handler on this screen already follows
- [x] 1.7 Confirm no flag meaning "a write is happening" was added to this file. There is
      none today and `write-feedback` forbids one

## 2. The two rows and the archived page

All in `apps/web/app/_components/trip-bar.tsx`.

- [x] 2.1 Widen the `View` union with `'archived'`
- [x] 2.2 Add `Archive this trip` as the last row of the root, under an `<hr>`, lettered
      in `danger`. No confirmation step — archiving is reversible and a confirmation on a
      reversible act teaches people to dismiss the ones that are not
- [x] 2.3 The archive row holds its own `usePending`: it reads `Archiving…` and is inert
      while the write is in flight, and the panel returns to the root only when it
      settles. Closing on the press leaves nothing on screen that can report a refusal
- [x] 2.4 Add `Archived trips` beneath it, muted, holding a second `usePending`: it reads
      `Looking…` while the fetch is in flight and switches to the page only once the
      answer is back. Two `usePending`s, held apart, because they are two different
      presses — one flag here would be the workspace's old `busy` rebuilt a level down
- [x] 2.5 No count on that row. A count means reading archived trips on every menu open,
      which is exactly the read a deliberate act defers
- [x] 2.6 Build the `archived` page: an `ARCHIVED` heading, one row per trip with its
      name and a `Restore`, the line saying nothing was deleted, and `Back` — the same
      shape rename, people and new trip already use
- [x] 2.7 `Nothing archived.` when the list came back empty, rather than an empty page
- [x] 2.8 Each archived row holds its own `usePending`: the pressed one reads
      `Putting back…` and the others stay live
- [x] 2.9 Unavailable is `aria-disabled` and a no-op, never the `disabled` attribute —
      `Button` in `ui.tsx` already owns this; anything hand-rolled here has to match it
- [x] 2.10 Opening the menu still resets to the root, so somebody who looked at the
      archive, closed the menu and pressed the name again gets the list they wanted

## 3. Archiving the trip being looked at

The one place this cannot be a copy of the phone. See `design.md — Archiving the trip
being viewed is a navigation, not a state change`.

- [x] 3.1 On a successful archive, `router.replace('/')` then `router.refresh()` — the
      same pair `selectTrip` already uses. The server re-reads the trips with archived
      excluded and lands on the first remaining one, or renders `TripSetup`
- [x] 3.2 Navigate **only** on success. A refused archive that navigated would remount
      the workspace and take the refusal message with it, moving the person somewhere
      else and telling them nothing
- [x] 3.3 Confirm by reading that dropping the trip from `trips` alone would not have
      worked: `trip = trips.find(…) ?? initialTrip` keeps rendering the trip after it
      leaves the list, on purpose. Leave a comment saying so where the navigation is,
      because the next person will reach for the state change first

## 4. Styles

`apps/web/app/_components/trip-bar.module.css`, from the existing custom properties. No
new colour is written anywhere.

- [x] 4.1 A danger variant of `.row`, lettering in `--pp-danger` with `--pp-danger-surface`
      on hover. Nothing here fills with a themed colour and then letters itself in the
      same one — the `Clear` defect, which is invisible on exactly one theme
- [x] 4.2 An archived row: the name muted, `flex: 1 1 auto; min-width: 0`, and
      ellipsised. A sixty-character trip name must truncate rather than wrap, so every
      `Restore` stays in one column and on one rhythm
- [x] 4.3 `Restore` lettered in `--pp-accent-ink` with the **wash** on hover, never the
      accent — `accent` and `accent-ink` are the same value on the dark ground
- [x] 4.4 Rows stay text-only. The phone's sheet carries icons and this menu never has;
      each application keeps the form native to it

## 5. Looking at it, which is where the last two changes' defects were

Every item here means opening the running application, not reasoning about it.

- [~] 5.1 Restore verified in full: archived `Japan 2`, revealed it, restored it, and it
      came back with its four members and every marker exactly as before. **The
      archive-the-last-trip half was not run** — it would have meant archiving all three
      of a real account's trips, and getting back from `TripSetup` means creating a trip
      that then has to be left behind. The path is `trips.status === 'empty' →
      <TripSetup/>` in `page.tsx`, unchanged by this change, reached by the same
      navigation verified twice in 5.2. Run it against a scratch account before release
- [x] 5.2 Done twice. Archiving `Japan 2` opened `Tokyo` and drew its (empty) map with
      the `No places saved on this trip yet.` note; archiving `Tokyo` opened `Japan 2` with
      its own markers. Neither left a marker of the archived trip behind
- [x] 5.3 Both. Dark is the machine's setting; light checked by overriding the token
      block on `:root`, which is exactly what the light theme is. `Restore` is Deep Amber
      Ink on both grounds and is never drawn on an accent fill; the danger row reads on
      both
- [x] 5.4 **Measured, and it is worse than the risk note guessed.** At a 560px column the
      panel spans x 38–358 and the note x 171–389, so the menu covers all of it but the
      last three letters of `Dismiss`. Overlap starts at about 934px, not at phone width.
      Recorded in `design.md` and as a loose end in 6.5
- [x] 5.5 Counted at the network layer. Three presses of `Archived trips` → one `GET` on
      `/rest/v1/trips`. Three presses of `Restore` → one `PATCH`. Two presses of `Archive
      this trip` → one write and one navigation
- [x] 5.6 Panel announces as `Trip`; root tab order ends `Archive this trip`, `Archived
      trips`; the archived page's is `Restore`, `Back`, both `tabIndex 0`. Escape closes it
      and focus lands back on the trip name. Opening the trip menu closed the filter menu,
      so the one-panel rule still holds with a fourth page in it
- [x] 5.7 Throttled to 4–6s and watched all three. `Looking…` and `Archiving…` render
      with `aria-disabled="true"` and `tabIndex 0`. **`Putting back…` did not** — the
      optimistic removal took the row out in the same tick, so the label was dead code.
      Fixed in 1.4 and then seen: `Japan 2` reading `Putting back…`, muted and inert, while
      `Tokyo`'s `Restore` beside it stayed live
- [x] 5.8 Forced a 403 on the `PATCH`. The trip stayed, the list was intact, **no
      navigation happened**, and `Could not save that trip. Dismiss` appeared over the map
- [~] 5.9 **Half of it, by accident, and it is the half that matters.** `Tokyo` was
      already archived when this started — archived from the phone, before any of this
      existed — and the web revealed it and restored it. The web→phone direction needs the
      native dev build and has not been run

## 6. Closing it out

- [x] 6.1 `pnpm verify` — exit 0. Lint, both typechecks, packages typecheck, 119 package tests, the production build, tokens, fonts, RLS, cycles and specs
- [x] 6.2 `openspec validate --all --strict` — 14 passed, 0 failed
- [x] 6.3 `git diff -- supabase/` is empty. `check:rls` reports all 5 tables with row
      level security on and the same policy counts as the initial schema — `trips` still
      has 2, and no table gained a delete policy
- [x] 6.4 Updated: restoring joins the optimistic list, and a paragraph was added for
      what 5.7 taught — optimistic does not excuse a control from reporting, so the
      question is never "is this optimistic, therefore silent" but "is the control still
      there to speak"
- [x] 6.5 Recorded in `ROADMAP.md` under Loose ends, with the measurement from 5.4 —
      including the ~934px threshold, which is the part that was not known before
