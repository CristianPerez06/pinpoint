import {
  FRESH_FOR_MS,
  LOADING,
  type QueryState,
  readyOrEmpty,
  type SettledQueryState,
} from '@pinpoint/data'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A list this screen is showing: what the read is doing, what it holds, a way to
 * change it, and a way to ask for it again.
 *
 * Lists rather than any `T`, because every query in this application returns
 * one and `rows` needs something to be when the read has not produced anything
 * — `[]` is that for a list and there is no generic answer for anything else.
 */
export interface Query<T> {
  /** What the read is doing, or what it produced. */
  readonly state: QueryState<readonly T[]>
  /**
   * What it holds now. Empty while loading, when the read failed, and when the
   * answer genuinely is nothing — the three are told apart by `state`, and
   * anything that renders the difference reads that instead.
   */
  readonly rows: readonly T[]
  /**
   * Change what it holds, without going back to the database.
   *
   * This is what a write uses. Before it existed, a screen that wanted to show
   * its own write had to keep it in a pile beside the query and merge the two
   * at render time — five piles and four merges, in one component, for want of
   * this function.
   */
  readonly set: (update: (rows: readonly T[]) => readonly T[]) => void
  /**
   * Read it again.
   *
   * Declines inside `FRESH_FOR_MS` of the last read unless forced. Force it for
   * a read somebody asked for by hand and is waiting on; leave it alone for
   * every read that happens because the screen became current again.
   */
  readonly refetch: (options?: { force?: boolean }) => Promise<void>
}

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
  run: () => Promise<SettledQueryState<readonly T[]>>,
  deps: readonly unknown[],
): Query<T> {
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
   *
   */
  const [entry, setEntry] = useState<{
    deps: readonly unknown[]
    state: SettledQueryState<readonly T[]>
  } | null>(null)

  /**
   * The current query and dependencies, reachable from `refetch` — which is one
   * stable function and cannot close over a particular render's values.
   *
   * Written in an effect rather than during render. Refs are not for rendering,
   * and the React linter rejects assigning one in the render body outright; it
   * has caught reasoned-into-place ref handling on this platform three times
   * already. Everything that reads these does so from an event handler or an
   * effect, which is to say after this one has run.
   */
  const runRef = useRef(run)
  const depsRef = useRef(deps)
  useEffect(() => {
    runRef.current = run
    depsRef.current = deps
  })

  /**
   * When the answer on screen arrived, which is what the floor is measured
   * against.
   *
   * A ref rather than state because nothing renders it, and written only from
   * the callbacks below — never during a render. It lives here rather than in
   * whatever asked for a read, because how recently a list was read is a fact
   * about the list. See `FRESH_FOR_MS`.
   */
  const readAt = useRef(0)

  /**
   * A read already on its way.
   *
   * Two triggers can ask within the same tick — returning to the application
   * re-reads everything, and a sheet that opens in the same breath asks for its
   * own list. Handing back the read that is already travelling is cheaper than
   * a floor can be, because it needs no clock.
   */
  const inFlight = useRef<Promise<void> | null>(null)

  const read = useCallback(async () => {
    const forDeps = depsRef.current
    const settled = await runRef.current()

    // The dependencies changed while this was travelling, so the answer is
    // about something nobody is looking at any more. Compared by value: `deps`
    // is a fresh array on every render, so comparing the arrays themselves
    // would throw away every re-read that happened to span a render.
    if (!sameDeps(depsRef.current, forDeps)) return

    setEntry((current) => {
      /*
        A re-read that failed leaves what is on screen alone.

        Nobody pressed anything, so there is no press to answer, and replacing a
        working map with an error because a background read failed trades the
        screen for the news. A *first* read that fails is a different thing and
        still reports: there is nothing on screen to protect.
      */
      if (
        settled.status === 'failed' &&
        current !== null &&
        current.state.status !== 'failed'
      ) {
        return current
      }

      readAt.current = Date.now()
      return { deps: forDeps, state: settled }
    })
  }, [])

  useEffect(() => {
    let active = true

    /*
      Registered as in flight like any other read.

      Without this the first read is invisible to `refetch`, which then has
      nothing to hand back and no `readAt` to measure against — so a screen
      opened and immediately returned to, or a sheet opened while the list it
      shows is still arriving, sends a second request for what is already on
      its way.
    */
    const started: Promise<void> = run()
      .then((settled) => {
        // The screen went away, or the dependencies changed and a newer run is
        // already in flight. Writing here would show the older answer.
        if (!active) return
        readAt.current = Date.now()
        setEntry({ deps, state: settled })
      })
      .finally(() => {
        if (inFlight.current === started) inFlight.current = null
      })
    inFlight.current = started

    return () => {
      active = false
    }
    // `run` is a fresh closure on every render and `deps` is the array being
    // spread; the caller declares what the query actually depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const refetch = useCallback(
    (options?: { force?: boolean }) => {
      if (inFlight.current !== null) return inFlight.current
      if (options?.force !== true && Date.now() - readAt.current < FRESH_FOR_MS) {
        return Promise.resolve()
      }

      const started = read().finally(() => {
        inFlight.current = null
      })
      inFlight.current = started
      return started
    },
    [read],
  )

  const set = useCallback((update: (rows: readonly T[]) => readonly T[]) => {
    setEntry((current) => ({
      // A write against a list that never arrived still belongs to the
      // dependencies on screen now — there is nothing else it could be for.
      deps: current?.deps ?? depsRef.current,
      state: readyOrEmpty(
        update(current?.state.status === 'ready' ? current.state.data : []),
      ),
    }))
    /*
      A write does not make the list fresh, and `readAt` is deliberately left
      alone.

      It says what this device did, not what everybody else did, so counting it
      as a read would let one write suppress the re-read that was going to bring
      somebody else's changes in.
    */
  }, [])

  const isCurrent = entry !== null && sameDeps(entry.deps, deps)

  const state: QueryState<readonly T[]> = isCurrent ? entry.state : LOADING

  return {
    state,
    rows: state.status === 'ready' ? state.data : [],
    set,
    refetch,
  }
}

/** What the caller declared the query depends on, compared the way React does. */
function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
}
