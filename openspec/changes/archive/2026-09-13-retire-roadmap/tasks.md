## 1. Clear the way

- [x] 1.1 ~~Confirm `one-colour-per-place-type` is archived.~~ **Gate dropped, on the user's
      call.** Its task 6.3 is already `[x]` and is the only roadmap line in that change, so no
      pending task there edits the file. The one consequence is folded into task 6.1. See
      `design.md` § Migration Plan.
- [x] 1.2 ~~Confirm `mobile-account-creation` is archived.~~ Dropped with 1.1 — it never
      referenced the roadmap, and its remaining tasks touch no file this change edits.
- [x] 1.3 Check whether `#119` has already edited `.claude/skills/pinpoint-explore/SKILL.md`. If
      it has, rebase on it before touching step 5; if it has not, this change goes first and
      `#119` rebases on this.

## 2. Move the two decisions into the specifications

`openspec archive` is what writes these deltas into `openspec/specs/`, so this group verifies
them and the archive step applies them. Hand-editing the main specifications here would apply
each delta twice.

- [x] 2.1 Verify the `data-freshness` delta is a faithful full copy of *A screen re-reads what
      it is showing when it becomes current again* with additions only — the revisit condition,
      the accepted cost, and why a live subscription was declined. Diffed against
      `openspec/specs/data-freshness/spec.md`: four additions, nothing removed or reworded.
- [x] 2.2 Confirm the revisit condition in `design.md` § Decisions is reachable from the
      requirement, since the requirement's rejection scenario points at it by reference.
- [x] 2.3 Verify the `workspace-chrome` delta adds *A control does not appear to offer more
      than it offers* with its three scenarios, and that no requirement of that name already
      exists in `openspec/specs/workspace-chrome/spec.md` — it does not, so the delta is an
      `ADDED` rather than a collision.
- [x] 2.4 Grep the specifications for the parity sentence (`sufficient on its own`) and confirm
      the new requirement reads as a qualification of it rather than a contradiction — it must
      not appear to forbid an application reaching a capability by a different route, which the
      existing rule expressly permits.

## 3. Move the one gotcha into `AGENTS.md`

- [x] 3.1 Add to `AGENTS.md` § Gotchas: an iOS Keychain item outlives the application that
      wrote it, so `expo-secure-store` would restore a preference from an app that has been
      deleted and reinstalled — tolerable for a theme, wrong for a trip id naming a trip this
      account may have been removed from. The phone's preferences use
      `@react-native-async-storage/async-storage` for that reason.
- [x] 3.2 Leave the header comment in `apps/mobile/lib/preferences.tsx` in place. It says the
      same thing at the point of use and is not the durable record.

## 4. Update the live references

- [x] 4.1 `README.md:14-17` — rewrite the Status paragraph. It still says mobile "has no capture
      flow yet", which has been untrue for two changes. State what both applications do today
      and drop the pointer.
- [x] 4.2 `PRODUCT.md:188-190` — the Evidence on Hand item citing the roadmap as the record of
      defects that passed `typecheck`, `lint` and `build`. Point it at
      `openspec/changes/archive/`, which holds those accounts.
- [x] 4.3 `.github/PULL_REQUEST_TEMPLATE.md:34` — delete the checklist item obliging a roadmap
      update. Replace it with nothing.
- [x] 4.4 `openspec/config.yaml:26` — in the `context:` block, repoint "where things are" at
      `PRODUCT.md` for the product decisions and `openspec/specs/` for the rules in force.
      Remove the roadmap as the answer to "what is next".
- [x] 4.5 `apps/mobile/components/trip-workspace.tsx:345` — rewrite the comment. It cites the
      roadmap as where the decision about storing the selected city lives; that decision is now
      `#128`. Do this after task 3.1, so the comment points at something that exists.
- [x] 4.6 `.claude/skills/pinpoint-explore/SKILL.md:45` — remove step 5's roadmap item. The
      preceding steps already send the reader to the specifications; add `PRODUCT.md` there if
      it is not named.
- [x] 4.7 Leave `supabase/migrations/20260808120000_seed_kyoto_markers.sql:10` alone — an
      applied migration is not edited to fix a comment, and `#126` deletes the file. See
      `design.md` § Decisions.
- [x] 4.8 Leave `openspec/changes/archive/` untouched. Its citations are a dated record.

## 5. Delete the file

- [x] 5.1 Before deleting, read `openspec/ROADMAP.md` once more end to end against `PRODUCT.md`
      and the specifications, and confirm every sentence worth keeping is now somewhere else.
      This is the last chance, and `design.md` § Risks names it as the main risk.
- [x] 5.2 Put anything found in that pass which is worth keeping and has no home into
      `findings.md`, not into the task list. Three went in: the "budget for drawing" lesson,
      and the two open design questions the artifacts never routed.
- [x] 5.3 Delete `openspec/ROADMAP.md`.

## 6. Verify

- [x] 6.1 `grep -rn ROADMAP` returns nothing outside three named places: `openspec/changes/archive/`,
      the seed migration in task 4.7, and `openspec/changes/one-colour-per-place-type/tasks.md:135`
      until that change archives (task 1.1). Anything else is a miss.
- [x] 6.2 `openspec validate retire-roadmap --strict` passes.
- [x] 6.3 `pnpm check:specs` passes.
- [x] 6.4 `pnpm typecheck:mobile` passes — task 4.5 edits a mobile source file, and a comment
      edit is still an edit.
- [ ] 6.5 Open both applications and confirm nothing changed on screen. This change alters one
      comment and no behaviour, so anything visible is a mistake rather than a feature.
- [x] 6.6 Open a pull request and confirm the template no longer asks for a roadmap update.
      `#129`; the OpenSpec checklist no longer carries the roadmap line.
- [x] 6.7 Read the two modified specifications as a whole, not as diffs, and confirm each new
      rule reads as a rule with its reason rather than a paragraph transplanted out of another
      document. Both do. Caught one defect in the reading: the revisit condition was cited as
      "this change's design document", which is unresolvable once in force — now the archived
      path. Also verified the `MODIFIED` requirement against `main`: additions only, nothing
      dropped.
