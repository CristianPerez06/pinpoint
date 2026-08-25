'use client'

import { FRESH_FOR_MS, type SettledQueryState } from '@pinpoint/data'
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

/**
 * A list this screen shows: the rows, a way to change them, and a way to read
 * them again.
 *
 * The first two are `useState` and nothing more — this page has always held its
 * lists that way, and every write on it already sets them. What is new is the
 * third, and the freshness beside it.
 *
 * The server does the first read and hands the rows down as props; from there
 * this owns them. Re-reading happens on the client rather than through
 * `router.refresh()`, and that is not a preference. A refresh re-renders the
 * page on the server and hands down new props, and this component is keyed by
 * the trip so it does not remount — so its state initialisers never run again
 * and four of the five lists would go on showing what they were given at first
 * paint. It would refresh the trips prop and look like it had worked.
 *
 * The mount is counted as the read, because the server had just done one. A
 * screen that re-read a second after it painted would be asking for what it is
 * already showing.
 */
export function useRows<T>(
  initial: readonly T[],
): [
  readonly T[],
  Dispatch<SetStateAction<readonly T[]>>,
  (
    run: () => Promise<SettledQueryState<readonly T[]>>,
    options?: { force?: boolean },
  ) => Promise<void>,
] {
  const [rows, setRows] = useState<readonly T[]>(initial)

  /**
   * When this list was last read, which is what the floor is measured against.
   *
   * It belongs to the list rather than to whatever asked for the read. There is
   * more than one trigger — coming back to the tab, opening the panel that
   * shows a list — and a floor held beside each of them lets a return read the
   * members and the People panel read them again a second later, because
   * neither knows the other ran. See `FRESH_FOR_MS`.
   *
   * Deliberately not moved by a write. A write says what this device did, not
   * what everybody else did, so counting it as a read would let one write
   * suppress the re-read that was going to bring somebody else's changes in.
   */
  const readAt = useRef(0)
  /*
    Stamped on mount rather than at the initialiser. `Date.now()` in a render
    body is impure — the React linter rejects it outright, and on this page it
    would also be a different number on the server than in the browser that
    hydrates it. Mount is the closer moment anyway: it is when the server's read
    finished arriving.
  */
  useEffect(() => {
    readAt.current = Date.now()
  }, [])

  /** A read already on its way, so two triggers in one tick send one request. */
  const inFlight = useRef<Promise<void> | null>(null)

  const refresh = useCallback(
    (
      run: () => Promise<SettledQueryState<readonly T[]>>,
      options?: { force?: boolean },
    ) => {
      if (inFlight.current !== null) return inFlight.current
      if (options?.force !== true && Date.now() - readAt.current < FRESH_FOR_MS) {
        return Promise.resolve()
      }

      const started = run()
        .then((settled) => {
          /*
            A re-read that failed leaves what is on screen alone.

            Nobody pressed anything, so there is no press to answer, and
            replacing a working map with an error because a background read
            failed trades the screen for the news. The first read is the
            server's, and it reports through the page.
          */
          if (settled.status === 'failed') return

          readAt.current = Date.now()
          setRows(settled.status === 'ready' ? settled.data : [])
        })
        .finally(() => {
          inFlight.current = null
        })

      inFlight.current = started
      return started
    },
    [],
  )

  return [rows, setRows, refresh]
}
