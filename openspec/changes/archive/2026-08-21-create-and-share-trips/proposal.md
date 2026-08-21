## Why

The product works and cannot be given to anybody. There is exactly one trip,
inserted by a migration, and its two members were inserted by the same migration.
Nobody can make a second trip, and nobody new can ever join the first one — the
application has no way to gain a user who is not already in the database.

That is the last thing standing between this and being usable by someone other
than the two people whose email addresses are hard-coded in
`20260803023543_seed_first_trip.sql`.

It has been deferred twice, each time so that the phone could catch up first. The
phone has caught up. Nothing is in front of it any more, and item 1 on the roadmap
— responsive web — is explicitly the kind of thing that can slide, while this is
not.

## What Changes

- **A trip can be created**, by a `create_trip` function rather than by an insert
  policy. It takes what the trip is called and what the creator is called on it,
  and writes both rows in one transaction — so a trip cannot exist without a
  member, which is the invariant that made an insert policy impossible to write.
- **A member can invite somebody by email.** One row in `trip_members` with no
  account attached; `claim_trip_memberships()` already links it on their next
  successful sign-in, whether they sign up afterwards or signed up years ago.
  Nothing is sent, and nothing needs to be — see the design.
- **A member who has not signed in yet is shown as not joined.** Derived from the
  `user_id` the applications already read and currently ignore. This is the only
  feedback that a mistyped invitation exists, and self-service invitation is what
  makes mistyping possible.
- **A trip can be renamed.** No migration: `trips_update_member` has existed since
  the initial schema and nothing has ever called it.
- **A person can change which trip they are looking at**, once more than one
  exists. Web keeps it in the URL beside the selected city; the phone holds it for
  the session.
- **The empty state stops being a dead end.** Both applications currently render
  "You are not on any trips yet." and stop. It becomes where a first trip is made,
  and where somebody who was invited at an address they did not sign up with is
  told what to check.

Not in this change: archiving a trip, removing a member, editing your own display
name, and deleting anything. Deletion is settled — archiving is the answer — and
archiving is deliberately deferred rather than forgotten.

## Capabilities

### New Capabilities

None. Everything here belongs to `trips`, which already defines the trip, the
member, and the boundary between them — including a requirement that more than one
trip may exist, which nothing has ever been able to exercise.

### Modified Capabilities

- `trips`: gains creating a trip, inviting somebody to one, renaming one, choosing
  which one is being viewed, and showing whether a member has an account yet. The
  existing requirement that row-level security resolves to membership is amended
  rather than left alone, because creation is deliberately **not** a policy — it is
  a `SECURITY DEFINER` function, and a specification saying every write resolves to
  a membership policy would be describing something the product no longer does.

### Not modified, and worth saying why

- `auth` needs no delta. "Authenticating claims any membership waiting for that
  address" already defines invitation exactly as this change implements it — a
  member record carrying an email and no account — and already requires claiming on
  every authentication rather than only at sign-up, which is what makes "signed up
  first, invited later" work. This change is the first thing to actually exercise a
  requirement that has been in force since the auth change.

## Impact

**Database.** One migration, the second since the conflict change. It adds
`create_trip(trip_name, member_name)` as `SECURITY DEFINER`, and one insert policy
on `trip_members` resolving to `is_trip_member(trip_id)`. It deliberately adds **no
insert policy on `trips`** — the schema's own comment warned against loosening one
in passing, and routing creation through a function means the "a trip always has a
member" invariant is structural rather than hoped for.

**Shared packages.** `@pinpoint/data` gains `createTrip`, `updateTrip` and
`inviteMember`. `@pinpoint/core` gains nothing — `newTripMemberSchema` is already
there, defining `{ tripId, displayName, email }`, and has never been called.

**Both applications.** A create-trip form, an invite control, a rename control, a
trip switcher, and a rewritten empty state. Web and mobile both currently do
`trips.data[0]!` and both dead-end on the same sentence.

**What this unblocks.** Two loose ends that have been waiting on it. Cross-trip
isolation is a scenario in the `trips` specification that has never been testable,
because there has only ever been one trip. And the disposable Kyoto seed cannot be
removed while it is the only thing there is to look at — that one is not done here,
but it stops being blocked.

**Looking.** Five consecutive changes have shipped defects that type-checked,
linted and built clean. This one carries a database function running as its
definer, which is the one category where a mistake is not a rendering bug but a
hole in the only authorization boundary the product has. The task list verifies it
with a rolled-back probe against real policies rather than by reasoning about the
SQL.
