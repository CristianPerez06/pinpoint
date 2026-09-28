/**
 * Reading an untrusted response, shared by both services' parsers.
 *
 * Neither service guarantees its response shape, so every field is read as
 * `unknown` and accepted only once it is the type expected. These are the
 * pieces both parsers need; what each service calls its fields stays with the
 * parser that knows.
 */

export function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

export function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Roughly where a place is, for telling identically-named results apart.
 *
 * Two or three parts at most. The list exists to answer "which Starbucks", and a
 * full postal address answers it no better while making every row unreadable. A
 * part equal to the place's own name is dropped — a city searched for by name
 * would otherwise read "Kyoto, Kyoto".
 */
export function joinContext(
  parts: readonly (string | null)[],
  name: string,
): string | null {
  const kept = parts.filter(
    (part): part is string => part !== null && part !== name,
  )
  const unique = [...new Set(kept)].slice(0, 3)
  return unique.length > 0 ? unique.join(', ') : null
}
