import {
  languageFor,
  parseLanguagePreference,
  requestedLanguages,
  say,
  type Language,
  type LanguagePreference,
  type Message,
} from '@pinpoint/wording'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'

import { LANGUAGE_COOKIE } from './language-preference'

/**
 * The language this request is drawn in, decided once, on the server.
 *
 * The chosen preference from the cookie, and — only for *follow the device* —
 * the browser's own `Accept-Language`. The header is carried out with the
 * answer so the client provider can resolve the same preference the same way
 * without asking the browser a second time: two readers of the browser's
 * language are two chances to disagree about it, and a disagreement between the
 * server and the client is a hydration mismatch.
 *
 * Cached per request, so the layout, a page and its metadata all read one
 * answer.
 */
export const requestLanguage = cache(
  async (): Promise<{
    preference: LanguagePreference
    language: Language
    requested: string[]
  }> => {
    const preference = parseLanguagePreference((await cookies()).get(LANGUAGE_COOKIE)?.value)
    const requested = requestedLanguages((await headers()).get('accept-language'))
    return { preference, language: languageFor(preference, requested), requested }
  },
)

/**
 * `say`, bound to this request's language, for a server component.
 *
 * Words a server component draws are drawn once per render; changing the
 * language re-renders them because the provider refreshes the route in the
 * same transition that repaints the client — see `language.tsx`.
 */
export async function serverSay(): Promise<(named: Message) => string> {
  const { language } = await requestLanguage()
  return (named) => say(language, named)
}
