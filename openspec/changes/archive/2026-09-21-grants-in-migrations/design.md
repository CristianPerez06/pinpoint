## Context

See `proposal.md` — Why. The state this works from:

- Eight migrations, five tables (`trips`, `trip_members`, `cities`, `markers`,
  `marker_interest`), every one with row-level security enabled and policies written
  `to authenticated`.
- Two `grant` statements in the whole repository, both `grant execute` on
  `create_trip`. No table grant anywhere.
- The hosted database holds table grants that no migration created. Local Supabase, which
  already defaults to the new behaviour, does not — replaying the migrations there gives a
  database that answers `permission denied for table trips`.
- Every primary key is a `uuid` default, so there are no sequences to grant.
- The `SECURITY DEFINER` functions (`create_trip`, `claim_trip_memberships`, the
  `is_*` policy helpers) run as their owner, which owns the tables, so they are unaffected
  by what the caller holds. Function execute comes from Postgres' own default of granting
  `execute` to `public`, which is not what Supabase changed. Functions are out of scope.

## Goals / Non-Goals

**Goals:**

- A database built by replaying these migrations alone is usable by both applications.
- Running the new migration against the hosted database changes nothing.
- The pair — a table's policies and the permission to address the table — is legible in
  one place, so the next migration that adds a table states both.

**Non-Goals:**

- No change to any policy, to what any account may see, or to any application code.
- No check that needs a database. The one added here reads the SQL as text, like the
  check it extends.
- No `anon` access of any kind, now or as a stepping stone.
- Not repairing the hosted database, which already holds what this states.

## Decisions

### The grants are per table, stated explicitly

A single `alter default privileges … grant … on tables to authenticated` would cover the
five tables and every future one in one line. Rejected.

A default is precisely the mechanism that produced this bug: a fact about what the
database permits that lives in the database and in no file. Worse, it inverts the failure.
Today a table whose migration forgot its permission is unreachable — loud, immediate, and
safe. Under a default, a table whose migration forgot *row-level security* would be
readable in full by every signed-in account from the moment it existed — silent, and the
opposite of safe. The `trips` specification already treats a table without row-level
security as the serious failure; a default trades the harmless failure for that one.

Explicit costs one line per table and fails in the only direction this product can afford.

### Each grant mirrors that table's policies

The grant for a table names exactly the operations that table has a policy for:

| table | granted to `authenticated` | why not more |
| --- | --- | --- |
| `trips` | `select, update` | no insert policy — trips are created by `create_trip`, which runs as its definer; no delete policy |
| `trip_members` | `select, insert, update` | no delete policy — removing somebody from a trip is #51, not built |
| `cities` | `select, insert, update, delete` | — |
| `markers` | `select, insert, update, delete` | — |
| `marker_interest` | `select, insert, update, delete` | — |

The alternative is granting all four everywhere and letting the policies do the refusing,
which is equally safe — a grant without a policy permits nothing. It is rejected because
it is untrue: it would say a member may delete a trip when no policy allows it, and the
next reader has to check the policies to find out that the grant means nothing. Mirroring
makes the grant a readable summary of the table, and makes a mismatched pair visible.

The cost is that adding a policy later means adding to the grant. That is the same
obligation as the one being written down, in the same file, one line apart.

### `anon` is granted nothing, and the migration says so

Rather than leaving `anon` unmentioned, the migration carries an explicit
`revoke all on … from anon` and a comment. The two are not the same: unmentioned means
whoever reads it next has to work out whether it was decided or forgotten. The `trips`
specification settles the behaviour — a request with no session reaches no row — so there
is nothing to decide, only something to record.

This makes a signed-out request to a table fail outright rather than return an empty list.
Neither application ever makes one: both gate on a session before any read. The `trips`
scenario is reworded accordingly.

### `check:rls` is extended to grants, and renamed

`.github/scripts/check-rls.mjs` already reads every migration as text, strips comments,
and builds a per-table map of what each migration did — created, dropped, secured,
policies counted. Adding "and was granted to `authenticated`" is a fourth pattern over
the same map. It needs no database, so it runs in `pnpm verify` and in CI on every pull
request, which is the property the script's own header calls out as the reason it parses
text in the first place.

#203 reasoned that a check was not worth it because `pnpm verify` has no database. That
premise is wrong — this failure is visible in the files.

The counter-argument is the script's own stated rule: only the *silent* failure fails the
build. A table with policies and no grant denies everything, which is loud. But it was
loud for eight migrations and nobody heard it, because the hosted database was quietly
covering for the repository and nobody runs a local one. "Loud" only helps when somebody
is in the room; this one shouts on a laptop nobody has booted.

**Renamed.** The script will assert two things about every table, and `check:rls` names
one of them. This repository has been bitten twice by a name pointing at the wrong axis —
a colour token described by how it should feel, and a store chosen because its name
sounded stronger — so the name moves with the job: `check:tables`, over
`.github/scripts/check-tables.mjs`. Five live references (`package.json` twice,
`README.md`, `.github/workflows/ci.yml`, `.github/PULL_REQUEST_TEMPLATE.md`); archived
change records mention the old name and stay as they are, being history.

**What it fails on.** A table that is created, not dropped, and never appears in a grant
to `authenticated`. It does not try to check that the grant matches the policies: the
mirroring above is a convention for readers, and a script inferring intent from policy
counts would be guessing. It also says nothing about `anon`, since granting `anon`
something is not a thing anybody does by accident — it has to be typed.

### One new migration, no existing file edited

The grants could be inserted into `20260803023541_initial_schema.sql` beside the policies
they belong with, which is where they would have gone. Rejected: editing an applied
migration means the file no longer describes what the hosted database was built from, and
`supabase db reset` and the hosted project diverge in their history. A new migration at
the end is the only form that is true in both places.

The habit that keeps future tables right is `AGENTS.md` plus the `trips` requirement, not
the position of this one file.

## Risks / Trade-offs

- **The migration is not the no-op it claims to be against the hosted database** →
  verified rather than assumed: read the privileges the hosted database currently holds for
  `authenticated` on the five tables before applying, and confirm the set afterwards is the
  same. `grant` on a privilege already held is defined to change nothing; the check is that
  the *before* set is not narrower than what the migration states.
- **The mirrored grants are narrower than the automatic ones the hosted database holds**
  → this is real: `trips` currently permits `insert` and `delete` at the grant level with
  no policy allowing either, and this migration does not revoke them. It states what is
  needed and leaves the surplus alone, because revoking on a live database is a change with
  a failure mode, and the policies already refuse. A database built fresh will simply not
  have the surplus. The two converge on behaviour, not on grants.
- **A future table is added and nobody grants it** → `check:tables` fails on the pull
  request. Behind that, the written rule and a local database that now works.
- **Something in the product turns out to read while signed out** → it would now be
  refused rather than empty. Both applications gate on a session, and the probe below reads
  each table as `anon` to confirm what happens.

## Migration Plan

The proof has to come from a database holding only what the migrations say, and the
hosted database is the one database that cannot supply it — it already holds grants
Supabase issued automatically when the project was created, so the migration runs there
as a no-op whether or not it is correct. A green run against it is not evidence.

A local Supabase would supply it, and originally did. Chosen instead, because this is a
single-user development database and starting Docker to prove something about a database
that is right there is ceremony: **strip the automatic grants from the hosted database,
watch both applications fail, then let the migration put back exactly what it states.**
Same evidence, no container, and no data touched — `revoke` and `grant` move privileges,
not rows.

It also settles the surplus. The hosted database currently permits `insert`, `delete`,
`references`, `trigger` and `truncate` on every one of the five tables, to `anon` as well
as to `authenticated`, none of which any policy allows. The original plan left that alone
as a change with a failure mode. Stripping first removes it as a side effect, and the
hosted database ends up holding exactly what the migrations state rather than a superset
nobody wrote down.

1. Record what the hosted database permits today for `authenticated` and `anon` on the
   five tables, so both the strip and the restore are measured rather than claimed.
2. Extend and rename the check first, and watch it fail naming all five tables. A check
   that has never been seen failing is a check nobody has tested.
3. Add the migration; the check passes.
4. Revoke every privilege on the five tables from `authenticated` and `anon`. Confirm by
   reading the privileges back, by probing as `authenticated` with the rolled-back
   `do $$ … raise exception 'RESULT: %' … $$` shape from `AGENTS.md`, and by opening both
   applications: this is the state a database built from the repository is in, and
   nothing works.
5. Apply the migration with `supabase db push`. Read the privileges back — they must now
   be exactly what the migration states, `anon` holding nothing — probe again, and use
   both applications end to end.

Rollback, if anything goes wrong between steps 4 and 5, is the migration itself: it is
the complete statement of what these tables need, so applying it is the repair.
