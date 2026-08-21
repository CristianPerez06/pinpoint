## 1. The migration, and proving it before anything is built on it

- [x] 1.1 Write `create_trip(trip_name text, member_name text) returns uuid` —
      `plpgsql`, `security definer`, `set search_path = public`. It reads the address
      from `auth.jwt() ->> 'email'`, inserts the trip and the creator's membership in
      one block, and returns the trip id. Model it on
      `claim_trip_memberships()`, which is the existing precedent for every one of
      those modifiers.
- [x] 1.2 Return without creating anything when `auth.uid()` is null or the JWT
      carries no email. A definer function with no session must not be a way to
      create rows, and must not reveal anything either.
- [x] 1.3 Add the insert policy on `trip_members`: `for insert to authenticated with
      check (public.is_trip_member(trip_id))`. `is_trip_member` is already
      `SECURITY DEFINER`, so this does not recurse — that is the trap it exists to
      avoid, and it is worth confirming rather than assuming.
- [x] 1.4 **Add no insert policy on `trips`.** Creation is the function or it is
      nothing. Leave a comment saying so, replacing the one that guessed at a trigger.
- [x] 1.5 **Verify with a rolled-back probe, not by reasoning.** A `do $$ … raise
      exception 'RESULT: %' … $$` block, as `AGENTS.md` describes. Check: creating a
      trip makes exactly one member; the caller cannot create a membership on a trip
      they do not belong to; a duplicate address on one trip is refused; and calling
      the function with no session creates nothing.
      *Thirteen assertions, all true, impersonating real accounts through
      `request.jwt.claims` with `set local role authenticated` so the policies
      actually engage: no-session-returns-null, no-session-created-nothing,
      trip-created, exactly-one-member, name-trimmed, email-from-session,
      creator-linked-to-account, creator-can-see-own-trip, member-can-invite,
      duplicate-address-refused, outsider-cannot-invite, outsider-cannot-see-trip,
      outsider-cannot-see-members. Nothing survived: one trip, two members, no
      leftovers.*
      **This is what caught the defect in 1.1** — see the note at the end.
- [x] 1.6 `pnpm check:rls` still passes, and the new policy resolves to membership.

## 2. The write path

- [x] 2.1 `createTrip(client, { name, displayName })` in `@pinpoint/data`, calling
      the function through `client.rpc()` and returning a `WriteOutcome<Trip>`.
- [x] 2.2 `updateTrip(client, tripId, { name })`, going through the
      `trips_update_member` policy that has existed since the initial schema and has
      never been called.
- [x] 2.3 `inviteMember(client, input)`, validating against `newTripMemberSchema` —
      which is already in `@pinpoint/core` and has never been called. A duplicate
      address on a trip is a rejection with a message, not a crash: the unique index
      on `(trip_id, lower(email))` is what enforces it.
- [x] 2.4 Tests beside the existing ones in `packages/data`, in the same shape.

## 3. Choosing a trip

- [x] 3.1 Web: the trip lives in the URL as `?trip=<id>`, beside the selected city.
      `page.tsx` reads it before fetching, and falls back to the first trip when it
      is absent or names a trip the person does not belong to.
- [x] 3.2 Mobile: held in state for the session, opening on the first trip.
- [x] 3.3 Switching replaces everything scoped to a trip — markers, cities, members —
      **and clears the filter**. A filter carried across narrows the new trip by
      member ids that do not exist in it, which matches nothing for a reason nobody
      can see.
- [x] 3.4 Offer no choice at all when the person belongs to exactly one trip. That is
      the state this product will be in most of the time.

## 4. Creating a trip, and the empty state that stops being a dead end

- [x] 4.1 Replace "You are not on any trips yet." on both platforms with a state that
      offers making one.
- [x] 4.2 The create form asks two things: what the trip is called, and what the
      person is called on it. Both required; the display name is 1–60 characters,
      matching the column.
- [x] 4.3 Say on that same screen what to check if they expected to be on a trip —
      that an invitation is matched on the address they signed up with. It must not
      say whether an invitation exists for any address: that would tell any account
      whether some address is on some trip.
- [x] 4.4 A created trip is opened immediately, without re-reading the trip list.

## 5. Inviting somebody, and seeing that it worked

- [x] 5.1 An invite control on both platforms, taking a display name and an email.
      Web in the toolbar's rare-controls area; mobile in the header menu sheet, where
      Cities already lives.
- [x] 5.2 List the trip's members where inviting happens, and mark the ones with no
      account as not joined yet, showing the address they were invited at. `userId`
      is already fetched and currently ignored — this is the only signal a mistyped
      address exists, and the inviter is the only person who can act on it.
- [x] 5.3 A duplicate address is refused with a message naming the field, not a
      generic failure.
- [x] 5.4 A new member appears without re-reading the trip.

## 6. Renaming a trip

- [x] 6.1 A rename control on both platforms, beside where the trip is named.
- [x] 6.2 The new name shows everywhere the trip is named, without a reload.

## 7. The specification catches up

- [ ] 7.1 Apply the `trips` delta: five added requirements and the amended
      row-level-security one. *Performed by `/opsx:archive`, as in the last
      change — no archived change does this by hand.*
- [x] 7.2 `openspec/ROADMAP.md`: move this out of `Next`, renumber what remains, and
      record what turned out differently — the function instead of the trigger the
      schema guessed at, above all.
- [x] 7.3 Note that the Kyoto seed is no longer blocked even though it is not
      removed here. *Cross-trip isolation is left open until 8.2 has actually been
      run — closing a loose end on the strength of a diff is the thing this task
      list exists to refuse.*
- [x] 7.4 Fold the phone's forgotten trip into the existing last-used-city gap rather
      than logging a second one. They are one missing capability.
- [x] 7.5 `AGENTS.md`: record that a write which cannot resolve to an existing
      membership goes through a definer function rather than a widened policy, and
      that `is_trip_member` being `SECURITY DEFINER` is what keeps the `trip_members`
      insert policy from recursing.

## 8. Looking, including the thing that has never been testable

- [x] 8.1 `pnpm typecheck`, `lint`, `test`, `build`, `check:cycles`, `check:tokens`,
      `check:rls`, `check:specs`, both platforms. Necessary and, on five consecutive
      changes of evidence, not sufficient.
- [x] 8.2 **Test cross-trip isolation for the first time.** Make a second trip, put a
      marker and a city in it, and confirm from the other trip that neither is
      visible — and that asking for them by id returns nothing. This is a scenario in
      the `trips` specification that has never been exercisable, and a defect could
      have been sitting in those policies since the initial schema with nothing able
      to reveal it.
      *Done as a second rolled-back probe rather than through the interface, which
      is the layer that matters: the specification requires the filtering happen in
      the database rather than in application code, so testing it there tests the
      guarantee rather than a screen's use of it. Nine assertions, all true —
      other-trip-not-listed, other-city-by-id-returns-nothing,
      other-marker-by-id-returns-nothing, other-members-not-visible,
      ana-sees-exactly-her-own-trips, ana-sees-no-markers-at-all,
      cannot-write-into-other-trip, cannot-rename-other-trip. The policies written
      in the initial schema are correct; that is now demonstrated rather than
      assumed.*
- [x] 8.3 Invite an address from one account and claim it from another, on a real
      device and a real browser. This is the first time `claim_trip_memberships()`
      has run against a row the product created rather than one a migration seeded.
- [x] 8.4 Invite an address deliberately wrongly. Confirm the inviter sees "not joined
      yet" against it, and that the person who signs up at the other address gets the
      empty state that tells them what to check.
- [x] 8.5 Switch trips with a filter applied and confirm it clears rather than
      carrying over.
- [x] 8.6 Create a trip on one platform and confirm it appears on the other.

## 9. What the probe found

`create_trip` shipped to the remote inserting the creator's membership with a
display name and an email and **no `user_id`**. Membership resolves through
`is_trip_member`, which matches on `user_id` — so the creator was a member the
database could not recognise. They would have made a trip and immediately not
been able to see it, until they signed out and back in and
`claim_trip_memberships()` matched the address.

Nothing static could have caught it. The SQL is valid, the function returns a
uuid, every typecheck and lint and test passed, and the migration applied
cleanly. It is only visible by asking the database whether the person who just
created a trip can see it.

- [x] 9.1 Set `user_id` to `auth.uid()` in the creator's membership, with the
      reasoning recorded in the migration rather than only in this file.
- [x] 9.2 Re-apply the corrected function to the remote. The definition was
      extracted from the migration file rather than retyped, so the two cannot
      have drifted; `create or replace` means the file remains the source of
      truth and a fresh database gets the fixed version from the same migration.
- [x] 9.3 Re-run the probe and confirm `creator-can-see-own-trip`, which was the
      assertion that would have been false.
- [x] 9.4 Regenerate `database.types.ts` now that the project is linked, and
      confirm it matches the signature that was hand-written to typecheck
      against. It does, exactly.

## 10. Creating a trip when you already have one

Found by using it: creation was only reachable from the empty state, so somebody
who already had a trip could rename it and switch between trips but never make
another. The requirement always said "any signed-in person", and only its
*scenario* was about having none — so the specification was right and the
implementation read the narrower half of it.

- [x] 10.1 Split the two questions out of the empty state into a `CreateTripForm`
      both entry points share. The empty state keeps the part that explains why
      somebody might be seeing it, which is noise beside a trip you are already on.
- [x] 10.2 Web: a `New trip` control in the trip bar, opening the form as a detour
      beside Rename and People. Only one detour open at a time.
- [x] 10.3 Mobile: a `New trip` item in the header menu, beside Rename and People,
      with the form inline in the shape the rename editor already uses.
- [x] 10.4 Re-read the trip list after creating one. Web navigates and the server
      re-reads; mobile keys `useQuery` on a counter, because that hook re-runs on a
      dependency change and this is the one query with nothing else to key on.
- [x] 10.5 Add the two missing scenarios to the `trips` delta — creating a trip
      while already on one, and being shown the new trip afterwards. The gap was in
      the scenarios rather than the requirement, which is exactly how it got built
      half-right.
- [x] 10.6 On a device and in a browser: make a second trip from inside the first,
      confirm it opens, and confirm both appear in the picker.
