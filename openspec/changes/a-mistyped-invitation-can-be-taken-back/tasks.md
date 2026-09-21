## 1. Check the database before building on it

- [x] 1.1 Probe the policy design against a real schema, rolled back, before writing the
      migration: a trip with a claimed member and an unclaimed invitation; confirm a member
      of the trip can delete the unclaimed row, cannot delete the claimed one, and that a
      non-member can delete neither. Use the `do $$ … raise exception 'RESULT: %' … $$`
      shape, per `AGENTS.md`. A clean local database is the right place — note that the
      migrations grant no table access, so the probe needs grants applied by hand until
      `#203` lands.
      *Probed 21 September 2026 against a clean local database with all eight migrations,
      the proposed policy created inside the rolled-back block: outsider deletes the
      unclaimed row → **0**; member deletes another member's claimed row → **0**; member
      deletes their own claimed row → **0**; member deletes the unclaimed row → **1**. The
      policy is sufficient and `#51`'s assumption that this needs a `SECURITY DEFINER`
      function is wrong. Grants had to be applied by hand first, per `#203`.*
- [x] 1.2 Confirm in the same probe that deleting an unclaimed membership touches nothing
      else: marker, city, other membership and `marker_interest` counts unchanged. The
      cascade is the objection this change is scoped around, so measure it rather than
      reason that it cannot fire.
      *Measured in the same block: `marker_interest` 2 → 2 with both rows belonging to the
      two claimed members, markers 1, cities 0, members 3 → 2. The cascade did not fire,
      because an unclaimed membership cannot hold interest in the first place.*

## 2. The database

- [x] 2.1 A migration adding the delete policy on `trip_members`, scoped to `user_id is
      null` and `is_trip_member(trip_id)`. Say in the migration why it is a policy and not
      a `SECURITY DEFINER` function, and why this cannot empty a trip — the two notes
      already in that file explain what was absent, and this is the one that fills part of
      it.
      *`20260921120000_revoke_unclaimed_invitation.sql`. Re-probed after `supabase db reset`
      against the migration itself rather than a policy created inside the test block, and
      the result is identical: outsider 0, claimed 0, own 0, unclaimed 1.*
- [x] 2.2 Update the closing note in `20260821120000_create_trip_and_invite.sql` — it says
      "Neither table has a delete policy", which stops being true. Leave the reasoning about
      claimed members intact; it is still the rule.

## 3. The write

- [x] 3.1 `removeMember` in `packages/data/src/interest.ts`, beside `inviteMember`,
      returning `WriteOutcome`. No membership check in the function.
- [x] 3.2 Report a delete that matched no row as a refusal, not a success, with a message
      that fits the case it actually means: the invitation was claimed, or already removed,
      while the list was open.

## 4. Both applications

- [x] 4.1 Web: a control on unclaimed rows in the People view of `trip-bar.tsx`, raising
      the question in that panel.
- [x] 4.2 Mobile: the same on unclaimed rows in `people-sheet.tsx`.
- [x] 4.3 One shared wording for the question and its controls, so the two do not drift
      from the day after they are written. `#159` is the record of what happens otherwise.
- [x] 4.4 While a question stands, withdraw the remove control from every other row.
      `write-feedback` requires it and a trip with two mistyped addresses is the only place
      it shows.
- [x] 4.5 The confirming control owns the pending state and says what it is doing.

## 5. Look at it

- [ ] 5.1 On a trip with one claimed member and two unclaimed invitations, on both
      platforms and in both themes: the control appears on the unclaimed rows and on
      neither the claimed one nor your own.
- [ ] 5.2 Raise the question on one invitation and confirm the other's control is gone
      while it stands.
- [ ] 5.3 Decline, and confirm nothing was written. Dismiss the panel with a question
      standing, and confirm the same.
- [ ] 5.4 Take one back, then invite somebody at that same address, and confirm it is
      accepted — the unique index is on `(trip_id, lower(email))` and a removed row must
      not keep the address reserved.
- [ ] 5.5 Do not leave test invitations on the live trip. Whatever is created for 5.1 is
      removed by the end, and the trip is left as it was found.

## 6. Finish

- [ ] 6.1 `openspec validate a-mistyped-invitation-can-be-taken-back --strict`.
- [ ] 6.2 `pnpm verify`.
- [ ] 6.3 Close `#51`, recording that A was answered as the narrowest of its three options
      and that B, C and D stopped being open questions at that scope — B because an
      unclaimed invitation belongs to nobody, D because `write-feedback` already requires
      the question to be asked where the act was offered.
