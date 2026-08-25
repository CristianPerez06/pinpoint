'use client'

import { useEffect, useRef } from 'react'

/**
 * Run something when this tab becomes visible again.
 *
 * The web half of "a screen re-reads what it is showing when it becomes current
 * again". Coming back is the only automatic trigger there is: no polling, no
 * interval, and nothing holding a connection open waiting to be told.
 *
 * There is no interval here and no floor. How recently a list was read is a
 * fact about the list, not about what asked for it, so the workspace holds that
 * per list — see `FRESH_FOR_MS`. A floor kept here would be one per listener,
 * and two listeners would each let the other's list be read twice.
 *
 * Nothing is added for the browser's own reload. It is a control sitting a few
 * pixels above wherever a second one would go, and duplicating it inside the
 * page is how an application starts looking like it does not trust itself.
 */
export function useVisibleAgain(onVisible: () => void) {
  /**
   * Held in a ref so the listener is registered once. A callback in the
   * dependency list would tear it down and re-register it on every render, and
   * a listener re-registered mid-event is a listener that can miss one.
   *
   * Assigned in an effect rather than during render: refs are not for
   * rendering, and everything that reads this does so from the event below.
   */
  const handler = useRef(onVisible)
  useEffect(() => {
    handler.current = onVisible
  })

  useEffect(() => {
    function onChange() {
      if (document.visibilityState === 'visible') handler.current()
    }

    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
}
