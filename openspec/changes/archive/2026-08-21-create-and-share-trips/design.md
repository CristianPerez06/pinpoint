## Context

Membership is the only authorization boundary this product has. Every policy on
every table resolves to it, directly or through the row's trip. That is a good
design and it has one hole in it, which the initial schema named rather than
patched:

> No insert or delete policy: nothing in the product creates or removes a trip
> yet, and an insert policy cannot resolve to membership for a trip that has no
> members. Trips are seeded. When creating a trip becomes a real flow it needs its
> own decision (most likely: insert allowed, with a trigger adding the creator as
> the first member) rather than a policy loosened in passing.

This change makes that decision. It also turns out that most of the surrounding
work is already built: `claim_trip_memberships()` links an account to a member row
matching its verified address, and runs on **every** successful authentication;
`trip_members` already carries a mandatory email and a nullable `user_id`; and
`newTripMemberSchema` in `@pinpoint/core` already describes an invitation as
`{ tripId, displayName, email }` and has never been called.

## Goals / Non-Goals

**Goals:**

- A trip can be created without an insert policy on `trips`.
- The invariant "a trip always has at least one member" is structural, not hoped for.
- Inviting somebody costs one row and no service.
- A mistyped invitation is visible to the person who can fix it.
- Nothing under `packages/` is reimplemented — the write path is three new functions
  over the client that already exists.

**Non-Goals:**

- Archiving a trip. Settled as the answer instead of deletion, deliberately deferred.
- Deleting anything — a trip, a member, or a membership.
- Editing your own display name.
- Sending an email, of any kind, for any reason.
- Roles. Any member can do anything a member can do, which is what a trip of two to
  four people needs.

## Decisions

### Creation is a `SECURITY DEFINER` function, not an insert policy

The schema's own guess was "insert allowed, with a trigger adding the creator as the
first member". Asking the person for their display name rules that out: a trigger on
`trips` sees the trip's columns and `auth.jwt()`, and a display name is in neither.

Doing it as two client statements does not work either, and the reason is the same
one that left the hole:

```
  1. insert into trips (name) returning id   ← needs an insert policy that
                                               cannot resolve to membership
  2. insert into trip_members (…)            ← its policy checks
                                               is_trip_member(trip_id),
                                               false until step 2 has run
```

Even with both policies somehow written, a failure between the two leaves a trip with
no members: unreachable by every select policy in the schema, and impossible to
delete, because there is no delete policy either. An orphan nobody can see or remove.

So creation is one function:

```sql
create_trip(trip_name text, member_name text) returns uuid
  language plpgsql
  security definer
  set search_path = public
```

It reads the address from `auth.jwt() ->> 'email'`, inserts both rows in one
statement block, and returns the trip's id. `claim_trip_memberships()` is the
precedent for all of it — same modifiers, same way of reading the verified address,
same invocation through `client.rpc()` from a shared package.

Three consequences worth stating:

- **`trips` gets no insert policy at all.** The comment warned against loosening one
  in passing; this does not loosen one, it declines to add one. Creation is
  expressible only through the function.
- **The invariant is structural.** There is no path that produces a memberless trip,
  rather than a rule that every caller has to remember.
- **The specification had to change.** `trips` requires that every policy resolve to
  membership; a write that deliberately does not resolve to a policy at all needed
  that requirement amended rather than quietly contradicted. The amendment is narrow:
  it permits a definer function exactly where no membership can exist yet, and
  requires the acting account come from the session rather than the arguments.

Alternatives considered and rejected: widening the `trip_members` insert policy to
permit inserting yourself into a memberless trip — expressible, but it makes the
policy describe a transient state rather than an authorization rule, and still leaves
the two-statement window. And a trigger deriving the display name from the email's
local part, which is how a member list ends up reading `cristian.ap84`.

### Invitation is one row, and nothing is sent

`auth` already specifies invitation completely: *"A person is invited to a trip by a
member record carrying their email address and no account."* Claiming happens on every
successful authentication, so being invited before signing up and being invited years
after both work, with no branch.

So inviting is an insert into `trip_members` with `user_id` null, permitted by one new
policy resolving to `is_trip_member(trip_id)`. No token, no invitation table, no
expiry, no mail service — which also keeps the $0 constraint intact rather than
testing it.

**The cost is that delivery is out of band**, and the person being invited is told by
whoever invited them. For a trip of two to four people who are travelling together
this is not a real limitation. It has one failure mode, and it is nasty:

```
   invites  "juli@gmial.com"              signs up as "julieta@gmail.com"
   ───────────────────────────►                      │
   sees "Julieta" in the members            ┌────────▼──────────────┐
   list. Indistinguishable from             │ You are not on any    │
   success.                                 │ trips yet.            │
                                            └───────────────────────┘
                                            Indistinguishable from
                                            not having been invited.
```

Two screens that both look correct, one mistake, and the only person who can fix it
has no reason to suspect it. The seed migration already warns about this shape in a
comment — *"a placeholder left here means sign-up succeeds and the person sees no
trips, which looks like a bug and is not one"* — where it can happen once, to you,
while editing SQL. Self-service invitation makes it something anybody can do to
somebody else.

### The fix for that is already fetched and currently ignored

`TripMember.userId` is nullable, read by `fetchTripMembers`, and used by exactly one
thing: `ownMemberOf`, to find which member the reader is. Nothing displays it.

`userId === null` means "invited, never signed in". Showing that in the member list,
with the address, converts a silent failure into a visible one at the only place it
can be corrected. It costs no query, no column and no round trip — the data is
already on the client.

The empty state gets the other half of it: somebody who lands on "You are not on any
trips yet" is either genuinely uninvited or was invited at a different address, and
the screen can say so. It cannot say which, because telling an arbitrary account
whether an invitation exists for some address would leak membership to anyone who can
type an email in.

### Where the chosen trip lives, and why the two platforms differ

Web already keeps the selected city in the URL, so the trip goes beside it as
`?trip=<id>`. It survives a reload, it can be linked, and `page.tsx` is a server
component that can read it before fetching anything. A route — `/trip/[id]` — is the
better long-term shape for a container, and is not worth restructuring the app
directory for inside a change already carrying a migration and two applications'
worth of interface.

The phone holds it in memory for the session and opens on the first trip. It has
nowhere to persist a preference: `expo-secure-store` exists for the session token,
and a trip id is not a secret. This is the second feature to want a small persisted
preference — the form's last-used city was the first, and is already logged as a gap.
Rather than working around it twice or introducing a storage dependency inside this
change, the two are recorded as one gap wanting one answer.

Both platforms must satisfy the same rule regardless: everything scoped to a trip is
replaced when the trip changes, filter included. A filter surviving a trip switch
would narrow the new trip by the old trip's members, which are member ids that do not
exist in it — matching nothing, for a reason nobody could see.

## Risks / Trade-offs

**A `SECURITY DEFINER` function is a hole in the only authorization boundary the
product has, if it is wrong.** → It takes the account from `auth.jwt()` rather than
from an argument, so there is nothing a caller can pass to act as somebody else. It
returns early when there is no session. And it is verified with a rolled-back probe
against the real policies rather than by reading the SQL, which is how the composite
foreign key was checked in an earlier change.

**A mistyped invitation is still possible; it is only visible now.** → Accepted. The
alternative is verifying addresses, which needs mail, which needs a service. Making
it visible to the inviter is the cheap 90%.

**Invitation leaks nothing, and therefore explains nothing.** → The empty state cannot
say "you were invited at a different address" without confirming to any account that
some address is on some trip. It says what to check instead, which is weaker and is
the right trade.

**Any member can invite any address to a trip.** → Correct for a trip of two to four
people planning together, and hard to tighten later without a role concept the product
does not have and does not need. Noted rather than mitigated.

**The phone forgets which trip you were on.** → Only matters once somebody has two
trips, which is new with this change. Logged with the last-used-city gap it duplicates.

**Two trips make cross-trip isolation testable for the first time.** → That is a
benefit, and it is also a risk in the sense that a defect could have been sitting in
the policies since the initial schema with nothing able to reveal it. The task list
tests it deliberately rather than assuming the policies were right because nothing
complained.

## Open Questions

- **Whether the invited person should be able to rename themselves.** The creator
  names themselves; an invited person is named by whoever invited them, and
  `trip_members_update_own` already permits changing it. Out of scope here, but the
  asymmetry is new enough to be worth watching.
- **What the trip switcher looks like when there are two trips versus eight.** This
  product will realistically reach three. Building a picker for eight would be
  designing for a scale it will not see, so it is deliberately a list.
- **Whether the Kyoto seed goes now or next.** It stops being blocked by this change,
  but removing it needs a migration deleting rows rather than deleting a file, since
  the remote's history does not rewind. Kept out to leave this change one subject.
