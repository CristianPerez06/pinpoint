import { fieldErrorsOf } from '@pinpoint/core'

import { invalidInput, type WriteOutcome } from './write-outcome'

/**
 * What validation needs from a schema, described structurally.
 *
 * Zod satisfies it and is not imported. The same reasoning as `@pinpoint/auth`:
 * this package's dependency list stays at the workspace, and swapping validation
 * libraries stays confined to `@pinpoint/core` where the schemas live.
 */
export interface Validatable<T> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } }
}

/**
 * Check input before it reaches the database.
 *
 * Writes validate; the reads beside them deliberately do not. A row written by a
 * newer version of the app must still render, so a read resolves what it cannot
 * recognise and carries on — but a write is the moment a bad value would be
 * created, and it is the only place stopping one costs nothing.
 */
export function validate<T>(
  schema: Validatable<T>,
  input: unknown,
): { ok: true; data: T } | { ok: false; outcome: WriteOutcome<never> } {
  const result = schema.safeParse(input)
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, outcome: invalidInput(fieldErrorsOf(result.error.issues)) }
}
