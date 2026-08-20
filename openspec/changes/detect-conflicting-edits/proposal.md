# A save that would overwrite somebody else's says so

## Why

Two people editing the same place at the same time is the ordinary case for this product,
not an edge one — it is built for travellers planning together, and the whole reason
interest is stored per member is that both of them are working on the same trip at once.

Today the later save wins and nothing tells either person. The one whose work vanished
does not find out; the one who overwrote it does not know they did. There is no
`updated_at` on a marker, so the application cannot detect it even if it wanted to.

It is the last thing on the loose-ends list that is a correctness problem rather than a
tidiness one, and unlike the rest it gets worse rather than staying still: the moment a
trip has more than two people, the odds of a silent overwrite stop being negligible.

## What Changes

- **A marker records when it was last changed.** A new `updated_at` column, maintained by
  the database rather than by whoever writes, so it cannot be forgotten by a caller or
  faked by one.
- **Editing a place carries the version it was read at**, and a save whose version no
  longer matches is refused rather than applied.
- **A refused save is reported as a conflict**, distinctly from a validation error and
  from a policy refusal. The person is told somebody else changed the place, and nothing
  they typed is thrown away.
- **BREAKING (specification only):** `marker-capture` gains a requirement that concurrent
  edits are detected. Nothing that exists stops working; a guarantee that was absent is
  now made.

**Not in this change:** marking a place visited, and recording interest. Visited is a
shared toggle with one meaningful value either way, and interest is keyed per member so
two people cannot collide on one row. Guarding them would add a failure mode without
removing one. This is about the edit form, which is the only place two people can type
different things into the same field.

**No conflict resolution, no merge, no diff.** The person is told and can look. Deciding
whose version wins is a conversation between two travellers, not something the software
should arbitrate.

## Capabilities

### New Capabilities

None. This is a guarantee added to an existing capability.

### Modified Capabilities

- `marker-capture`: adds that a marker records when it was last changed, and that a save
  based on a stale read is refused and reported rather than applied.

## Impact

- `supabase/migrations` — **one migration**, adding `updated_at` to `markers` and a
  trigger that maintains it. The first migration this project has needed since the
  initial schema, and it is the reason this change is not a refactor.
- `packages/core` — `Marker` gains `updatedAt`. The patch schema does not: the version is
  a precondition of a write, not a field somebody edits.
- `packages/data` — `updateMarker` takes the version it is updating from, and returns a
  new `conflict` outcome when the row no longer matches.
- `apps/web` — the edit form reports a conflict without discarding what was typed.
- `apps/mobile` — nothing. It cannot edit a marker yet; when it can, the guarantee is
  already in the shared write path rather than something the phone has to reimplement.
- No new dependency.
