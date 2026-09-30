import {
  isWaiting,
  keepWaiting,
  readWaiting,
  recordInterest,
  setMarkerVisited,
  waitAlso,
  type WaitingTap,
  withdrawInterest,
} from '@pinpoint/data'
import { getNetworkStateAsync } from 'expo-network'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useOnline } from '@/lib/connectivity'
import { readKeptText, writeNow } from '@/lib/kept'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

/**
 * Taps made with no signal, waiting to be sent (`offline-use`).
 *
 * Only whether a place was visited and whether somebody wants to go. What the
 * tap changed is already on screen — the screen that took it put it into its
 * list the way any write does — so this holds nothing to draw. It exists to
 * send, and to say that something has not been sent yet.
 *
 * Held for the whole application rather than by a screen, because the map and
 * the calendar both take these taps and the queue has to outlive either of them.
 * Kept in a file beside the trips so it survives the application being closed.
 */
type Target = Parameters<typeof isWaiting>[1]

interface Waiting {
  /** Keep a tap until the connection returns. */
  readonly add: (tap: WaitingTap) => void
  /** Whether something about this place is still waiting to be sent. */
  readonly waitingFor: (target: Target) => boolean
  /** Be told each time everything waiting has been sent. */
  readonly subscribe: (then: () => void) => () => void
}

const KEPT_QUEUE = 'waiting'

const WaitingContext = createContext<Waiting | null>(null)

export function WaitingProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const online = useOnline()
  const signedIn = session !== null

  const [queue, setQueue] = useState<readonly WaitingTap[]>(() =>
    readWaiting(readKeptText(KEPT_QUEUE)),
  )

  /*
    Forgotten in memory when nobody is signed in, and read back from the file
    when somebody is again. Signing out with the button has already deleted the
    file; a session that ended some other way — a token that could not be
    refreshed — has not, and those taps are still the person's to send.
  */
  const [queueFor, setQueueFor] = useState(signedIn)
  if (queueFor !== signedIn) {
    setQueueFor(signedIn)
    setQueue(signedIn ? readWaiting(readKeptText(KEPT_QUEUE)) : [])
  }

  /** Every change to the queue goes through here, so the file always matches. */
  const change = useCallback(
    (update: (current: readonly WaitingTap[]) => readonly WaitingTap[]) => {
      setQueue((current) => {
        const next = update(current)
        writeNow(KEPT_QUEUE, keepWaiting(next))
        return next
      })
    },
    [],
  )

  const add = useCallback((tap: WaitingTap) => change((current) => waitAlso(current, tap)), [
    change,
  ])

  const listeners = useRef(new Set<() => void>())
  const subscribe = useCallback((then: () => void) => {
    listeners.current.add(then)
    return () => {
      listeners.current.delete(then)
    }
  }, [])

  /*
    Sending, in the order the taps were made, once there is a connection and
    somebody to send them as.

    Each tap is taken off by identity as it is sent, not by what it is about.
    A tap made while the queue is being sent replaces the entry for its target
    with a new object, so it survives; removing by target would drop it unsent.
  */
  const sending = useRef(false)
  /*
    Bumped when a round of sending ends, so a tap made during it is looked at
    straight away rather than when the queue next happens to change.
  */
  const [round, setRound] = useState(0)
  useEffect(() => {
    if (!online || !signedIn || queue.length === 0 || sending.current) return
    sending.current = true

    void (async () => {
      let reachable = true
      for (const tap of queue) {
        if ((await send(tap)) === 'unreachable') {
          reachable = false
          break
        }
        // Sent, or refused: either way it is done. A refusal means the place was
        // removed or the person left the trip, and the re-read shows that.
        change((current) => current.filter((each) => each !== tap))
      }

      sending.current = false
      if (reachable) {
        for (const then of listeners.current) then()
        setRound((each) => each + 1)
      }
    })()
  }, [online, signedIn, queue, change, round])

  const waitingFor = useCallback((target: Target) => isWaiting(queue, target), [queue])

  const value = useMemo<Waiting>(
    () => ({ add, waitingFor, subscribe }),
    [add, waitingFor, subscribe],
  )

  return <WaitingContext.Provider value={value}>{children}</WaitingContext.Provider>
}

/**
 * Send one tap. `unreachable` when it could not be sent because the phone lost
 * its connection again, so it is kept for next time; `done` otherwise, whether
 * the database took it or refused it.
 *
 * The outcome of a write does not say which of the two a failure was, so the
 * device is asked: a failure with no connection is the connection's, and a
 * failure with one is the database's answer.
 */
async function send(tap: WaitingTap): Promise<'done' | 'unreachable'> {
  const outcome =
    tap.kind === 'visited'
      ? await setMarkerVisited(supabase, tap.markerId, tap.visited)
      : tap.interested === null
        ? await withdrawInterest(supabase, tap.markerId, tap.memberId)
        : await recordInterest(supabase, {
            markerId: tap.markerId,
            memberId: tap.memberId,
            interested: tap.interested,
          })

  if (outcome.ok) return 'done'

  try {
    const state = await getNetworkStateAsync()
    const online = state.isConnected !== false && state.isInternetReachable !== false
    return online ? 'done' : 'unreachable'
  } catch {
    return 'unreachable'
  }
}

function useWaitingContext(): Waiting {
  const waiting = useContext(WaitingContext)
  if (waiting === null) throw new Error('useWaiting needs a WaitingProvider above it')
  return waiting
}

/** Keep taps, and ask whether one is still waiting. */
export function useWaiting(): Pick<Waiting, 'add' | 'waitingFor'> {
  const { add, waitingFor } = useWaitingContext()
  return { add, waitingFor }
}

/**
 * Run `then` each time everything waiting has been sent. The screen showing a
 * trip reads it again then, however recently it last did.
 */
export function useAfterSending(then: () => void): void {
  const { subscribe } = useWaitingContext()
  const handler = useRef(then)
  useEffect(() => {
    handler.current = then
  })
  useEffect(() => subscribe(() => handler.current()), [subscribe])
}
