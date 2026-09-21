## Why

Invite somebody at the wrong address and there is nothing you can do about it. The row
sits in the People list forever, reading `not joined yet · crisitan@…`, beside the real
person you invited on the second attempt.

Both applications go out of their way to tell you this has happened, and then offer
nothing to do about it. The specification says why the warning exists — *"Neither can
diagnose it, and only the inviter can fix it"* — and the migration that built the invite
says the same: *"The database cannot fix a typo; it can only make sure the person who can
fix it is looking at it."* **Both documents name a fix that has never existed.**

Nothing sends an invitation. The address is the whole mechanism, so a typo is not an
unlikely edge — it is the one failure this design accepts in exchange for needing no email,
and it is the one this product has left standing.

## What Changes

- **An invitation that no account has claimed can be taken back**, from the People list
  where it is already shown as not joined.
- **It asks first**, the way removing a place or a city already asks — in the People list
  itself, in the product's own words. A name and an address somebody typed are being
  destroyed, and they cannot be got back except by typing them again.
- Both applications, because every action on a trip is offered by both.

## What this deliberately does not do

**Removing a member who has joined.** That is what the database refuses today, for a
reason it states: it would cascade that person's recorded interest away and silently
change what the trip's filters match for everybody else. Nothing here overrules that. An
unclaimed invitation has no recorded interest, because nobody has ever signed in as it, so
the objection does not reach this case at all.

**Leaving a trip yourself.** One row and a different feature: it has to move you off the
trip you are looking at, the way archiving already does, and it has to refuse when you are
the last one.

**Roles.** "Who may remove whom" stops being a question at this scope. An unclaimed
invitation belongs to nobody, so there is no asymmetry to resolve, and this product still
has no roles — every member is equal by design.

Each of these stays open. None is blocked by this change, and this change does not decide
any of them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trips`: gains one requirement for taking back an unclaimed invitation — who may, what it
  affects, and that a membership an account has claimed is not removable by it. The
  existing requirement *A member who has no account yet is shown as not joined* is not
  rewritten: it describes the diagnosis, and this adds the fix beside it.

`write-feedback`'s *A write that destroys something asks before it happens* applies to this
unchanged and is deliberately not edited. It already settles that the question is asked in
the surface that offered the act, that dismissing counts as declining, that the confirming
control owns the wait, and that no second destructive control may stand beside a question.

## Impact

- One migration: a delete policy on `trip_members`, which that table has never had.
- `packages/data/src/interest.ts` — a `removeMember` beside `inviteMember`, returning the
  same `WriteOutcome` every write there returns.
- `apps/web/app/_components/trip-bar.tsx` and `apps/mobile/components/people-sheet.tsx` —
  the People list on each platform gains a control on unclaimed rows only, and the question
  that control raises.
