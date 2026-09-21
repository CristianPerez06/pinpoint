#!/usr/bin/env node
/**
 * Every table this repository creates must end the migration history both
 * **protected** — row-level security enabled — and **reachable** — granted to
 * `authenticated`. They are a pair, and they fail in opposite directions.
 *
 * Forgetting row-level security is the silent one. Postgres tables are readable
 * by default, and Supabase hands every signed-in browser a key that speaks
 * directly to the database — so a migration that creates a table and forgets
 * `enable row level security` ships a table any account can read and write in
 * full. Nothing catches it: the application still works, the tests still pass,
 * and the only symptom is data being available to people who should not have
 * it. There is no error to notice.
 *
 * That is the whole reason auth and the schema were sequenced first in this
 * project — so every policy was written once against a real authenticated user
 * rather than permissively and tightened later. This check is what keeps the
 * fifth table from being the exception.
 *
 * Forgetting the grant is the loud one, and it is here anyway. Row-level
 * security decides which rows an account may see; it does not decide whether
 * the account may address the table at all. A table with policies and no grant
 * denies everything, which ought to be impossible to miss — and it was missed
 * for eight migrations, because the hosted database held grants that Supabase
 * issued automatically when the project was created and that no migration ever
 * stated. The repository was wrong and nobody was in the room to hear it: the
 * only database that disagreed was a local one nobody starts. Supabase stopped
 * issuing those grants on 30 October 2026, so the next table added without one
 * is unreachable everywhere. "It fails loudly" is only a defence when somebody
 * is listening.
 *
 * **A table with RLS enabled and no policies is still not a build failure.**
 * It is wrong, but it breaks visibly for whoever opens the feature, and unlike
 * the grant there is no second database quietly covering for it. Policy counts
 * are printed because they are useful to see, not because zero fails.
 *
 * Reads the SQL as text rather than connecting to anything. A check that needs
 * a database is a check that does not run in CI, and this one has to run on
 * every pull request.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MIGRATIONS = join(ROOT, 'supabase', 'migrations')

/**
 * Comments are stripped first so that a `create table` inside one does not
 * invent a table nobody made — these migrations explain themselves at length,
 * and the explanations quote SQL.
 */
function withoutComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
}

/**
 * `public` only. The `auth` and `storage` schemas belong to Supabase.
 *
 * One alternation rather than five separate scans, so that the statements come
 * back in the order they are written. That matters for exactly one shape: a
 * migration that drops a table and creates it again in the same file. Scanned
 * pattern by pattern, every `drop` in the file was applied after every `create`
 * in it, and the table came out the far end having never existed — absent from
 * the report, and unable to fail either half of this check. No migration here
 * does that yet, and a check whose answer depends on which order somebody wrote
 * two statements in is not one worth relying on.
 */
const STATEMENT = new RegExp(
  [
    /(?<create>create\s+table\s+(?:if\s+not\s+exists\s+)?public\.("?)(?<createName>\w+)\2)/,
    /(?<drop>drop\s+table\s+(?:if\s+exists\s+)?public\.("?)(?<dropName>\w+)\4)/,
    /(?<enable>alter\s+table\s+(?:only\s+)?public\.("?)(?<enableName>\w+)\6\s+enable\s+row\s+level\s+security)/,
    /(?<policy>create\s+policy\s+[\s\S]*?\son\s+public\.("?)(?<policyName>\w+)\8)/,
    /(?<grant>\bgrant\s+(?<granted>[\s\S]*?)\s+to\s+(?<grantees>[^;]+);)/,
  ]
    .map((part) => part.source)
    .join('|'),
  'gi',
)

/**
 * A grant is matched as a whole `grant … to …;` statement and split at ` to `
 * into what is being granted and who to. Taking the statement in one piece is
 * what lets the forms this file does not care about — `grant execute on
 * function`, `grant usage on schema` — be recognised and dropped, rather than
 * having their `public.name` mistaken for a table.
 */

/** `select, insert on public.markers` -> `select, insert`. */
const PRIVILEGES = /^([\s\S]*?)\s+on\s+/i

/** Every `public.<name>` inside the granted clause. A grant may name several. */
const GRANTED_TABLE = /public\.("?)(\w+)\1/gi

const files = readdirSync(MIGRATIONS)
  .filter((name) => name.endsWith('.sql'))
  // Supabase names migrations with a sortable timestamp prefix, so this is the
  // order they are applied in — which matters, because a table can be created
  // in one migration and secured in a later one.
  .sort()

if (files.length === 0) {
  console.error(`\nTable check failed:\n\n  No migrations found under ${MIGRATIONS}.`)
  process.exit(1)
}

/** table name -> the migration that created it. Dropped tables are removed. */
const created = new Map()
const secured = new Map()
const policies = new Map()
/** table name -> the privileges most recently granted to `authenticated`. */
const granted = new Map()
/** Bulk grants, which cover the tables without naming them. See below. */
const bulk = []

for (const file of files) {
  const sql = withoutComments(readFileSync(join(MIGRATIONS, file), 'utf8'))

  for (const { groups } of sql.matchAll(STATEMENT)) {
    if (groups.create) {
      if (!created.has(groups.createName)) created.set(groups.createName, file)
      continue
    }

    if (groups.drop) {
      const table = groups.dropName
      created.delete(table)
      secured.delete(table)
      policies.delete(table)
      // Dropping a table drops its grants with it, so a table that comes back
      // has to be granted again. `20260915120000_trip_and_marker_dates.sql`
      // says the same thing about the function it recreates.
      granted.delete(table)
      continue
    }

    if (groups.enable) {
      if (!secured.has(groups.enableName)) secured.set(groups.enableName, file)
      continue
    }

    if (groups.policy) {
      const table = groups.policyName
      policies.set(table, (policies.get(table) ?? 0) + 1)
      continue
    }

    const { granted: what, grantees: who } = groups
    if (!/\bauthenticated\b/i.test(who)) continue
    // Functions and schemas are granted too, and neither is a table.
    if (/\bon\s+(function|schema|sequence|routine|procedure)\b/i.test(what)) continue

    if (/\ball\s+tables\s+in\s+schema\b/i.test(what)) {
      bulk.push({ file, what: what.replace(/\s+/g, ' ').trim() })
      continue
    }

    const privileges = (what.match(PRIVILEGES)?.[1] ?? what).replace(/\s+/g, ' ').trim()
    for (const [, , table] of what.matchAll(GRANTED_TABLE)) {
      granted.set(table, privileges.toLowerCase())
    }
  }
}

console.log(`Checked ${files.length} migration${files.length === 1 ? '' : 's'}:\n`)

const problems = []
/**
 * Held back rather than reported directly, because a bulk grant below makes
 * every one of them a lie — the tables really are granted, just not by name.
 * With one in the history, the bulk grant is the only thing worth saying.
 */
const ungranted = []

for (const [table, file] of [...created].sort()) {
  const count = policies.get(table) ?? 0
  const on = secured.has(table)
  const grant = granted.get(table)

  console.log(
    `  public.${table}\n` +
      `    row level security: ${on ? 'enabled' : 'NOT ENABLED'}` +
      `   policies: ${count}\n` +
      `    granted to authenticated: ${grant ?? 'NOTHING'}` +
      `   created in: ${file}`,
  )

  if (!on) {
    problems.push(
      `public.${table} is created in ${file} and never has row level security enabled. ` +
        `Every signed-in browser holds a key that reaches this table directly, so it is ` +
        `readable and writable by any account — and nothing about that fails, throws, or ` +
        `looks wrong. Add "alter table public.${table} enable row level security;" and the ` +
        `policies that say who may do what.`,
    )
  }

  if (!grant) {
    ungranted.push(
      `public.${table} is created in ${file} and never granted to authenticated. Row ` +
        `level security decides which rows an account may see; it does not let the ` +
        `account address the table at all. Until something grants it, every read and ` +
        `write of this table fails with "permission denied for table ${table}" — in the ` +
        `hosted database as well as locally, because Supabase no longer issues these ` +
        `grants automatically for tables created from 30 October 2026. Add "grant <the ` +
        `operations this table has policies for> on public.${table} to authenticated;" ` +
        `beside those policies.`,
    )
  }
}

/**
 * A secured or granted table that is never created is a typo in the table name,
 * and it is worth catching: aimed at a table that is not the one that needs it,
 * the protection or the grant silently does nothing for the table that does.
 */
for (const [table, file] of [...secured].sort()) {
  if (!created.has(table)) {
    problems.push(
      `${file} enables row level security on public.${table}, which no migration creates. ` +
        `Most likely a misspelled table name, which means some other table is unprotected.`,
    )
  }
}

for (const table of [...granted.keys()].sort()) {
  if (!created.has(table)) {
    problems.push(
      `A migration grants public.${table} to authenticated, and no migration creates it. ` +
        `Most likely a misspelled table name, which means some other table is unreachable.`,
    )
  }
}

if (bulk.length === 0) problems.push(...ungranted)

/**
 * `grant … on all tables in schema public` would satisfy the rule above without
 * naming anything, so it is refused rather than accepted quietly — otherwise
 * the tables below would each be reported as ungranted by a check that had just
 * read the statement granting them, which is a worse failure than none.
 *
 * The objection to the bulk form is not that it is hard to parse. A grant that
 * does not name its table is a grant nobody reads next to the policies it
 * belongs with, and this repository has already paid once for a permission that
 * lived somewhere no file mentioned.
 */
for (const { file, what } of bulk) {
  problems.push(
    `${file} grants "${what}" to authenticated. Grant each table by name, beside its own ` +
      `row level security and policies, so that what a table permits can be read in the ` +
      `migration that creates it. A grant covering tables it does not name is how the ` +
      `permissions in this database came to be written down nowhere.`,
  )
}

if (problems.length > 0) {
  console.error('\nTable check failed:\n')
  for (const problem of problems) console.error(`  - ${problem}\n`)
  process.exit(1)
}

console.log(
  `\nAll ${created.size} table${created.size === 1 ? '' : 's'} have row level security ` +
    `enabled and are granted to authenticated.`,
)
