'use client'

import {
  languageFor,
  say,
  type Language,
  type LanguagePreference,
  type Message,
} from '@pinpoint/wording'
import { useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'

import { languageCookieAssignment } from '@/lib/language-preference'

/**
 * The language in force, held once for the whole document.
 *
 * The shape `ThemePreferenceProvider` already has, on purpose: seeded from the
 * server, which read the cookie and the browser's `Accept-Language` before
 * rendering anything, and never read again by the client. A second reader is a
 * second thing that can be stale — and a language resolved separately on the
 * server and in the browser is the hydration mismatch `day-wording.ts`
 * records, which left a whole screen drawn, correct, and attached to nothing.
 */
type LanguageState = {
  preference: LanguagePreference
  language: Language
  choose: (next: LanguagePreference) => void
}

const Context = createContext<LanguageState | null>(null)

export function LanguageProvider({
  initial,
  requested,
  children,
}: {
  /** What the cookie said, parsed on the server. */
  initial: LanguagePreference
  /**
   * What the browser asked for, as the server read it from `Accept-Language`.
   *
   * Carried in rather than read from `navigator.languages`, so that *follow the
   * device* resolves to the same language here as it did on the server.
   */
  requested: readonly string[]
  children: ReactNode
}) {
  const [preference, setPreference] = useState(initial)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const language = languageFor(preference, requested)

  const choose = useCallback(
    (next: LanguagePreference) => {
      /*
       * Every surface changes together, or none does.
       *
       * The client's words follow the state; a server component's words were
       * written by the server and follow the cookie. So the cookie is written
       * first, and the state and a refresh of the route are started in one
       * transition — React commits them together, once the server has redrawn
       * its part in the new language, rather than repainting the client first
       * and leaving the server's words behind for a round trip.
       *
       * `lang` on `<html>` is set by hand for the reason `data-theme` is: the
       * root layout does not re-render on a client navigation within itself.
       */
      document.cookie = languageCookieAssignment(next)
      document.documentElement.lang = languageFor(next, requested)
      startTransition(() => {
        setPreference(next)
        router.refresh()
      })
    },
    [requested, router],
  )

  const value = useMemo(() => ({ preference, language, choose }), [preference, language, choose])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

/**
 * The preference, the language it resolves to, and the way to change it.
 *
 * Throws outside the provider rather than falling back to English. A plausible
 * default here would draw one component in a language the rest of the page is
 * not in, which is the exact failure this file exists to prevent.
 */
export function useLanguagePreference(): LanguageState {
  const state = useContext(Context)
  if (state === null) {
    throw new Error('useLanguagePreference used outside LanguageProvider')
  }
  return state
}

/** The language in force. */
export function useLanguage(): Language {
  return useLanguagePreference().language
}

/**
 * `say`, bound to the language in force.
 *
 * What nearly every component wants: a name in, the sentence the person reads
 * out. The language is still passed at the one place it is bound, so a second
 * language remained a value rather than a signature.
 */
export function useSay(): (named: Message) => string {
  const language = useLanguage()
  return useCallback((named: Message) => say(language, named), [language])
}
