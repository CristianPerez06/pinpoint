import { buildNominatimUrl, toNominatimCandidates } from './nominatim'
import { SEARCH_FAILED_MESSAGE, wasAborted } from './search'
import type { Fetcher, SearchBias, SearchResult } from './types'

/**
 * One search of names in every language, kept within the service's usage policy.
 *
 * Every person's device calls Nominatim directly, so there is nowhere central to
 * count requests. The policy's limits are therefore kept here, on the device:
 *
 * - **At most one request a second.** A submit that comes sooner waits out the
 *   rest of the second rather than being refused — the person asked for
 *   something, and a short wait is a better answer than none.
 * - **A query already answered is not asked again.** Somebody pressing Enter
 *   twice, or going back to a query they tried a minute ago, costs the service
 *   nothing.
 *
 * Built as an object an application constructs once rather than as module state
 * in this package, so the pace belongs to something the application owns and
 * the tests can hand it a clock.
 */

/** The policy's ceiling. */
export const MIN_INTERVAL_MS = 1000

/**
 * How many answers are remembered. Far more than a planning session submits;
 * the cap only stops a page left open for a week from growing without end.
 */
export const CACHE_SIZE = 50

export interface EveryLanguageSearch {
  (
    searchQuery: string,
    options?: { bias?: SearchBias; signal?: AbortSignal },
  ): Promise<SearchResult>
}

/**
 * An abort, shaped the way `fetch` shapes one.
 *
 * Not `DOMException`, which React Native's runtime does not promise to have.
 */
function abortError(): Error {
  const error = new Error('Aborted')
  error.name = 'AbortError'
  return error
}

/** Resolves after `ms`, or rejects as soon as `signal` aborts. */
function abortableWait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function createEveryLanguageSearch(
  fetcher: Fetcher,
  {
    now = () => Date.now(),
    wait = abortableWait,
  }: {
    now?: () => number
    wait?: (ms: number, signal?: AbortSignal) => Promise<void>
  } = {},
): EveryLanguageSearch {
  /**
   * The earliest moment the next request may leave.
   *
   * A slot is reserved when a request is decided on, not when it is sent, so two
   * submits waiting at once are spaced from each other rather than both waking
   * after the same second and leaving together. A slot reserved by a search
   * that is then cancelled is simply spent; that errs on the side of asking less.
   */
  let nextSlot = 0

  /**
   * Raw responses rather than candidates, keyed by the query as typed.
   *
   * Raw, because a candidate carries its distance from the bias, and the bias
   * moves with the map. An answer from ten minutes ago re-read against where the
   * person is working now is exactly as true as a fresh one.
   */
  const cache = new Map<string, unknown[]>()

  function remember(key: string, payload: unknown[]) {
    cache.delete(key)
    cache.set(key, payload)
    if (cache.size > CACHE_SIZE) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
  }

  function answer(payload: unknown[], bias: SearchBias | undefined): SearchResult {
    const candidates = toNominatimCandidates(payload, bias)
    return candidates.length > 0
      ? { status: 'ready', candidates }
      : { status: 'empty' }
  }

  return async function search(searchQuery, { bias, signal } = {}) {
    const trimmed = searchQuery.trim()
    if (trimmed === '') return { status: 'empty' }

    // Case does not change what the service matches.
    const key = trimmed.toLowerCase()
    const cached = cache.get(key)
    if (cached) {
      remember(key, cached)
      return answer(cached, bias)
    }

    const sendAt = Math.max(now(), nextSlot)
    nextSlot = sendAt + MIN_INTERVAL_MS

    let payload: unknown
    try {
      const delay = sendAt - now()
      if (delay > 0) await wait(delay, signal)
      const response = await fetcher(buildNominatimUrl(trimmed, { bias }), { signal })
      if (!response.ok) return { status: 'failed', reason: SEARCH_FAILED_MESSAGE }
      payload = await response.json()
    } catch (error) {
      if (wasAborted(error, signal)) return { status: 'aborted' }
      return { status: 'failed', reason: SEARCH_FAILED_MESSAGE }
    }

    // Only a readable answer is remembered. A failure is asked again on the next
    // submit, and an unreadable body is reported as no matches, as Photon's is —
    // the request succeeded, so saying the service is down would be a lie.
    if (!Array.isArray(payload)) return { status: 'empty' }
    remember(key, payload)
    return answer(payload, bias)
  }
}
