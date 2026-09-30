import { confirmSession } from '@pinpoint/auth'
import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

import { useSession } from '@/lib/session'
import { useForgetPerson } from '@/lib/sign-out'
import { supabase } from '@/lib/supabase'
import { useActiveAgain } from '@/lib/use-active-again'

/**
 * How often an open phone asks whether its session still stands (`auth`).
 *
 * The time within which a password changed elsewhere reaches sign-in here. One
 * small request each time, and only while the app is in front.
 */
const CHECK_EVERY_MS = 5 * 60 * 1000

/**
 * Notices a session ended from another device, and forgets the person when any
 * session ends.
 *
 * The phone used to learn that its session was gone only when its access pass
 * expired, up to an hour later — so "other devices were signed out" was false on
 * a phone for that long. It now asks at launch, on every return to the front,
 * and every `CHECK_EVERY_MS` in between. The answer is not read here: when the
 * session is gone the client removes it and emits `SIGNED_OUT`, and the map
 * redirects to sign-in the way it does for any sign-out.
 *
 * Forgetting listens for that event rather than for the check, because a phone
 * brought back after more than an hour may have the client's own refresh find
 * out first — refused by the service, session removed — and the check would
 * then never see an answer. One listener covers both, and the button too.
 *
 * Mounted inside `TripChoiceProvider`, because forgetting clears the trip choice.
 * Draws nothing.
 */
export function SessionWatch() {
  const { session } = useSession()
  const signedIn = session !== null
  const forget = useForgetPerson()

  /*
    In a ref so the listener is subscribed once. `forget` changes identity
    whenever the trip choice does, and re-subscribing on each of those is a
    window in which a `SIGNED_OUT` could be missed.
  */
  const forgetRef = useRef(forget)
  useEffect(() => {
    forgetRef.current = forget
  })

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') forgetRef.current()
    })
    return () => data.subscription.unsubscribe()
  }, [])

  /*
    Each return to the front bumps this, which re-runs the effect below: it asks
    at once and restarts the timer, so a return never asks twice in a row.
  */
  const [returns, setReturns] = useState(0)
  useActiveAgain(() => setReturns((count) => count + 1))

  useEffect(() => {
    if (!signedIn) return

    void confirmSession(supabase)
    // Android can run a timer for a while after the app has gone to the back;
    // a check nobody is looking at is a request for nothing.
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void confirmSession(supabase)
    }, CHECK_EVERY_MS)

    return () => clearInterval(timer)
  }, [signedIn, returns])

  return null
}
