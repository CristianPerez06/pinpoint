import type { StreetState } from '@pinpoint/core'
import type { LngLat, TravelMode } from '@pinpoint/map'
import { createRouter, type StreetRoute } from '@pinpoint/routing'
import { useEffect, useState } from 'react'

import { USER_AGENT } from '@/lib/user-agent'

/**
 * The street route on the phone (`place-route`).
 *
 * The router is created once for the app, because it is what keeps this phone
 * to one request a second and remembers routes it was given. The phone can set
 * any header, so both services are told who is asking: Valhalla by
 * `X-Client-Id`, as its terms ask, and both by the app's `User-Agent`.
 *
 * The hook below is the laptop's (`apps/web/lib/street-route.ts`) line for line,
 * over this app's router; it is React, so it cannot live in a shared package.
 */
const nativeFetch = (
  url: string,
  init?: { signal?: AbortSignal; headers?: Record<string, string> },
) => fetch(url, { ...init, headers: { ...init?.headers, 'User-Agent': USER_AGENT } })

export const streetRouter = createRouter(nativeFetch, {
  valhallaHeaders: { 'X-Client-Id': 'pinpoint' },
})

/** What the map draws and the card reads, while a street route is being had. */
export interface StreetRouteState {
  state: StreetState
  /** The line, once a route has arrived. */
  line: StreetRoute['line'] | null
}

const IDLE: StreetRouteState = { state: { kind: 'idle' }, line: null }
const FINDING: StreetRouteState = { state: { kind: 'finding' }, line: null }

/**
 * Asks for the street route whenever the route's ends, its way of travelling or
 * the connection change, and says where that has got to.
 *
 * With no route or no connection it is idle and asks nothing. A request that a
 * newer one supersedes is aborted, and its answer, if any, is never shown.
 * Each answer is stored against the question it answers, so a frame where the
 * question has changed and the answer has not yet reads as `finding` rather than
 * as the previous route's figures.
 */
export function useStreetRoute(
  from: LngLat | null,
  to: LngLat | null,
  mode: TravelMode,
  online: boolean,
): StreetRouteState {
  const question =
    from && to && online ? `${mode}|${from.lng},${from.lat}|${to.lng},${to.lat}` : null
  const [answer, setAnswer] = useState<{ question: string; value: StreetRouteState } | null>(null)

  useEffect(() => {
    if (!question || !from || !to) return
    const controller = new AbortController()
    void streetRouter(from, to, mode, { signal: controller.signal }).then((result) => {
      if (result.kind === 'aborted') return
      setAnswer({
        question,
        value:
          result.kind === 'ready'
            ? {
                state: { kind: 'ready', km: result.route.km, minutes: result.route.minutes },
                line: result.route.line,
              }
            : { state: { kind: 'none' }, line: null },
      })
    })
    return () => controller.abort()
    // `question` carries every input; the points themselves are new objects
    // on renders that change nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question])

  if (!question) return IDLE
  return answer?.question === question ? answer.value : FINDING
}
