'use client'

import type { ThemeMode } from '@pinpoint/tokens'
import { useEffect, useState } from 'react'

/**
 * Which ground the browser is drawing on.
 *
 * Almost nothing on web needs this. The token stylesheet declares both themes
 * and the cascade picks one, so components are theme-agnostic and a theme
 * change repaints without React hearing about it.
 *
 * The map is the exception, and the only one. Its colours live inside a style
 * document that has to be transformed in JavaScript, so something has to know
 * the current mode as a value.
 *
 * Starts light and corrects on mount. The server cannot know the preference,
 * and guessing produces markup that disagrees with the client's first render.
 */
export function useColourScheme(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')

    const sync = () => setMode(query.matches ? 'dark' : 'light')
    sync()

    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return mode
}
