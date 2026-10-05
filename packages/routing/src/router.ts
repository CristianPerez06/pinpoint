import type { LngLat, TravelMode } from '@pinpoint/map'

import { buildOsrmUrl, isOsrmNoRoute, parseOsrm } from './osrm'
import type { Fetcher, RouteResult, StreetRoute } from './types'
import { buildValhallaUrl, isValhallaNoRoute, parseValhalla } from './valhalla'

/**
 * One router per application, kept within both services' terms.
 *
 * Every device calls the services directly, so the limits are kept here, on the
 * device, the way `createEveryLanguageSearch` keeps Nominatim's:
 *
 * - **At most one request a second**, across both services. A request that
 *   comes sooner waits out the rest of the second.
 * - **A route already given is not asked for again**, keyed on the start
 *   rounded to about 50 metres, the place, and the way of travelling — so a
 *   person standing still whose GPS wanders, or who reopens the same place,
 *   costs the services nothing.
 *
 * Valhalla is asked first. OSRM is asked only when Valhalla *fails*: when
 * Valhalla answers that there is no way, that answer stands, because a second
 * router rarely disagrees and the question costs a request.
 */

/** Both services' ceiling. */
export const MIN_INTERVAL_MS = 1000

/** Remembered routes. Far more than a day on foot asks for. */
export const CACHE_SIZE = 50

/**
 * The longest a person waits for a street route, across both services, before
 * the straight line is all they get.
 */
export const ROUTE_TIMEOUT_MS = 8000

/** The grid the start is rounded to, in metres. */
export const START_GRID_M = 50

const METRES_PER_DEGREE = 111_320

export interface Router {
  (from: LngLat, to: LngLat, mode: TravelMode, options?: { signal?: AbortSignal }): Promise<RouteResult>
}

/**
 * The start, moved to the nearest point of a ~50 m grid.
 *
 * Used for the request as well as the key, so a remembered route is exactly the
 * one that would have been asked for. Fifty metres is less than a city block,
 * and the routing service snaps the start to the nearest street anyway.
 */
export function roundStart(point: LngLat): LngLat {
  const latStep = START_GRID_M / METRES_PER_DEGREE
  const lat = Math.round(point.lat / latStep) * latStep
  const lngStep = latStep / Math.max(Math.cos((lat * Math.PI) / 180), 0.01)
  const lng = Math.round(point.lng / lngStep) * lngStep
  return { lng: Number(lng.toFixed(6)), lat: Number(lat.toFixed(6)) }
}

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

type Attempt = { kind: 'ready'; route: StreetRoute } | { kind: 'none' } | { kind: 'failed' }

export function createRouter(
  fetcher: Fetcher,
  {
    valhallaHeaders = {},
    osrmHeaders = {},
    now = () => Date.now(),
    wait = abortableWait,
    timeoutMs = ROUTE_TIMEOUT_MS,
  }: {
    /** Sent to Valhalla: its `X-Client-Id`, and on the phone a user agent. */
    valhallaHeaders?: Record<string, string>
    /** Sent to OSRM. Empty from a browser, whose preflight would refuse more. */
    osrmHeaders?: Record<string, string>
    now?: () => number
    wait?: (ms: number, signal?: AbortSignal) => Promise<void>
    timeoutMs?: number
  } = {},
): Router {
  /** The earliest moment the next request may leave; reserved when decided on. */
  let nextSlot = 0

  const cache = new Map<string, Attempt>()

  function remember(key: string, attempt: Attempt) {
    cache.delete(key)
    cache.set(key, attempt)
    if (cache.size > CACHE_SIZE) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
  }

  async function paced(url: string, headers: Record<string, string>, signal: AbortSignal) {
    const sendAt = Math.max(now(), nextSlot)
    nextSlot = sendAt + MIN_INTERVAL_MS
    const delay = sendAt - now()
    if (delay > 0) await wait(delay, signal)
    const response = await fetcher(url, { signal, headers })
    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      // An unreadable body is read as nothing; the status still says what happened.
    }
    return { status: response.status, ok: response.ok, body }
  }

  async function askValhalla(from: LngLat, to: LngLat, mode: TravelMode, signal: AbortSignal) {
    const { status, ok, body } = await paced(buildValhallaUrl(from, to, mode), valhallaHeaders, signal)
    if (isValhallaNoRoute(status, body)) return { kind: 'none' } as const
    const route = ok ? parseValhalla(body) : null
    return route ? ({ kind: 'ready', route } as const) : ({ kind: 'failed' } as const)
  }

  async function askOsrm(from: LngLat, to: LngLat, mode: TravelMode, signal: AbortSignal) {
    const { ok, body } = await paced(buildOsrmUrl(from, to, mode), osrmHeaders, signal)
    if (isOsrmNoRoute(body)) return { kind: 'none' } as const
    const route = ok ? parseOsrm(body) : null
    return route ? ({ kind: 'ready', route } as const) : ({ kind: 'failed' } as const)
  }

  return async function route(person, place, mode, { signal } = {}) {
    if (signal?.aborted) return { kind: 'aborted' }

    const from = roundStart(person)
    const key = `${mode}|${from.lng},${from.lat}|${place.lng.toFixed(6)},${place.lat.toFixed(6)}`
    const cached = cache.get(key)
    if (cached) {
      remember(key, cached)
      return cached
    }

    // One deadline for both attempts, and the caller's abort folded into it.
    const controller = new AbortController()
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort, { once: true })
    const deadline = setTimeout(() => controller.abort(), timeoutMs)

    async function attempt(ask: typeof askValhalla): Promise<Attempt> {
      try {
        return await ask(from, place, mode, controller.signal)
      } catch {
        return { kind: 'failed' }
      }
    }

    try {
      let result = await attempt(askValhalla)
      if (result.kind === 'failed' && !controller.signal.aborted) result = await attempt(askOsrm)
      if (signal?.aborted) return { kind: 'aborted' }
      if (result.kind !== 'failed') remember(key, result)
      return result
    } finally {
      clearTimeout(deadline)
      signal?.removeEventListener('abort', onAbort)
    }
  }
}
