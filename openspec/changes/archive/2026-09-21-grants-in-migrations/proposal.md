## Why

A database built from this repository alone cannot be read by either application. Nothing
in the eight migrations gives the applications permission to read or write any table, so a
fresh database answers every query with `permission denied for table trips`. The live
database works only because it was created back when Supabase handed that permission out
automatically — a fact that lives in the hosted project and is written down nowhere here.

That automatic hand-out stops on 30 October 2026. Existing tables keep what they already
have, so nothing breaks for anyone using the product; but from then on **a table added by a
new migration is reachable by nobody** until something grants it, in the live database as
well as on a laptop. The next change to the data model is the one that meets it.

## What Changes

- **Nothing changes for the person using the app.** This is the repository catching up to
  what the live database already does.
- A new migration states, for each of the five existing tables, that the applications may
  read and write it — beside the security rules those tables already carry. Against the
  live database this asks for permission it already has, which is a no-op; everywhere else
  it is the fix.
- The migration says explicitly that a visitor with no account gets nothing at all. The
  `trips` specification already settles this — nothing in the product is readable signed
  out — so the schema is being made to say out loud what is already true.
- The rule is written down in `AGENTS.md` and in the `trips` specification: a migration
  that creates a table states its permissions in the same file as its security rules. They
  are a pair. A table with security rules and no permission is locked to everyone; a table
  with permission and no security rules is open to everyone.
- The existing check that reads the migrations and fails when a table never gets its
  security switched on is extended to fail when a table never gets its permission either.
  It reads the files as text and needs no database, so it runs on every pull request like
  the rest of `pnpm verify`. It is renamed for what it now checks.

**Not doing:** no standing rule that grants every future table automatically. That is the
mechanism that caused this — a fact about the database that no file mentions — and it would
make a table whose migration forgot its security rules readable by every account from the
moment it exists. Explicit is three lines per table and fails loudly.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trips`: gains a requirement covering the other half of reaching a table — the
  applications' permission to address it at all, which row-level security does not give —
  so that a migration adding a table is obliged to state both. The existing row-level
  security requirement is carried forward unchanged except for one scenario: a request
  with no session is now refused outright rather than answered with an empty list, since
  the unauthenticated role is granted nothing.

## Impact

- `supabase/migrations/` — one new migration, no existing file edited.
- `AGENTS.md` — one gotcha, beside the existing `SECURITY DEFINER` entries.
- `.github/scripts/check-rls.mjs` and its command, renamed and extended.
- No application code, no packages, no dependencies.
- Sequence this before #156, the data-model change most likely to add a table.
