import { useNetworkState } from 'expo-network'
import { createContext, type ReactNode, useContext } from 'react'

/**
 * Whether the phone can reach anything, known once for the whole application.
 *
 * One listener in a provider rather than one per control that asks: a place's
 * details, the toolbar and every sheet all want the answer, and they must all
 * change at the same moment or a person sees Edit enabled beside a greyed Drop.
 *
 * Offline means the device says there is no connection, or that the one it has
 * does not reach the internet. On iOS those are the same answer; on Android the
 * second catches a Wi-Fi with no internet behind it, which is common enough in a
 * hotel to matter.
 *
 * Unknown counts as online. Nothing is known for the first moments after launch,
 * and greying every control for that instant would flash the offline state at
 * everybody who has a perfectly good signal. A phone that really is offline
 * finds out a moment later, and a write attempted in that moment fails the way it
 * always did.
 */
const OnlineContext = createContext(true)

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const state = useNetworkState()
  const online = state.isConnected !== false && state.isInternetReachable !== false

  return <OnlineContext.Provider value={online}>{children}</OnlineContext.Provider>
}

/** Whether the phone is online now. Re-renders the caller when that changes. */
export function useOnline(): boolean {
  return useContext(OnlineContext)
}
