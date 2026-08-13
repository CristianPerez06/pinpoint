import { FONT_FAMILY } from '@pinpoint/tokens'
import localFont from 'next/font/local'

/**
 * Figtree, bundled rather than fetched.
 *
 * A third-party font host would be a request to somebody else's server on every
 * page load, which the $0 constraint tolerates but the privacy and the offline
 * story do not. `next/font/local` hashes the file into the build and emits the
 * `@font-face` itself, so there is no external request and no flash of a
 * different face.
 *
 * The unsubsetted variable file rather than the `latin` subset, and that is not
 * laziness: the subset stops at U+00FF, and this product's first trip is full of
 * macrons — Kyōto, Tōdai-ji, Dōtonbori. A missing ō does not fail, it silently
 * falls back to a system face for that one glyph, so a name renders in two
 * typefaces and nothing reports it.
 *
 * It carries no CJK and cannot: that is a different font and a much larger one.
 * A name written in kana or kanji falls back, which is correct.
 *
 * The same file is bundled by the mobile application. `pnpm check:fonts` asserts
 * the two are byte-identical, because two copies of an asset is exactly the kind
 * of thing that drifts.
 */
export const figtree = localFont({
  src: './fonts/Figtree.ttf',
  // The variable axis this file actually carries. Declaring the range is what
  // lets the browser synthesise nothing and use real weights.
  weight: '300 900',
  style: 'normal',
  display: 'swap',
  // Matched to FONT_FAMILY so the token and the loaded face cannot disagree.
  variable: '--pp-font-loaded',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

/**
 * What the token says the family is called, re-exported so a component never
 * has to decide between the token and the loader.
 */
export const FONT_NAME = FONT_FAMILY
