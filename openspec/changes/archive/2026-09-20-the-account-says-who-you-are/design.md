## Context

See `proposal.md` — Why.

The laptop's menu is already its own component, `AccountMenu`, extracted so that two
screens could not draw two different menus. What feeds it was not extracted with it: the
value it displays, `youAre`, is derived by the same single line in two files —
`trip-workspace.tsx:308` and `trip-calendar.tsx:200` — each with the same comment above
it. The component cannot drift; the thing it is handed can.

The address needed is already on the client. Both screens hold the trip's members and
which one is the reader's, and a member row carries `email` as a non-null column. Nothing
new is read from the server, and `requireUser()` does not need threading down.

The phone's equivalent block is the shape to match: an avatar, then a column holding the
name at title size and the address at note size, the column sized `flex: 1, minWidth: 0`
so a long address truncates rather than pushing the sheet wider.

## Goals / Non-Goals

**Goals:**

- The laptop's open menu shows the name and the address, in the phone's hierarchy.
- The value the menu is handed is derived in one place rather than two.

**Non-Goals:**

- Changing the phone. It is the reference, not the subject.
- Changing the trigger, the menu's rows, or `initialsOf`.
- Making the two applications share styling code. They share token values; that boundary
  is settled in `openspec/specs/styling`.

## Decisions

### The menu is handed the member, not a pair of strings

`youAre: string` becomes a single optional member-shaped value carrying the name and the
address together.

Passing two strings — `youAre` and `youAreAt` — would let a caller supply one without the
other, which is the state that has to be impossible: a menu showing a name and no address
is the defect being fixed, and it should not be expressible. The component already uses a
union to make its waiting form unrepresentable with half its handlers; this is the same
move one level in.

*Alternative considered:* keep `youAre` and add a second prop. Rejected for the reason
above — it makes the broken state one forgotten argument away.

### The derivation moves to one place

Both screens already call the same line to find the reader's own member row. That lookup
moves into a small helper used by both, so the menu's two callers cannot answer "who is
this" differently.

The helper stays in `apps/web` rather than going to a package. `packages/data` already
exports `ownMemberOf`, which answers the same question from a user id; this one answers it
from a member id, which is what both screens hold. It is a web-shaped convenience over
data both callers already have, and promoting it would put a function in a shared package
that only one application can use — the rule in `AGENTS.md` is to promote when the other
application needs it, which it does not: the phone reads its member from a different path
entirely.

### The unreachable fallback is left alone

`?? 'Account'` stays. The probe in `proposal.md` shows the branch cannot be reached, and
a value that is never rendered is not worth a decision — but removing it would mean either
asserting the member exists, which is a lie the type system would then carry everywhere,
or introducing a waiting state the menu already has a better form for.

What changes is that the reason is now written down, so the next reader finds the answer
rather than the question.

## Risks / Trade-offs

- **A long address in a fixed-width menu.** The panel is capped, and an address can be
  longer than the name. The phone already solved this with a column that truncates rather
  than growing; the laptop takes the same approach. Worth looking at with a genuinely long
  address rather than trusting it — this is the third time in this repository that a
  control's real width has disagreed with the one it was written for.
- **The address is the membership's, not the account's.** They are the same value by
  construction — a membership is claimed by matching the account's verified address — so
  this is accurate today. If claiming ever stops matching on address, this line becomes a
  claim that needs rechecking.
