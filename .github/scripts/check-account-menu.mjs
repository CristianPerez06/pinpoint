#!/usr/bin/env node
/**
 * The web account menu must not carry a way to ask for a re-read.
 *
 * `data-freshness` puts the by-hand re-read on the map, where reload is not at
 * hand, and forbids it anywhere else. The account menu is where it kept landing
 * anyway, because a rare control looks like it belongs beside `Sign out` — and
 * a menu row is exactly the kind of thing nothing else checks. It was added in
 * #74, eighteen pull requests after the requirement forbidding it landed in
 * #56, and nothing caught it: it type-checked, it rendered, and it worked.
 *
 * Scoped to this one file on purpose. The application *does* carry a re-read
 * control now — on the map, below the phone breakpoint — so a check over the
 * whole of `apps/web` would have to encode which file is allowed one and would
 * fail on the change that added it. What is being prevented is specific: this
 * row coming back to this menu.
 *
 * A text check rather than anything cleverer, because the defect is textual: a
 * row is a glyph and a word, and the word is what somebody reads. Parsing the
 * component would be a stricter check of a thing that is not the risk.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const MENU = 'apps/web/app/_components/account-menu.tsx'

/**
 * What a re-read row would be called, in the words it would actually use.
 *
 * `RefreshCw` is lucide's name for the glyph such a row would carry, and it is
 * here because an icon import is the first thing to arrive and the easiest to
 * add without thinking. The rest are the words a person would see.
 */
const FORBIDDEN = [
  { pattern: /\bRefreshCw\b/, what: 'the refresh glyph' },
  { pattern: /\bRefreshing\b/i, what: 'a refreshing state' },
  { pattern: /['"`>\s]Refresh[<'"`\s]/, what: 'a Refresh row' },
  { pattern: /\breread\b/i, what: 'a re-read control' },
  { pattern: /\bre-read\b/i, what: 'a re-read control' },
]

/**
 * Comments are stripped before matching, and that is not a detail.
 *
 * The file's own comment says *"There is no `Refresh` row, and its absence is
 * the requirement"* — which is the most valuable sentence in it and the exact
 * thing the next person needs to read before adding one back. A check that
 * failed on the explanation would be a check whose only fix is deleting the
 * explanation.
 *
 * Crude on purpose: `//` inside a string literal would be treated as a comment.
 * That can only make this more lenient, never stricter, and nothing in a menu
 * component has a URL in it.
 */
function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')
}

let source
try {
  source = withoutComments(readFileSync(join(ROOT, MENU), 'utf8'))
} catch {
  console.error(`\nAccount menu check failed:\n`)
  console.error(
    `  - ${MENU} is missing. If the menu moved, move this check with it — the\n` +
      `    rule it guards did not move.\n`,
  )
  process.exit(1)
}

const found = FORBIDDEN.filter(({ pattern }) => pattern.test(source))

if (found.length > 0) {
  console.error(`\nAccount menu check failed:\n`)
  console.error(`  ${MENU} mentions:\n`)
  for (const { what } of found) console.error(`    - ${what}`)
  console.error(
    `\n  Asking for a re-read is a property of the screen being read, not of the\n` +
      `  account. \`data-freshness\` gives the control to the map, where the browser's\n` +
      `  own reload is not at hand, and forbids a second one anywhere else. See\n` +
      `  openspec/specs/data-freshness/spec.md — "A map shown on a phone-shaped\n` +
      `  screen offers a way to ask for a re-read".\n`,
  )
  process.exit(1)
}

console.log(`The web account menu carries no re-read row.`)
