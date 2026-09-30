import { signOut } from '@pinpoint/auth'
import { useCallback } from 'react'

import { forgetKept } from '@/lib/kept'
import { supabase } from '@/lib/supabase'
import { useTripChoice } from '@/lib/trip-choice'

/**
 * Forget everything this phone kept about the person — which trip was open, and
 * every trip and waiting tap kept for use with no signal (`offline-use`).
 *
 * Every "forget" lives here so that whoever adds something to remember about a
 * person has one place to add forgetting it.
 *
 * A hook rather than a plain function because the trip choice is React state.
 * Nothing unmounts it on sign-out: the session provider keeps rendering its
 * children and the map only redirects, so without this the next account would
 * open on the trip the last one had chosen.
 *
 * Runs whenever the session ends, not only from the button: `SessionWatch` in
 * `lib/session-watch.tsx` calls it on every `SIGNED_OUT`. That event means the
 * service said the session is over — ended from another device, or a refresh it
 * refused — and never that the phone had no signal: the client keeps a session
 * it could not check and tries again. A phone cut off by a password change that
 * still opened every trip offline would only be signed out on paper.
 * `session-ending.test.ts` in `@pinpoint/supabase` fails if the client ever
 * emits the event for a missing connection.
 */
export function useForgetPerson(): () => void {
  const { forgetTrip } = useTripChoice()

  return useCallback(() => {
    forgetTrip()
    forgetKept()
  }, [forgetTrip])
}

/**
 * Sign out, forgetting first. The only way the phone signs out on purpose.
 *
 * Forgetting comes before the request so nothing kept is sent in the moment
 * between. The `SIGNED_OUT` that follows forgets again, which finds nothing.
 */
export function useSignOut(): () => Promise<void> {
  const forget = useForgetPerson()

  return useCallback(async () => {
    forget()
    await signOut(supabase)
  }, [forget])
}
