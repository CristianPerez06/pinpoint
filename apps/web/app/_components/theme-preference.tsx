'use client'

import type { ThemePreference } from '@pinpoint/tokens'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { themeAttribute, themeCookieAssignment } from '@/lib/theme-preference'

/**
 * The chosen ground, held once for the whole document.
 *
 * Web resolves its theme in two unrelated places — the cascade draws the
 * interface, and JavaScript draws the map, because the map's colours live
 * inside a style document no stylesheet can reach. Those two must never
 * disagree, and the only way to guarantee that is for both to be downstream of
 * one value. This is that value.
 *
 * Seeded from the server, which read the cookie before rendering anything. The
 * client never reads the cookie itself: a second reader is a second thing that
 * can be stale.
 */
type ThemePreferenceState = {
  preference: ThemePreference
  choose: (next: ThemePreference) => void
}

const Context = createContext<ThemePreferenceState | null>(null)

export function ThemePreferenceProvider({
  initial,
  children,
}: {
  /** What the cookie said, parsed on the server. */
  initial: ThemePreference
  children: ReactNode
}) {
  const [preference, setPreference] = useState(initial)

  const choose = useCallback((next: ThemePreference) => {
    /*
     * Three writes, in this order, none of them a navigation.
     *
     * The attribute repaints the interface through the cascade, which needs no
     * React at all; the state repaints the map, which needs nothing else; and
     * the cookie is for the *next* server render and is read by nobody before
     * then. Deliberately no `router.refresh()` and no server action — either
     * would put a network round-trip between pressing the control and the
     * colour changing.
     *
     * `documentElement` rather than a React-rendered attribute: `<html>` is
     * rendered by the root layout, which does not re-render on a client
     * navigation within itself, so React would not apply a change to it anyway.
     */
    const attribute = themeAttribute(next)
    if (attribute === null) {
      delete document.documentElement.dataset.theme
    } else {
      document.documentElement.dataset.theme = attribute
    }

    document.cookie = themeCookieAssignment(next)
    setPreference(next)
  }, [])

  const value = useMemo(() => ({ preference, choose }), [preference, choose])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

/**
 * The preference, and the way to change it.
 *
 * Throws outside the provider rather than falling back to `'system'`. A
 * plausible default here would mean a component rendering on one ground while
 * the document is on another, which is the exact failure this file exists to
 * prevent and is invisible until somebody looks at the right screen on the
 * right device.
 */
export function useThemePreference(): ThemePreferenceState {
  const state = useContext(Context)
  if (state === null) {
    throw new Error('useThemePreference used outside ThemePreferenceProvider')
  }
  return state
}
