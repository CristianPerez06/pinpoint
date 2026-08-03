export {
  AUTH_FAILURE_MESSAGES,
  authFailureMessage,
  authFailureOf,
  GENERIC_AUTH_FAILURE,
} from './auth-errors'
export type { AuthFailure, CodedError } from './auth-errors'

export { createPinpointClient } from './client'
export type {
  CreateClientOptions,
  PinpointClient,
  SessionStorage,
  SupabaseCredentials,
} from './client'

export type { Database } from './database.types'
