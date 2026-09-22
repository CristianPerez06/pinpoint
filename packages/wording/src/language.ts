import { ENGLISH_LANGUAGE, LANGUAGES, type Language } from './say'

/**
 * Choosing a language, and the one rule both applications choose it by.
 *
 * The same three-valued shape as the ground: follow the device, or one of the
 * languages outright. A stored language cannot be told apart from a device that
 * happens to agree with it, and that difference is what makes *follow the
 * device* something a person can choose rather than only the absence of a
 * choice.
 *
 * Here rather than in each application for the reason `resolveMode` is in
 * `@pinpoint/tokens`: two copies of the rule would be two applications that
 * disagree about what somebody chose. What is *not* here is the asking — a
 * cookie and `Accept-Language` on one side, a key-value store and
 * `expo-localization` on the other — because neither is available to a package
 * that carries no DOM API and no native module.
 */
export type LanguagePreference = 'system' | Language

/**
 * Whatever came out of a store, as a preference.
 *
 * Total, for the reason `parseThemePreference` is: an absent key, an empty
 * string, something hand-edited, or a language a later build offers and this
 * one predates. Everything unrecognised is `'system'`, which is what the product
 * does before anybody chooses anything.
 */
export function parseLanguagePreference(stored: string | null | undefined): LanguagePreference {
  if (stored === 'system') return 'system'
  return isLanguage(stored) ? stored : 'system'
}

/**
 * The language in force, given what was chosen and what the device asks for.
 *
 * `requested` is the device's or the browser's own list, most wanted first —
 * `['es-AR', 'en']`, say. The first entry whose language the product is offered
 * in wins; a region is ignored, because the product has one Spanish, not one per
 * country. Anything the product does not offer falls through to English, which
 * is what it spoke before it spoke anything else.
 *
 * **This is the only question the device is ever asked.** How a day, a price or
 * a number is written follows the language this returns, never the device's own
 * locale — a phone set to German and a laptop set to English, both reading a
 * trip in Spanish, show the same dates and the same prices.
 */
export function languageFor(
  preference: LanguagePreference,
  requested: readonly string[],
): Language {
  if (preference !== 'system') return preference

  for (const tag of requested) {
    const primary = tag.trim().split(/[-_]/)[0]?.toLowerCase()
    if (isLanguage(primary)) return primary
  }
  return ENGLISH_LANGUAGE
}

/**
 * An `Accept-Language` header, as the list `languageFor` reads.
 *
 * Ordered by the weights the browser gave, highest first; entries the browser
 * weighted at zero are refused rather than merely last, which is what `q=0`
 * means. The wildcard is dropped: it asks for nothing in particular.
 */
export function requestedLanguages(header: string | null | undefined): string[] {
  if (!header) return []

  return header
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const weight = q === undefined ? 1 : Number(q.slice(2))
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0, index }
    })
    .filter(({ tag, weight }) => tag !== '' && tag !== '*' && weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
    .map(({ tag }) => tag)
}

function isLanguage(value: string | null | undefined): value is Language {
  return (LANGUAGES as readonly (string | null | undefined)[]).includes(value)
}
