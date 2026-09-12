'use client'

import { resolveMode, type ThemeMode } from '@pinpoint/tokens'
import { useSyncExternalStore } from 'react'

import { useThemePreference } from '@/app/_components/theme-preference'

const PREFERS_DARK = '(prefers-color-scheme: dark)'

/**
 * Created on first use rather than at module scope. A `matchMedia` call at the
 * top level runs during the server render of everything that imports this file,
 * where there is no `window` at all.
 */
let query: MediaQueryList | null = null
function mediaQuery(): MediaQueryList {
  query ??= window.matchMedia(PREFERS_DARK)
  return query
}

/*
 * The three arguments are module-level constants on purpose. `useSyncExternalStore`
 * re-subscribes when `subscribe` changes identity and re-reads when `getSnapshot`
 * does, so defining them in the hook body is not a style question — it is a render
 * loop. The snapshot is a string, so a stable value is free.
 */
function subscribe(onChange: () => void): () => void {
  const media = mediaQuery()
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot(): ThemeMode {
  return mediaQuery().matches ? 'dark' : 'light'
}

function getServerSnapshot(): ThemeMode {
  return 'light'
}

/**
 * What the device is asking for, which is not necessarily what gets drawn.
 *
 * Separated from the hook below because it is only half the answer: somebody
 * who has chosen a ground explicitly has overruled this, and nothing should
 * read it without going through `resolveMode`.
 */
function useDeviceMode(): ThemeMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

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
 * THE TWO HALVES, AND WHICH ONE THE SERVER KNOWS
 *
 * A ground is a preference resolved against a device. The preference came from
 * a cookie and the server read it before rendering anything; the device is
 * `matchMedia`, which the server cannot ask. So:
 *
 *   chose light or dark   `resolveMode` ignores the device entirely, the server
 *                         snapshot is irrelevant, and the first frame is right
 *   follows the device    the server cannot know, and answers light — exactly
 *                         as it did before any of this existed
 *
 * That is the whole reason the preference is a cookie rather than
 * `localStorage`: it moves the one case somebody actually complained about out
 * of the browser and onto the server, and leaves the case that was already
 * correct alone.
 *
 * `'light'` remains the answer on the server and during the first client render
 * for the device case, because the server cannot know the preference and
 * hydration has to produce what the server produced. It is not the answer
 * afterwards, and the difference matters more than it looks: `page.tsx` keys the
 * workspace on the trip, so changing trips *remounts* the map, in a tree that is
 * long past hydration and has every means of knowing the real preference. React
 * uses `getServerSnapshot` only for the render that hydrates; a mount after a
 * client-side navigation reads the media query and starts correct.
 *
 * This used to start light on every mount and correct in an effect, which cost a
 * trip switch a wasted fetch-and-transform of the whole style document, a first
 * frame painted on the wrong ground, and — because a cached style document
 * resolves in a microtask, before React can flush the correction — the race in
 * `#64` that left the map light under dark chrome.
 */
export function useColourScheme(): ThemeMode {
  const { preference } = useThemePreference()
  return resolveMode(preference, useDeviceMode())
}
