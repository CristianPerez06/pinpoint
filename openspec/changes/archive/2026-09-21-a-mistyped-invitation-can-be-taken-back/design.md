## Context

See `proposal.md` — Why.

`trip_members` has never had a delete policy. The initial schema says so deliberately, and
the invite migration repeats the reason: removing a member would cascade their recorded
interest away. `marker_interest.member_id` is `on delete cascade`
(`initial_schema.sql:89`) and is the **only** foreign key in the schema pointing at a
member — checked rather than assumed, so the blast radius of any member delete is exactly
one table.

`write-feedback` already governs how the question is asked. Nothing in this change decides
any of that; it is listed in `tasks.md` as behaviour to satisfy, not to design.

## Goals / Non-Goals

**Goals:**

- Exactly one new capability at the database: deleting a membership with no account.
- The rule enforced where it cannot be bypassed, rather than only in two interfaces.

**Non-Goals:**

- Removing a claimed member, leaving a trip, roles. See `proposal.md`.
- Any change to how a question is drawn. That is F's work and it is done.

## Decisions

### A policy, not a `SECURITY DEFINER` function

`#51` assumes this needs a function, the same shape as `create_trip()`, because a policy
cannot express *"unless this is the last member"*.

**That constraint does not apply at this scope.** A trip always has at least one claimed
membership — `create_trip()` writes the trip and the creator's membership in one block
precisely so that is structural — and an unclaimed membership is by definition not that
one. So deleting an unclaimed membership can never empty a trip, and the rule a policy
cannot express is a rule this change never needs.

What the policy must say is expressible in a row predicate:

```sql
create policy trip_members_delete_unclaimed on public.trip_members
  for delete to authenticated
  using (user_id is null and public.is_trip_member(trip_id));
```

`is_trip_member` is already `SECURITY DEFINER` for exactly this reason — so that a policy
on `trip_members` can consult `trip_members` without re-entering its own policy. The
insert policy added for inviting is a one-liner for the same reason, and this is its
mirror.

*Alternative considered:* a `SECURITY DEFINER` function, as the ticket proposes. Rejected
because it buys nothing here and costs the thing policies are good at — a function is one
route that has to be the only route, while a policy is the rule itself. `trips` reserves
that shape for a write that **cannot** resolve to an existing membership, and this one
resolves to the caller's own membership on the trip.

**This is the decision most worth checking rather than believing.** `tasks.md` puts a
rolled-back probe against it before anything else is built, per `AGENTS.md` — the last
composite-key change was caught behaving correctly that way and not by argument.

### `removeMember` returns the same outcome as every other write

Beside `inviteMember` in `packages/data/src/interest.ts`, returning `WriteOutcome` so both
applications report a refusal the way they already report one. No membership check in the
function: the policy is the authorization, and restating it in the client would be the rule
written twice in a place that cannot enforce it — which is what the comment on
`recordInterest` already says about this file.

A delete that matches no row is not an error at the database. It SHALL be reported as a
refusal rather than as success, because the row it names is one the caller could see a
moment ago, and silently succeeding at removing nothing tells them the opposite of what
happened.

### The control appears on unclaimed rows only

Both People lists already branch on `member.userId === null` to draw the `not joined yet ·
address` line. The control goes inside that branch, so the diagnosis and the fix are the
same row and neither can appear without the other.

## Risks / Trade-offs

- **A membership claimed between the list being drawn and the control being pressed.** The
  window is real and the policy closes it: the delete simply matches no row, and the
  refusal path above is what the person sees. Worth writing the message for that case
  rather than letting it fall to a generic one.
- **`write-feedback` forbids a second destructive control beside a standing question.** A
  People list can hold several unclaimed invitations, so raising the question on one must
  withdraw the control from the others. This is the requirement most likely to be missed,
  because it only shows up on a trip with two mistyped addresses.
- **The phone and the laptop will want the same wording.** There is no shared string for
  this yet. Two copies written on the same day agree; the ones written days apart are what
  `#159` was filed about.
