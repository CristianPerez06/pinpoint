import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

/**
 * Run something when the application comes back to the foreground.
 *
 * **From `background` specifically, not from `inactive`.** iOS reports
 * `inactive` for a notification-centre pull, a control-centre pull, the app
 * switcher and a permission dialog. None of those is somebody coming back — the
 * app was never left — and treating them as a return means re-reading several
 * times during one uninterrupted session of using it.
 *
 * There is no interval here and no floor. How recently a list was read is a
 * fact about the list, not about what asked for it, so `useQuery` holds that —
 * see `FRESH_FOR_MS`. A floor held here would be one per listener, and two
 * listeners would each let the other's list be read twice.
 */
export function useActiveAgain(onActive: () => void) {
  /**
   * Held in a ref so the listener is subscribed once for the life of the
   * screen. A callback in the dependency list would tear down and re-subscribe
   * on every render, and a listener re-registered during a state change is a
   * listener that can miss it.
   *
   * Written in an effect rather than during render: refs are not for rendering,
   * and everything that reads this does so from the subscription below.
   */
  const handler = useRef(onActive)
  useEffect(() => {
    handler.current = onActive
  })

  useEffect(() => {
    // `AppState.currentState` rather than a starting value, so a screen mounted
    // while the app was already backgrounded does not read `active` as a return.
    let previous: AppStateStatus = AppState.currentState

    const subscription = AppState.addEventListener('change', (next) => {
      const returned = previous === 'background' && next === 'active'
      previous = next
      if (returned) handler.current()
    })

    return () => subscription.remove()
  }, [])
}
