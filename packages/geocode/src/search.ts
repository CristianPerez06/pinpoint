import { toCandidates } from './parse'
import { buildSearchUrl, type SearchOptions } from './request'
import type { Fetcher, SearchResult } from './types'

export const SEARCH_FAILED_MESSAGE = 'Place search is unavailable right now.'

/**
 * Was this rejection the caller cancelling, or the network failing?
 *
 * A superseded request rejects like any other, and the difference matters: one
 * should show nothing at all, the other should say search is unavailable. There
 * is no single reliable marker across runtimes, so both the standard abort name
 * and the signal itself are consulted.
 */
function wasAborted(error: unknown, signal: AbortSignal | undefined): boolean {
  if (signal?.aborted) return true
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  )
}

/**
 * Search for places matching a query.
 *
 * The only function here that performs I/O, and it does not reach a global to do
 * it — the fetch function is a parameter, so this package holds no opinion about
 * which runtime it is running in and its tests need no stubbed global.
 *
 * Returns rather than throws, for the same reason the reads in `@pinpoint/data`
 * do: a geocoder being unreachable is an ordinary thing for a search box to
 * render, and modelling it as a throw pushes every caller into a try/catch that
 * has to re-derive what it caught.
 *
 * The distinction this function exists to preserve is between finding nothing
 * and being unable to look. Only one of them means the person should try
 * different words, and a screen that blurs them sends somebody rephrasing a
 * query at a service that is down.
 */
export async function searchPlaces(
  fetcher: Fetcher,
  searchQuery: string,
  options: SearchOptions & { signal?: AbortSignal } = {},
): Promise<SearchResult> {
  const { signal, ...searchOptions } = options

  // Not a request worth making, and not a failure either.
  if (searchQuery.trim() === '') return { status: 'empty' }

  let response
  try {
    response = await fetcher(buildSearchUrl(searchQuery, searchOptions), {
      signal,
    })
  } catch (error) {
    if (wasAborted(error, signal)) return { status: 'aborted' }
    return { status: 'failed', message: SEARCH_FAILED_MESSAGE }
  }

  if (!response.ok) return { status: 'failed', message: SEARCH_FAILED_MESSAGE }

  let payload: unknown
  try {
    payload = await response.json()
  } catch (error) {
    if (wasAborted(error, signal)) return { status: 'aborted' }
    return { status: 'failed', message: SEARCH_FAILED_MESSAGE }
  }

  const candidates = toCandidates(payload)

  // An unreadable body and a genuinely empty result both arrive here as an empty
  // list. Both are reported as empty, and that is the right call: the request
  // succeeded, so telling somebody the service is down would be a lie, and the
  // honest remaining answer is that nothing matched.
  return candidates.length > 0
    ? { status: 'ready', candidates }
    : { status: 'empty' }
}
