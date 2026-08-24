## 1. Archiving, underneath

- [x] 1.1 Let `tripPatchSchema` in `packages/core/src/trip.ts` accept `archived`, and
      replace the comment saying it is deliberately not writable with what it is for.
- [x] 1.2 Add the archive and restore writes in `packages/data/src/`. **No new function
      was needed**: `updateTrip` already takes a partial patch, so widening the schema
      made archiving and restoring `updateTrip(client, id, { archived })`. A wrapper
      would have added a name and nothing else.
- [x] 1.3 Teach the trips read to exclude archived trips, with an explicit way to ask for
      them. Default excluded — a caller that forgets shows the right thing.
- [x] 1.4 **Confirmed by probe, not by reading.** `probe-archived.sql` beside this file,
      run in the dashboard SQL editor against the linked project, returned
      `RESULT: member=t archived=t nonmember=f restored=t` and rolled back — a member
      may archive and restore, the column really changes, and somebody who is not on
      the trip is refused. No policy changed. The CLI has no way to run this: v2 has no
      `db execute`, only diff/dump/push/pull/reset/lint. Confirm no row-level security
      change is needed: `trips_update_member` already
      permits a member to update the trip, and this adds a column to an existing update
      rather than a new statement. Verify with a rolled-back `do $$ … raise exception
      'RESULT: %' … $$` probe against a real member and a non-member, rather than by
      reasoning about the policy.
- [x] 1.5 Tests in `packages/data` for archive, restore, and that neither touches cities,
      markers, memberships or interest.

## 2. The toolbar

- [x] 2.1 ~~Add the three glyphs to the icon record in `marker-icon.tsx`.~~ **The plan was
      wrong twice here.** That record is `Record<MarkerIconName, LucideIcon>`, exhaustive
      over the *marker* names `@pinpoint/map` declares — `search` is not one, so adding it
      would not typecheck. And this application imports icons one subpath at a time
      (`lucide-react-native/icons/search`) rather than from the package root, because
      Metro does not tree-shake in development and the barrel pulls all 1767 glyphs into
      the bundle. So the three are imported at the point of use in `trip-workspace.tsx`,
      which is what `marker-details.tsx` already does with its `X`.

- [x] 2.2 Replace the pill row in `apps/mobile/components/trip-workspace.tsx` with three
      equal toolbar buttons — icon above label, one third of the row each, at least 44pt
      of target, all three the same weight and colour.
- [x] 2.3 Keep the row as the floor: flush to the bottom edge, carrying the device's
      bottom inset inside itself, with the map's ornaments and licence credit rising off
      it. This is the arrangement two earlier attempts got wrong; do not reintroduce a
      gap under the bar.
- [x] 2.4 Preserve every behaviour: `Search` opens the search sheet, `Drop` starts the
      sight with no sheet, `Filter` opens the filter sheet. Accessible labels stay on the
      buttons — the glyph is not the name.
- [x] 2.5 Leave the sight's confirm row alone. It replaces the toolbar while the map is
      armed, and that is still the right thing for it to do.

## 3. Where the narrowing is declared

- [x] 3.1 Give the Filter button its narrowed state: the accent, **and** a dot above the
      icon. Two signals, because the requirement forbids one carried by hue alone.
- [x] 3.2 Move `Clear` into `apps/mobile/components/filter-sheet.tsx` as a full-width
      button after the filters. Inert when nothing is hidden, through
      `accessibilityState={{ disabled: true }}` and a handler that returns — never the
      unreachable kind.
- [ ] 3.3 Check the amended requirement holds in the built app: with a filter applied and
      the sheet closed, the toolbar still says the view is narrowed; opening the Filter
      button reveals the way out; no second control has to be found.
- [ ] 3.4 View the toolbar in greyscale with a filter applied — macOS Display
      accessibility filters, or the simulator's colour filters — and confirm the narrowed
      state is still readable.

## 4. Trips, from the trip name

- [ ] 4.1 Make the header's trip name a control: a caret beside it so it says it opens
      something, an accessible label naming what it does, and it stays the only element
      in the header that yields so a long name truncates instead of pushing the menu off.
- [ ] 4.2 New `apps/mobile/components/trip-sheet.tsx`: the trips the person belongs to,
      current one ticked, place count beside each, tapping a row switches. Then `New
      trip`. Then, for the trip being viewed, `Rename`, `People`, `Cities` and `Archive
      trip`.
- [ ] 4.3 Move trip switching, rename and create out of `menu-sheet.tsx` into it, and
      move `People` and `Cities` across unchanged — they are existing sheets reached from
      a new place, not new screens.
- [ ] 4.4 Reveal archived trips behind a deliberate act in this sheet, and let them be
      restored from there. A person who has archived everything must still be able to
      find them.
- [ ] 4.5 Archiving the trip being viewed moves to another trip they belong to, or to the
      no-trips state. Nothing belonging to the archived trip stays on screen.
- [ ] 4.6 Draw `Archive trip` in the danger colour and put it last, separated from the
      rows above it.

## 5. The hamburger

- [ ] 5.1 Reduce `menu-sheet.tsx` to the account block — `displayName`, email — and
      `Sign out`. There is no first and last name; one line, not two.
- [ ] 5.2 Delete what moved out, rather than leaving it unreachable: the trip picker, the
      inline rename and create detours, and the People and Cities rows.
- [ ] 5.3 Keep `Sign out` where a thumb does not reach by accident.

## 6. Verify

- [ ] 6.1 `pnpm verify` — the full CI set.
- [ ] 6.2 Build and run on a simulator and look, in **both** themes. Static checks have
      been green over a real visual defect on six consecutive changes now.
- [ ] 6.3 Check every capability still has a home on the phone: switch, rename, create,
      invite, cities, archive. The standing rule is that either application is sufficient
      on its own, and this change moves five things at once.
- [ ] 6.4 Check the toolbar at a large Dynamic Type size — three labels under three icons
      is exactly the layout that clips when text grows.
- [ ] 6.5 Check one-handed reach on hardware rather than in the simulator. Reach is why
      the row exists.
