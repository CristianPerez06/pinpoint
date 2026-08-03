import { signOutAction } from '@/app/_actions/auth'
import { requireUserId } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

/**
 * The signed-in landing page.
 *
 * There is no map here yet — that is the next change. What this proves is the
 * whole stack underneath one: a session, a membership, and a policy doing the
 * filtering.
 *
 * Note what is absent. There is no `.eq(...)` on the reader's id, no filtering
 * of the result, no check that these trips belong to them. The query asks for
 * every trip and the database returns the ones this account is a member of. If
 * that were wrong, a filter here would hide it rather than fix it.
 */
export default async function Home() {
  await requireUserId()

  const supabase = await createClient()
  const { data: trips, error } = await supabase
    .from('trips')
    .select('id, name, archived, trip_members (display_name)')
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <main>
        <h1>pinpoint</h1>
        <p role="alert">Could not load your trips.</p>
      </main>
    )
  }

  return (
    <main>
      <h1>pinpoint</h1>

      {trips.length === 0 ? (
        // Not an error. An account with no membership sees nothing, which is
        // exactly what someone who signed up before being invited should see.
        <p>You are not on any trips yet.</p>
      ) : (
        <ul>
          {trips.map((trip) => (
            <li key={trip.id}>
              <strong>{trip.name}</strong>
              {trip.archived ? ' (archived)' : null}
              <span>
                {' — '}
                {trip.trip_members.map((member) => member.display_name).join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  )
}
