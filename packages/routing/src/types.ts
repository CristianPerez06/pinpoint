import type { LngLat } from '@pinpoint/map'

/**
 * A route the service found, reduced to what the details and the map need.
 *
 * `km` and `minutes` are the service's own figures, unrounded; how they are
 * written belongs to the application's language, not to this package.
 */
export interface StreetRoute {
  km: number
  minutes: number
  /** Every point of the line, from the start the service chose to the place. */
  line: readonly LngLat[]
}

/**
 * What asking for a route produced.
 *
 * - `ready`: a route along the streets.
 * - `none`: the service answered and there is no way — the two points are not
 *   connected for that way of travelling, or are too far apart for it.
 * - `failed`: no usable answer — no connection, no reply in time, a refusal,
 *   or something unreadable. Worth asking again later.
 * - `aborted`: the caller stopped wanting it. Ignored, never shown.
 *
 * The person sees the same thing for `none` and `failed`; they are kept apart
 * because only `none` is worth remembering.
 */
export type RouteResult =
  | { kind: 'ready'; route: StreetRoute }
  | { kind: 'none' }
  | { kind: 'failed' }
  | { kind: 'aborted' }

/**
 * The part of `fetch` this package uses, described structurally.
 *
 * Headers are part of it, unlike `@pinpoint/geocode`'s, because both routing
 * services ask to be told who is calling.
 */
export interface FetchResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export interface Fetcher {
  (
    url: string,
    init?: { signal?: AbortSignal; headers?: Record<string, string> },
  ): Promise<FetchResponse>
}
