import type { Session } from '@supabase/supabase-js'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { supabase } from '@/lib/supabase'

/**
 * The current session, for route protection.
 *
 * `loading` matters more than it looks: reading the session out of the keychain
 * is asynchronous, so for the first frame after launch there is no session even
 * when one exists. Redirecting during that frame would bounce a signed-in
 * person to the sign-in screen every time they opened the app.
 */
interface SessionState {
  session: Session | null
  loading: boolean
}

const SessionContext = createContext<SessionState>({
  session: null,
  loading: true,
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    // Fires on sign-in, sign-out, and every token refresh, so the tree follows
    // the session rather than a snapshot of it.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ session, loading }), [session, loading])

  return <SessionContext value={value}>{children}</SessionContext>
}

export function useSession(): SessionState {
  return useContext(SessionContext)
}
