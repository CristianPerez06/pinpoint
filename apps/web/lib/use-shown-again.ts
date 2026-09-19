'use client'

import { useEffect, useRef } from 'react'

/**
 * Every server render this tab has mounted a screen with.
 *
 * Module level, so it lives exactly as long as the browser's saved payloads do:
 * for this document. A reload clears both together.
 */
const seen = new Set<string>()

/**
 * Run something when this screen is a copy the browser kept, rather than one
 * the server has just read for.
 *
 * The other half of "a screen re-reads what it is showing when it becomes
 * current again" on the web. `useVisibleAgain` is coming back to the tab; this
 * is coming back to the *screen*, through the browser's history — `Back to the
 * map`, or the back and forward arrows.
 *
 * Next does not ask the server again for a history navigation. It rebuilds the
 * page from the payload it saved the first time the screen was shown, so the
 * lists it hands down are that old: an edit made since, on this device or
 * anybody else's, is not in them. The screen then mounted, counted the mount as
 * the moment it was read, and re-read nothing — a place edited a moment earlier
 * showed its old details until the page was reloaded (#193).
 *
 * Mounting cannot tell the two apart on its own, so the page issues a token per
 * render and this remembers the ones it has seen. A token seen twice means one
 * server render has mounted twice, which only a rebuild from history can do. A
 * fresh visit always brings a new token.
 *
 * Deliberately not a timestamp compared against `Date.now()`. That compares the
 * server's clock with the browser's, and a laptop a few minutes off would
 * either treat every visit as a rebuild or never notice one. A token is only
 * ever compared with itself.
 */
export function useShownAgain(readId: string, onShownAgain: () => void) {
  /**
   * Held in a ref for the reason `useVisibleAgain` holds its handler in one:
   * what runs is whatever the current render would do, without the effect being
   * torn down and run again each time this component renders.
   */
  const handler = useRef(onShownAgain)
  useEffect(() => {
    handler.current = onShownAgain
  })

  /**
   * Checked once per mounted component, not once per effect run.
   *
   * In development React mounts, cleans up, and mounts again on the same
   * instance. Without this the second run would find the token the first one
   * had just recorded and call every fresh visit a rebuild. A ref survives that
   * pair and is new whenever the component really mounts again, which is
   * exactly the event being detected.
   */
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

    if (seen.has(readId)) handler.current()
    else seen.add(readId)
  }, [readId])
}
