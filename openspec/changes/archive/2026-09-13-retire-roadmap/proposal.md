## Why

`openspec/ROADMAP.md` is a file this project's tooling does not know about. OpenSpec has two
folders — `openspec/specs/` for the rules in force and `openspec/changes/` for work in flight
and its archive — and the roadmap sits outside both, maintained by hand. Half of it (360 of
754 lines) retells what `openspec/changes/archive/` already holds, and the pull request
template obliges every change to edit it, so each one owes work to a duplicate.

It has also started to rot in the way an unowned file does. Pin legibility is listed as
settled *and* as an open question saying the opposite. One loose end says "Filed as `#70`",
and `#70` closed on 1 September. Nobody is wrong to trust it, which is the problem.

## What Changes

The durable half has already found other homes, and this change finishes the job rather than
starting it.

- **Two decisions are written into the specifications that own them.** That live updates were
  declined and the condition under which that is revisited, and the rule that a control must
  not appear to offer something it does not.
- **One gotcha moves to `AGENTS.md`** — why the phone's preferences are not kept in the iOS
  Keychain.
- **`openspec/ROADMAP.md` is deleted**, and the eight places that point at it stop pointing at
  it. Two of those are stale in their own right: `README.md` still says the phone cannot
  capture, and `PRODUCT.md` cites the roadmap as the record of defects that static checks
  missed, which is the archive's job.
- **The pull request template stops asking for a roadmap update**, so opening a pull request no
  longer owes an edit to a file that does not exist.

Nothing else is moved, because nothing else needs moving. `PRODUCT.md` already carries the
decision record — no clustering, markers on one point, currency on the city, the geocoder and
the rule that search is withdrawn rather than billed, wishlist not itinerary, types as a
design system, members are not users, bulk import and the measurement behind it — and
`product-mark` already carries the rule about the mark. The loose ends and the missing
capability are already filed as `#120` through `#128` and as a comment on `#49`.

**Not in this change:** none of those nine issues is fixed here. This change moves knowledge
and deletes a file. It changes nothing a person using the app can see.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-freshness`: adds the rule that staleness is closed by re-reading rather than by a live
  subscription, with the condition under which that is reconsidered. The specification
  currently describes every re-read trigger and never says that re-reading is the whole of the
  mechanism on purpose, so a future change could add a live subscription without contradicting
  anything written down.
- `workspace-chrome`: adds the rule that a control must not appear to offer a capability it
  does not offer. Today the specifications require that either application be sufficient on
  its own, and the phone once satisfied that rule while still shipping a control that looked
  like the laptop's and did a third of what it did. Passing the existing rule was not enough,
  and nothing records why.

## Impact

Documentation and repository furniture. No application code changes, no database changes, no
dependency changes.

- **Deleted**: `openspec/ROADMAP.md`.
- **Specifications**: `openspec/specs/data-freshness/spec.md`,
  `openspec/specs/workspace-chrome/spec.md`.
- **Edited**: `AGENTS.md`, `README.md`, `PRODUCT.md`, `.github/PULL_REQUEST_TEMPLATE.md`,
  `openspec/config.yaml`, `apps/mobile/components/trip-workspace.tsx` (a comment),
  `.claude/skills/pinpoint-explore/SKILL.md`.
- **One reference is deliberately left alone**: an applied migration cites the roadmap in a
  comment, and `#126` deletes that migration. See `design.md`.
- **Sequencing**: `one-colour-per-place-type` has a completed task that writes *into*
  `openspec/ROADMAP.md`, and `mobile-account-creation` is also in flight. Both archive before
  this change deletes the file. `#119` edits the same line of
  `.claude/skills/pinpoint-explore/SKILL.md` that this change edits, so the two need an order.
- **Archived changes keep their citations.** About twenty archived designs and task lists
  mention the roadmap. They are a dated record of what somebody concluded at the time, and are
  left unannotated.
