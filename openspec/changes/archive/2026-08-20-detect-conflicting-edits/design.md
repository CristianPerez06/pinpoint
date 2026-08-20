# Design

## Context

See `proposal.md` — Why. Two facts shape the approach.

`markers` has no `updated_at`, so there is nothing to compare against. That is the reason
this needs the first migration since the initial schema, and it is worth saying plainly:
the proposal for the previous change said that finding itself writing a migration would
mean something had been misunderstood. Here it is the point rather than a symptom.

The write path already returns a four-state result — invalid input, rejected, wrote, and
the query states — so a conflict has somewhere to live without inventing a second error
channel.

## Goals / Non-Goals

**Goals:**

- A save that would overwrite somebody else's is refused, and says why.
- The guarantee holds for any caller, including the phone once it can edit.
- Nothing typed is lost when a save is refused.

**Non-Goals:**

- Merging, diffing, or choosing a winner. The person is told and can look.
- Guarding visited or interest. Neither can collide meaningfully — see the proposal.
- Live updates. Learning about somebody else's change *before* you hit save is a different
  and much larger change, and this one has to work without it.

## Decisions

### The database maintains `updated_at`, via a trigger

A `before update` trigger sets `updated_at = now()` on every modification.

Doing it in `updateMarker` instead was rejected for the reason the specification gives: a
value the caller supplies is a value the caller can forget or fake, and the guarantee is
only worth having if it holds for every writer. The same argument put row-level security
in the database rather than the interface.

**Consequence accepted:** marking a place visited also bumps `updated_at`, so it can
invalidate a concurrent edit of that same marker's name. That is over-eager but honest —
the row did change. Being over-eager fails safe: a spurious conflict costs one retry,
while a missed one silently destroys somebody's work. Narrowing the trigger to the
editable columns would trade a cheap, visible cost for a rare, invisible one.

### The version travels as a precondition, not as a field

`updateMarker(client, markerId, patch, updatedAt)` adds `.eq('updated_at', updatedAt)` to
the update. Postgres applies the filter and the update atomically, so there is no window
between checking and writing — which is the whole reason not to read-then-compare in
application code.

`updatedAt` stays out of `markerPatchSchema`. It is not a field somebody edits, and
putting it there would let a caller "update" it, which is exactly what the trigger exists
to prevent.

**Zero rows affected is the conflict signal.** Supabase's `.single()` errors when the
update matches nothing, so the outcome has to distinguish that from a genuine failure —
which means the row is re-read to tell "it changed underneath you" from "it is gone".
Without that, deleting a marker in another tab and editing it here would report the wrong
thing.

### A conflict is its own outcome, not a rejection with a special message

`WriteOutcome` gains `conflict`. Reusing `rejected` with wording the interface matches on
would put the meaning in a string, and a string is not a contract — the first translation
or reword silently breaks the branch.

Three refusals, three answers: correct what you typed, you may not do this, somebody else
changed it while you were working. The interface has to be able to say which.

### The form keeps what was typed

The existing form already survives a rejection — retyping a name is a nuisance and
re-finding a spot on a map is worse — so this rides on behaviour the write path
established rather than adding a rule of its own. The conflict message names the place and
says the other version is what is stored; deciding what to do about it is left to the
person.

## Risks / Trade-offs

- **A person can be stuck retrying against a version they cannot see.** Nothing here
  refreshes the form with what is stored, so somebody could correct a conflict twice. →
  Accepted for now: with two travellers the second collision is vanishingly unlikely, and
  the alternative — replacing what they typed with somebody else's text — is worse than
  the problem. Live updates are the real answer and are their own change.
- **The trigger makes every write slightly more expensive.** → Immeasurably so at this
  scale, and it buys a guarantee that cannot be forgotten.
- **`Marker` gaining a field touches both applications and `@pinpoint/map`.** → It is
  additive and nothing is required to read it. The phone carries the value and ignores it
  until it can edit.

## Open Questions

- Whether cities should get the same guarantee. They can be renamed by either member and
  have the same exposure, but a city is a name and a currency — far less to lose, and
  renaming one is not something two people do at once. Left alone deliberately rather than
  by oversight.
