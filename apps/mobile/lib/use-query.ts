import { LOADING, type QueryState, type SettledQueryState } from '@pinpoint/data'
import { useEffect, useState } from 'react'

/**
 * Run a query and hold its four-state result.
 *
 * This exists so that no screen invents its own idea of "still loading" again.
 * The map screen previously derived one from `trips === null && !failed`, which
 * is three booleans pretending to be a state machine and gets the empty case
 * wrong the moment a real trip has nothing on it.
 *
 * Loading is the starting value, not a flag beside the data — which is what
 * makes "not arrived yet" and "arrived and there is nothing" impossible to
 * confuse. The distinction, and the union that carries it, are shared with web
 * in `@pinpoint/data`. What is not shared is anything that renders it.
 *
 * Note this is a different `loading` from the session's. `useSession` answers
 * "do we know yet whether anyone is signed in", which is asked once per launch;
 * this answers "has this screen's data arrived". Collapsing them would mean a
 * screen could not reload without the app looking signed out.
 */
export function useQuery<T>(
  run: () => Promise<SettledQueryState<T>>,
  deps: readonly unknown[],
): QueryState<T> {
  /**
   * The result is stored with the dependencies it was fetched for, rather than
   * as bare state reset by the effect. Two reasons, and the second is the one
   * that matters:
   *
   * - Resetting to `loading` inside the effect is a second render for no
   *   reason, which is what React's linter objects to.
   * - It would also be a render too late. Between the dependencies changing and
   *   the effect running, a screen rendering bare state would show the previous
   *   trip's markers as though they were this trip's. Deriving staleness
   *   instead means the very first render after a change already says loading.
   */
  const [entry, setEntry] = useState<{
    deps: readonly unknown[]
    state: SettledQueryState<T>
  } | null>(null)

  useEffect(() => {
    let active = true

    void run().then((settled) => {
      // The screen went away, or the dependencies changed and a newer run is
      // already in flight. Writing here would show the older answer.
      if (active) setEntry({ deps, state: settled })
    })

    return () => {
      active = false
    }
    // `run` is a fresh closure on every render and `deps` is the array being
    // spread; the caller declares what the query actually depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const isCurrent =
    entry !== null &&
    entry.deps.length === deps.length &&
    entry.deps.every((value, index) => Object.is(value, deps[index]))

  return isCurrent ? entry.state : LOADING
}
