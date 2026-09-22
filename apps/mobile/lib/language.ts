import { languageFor, say, type Language, type Message } from '@pinpoint/wording'
import { getLocales } from 'expo-localization'
import { useCallback } from 'react'

import { usePreferences } from '@/lib/preferences'

/**
 * What the device asks for, read once, at launch.
 *
 * Read at module load rather than subscribed to, deliberately. The device is
 * asked which language to open in and nothing else: a first launch on a phone
 * set to Spanish opens in Spanish, and after that the language follows what
 * was chosen here. How a day or a price is written never comes from the device
 * — `@pinpoint/core` takes the language as an argument — so a phone set to
 * German reading a trip in Spanish agrees with a laptop reading it in Spanish
 * about every date and every price.
 *
 * `languageTag` rather than `languageCode`: the tag carries the region, which
 * `languageFor` ignores, and the code is null on some devices.
 */
const REQUESTED: readonly string[] = (() => {
  try {
    return getLocales().map((locale) => locale.languageTag)
  } catch {
    // A native module that cannot answer is not an error anybody can act on.
    // English, which is what the product spoke before it spoke anything else.
    return []
  }
})()

/** The language in force: the one chosen, or the device's where none was. */
export function useLanguage(): Language {
  const { language } = usePreferences()
  return languageFor(language, REQUESTED)
}

/**
 * `say`, bound to the language in force.
 *
 * What nearly every component wants: a name in, the sentence the person reads
 * out. Every surface draws from the one preference, so a change repaints all of
 * them in the same render.
 */
export function useSay(): (named: Message) => string {
  const language = useLanguage()
  return useCallback((named: Message) => say(language, named), [language])
}
