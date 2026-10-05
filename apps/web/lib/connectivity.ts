import { useSyncExternalStore } from 'react'

/**
 * Whether the browser says it has a network (`place-route`).
 *
 * The same name as the phone's hook, which answers the same question from the
 * operating system. The browser's answer is coarser: `navigator.onLine` is true
 * on a network that reaches nothing, such as a hotel's sign-in page. That case
 * needs nothing of its own — the request for a street route fails and the
 * straight line stays, which is what the person should see anyway.
 *
 * True on the server and before the first read, as the phone treats an unknown
 * state: assuming a connection costs one failed request, assuming none would
 * switch off cycling and driving for somebody who has one.
 */
function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}
