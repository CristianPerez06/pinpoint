#!/usr/bin/env node
/**
 * Every table this repository creates must have row-level security enabled by
 * the end of the migration history.
 *
 * The failure this exists for is silent and total. Postgres tables are readable
 * by default, and Supabase hands every signed-in browser a key that speaks
 * directly to the database — so a migration that creates a table and forgets
 * `enable row level security` ships a table any account can read and write in
 * full. Nothing catches it: the application still works, the tests still pass,
 * and the only symptom is data being available to people who should not have it.
 * There is no error to notice.
 *
 * That is the whole reason auth and the schema were sequenced first in this
 * project — so every policy was written once against a real authenticated user
 * rather than permissively and tightened later. This check is what keeps the
 * fifth table from being the exception.
 *
 * **Only missing RLS fails.** A table with RLS enabled and no policies is also
 * wrong, but it fails loudly — it denies everything, so the feature using it
 * visibly breaks the first time anybody opens it. Policy counts are printed
 * because they are useful to see, not because zero is a build failure.
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

/** `public` only. The `auth` and `storage` schemas belong to Supabase. */
const CREATE = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.("?)(\w+)\1/gi
const DROP = /drop\s+table\s+(?:if\s+exists\s+)?public\.("?)(\w+)\1/gi
const ENABLE =
  /alter\s+table\s+(?:only\s+)?public\.("?)(\w+)\1\s+enable\s+row\s+level\s+security/gi
const POLICY = /create\s+policy\s+[\s\S]*?\son\s+public\.("?)(\w+)\1/gi

const files = readdirSync(MIGRATIONS)
  .filter((name) => name.endsWith('.sql'))
  // Supabase names migrations with a sortable timestamp prefix, so this is the
  // order they are applied in — which matters, because a table can be created
  // in one migration and secured in a later one.
  .sort()

if (files.length === 0) {
  console.error(`\nRLS check failed:\n\n  No migrations found under ${MIGRATIONS}.`)
  process.exit(1)
}

/** table name -> the migration that created it. Dropped tables are removed. */
const created = new Map()
const secured = new Map()
const policies = new Map()

for (const file of files) {
  const sql = withoutComments(readFileSync(join(MIGRATIONS, file), 'utf8'))

  for (const [, , table] of sql.matchAll(CREATE)) {
    if (!created.has(table)) created.set(table, file)
  }
  for (const [, , table] of sql.matchAll(DROP)) {
    created.delete(table)
    secured.delete(table)
    policies.delete(table)
  }
  for (const [, , table] of sql.matchAll(ENABLE)) {
    if (!secured.has(table)) secured.set(table, file)
  }
  for (const [, , table] of sql.matchAll(POLICY)) {
    policies.set(table, (policies.get(table) ?? 0) + 1)
  }
}

console.log(`Checked ${files.length} migration${files.length === 1 ? '' : 's'}:\n`)

const problems = []

for (const [table, file] of [...created].sort()) {
  const count = policies.get(table) ?? 0
  const on = secured.has(table)

  console.log(
    `  public.${table}\n` +
      `    row level security: ${on ? 'enabled' : 'NOT ENABLED'}` +
      `   policies: ${count}` +
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
}

/**
 * A table secured but never created is a typo in the table name, and it is
 * worth catching: the `alter` succeeds against nothing in a fresh database only
 * if the name exists, so this usually means the protection was aimed at a table
 * that is not the one that needs it.
 */
for (const [table, file] of [...secured].sort()) {
  if (!created.has(table)) {
    problems.push(
      `${file} enables row level security on public.${table}, which no migration creates. ` +
        `Most likely a misspelled table name, which means some other table is unprotected.`,
    )
  }
}

if (problems.length > 0) {
  console.error('\nRLS check failed:\n')
  for (const problem of problems) console.error(`  - ${problem}\n`)
  process.exit(1)
}

console.log(
  `\nAll ${created.size} table${created.size === 1 ? '' : 's'} have row level security enabled.`,
)
