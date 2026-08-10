# Guarantee that an invitation is claimable

## Why

A person is invited to a trip by having a member row seeded with their email address.
When they authenticate, `claim_trip_memberships()` links the account to that row. Until
that happens they are on no trips, and the application has no way to tell them why —
they see an empty trip list, which is also what a genuinely uninvited person sees.

For a while the claim ran **only after sign-up**. That made the order of two ordinary
events load-bearing: invited first, then sign up, and it worked; sign up first, then get
invited, and the invitation could never be claimed by any action available in the
product. It is not a hypothetical. Both members of the first trip sat with `user_id`
null while the map they belonged to rendered nothing, and the symptom — "You are not on
any trips yet" over a database holding eighteen markers — gave no hint where to look.

That is fixed in code (`539d1ca`). **Nothing in the specification says it must stay
fixed.** The `auth` spec covers signing up, signing in, staying signed in, signing out
and route protection, and says nothing about claiming — so the behaviour could be
removed by a future change and every check in the repository would still pass.

This change writes the requirement down. It is deliberately small and deliberately not
bundled into the change that made the fix: a rule that exists only as a line of code is
one refactor away from not existing.

## What Changes

- **The `auth` spec gains a requirement** that authenticating claims any membership
  seeded for the verified address, whichever order sign-up and invitation happened in.
- **The requirement states the properties that make claiming safe**: the match is on the
  address the identity provider verified rather than one supplied by the caller, only
  unclaimed rows are taken, and claiming nothing is an ordinary outcome rather than a
  failure.
- **Claiming moves into `signIn` and `signUp`** in `@pinpoint/auth`, from the two
  applications that each called it afterwards. Every successful authentication then
  claims because no path through authentication skips it, rather than because two call
  sites remembered — which is the arrangement that produced the defect in the first
  place. Decided in design (D3).
- **A regression test** for the shape that broke — an account that signs in without ever
  signing up in this session still claims.

No user-visible behaviour changes: the same call fires after the same event, one layer
down.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth` — adds a requirement covering membership claiming, which the specification did
  not previously mention at any point.

## Impact

- **`openspec/specs/auth/spec.md`** gains one requirement.
- **`packages/auth`** claims inside `signIn` and `signUp`, and gains test coverage for
  it.
- **`apps/web`** and **`apps/mobile`** stop calling `claimTripMemberships` themselves;
  the export stays, because claiming on demand is still a reasonable thing to want.
- **No schema change.** `claim_trip_memberships()` already matches on
  `auth.jwt() ->> 'email'` and only updates rows where `user_id` is null, which is what
  makes running it on every authentication both safe and idempotent.
- **Nothing user-visible.**

Out of scope: inviting somebody from inside the product. Membership rows are seeded by
migration today, and an invitation interface is a separate change with its own
questions — who may invite, whether an invitation can be withdrawn, and what happens to
attribution if it is.
