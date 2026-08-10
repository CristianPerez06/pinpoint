## Context

See proposal.md — Why. The behaviour already exists in code; what does not exist is a
rule requiring it.

The mechanism is `public.claim_trip_memberships()`, a `SECURITY DEFINER` function added
with the schema. It is `SECURITY DEFINER` for a reason that constrains everything below:
an account with no membership cannot be reached by any membership policy, so it cannot
read — let alone update — the row it needs to claim. The privilege has to come from
somewhere other than membership, and the verified email is what earns it.

## Goals / Non-Goals

**Goals:**

- The rule is written down, so removing the behaviour requires arguing with a
  specification rather than deleting a line.
- The properties that make claiming safe are stated, not just the fact that it happens.
- A test covers the ordering that broke.

**Non-Goals:**

- Changing behaviour. The same call fires after the same event; D3 only moves where it
  lives.
- An invitation interface. Member rows are seeded by migration; inviting from inside the
  product is a separate change.
- Changing the SQL. It is already idempotent and already matches on the verified address.

## Decisions

### D1 — Claim on every authentication, not once

The obvious alternative is a one-time reconciliation: claim at sign-up, and if an
invitation arrives later, fix it with a migration or an admin action.

Rejected. It makes an ordinary sequence — sign up on Monday, get invited on Tuesday —
require intervention by somebody with database access, and it fails silently from the
invited person's side. They see an empty trip list, which is exactly what a person
invited to nothing sees, so they cannot even report it accurately.

The cost of the alternative is one round trip per sign-in. The statement touches only
rows where `user_id is null`, so after the first success it updates nothing, and the
common case is a query that matches no rows. That is a small price for removing a state
the product cannot recover from on its own.

### D2 — The verified address is the authorization

Claiming is privileged: it writes to a row the caller cannot otherwise see. What makes
it safe is that the function reads the address from `auth.jwt() ->> 'email'` rather than
from an argument.

That distinction is the entire security boundary, which is why the specification states
it rather than leaving it to the implementation. A refactor that "simplifies" the
function by taking the address as a parameter would turn claiming into: name any address
and take their invitation. It would also look tidier, which is what makes it worth
naming in a spec.

The `user_id is null` condition is the second half: without it, re-claiming could move a
membership between accounts.

### D3 — Claiming moves inside `signIn` and `signUp`

Written while drafting the tasks, which is where the flaw showed: the fact that was
wrong — *signing in claims, not only signing up* — is a fact about **call sites in the
applications**, and `packages/auth` cannot test it. Web calls `claimTripMemberships`
from two server actions; mobile calls it from the login screen. A test in the package
can only prove the function works, which was never the broken part.

Worse, the arrangement reproduces the original defect. Two call sites have to remember,
a third platform or a second sign-in path would have to remember too, and forgetting
looks like nothing at all until somebody is staring at an empty trip list.

So claiming moves into `signIn` and `signUp` themselves. Every successful authentication
then claims because there is no path through authentication that does not, rather than
because two applications each remembered. That is what the requirement actually says,
expressed as structure instead of convention.

This does change code, which the proposal originally said it would not — the proposal is
updated to match. No behaviour changes: the same call happens after the same event, one
layer down.

It also makes the guarantee testable where the tests already are, which is what D4 is
about.

### D4 — Test the ordering, not the SQL

The regression worth protecting is not "the function works" — it is "signing in claims,
not just signing up". With D3 that is a fact about `signIn`, which `packages/auth`
already tests against a stubbed client, so the test is cheap and sits beside the code it
guards.

Testing the SQL itself would need a live database and would cover the half that was
never broken.

## Risks / Trade-offs

- **One extra round trip per sign-in.** Accepted, per D1. If sign-in latency ever
  matters, the honest fix is to make the function cheaper, not to make it rarer.
- **This does not stop the call being removed.** A spec constrains changes made by
  people who read specs; the test catches the rest. D3 narrows it further by leaving one
  place to remove rather than three.
- **A person invited under a different address than they signed up with still sees
  nothing**, and this change does not help them. It is the same failure the change is
  about, from a cause a spec cannot fix — the product has no way to say "we invited
  someone else". Worth revisiting when invitations become an interface.
