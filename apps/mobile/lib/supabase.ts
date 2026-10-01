import 'react-native-url-polyfill/auto'

import { createPinpointClient, type SessionStorage } from '@pinpoint/supabase'
import * as SecureStore from 'expo-secure-store'
import { AppState } from 'react-native'

import { config } from '@/lib/config'

/**
 * The mobile Supabase client.
 *
 * Session lives in the platform keychain rather than in cookies — this is the
 * half of authentication that cannot be shared, which is why
 * `createPinpointClient` takes storage as an argument instead of choosing.
 *
 * Note the shape: `@pinpoint/supabase` declares `SessionStorage` structurally,
 * so this adapter satisfies it without that package importing anything from
 * Expo. The dependency points one way, from the app inward.
 *
 * expo-secure-store warns above roughly 2 KB per value. A Supabase session sits
 * under that today; adding large custom JWT claims is what would push it over.
 */
const secureStorage: SessionStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
}

export const supabase = createPinpointClient(
  {
    url: config.supabase.url,
    publishableKey: config.supabase.publishableKey,
  },
  {
    storage: secureStorage,
    // There is no URL to read a session back from on native.
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
)

/*
  Keep the session fresh only while the app is in front (`auth`).

  The client pauses its refresh timer for a hidden tab in a browser and nowhere
  else — on a phone it would run, freeze or fire late at the platform's whim.
  Starting it again runs one check at once, so a session that expired while the
  app was away is renewed on return; a refresh that cannot reach the service
  keeps the session and is tried again on the next tick.

  Any state but `active` stops it, iOS's `inactive` included, unlike
  `useActiveAgain`: here a brief pause costs one check on return and reads
  nothing. Registered once, for the life of the client. The app is already in
  front when this module loads, and `autoRefreshToken` starts the timer for that.
*/
AppState.addEventListener('change', (state) => {
  if (state === 'active') void supabase.auth.startAutoRefresh()
  else void supabase.auth.stopAutoRefresh()
})
