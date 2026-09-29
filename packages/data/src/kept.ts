/**
 * A list as the phone keeps it for use without a signal: the rows, and when they
 * were last read.
 *
 * Shared rather than written in the phone, because the part worth testing —
 * what counts as a copy worth trusting — is platform-neutral text handling. The
 * file itself is the application's; this package never touches storage.
 *
 * `readAt` is the moment of the last successful read, not of the last write.
 * A tap made offline changes the rows without anybody having read them, and the
 * offline note says how old the trip is as the database last told it.
 */
export interface KeptList<T> {
  readonly readAt: number
  readonly rows: readonly T[]
}

/**
 * The shape version. A copy written by an older build in a shape this build no
 * longer understands is treated as absent rather than drawn wrongly.
 */
const KEPT_VERSION = 1

/** A list as text, ready to be stored. */
export function keepList<T>(kept: KeptList<T>): string {
  return JSON.stringify({ v: KEPT_VERSION, readAt: kept.readAt, rows: kept.rows })
}

/**
 * A stored list read back, or null when there is none worth showing.
 *
 * Null covers a missing file, a truncated write, another version's shape, and
 * anything else that is not what `keepList` produced. None of them is reported:
 * a copy that cannot be read is the same as no copy, and the trip then loads the
 * way it always did.
 *
 * The rows themselves are not validated. They were written by this application
 * from rows it had already read and drawn, so checking them again would test
 * the database's answer twice and this function's once.
 */
export function readKeptList<T>(text: string | null | undefined): KeptList<T> | null {
  if (text == null || text === '') return null

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const { v, readAt, rows } = parsed as Record<string, unknown>
  if (v !== KEPT_VERSION) return null
  if (typeof readAt !== 'number' || !Number.isFinite(readAt)) return null
  if (!Array.isArray(rows)) return null

  return { readAt, rows: rows as T[] }
}
