## Context

See `proposal.md` — Why.

The state that shapes this change is that most of the work is already done and was done
elsewhere. `PRODUCT.md` grew into the decision record while the roadmap was still being
maintained, so the two overlap heavily and `PRODUCT.md` is the more current of the pair. What
is left in `openspec/ROADMAP.md` and nowhere else is small, and finding that out is what makes
this a routing job rather than a migration.

Three constraints matter:

- **A `MODIFIED` spec delta replaces the whole requirement at archive time.** A sentence not
  carried forward is deleted silently, so the one modified requirement here is written as a
  full copy of the original with additions.
- **The specification already forbids a persistent connection.** `data-freshness` states it as
  a `SHALL NOT`. Only the revisit condition is missing, which is why that delta adds a
  condition rather than a prohibition.
- **`.claude/skills/` is partly generated.** `openspec update` regenerates the OpenSpec skills,
  so nothing durable can be written there — but `pinpoint-explore/SKILL.md` is hand-written and
  is safe to edit.

## Goals / Non-Goals

**Goals:**

- Every sentence worth keeping is somewhere a future change will actually look.
- Deleting the file breaks no reference that a person could reasonably follow.
- Opening a pull request stops owing an edit to a file that does not exist.

**Non-Goals:**

- Fixing anything the roadmap listed. The nine issues stand on their own.
- Restating in the specifications what `PRODUCT.md` already holds. Two records of one decision
  is the problem being removed, not the shape of the fix.
- Annotating the archive.

## Decisions

**The revisit condition for live updates, which the `data-freshness` delta points at.**

> Use the existing return trigger on a real shared trip, with two people planning at the same
> time, and observe whether something is still stale in a way that matters to them. Not before
> that.

The condition is deliberately an observation and not a threshold. The gap is real and known;
what is unknown is whether it costs anything at the size this product runs at, and the only
thing that can answer that is two people using it. A numeric trigger — a trip count, a member
count — would be invented rather than measured.

**The three homeless pieces land where a future change will trip over them, not where they fit
tidily.**

- *Live updates declined, with the condition* → `data-freshness`, because that specification
  already carries the prohibition and a rule whose exception lives in another file is a rule
  nobody finds.
- *A control must not appear to offer more than it offers* → `workspace-chrome`, because it is
  a rule about controls. It is a gloss on the parity rule, but the parity rule already appears
  in three specifications and `PRODUCT.md`, and adding a fifth copy of it to carry one
  qualification would spread it further.
- *Why the phone's preferences are not in the iOS Keychain* → `AGENTS.md`, with the other
  native gotchas. Its header comment in `apps/mobile/lib/preferences.tsx` already explains it,
  which is why this is the least urgent of the three: this repository's own rule is that a
  comment records what somebody once concluded and the durable record belongs elsewhere.

**`## Done` is deleted rather than summarised.** It is 360 of 754 lines and every entry has an
archived change behind it holding the same account in more detail. A summary of a record is a
third copy.

**The applied migration's reference is left alone.** `supabase/migrations/20260808120000_seed_kyoto_markers.sql:10`
cites the roadmap in a comment. Editing an applied migration to change a comment is a worse
idea than leaving a dead reference in a file that `#126` deletes outright — newer Supabase
tooling records the statements it applied, and a rewritten file invites a mismatch for no gain.

This means the issue's original validation line — `grep -rn ROADMAP` returns nothing outside
the archive — is not achievable in this change, and should not be forced. The check becomes:
nothing outside the archive **and that one migration**. `tasks.md` records it so the next
person does not read it as an oversight.

**Archived changes keep their citations, unannotated.** About twenty archived designs and task
lists say things like "recorded in ROADMAP.md under loose ends with that condition". They break
nothing. They are a dated record of what somebody concluded at the time, and the archive is not
where anyone looks for current truth — twenty edits announcing a deletion would be noise in the
one folder that is supposed to be immutable.

**The pull request template's checklist item is removed and not replaced.** The obligation it
encoded — record what this change opened or closed — is now served by filing an issue, which
needs no checklist because nothing is being kept in sync.

**`openspec/config.yaml`'s `context:` block repoints to `PRODUCT.md` and
`openspec/specs/`.** It currently sends an agent to the roadmap for "what is next". `PRODUCT.md`
holds the product decisions and the specifications hold the rules; what is next lives on the
GitHub board, which is not a file an agent should be told to read.

## Risks / Trade-offs

**A sentence worth keeping is dropped because it looked like a duplicate.** → The routing was
verified line by line against `PRODUCT.md` and the specifications before this change was
proposed, and the three survivors were identified that way rather than by reading the roadmap
alone. `tasks.md` re-checks each one at the point of deletion rather than trusting this
document.

**The `MODIFIED` delta on `data-freshness` silently drops a sentence at archive time.** → It is
written as a full copy of the existing requirement with additions only, and the task list
includes diffing the archived result against the original so a loss is caught rather than
assumed absent.

**`PRODUCT.md` becomes the single copy of the decision record.** → That is the intent, and it
is the trade being made: one current record instead of two that disagree. The cost is that
`PRODUCT.md` is now load-bearing in a way it was not, and it is a hand-maintained file with no
check on it either.

**A change in flight edits the file this one deletes.** → Sequencing, below.

## Migration Plan

Ordering, because three things collide:

1. ~~**`one-colour-per-place-type` archives first.**~~ **Gate dropped during apply, deliberately.**
   The concern was that its task 6.3 wrote the visited-pin entry *into* `openspec/ROADMAP.md`,
   so deleting the file would leave that task citing something gone. Checked at apply time:
   6.3 is already `[x]`, and it is the only roadmap line in that change — no *pending* task
   there edits the file. So the cost of deleting first is one completed task citing a deleted
   file, which is the same status as the roughly twenty archived citations this document
   already decided to leave unannotated. The gate was over-cautious. It holds one consequence:
   `grep -rn ROADMAP` returns that line until the change archives, so the check in `tasks.md`
   names it rather than failing on it.
2. ~~**`mobile-account-creation` archives first.**~~ Dropped with the above — it never
   referenced the roadmap at all, and the concern was only that its remaining three tasks
   should not absorb a documentation conflict. They do not touch any file this change edits.
3. **`#116` and `#119` need an order.** Both edit step 5 of
   `.claude/skills/pinpoint-explore/SKILL.md`. Either order works; whichever runs second
   rebases onto the first. This change removes one list item from that step, which is the
   smaller edit of the two, so running it first is marginally cheaper.

Rollback is `git revert`. Nothing is deployed, no data moves, and no schema changes.
