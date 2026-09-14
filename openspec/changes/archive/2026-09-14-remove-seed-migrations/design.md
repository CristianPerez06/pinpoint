## Context

Supabase keeps a table of applied migration versions on the live project
(`supabase_migrations.schema_migrations`). `supabase db push` compares it with the files in
`supabase/migrations/`, and refuses to run when the live table lists a version that has no
file locally. Both seed versions are in that table today. Deleting the files alone would
therefore leave every later `pnpm db:push` failing.

## Goals / Non-Goals

**Goals:**

- The seed files are gone and `pnpm db:push` still works against the live project.
- The live project's application data is untouched.

**Non-Goals:**

- Rewriting migration history beyond the two seed versions.

## Decisions

**Mark the two versions reverted in the live history.**
`supabase migration repair --linked --status reverted 20260803023543 20260808120000`
removes them from the history table and nothing else. Keeping empty placeholder files
under the old names was the alternative; it leaves two files in `supabase/migrations/`
whose only purpose is to satisfy a comparison, and the issue asks for the files to be gone.

**Repair the history in the same sitting as deleting the files.** Between the two, local
and live disagree and `db:push` refuses rather than doing anything — a refusal is the safe
failure. The unsafe order is the reverse lived with for long: history repaired while the
files still exist on `main`, where `db:push --include-all` would re-apply both seeds and
put the made-up trip back. So the repair runs after the files are deleted on the branch,
and nobody pushes migrations from `main` until the branch is merged.

**Confirm the fresh-database claim on a real fresh database.** `supabase db reset --local`
builds one from the migrations; count the rows in `trips`, `trip_members`, `cities`,
`markers` and `marker_interest`. The one remaining data statement,
`update public.markers set updated_at = created_at` in `20260820120000`, matches no rows on
an empty table, but that is what the reset is for. This needs Docker running.

## Risks / Trade-offs

- [The live data changes again before the repair runs] → Re-run the read-only check
  (no trip named `Japan`, none of the seeded place names) immediately before repairing.
- [Somebody else's machine still has the seed files, on an old branch] → `db:push` from
  there would list them as not applied and refuse without `--include-all`. Accepted; this
  repository has one deployer.

## Migration Plan

1. Re-run the read-only check against the live project.
2. Delete the two files.
3. Repair the live history.
4. `pnpm exec supabase db push --dry-run` reports nothing to apply.

Rollback: `supabase migration repair --linked --status applied <versions>` and restore the
files from git. Neither step touches data, so neither needs a data rollback.
