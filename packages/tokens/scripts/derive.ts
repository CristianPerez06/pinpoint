/**
 * Derives the platform representations from the authoritative token modules.
 *
 * Run with `pnpm --filter @pinpoint/tokens derive`. CI runs it and fails on a
 * diff, because "derived" without that check degrades to "was derived once".
 *
 * Direction is one way and only one way: this reads the modules in `src/` and
 * writes into `src/generated/`. Nothing recovers a token by parsing the
 * generated stylesheet — parsing CSS is lossy and fails silently on input it
 * did not anticipate, which is why the spec forbids it rather than discouraging
 * it.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  BASEMAP_COLOUR,
  COLOUR,
  MARKER_TYPE_COLOURS,
  MARKER_FOREGROUND,
  type Themed,
  type ThemeMode,
} from '../src/colour'
import { ELEVATION } from '../src/elevation'
import {
  MARKER_BADGE_SIZE,
  MARKER_GLYPH_SIZE,
  MARKER_SIZE,
  RADIUS,
  SPACE,
} from '../src/layout'
import { FONT_FAMILY, TYPE } from '../src/type'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'src', 'generated')

const MODES: readonly ThemeMode[] = ['light', 'dark']

/* ── validation ─────────────────────────────────────────────────────────────
   The two failures worth failing the build over, rather than emitting and
   finding out by looking at pixels. */

const HEX = /^#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/

/**
 * Notations a browser resolves and native does not. Each one produces an
 * element that occupies correct layout space and renders nothing — invisible to
 * typechecking, to linting, and to every test that does not inspect pixels.
 */
const HOST_RESOLVED = /var\(|color-mix\(|rgba?\(|hsla?\(|currentColor|inherit/i

const problems: string[] = []

function checkThemed(path: string, token: Themed): void {
  for (const mode of MODES) {
    const value: unknown = token[mode]
    if (typeof value !== 'string' || value.length === 0) {
      problems.push(`${path}.${mode} is missing — every colour is defined for both grounds`)
      continue
    }
    if (HOST_RESOLVED.test(value)) {
      problems.push(`${path}.${mode} is "${value}", which the host resolves; native renders nothing`)
      continue
    }
    if (!HEX.test(value)) {
      problems.push(`${path}.${mode} is "${value}", which is not a hex literal`)
    }
  }
}

function checkGroup(name: string, group: Record<string, Themed>): void {
  for (const [key, token] of Object.entries(group)) checkThemed(`${name}.${key}`, token)
}

checkGroup('COLOUR', COLOUR)
checkGroup('BASEMAP_COLOUR', BASEMAP_COLOUR)
checkGroup('MARKER_TYPE_COLOURS', MARKER_TYPE_COLOURS)
checkThemed('MARKER_FOREGROUND', MARKER_FOREGROUND)
for (const [level, value] of Object.entries(ELEVATION)) {
  checkThemed(`ELEVATION.${level}.colour`, value.colour)
}

if (problems.length > 0) {
  console.error('Token derivation refused to emit:\n')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('\nNothing was written.')
  process.exit(1)
}

/* ── the native representation ──────────────────────────────────────────── */

function resolve(group: Record<string, Themed>, mode: ThemeMode) {
  return Object.fromEntries(
    Object.entries(group).map(([key, token]) => [key, token[mode]]),
  )
}

function themeObject(mode: ThemeMode) {
  return {
    mode,
    colour: resolve(COLOUR, mode),
    basemap: resolve(BASEMAP_COLOUR, mode),
    markerType: resolve(MARKER_TYPE_COLOURS, mode),
    markerForeground: MARKER_FOREGROUND[mode],
    elevation: Object.fromEntries(
      Object.entries(ELEVATION).map(([level, value]) => [
        level,
        { colour: value.colour[mode], offsetY: value.offsetY, blur: value.blur },
      ]),
    ),
  }
}

const GENERATED_TS = `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Written by packages/tokens/scripts/derive.ts from the modules in ../. Any
 * edit here is lost the next time that script runs, and CI fails on the diff
 * before it gets the chance.
 *
 * This is the native representation: both themes, already flattened to one
 * ground's literals, because a React Native StyleSheet wants "#FBFAF8" and not
 * a pair to choose from. Every value is a literal — nothing here is resolved by
 * a host.
 */

export interface ThemeElevation {
  readonly colour: string
  readonly offsetY: number
  readonly blur: number
}

export interface Theme {
  readonly mode: 'light' | 'dark'
  readonly colour: Readonly<Record<${Object.keys(COLOUR).map((k) => `'${k}'`).join(' | ')}, string>>
  readonly basemap: Readonly<Record<${Object.keys(BASEMAP_COLOUR).map((k) => `'${k}'`).join(' | ')}, string>>
  readonly markerType: Readonly<Record<${Object.keys(MARKER_TYPE_COLOURS).map((k) => `'${k}'`).join(' | ')}, string>>
  readonly markerForeground: string
  readonly elevation: Readonly<Record<${Object.keys(ELEVATION).map((k) => `'${k}'`).join(' | ')}, ThemeElevation>>
}

export const LIGHT: Theme = ${JSON.stringify(themeObject('light'), null, 2)}

export const DARK: Theme = ${JSON.stringify(themeObject('dark'), null, 2)}
`

/* ── the web representation ─────────────────────────────────────────────── */

const px = (n: number) => `${n}px`

function customProperties(mode: ThemeMode): string {
  const lines: string[] = []

  lines.push('  /* surfaces and ink */')
  for (const [key, token] of Object.entries(COLOUR)) {
    lines.push(`  --pp-${kebab(key)}: ${token[mode]};`)
  }

  lines.push('', '  /* the basemap, patched to share this ground */')
  for (const [key, token] of Object.entries(BASEMAP_COLOUR)) {
    lines.push(`  --pp-map-${kebab(key)}: ${token[mode]};`)
  }

  /* `--pp-pin-*` rather than `--pp-type-*`: the typography scale already owns
     that prefix (`--pp-type-body-size`), and two unrelated things under one
     namespace is how a stylesheet becomes unreadable. These colour a pin. */
  lines.push('', '  /* marker types — fixed by the product, not by the palette */')
  for (const [key, token] of Object.entries(MARKER_TYPE_COLOURS)) {
    lines.push(`  --pp-pin-${key}: ${token[mode]};`)
  }
  lines.push(`  --pp-marker-foreground: ${MARKER_FOREGROUND[mode]};`)

  lines.push('', '  /* elevation, composed — CSS wants one string */')
  for (const [level, value] of Object.entries(ELEVATION)) {
    lines.push(
      `  --pp-shadow-${level}: 0 ${px(value.offsetY)} ${px(value.blur)} ${value.colour[mode]};`,
    )
  }

  return lines.join('\n')
}

function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}

/** Single-valued tokens. Nothing about a spacing step changes with the ground. */
function invariantProperties(): string {
  const lines: string[] = []

  lines.push('  /* spacing */')
  for (const [key, value] of Object.entries(SPACE)) lines.push(`  --pp-space-${key}: ${px(value)};`)

  lines.push('', '  /* radii */')
  for (const [key, value] of Object.entries(RADIUS)) {
    lines.push(`  --pp-radius-${key}: ${key === 'pill' ? '999px' : px(value)};`)
  }

  lines.push('', '  /* the marker pin */')
  lines.push(`  --pp-marker-width: ${px(MARKER_SIZE.width)};`)
  lines.push(`  --pp-marker-height: ${px(MARKER_SIZE.height)};`)
  lines.push(`  --pp-marker-glyph: ${px(MARKER_GLYPH_SIZE)};`)
  lines.push(`  --pp-marker-badge: ${px(MARKER_BADGE_SIZE)};`)

  lines.push('', '  /* type */')
  lines.push(`  --pp-font: '${FONT_FAMILY}', ui-sans-serif, system-ui, sans-serif;`)
  for (const [role, spec] of Object.entries(TYPE)) {
    const name = kebab(role)
    lines.push(`  --pp-type-${name}-size: ${px(spec.size)};`)
    lines.push(`  --pp-type-${name}-weight: ${spec.weight};`)
    lines.push(`  --pp-type-${name}-tracking: ${spec.letterSpacing}em;`)
    lines.push(`  --pp-type-${name}-leading: ${spec.lineHeight};`)
  }

  return lines.join('\n')
}

const GENERATED_CSS = `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Written by packages/tokens/scripts/derive.ts from the modules in ../. Any
 * edit here is lost the next time that script runs, and CI fails on the diff
 * before it gets the chance.
 *
 * This is the web representation. A browser theme belongs in the cascade rather
 * than in JavaScript, so both grounds are declared here and the media query
 * chooses — components reference the properties and never import a colour, and
 * a theme change repaints without re-rendering a tree.
 *
 * These custom properties are for web only. A value the host resolves is
 * exactly what native cannot render, which is why the native representation
 * beside this one carries literals instead.
 */

:root {
${invariantProperties()}

${customProperties('light')}
}

@media (prefers-color-scheme: dark) {
  :root {
${customProperties('dark')
  .split('\n')
  .map((line) => (line === '' ? '' : `  ${line}`))
  .join('\n')}
  }
}
`

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'native.ts'), GENERATED_TS)
writeFileSync(join(OUT, 'tokens.css'), GENERATED_CSS)

console.log(`Derived 2 representations into ${OUT}`)
