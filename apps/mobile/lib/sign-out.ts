import { signOut } from '@pinpoint/auth'
import { useCallback } from 'react'

import { forgetKept } from '@/lib/kept'
import { supabase } from '@/lib/supabase'
import { useTripChoice } from '@/lib/trip-choice'

/**
 * Sign out, and forget first everything this phone kept about the person —
 * which trip was open, and every trip and waiting tap kept for use with no
 * signal (`offline-use`).
 *
 * The only way the phone signs out. Every "forget" lives here so that whoever
 * adds something to remember about a person has one place to add forgetting
 * it; a button calling `signOut` from `@pinpoint/auth` directly would sign out
 * and leave all of it behind.
 *
 * A hook rather than a plain function because the trip choice is React state.
 * Nothing unmounts it on sign-out: the session provider keeps rendering its
 * children and the map only redirects to sign-in, so without this the next
 * account would open on the trip the last one had chosen.
 *
 * Tied to the button rather than to the session ending. Supabase also ends a
 * session when a token cannot be refreshed, and a phone that has been without a
 * signal for days is exactly when that might happen — forgetting on that event
 * would erase the trip at the moment it is needed most.
 */
export function useSignOut(): () => Promise<void> {
  const { forgetTrip } = useTripChoice()

  return useCallback(async () => {
    forgetTrip()
    forgetKept()
    await signOut(supabase)
  }, [forgetTrip])
}
