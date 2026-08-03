import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

export type PinpointClient = SupabaseClient<Database>

export interface SupabaseCredentials {
  url: string
  /**
   * The publishable (anon) key. It is protected by row-level security and is
   * safe to embed in a shipped client bundle.
   *
   * The secret (service_role) key bypasses row-level security entirely and MUST
   * NOT be passed here — nothing constructed by this factory is guaranteed to
   * stay off a client.
   */
  publishableKey: string
}

/**
 * Minimal storage contract, structurally compatible with what supabase-js
 * expects. Web supplies cookie-backed storage, native supplies secure storage;
 * neither implementation belongs in this package.
 */
export interface SessionStorage {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}

export interface CreateClientOptions {
  storage?: SessionStorage
  /** Native has no URL to read a session back from; web does. */
  detectSessionInUrl?: boolean
  persistSession?: boolean
  autoRefreshToken?: boolean
}

/**
 * Build a Supabase client for either platform.
 *
 * Everything platform-specific arrives as an argument, so this stays free of
 * cookie APIs, secure-storage modules, and anything else that would stop it
 * resolving on one side or the other.
 */
export function createPinpointClient(
  credentials: SupabaseCredentials,
  options: CreateClientOptions = {},
): PinpointClient {
  const {
    storage,
    detectSessionInUrl = true,
    persistSession = true,
    autoRefreshToken = true,
  } = options

  return createClient<Database>(credentials.url, credentials.publishableKey, {
    auth: {
      storage: storage as never,
      detectSessionInUrl,
      persistSession,
      autoRefreshToken,
    },
  })
}
