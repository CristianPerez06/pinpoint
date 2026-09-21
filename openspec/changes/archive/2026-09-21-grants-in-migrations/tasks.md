## 1. Record what the hosted database permits today

- [x] 1.1 Read the privileges `authenticated` and `anon` currently hold on `trips`,
      `trip_members`, `cities`, `markers` and `marker_interest` in the hosted database,
      via `information_schema.role_table_grants`. This is the baseline that makes both the
      strip and the restore measurements rather than claims.

      *Linked project `vwbbqebocapuvicalgov` (Pinpoint). All ten rows identical:*

      ```
      anon           cities           DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      anon           marker_interest  DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      anon           markers          DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      anon           trip_members     DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      anon           trips            DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      authenticated  cities           DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      authenticated  marker_interest  DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      authenticated  markers          DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      authenticated  trip_members     DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      authenticated  trips            DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
      ```

      *This is the automatic grant the issue describes, and no migration created any of
      it. It is also wider than anything the schema allows: `anon` holds everything while
      every policy is written `to authenticated`, and `trips` permits insert and delete
      with no policy for either.*

- [x] 1.2 Confirm the baseline is not narrower than what the migration states, so the
      migration is a no-op for `authenticated` as claimed. *Confirmed — the baseline is a
      strict superset on all five tables.*

## 2. The check, first and failing

- [x] 2.1 Rename `.github/scripts/check-rls.mjs` to `check-tables.mjs` and the command
      `check:rls` to `check:tables`, updating `package.json` (the script and `verify`),
      `README.md`, `.github/workflows/ci.yml` and `.github/PULL_REQUEST_TEMPLATE.md`.
      Verify with `grep -rn "check:rls\|check-rls" --include='*.json' --include='*.yml'
      --include='*.md' --include='*.mjs' .` returning nothing outside
      `openspec/changes/archive/`, and `pnpm check:tables` running.
- [x] 2.2 Rewrite the script's header comment so it states both duties — a table this
      repository creates must be protected *and* reachable — and why a loud failure is
      being caught by a check anyway (design.md — the check decision). The existing "only
      missing RLS fails" paragraph is now wrong and must go, not be appended to.
- [x] 2.3 Add a fourth pattern collecting `grant <privileges> on public.<table> to
      … authenticated`, over the same per-table map the script already builds, and fail
      naming any table that is created, not dropped, and never granted. Verify by running
      `pnpm check:tables` before the migration exists: it must exit non-zero and name all
      five tables.
- [x] 2.4 Confirm the script still tolerates what the migrations actually contain: grants
      inside comments are ignored (comments are stripped already), `grant execute on
      function` is not mistaken for a table grant, and a table dropped and recreated is
      judged on the grants stated after the recreation. Verify by reading the script's
      output for all eight current migrations.
- [x] 2.5 Read each migration top to bottom rather than pattern by pattern, so a table
      dropped and recreated in one file is judged on what follows the recreation. Before
      this, every `drop` in a file was applied after every `create` in it, and such a table
      vanished from the check entirely — no report, and unable to fail either half.
      Pre-existing, inherited from `check-rls.mjs`, agreed mid-apply. Verified against
      synthetic migrations covering all three orderings, plus the bulk-grant and
      misspelled-table cases.

## 3. The migration

- [x] 3.1 Write `supabase/migrations/<timestamp>_data_api_grants.sql` granting
      `authenticated` exactly the operations each table has policies for: `trips`
      `select, update`; `trip_members` `select, insert, update`; `cities`, `markers` and
      `marker_interest` `select, insert, update, delete`. Verify each line against the
      policies in `20260803023541_initial_schema.sql` and
      `20260821120000_create_trip_and_invite.sql`.
- [x] 3.2 Add `revoke all on public.<table> from anon` for the five tables, with a comment
      saying nothing in this product is readable without a session and that the absence is
      stated rather than left to be inferred.
- [x] 3.3 Write the migration's header comment the way the others in this repository are
      written: what the file does, why grants live beside policies, and the sentence that
      explains why there is no `alter default privileges` here.
- [x] 3.4 `pnpm check:tables` now passes, naming all five tables as both protected and
      reachable.

## 4. Take the hosted database down to what the repository says

- [x] 4.1 Revoke every privilege on the five tables from `authenticated` and `anon` on the
      linked project. This reproduces, on a real database, the state a database built from
      these migrations is in. No rows are touched.
- [x] 4.2 Read the privileges back and confirm the five tables now grant nothing to either
      role. *No rows: neither `authenticated` nor `anon` holds any privilege on any of the
      five tables.*
- [x] 4.3 Probe as `authenticated` with the rolled-back `do $$ … raise exception
      'RESULT: %' … $$` shape from `AGENTS.md`: a select on each of the five tables must
      fail with `permission denied`. This is the failure #203 describes.

      ```
      RESULT: select as authenticated -> trips=DENIED  trip_members=DENIED
              cities=DENIED  markers=DENIED  marker_interest=DENIED
      ```
- [x] 4.4 Open the web application against this database and confirm it is unusable —
      the trip list cannot load. *The app renders one message on an empty screen:
      "Could not load your trips." This is what a fresh database does today.*

## 5. Let the migration put it back

- [x] 5.1 `pnpm db:push` to apply the migration to the linked project. Verify it reports
      the migration applied.
- [x] 5.2 Read the privileges back. `authenticated` must hold exactly what the migration
      states, and `anon` must hold nothing at all.

      ```
      authenticated  cities           DELETE, INSERT, SELECT, UPDATE
      authenticated  marker_interest  DELETE, INSERT, SELECT, UPDATE
      authenticated  markers          DELETE, INSERT, SELECT, UPDATE
      authenticated  trip_members     INSERT, SELECT, UPDATE
      authenticated  trips            SELECT, UPDATE
      ```

      *`anon` returns no rows at all. Note this is narrower than the baseline in 1.1 in
      two ways beyond the grants themselves: the surplus `REFERENCES`, `TRIGGER` and
      `TRUNCATE` are gone, and so are `trips` insert/delete and `trip_members` delete,
      none of which any policy allowed. The hosted database now holds exactly what the
      migrations state.*
- [x] 5.3 Probe as `authenticated` again: every operation the migration grants is
      permitted, on all five tables. Probe as `anon`: every table refuses. Each statement
      is written to affect no rows, so it tests the privilege rather than the policy.
      Upper case = permitted, lower case = `permission denied`.

      ```
      AUTHENTICATED: trips[SiUd] trip_members[SIUd] cities[SIUD] markers[SIUD] marker_interest[SIUD]
      ANON:          trips[siud] trip_members[siud] cities[siud] markers[siud] marker_interest[siud]
      ```

      *Exactly the migration: `trips` refuses insert and delete, `trip_members` refuses
      delete, and `anon` reaches nothing.*
- [x] 5.4 Probe that `create_trip` still works for a signed-in account, since `trips` has
      no insert grant and the definer function is the only route in.

      ```
      RESULT: create_trip -> made c2d79c80-… and the creator can read it back: 1 row(s)
      ```

      *Rolled back; `select count(*) … where name = 'Grant probe, rolled back'` returns 0.*
- [x] 5.5 Use the web application end to end. *Dropped a place ("Grant check — delete
      me"), marked "Want to go", marked it visited, removed it; created a city ("Grant
      check city") and removed it. That is insert/update/delete on `markers`, insert on
      `marker_interest`, insert/delete on `cities`, and reads of all five. No permission
      failure and no console error at any point; all test data verified gone afterwards.
      `create_trip` was left to the rolled-back probe in 5.4 rather than leaving an
      archivable-but-undeletable trip behind.*
- [x] 5.6 Do the same on the phone, including capture and the details sheet. Both
      applications read the same tables but not always the same columns.

      *Reads verified; writes accepted as covered, on the user's call. The installed
      build on the booted simulator was launched against the
      same database: it loads the trip, the city selector and every place, with tiles and
      attribution — so the phone's reads are confirmed. Its writes were not exercised,
      because driving the simulator needs a desktop automation driver that is not
      installed here and installing one for three taps was not worth it. The write
      privileges are proven twice over by 5.3 and 5.5, and this change contains no mobile
      code, so the phone exercises the same privileges through the same shared data
      package that the web run and the probes already proved. The user chose to accept
      that rather than install a driver to tap three buttons.*

## 6. Write the rule down

- [x] 6.1 Add a gotcha to `AGENTS.md`, beside the two `SECURITY DEFINER` entries: row-level
      security decides which rows, the grant decides whether the table can be addressed at
      all, they are a pair stated in the same migration, and the shape of the failure — a
      table that is correctly protected and reachable by nobody, which reads as a broken
      query and never is. Name `check:tables` as what catches it.
- [x] 6.2 Update the `README.md` line describing the check so it says what the check now
      does.
- [x] 6.3 `openspec validate grants-in-migrations --strict` passes.
- [x] 6.4 `pnpm verify` green. `check:unarchived` fails until the
      change is archived, so it was run last; every other step is green — check:cycles,
      check:openspec-workflows, check:duplicate-deps, check:account-menu, check:fonts,
      check:tokens, check:icons, check:tables, check:specs, openspec doctor, lint,
      lint:mobile, typecheck, typecheck:mobile, typecheck:packages, test, build.
