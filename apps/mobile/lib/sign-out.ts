import { signOut } from '@pinpoint/auth'

import { forgetKept } from '@/lib/kept'
import { supabase } from '@/lib/supabase'

/**
 * Sign out, and forget every trip and waiting tap this phone kept for the
 * person first (`offline-use`).
 *
 * Tied to the button rather than to the session ending. Supabase also ends a
 * session when a token cannot be refreshed, and a phone that has been without a
 * signal for days is exactly when that might happen — forgetting on that event
 * would erase the trip at the moment it is needed most.
 */
export async function signOutHere(): Promise<void> {
  forgetKept()
  await signOut(supabase)
}
