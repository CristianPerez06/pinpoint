'use client'

import type { ThemeMode } from '@pinpoint/tokens'
import { useSyncExternalStore } from 'react'

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
 * `'light'` is the answer on the server and during the first client render,
 * because the server cannot know the preference and hydration has to produce
 * what the server produced. It is not the answer afterwards, and the difference
 * matters more than it looks: `page.tsx` keys the workspace on the trip, so
 * changing trips *remounts* the map, in a tree that is long past hydration and
 * has every means of knowing the real preference. React uses `getServerSnapshot`
 * only for the render that hydrates; a mount after a client-side navigation
 * reads the media query and starts correct.
 *
 * This used to start light on every mount and correct in an effect, which cost a
 * trip switch a wasted fetch-and-transform of the whole style document, a first
 * frame painted on the wrong ground, and — because a cached style document
 * resolves in a microtask, before React can flush the correction — the race in
 * `#64` that left the map light under dark chrome.
 */
export function useColourScheme(): ThemeMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
