import { useCallback, useRef, useState } from 'react'

/**
 * One write, and whether it is currently happening.
 *
 * Every control that starts a write holds one of these. There is deliberately
 * no screen-level equivalent: a single flag meaning "a write is in flight"
 * cannot say *which*, so it disables controls that have nothing to do with what
 * is happening and leaves the responsible one live — which is what the old
 * `busy` did to the rename and the invite on both platforms.
 *
 * The guard is a ref as well as a state, and the ref is the half that makes the
 * guarantee real. `pending` is React state, so it is only true from the next
 * render onwards; two presses that arrive before that render both read `false`
 * and both send. In a browser that is hard to provoke by hand — measured at
 * three taps one macrotask apart producing exactly one write — but "hard to
 * provoke" is a statement about a fast machine, and this whole change exists
 * because the slow one behaves differently. The ref flips synchronously inside
 * the press that started the write, so the second press cannot see a stale
 * value however far behind the renderer is.
 *
 * `pending` is for what the control says; `start` is what it does.
 *
 * Written once per application rather than shared from a package, like the four
 * loading states it stands beside. It is twenty lines and no package depends on
 * React today; making one do so to save them is a bigger decision than this
 * change is entitled to make.
 */
export function usePending(): [boolean, (write: () => Promise<unknown>) => void] {
  const [pending, setPending] = useState(false)
  const inFlight = useRef(false)

  const start = useCallback((write: () => Promise<unknown>) => {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)

    // Released on both outcomes. A refused write leaves the control on screen
    // and it has to be pressable again; a successful one usually unmounts it,
    // where releasing costs nothing.
    void write().finally(() => {
      inFlight.current = false
      setPending(false)
    })
  }, [])

  return [pending, start]
}
