import 'react-native-url-polyfill/auto'

import { createPinpointClient, type SessionStorage } from '@pinpoint/supabase'
import * as SecureStore from 'expo-secure-store'

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
