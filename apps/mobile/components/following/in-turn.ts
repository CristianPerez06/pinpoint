/**
 * Asking routing services one after another, under one deadline
 * (`route-following`, *Following asks the same routing services, under the
 * same limits*).
 *
 * The order and the rules are `@pinpoint/routing`'s router's: the next service
 * is asked only when one gives no usable answer, an answer of "no way" stands,
 * and one deadline covers every attempt. That router cannot be reused here
 * because it reads only the line, the distance and the time, and following
 * needs the turns — so this is the same loop over attempts that hand back
 * whatever their caller parses.
 *
 * Kept apart from Ferrostar so it can be tested without the phone's native code.
 */

export type Outcome<T> = { kind: 'ready'; value: T } | { kind: 'none' } | { kind: 'failed' }

/** One service: asked with the shared deadline's signal. */
export type Attempt<T> = (signal: AbortSignal) => Promise<Outcome<T>>

export async function askInTurn<T>(
  attempts: readonly Attempt<T>[],
  timeoutMs: number,
): Promise<Outcome<T>> {
  const controller = new AbortController()
  const deadline = setTimeout(() => controller.abort(), timeoutMs)
  try {
    for (const attempt of attempts) {
      if (controller.signal.aborted) break
      let outcome: Outcome<T>
      try {
        outcome = await attempt(controller.signal)
      } catch {
        outcome = { kind: 'failed' }
      }
      if (outcome.kind !== 'failed') return outcome
    }
    return { kind: 'failed' }
  } finally {
    clearTimeout(deadline)
  }
}
