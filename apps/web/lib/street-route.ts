import type { StreetState } from '@pinpoint/core'
import { isTravelMode, type LngLat, type TravelMode } from '@pinpoint/map'
import { createRouter, type StreetRoute } from '@pinpoint/routing'
import { useEffect, useState } from 'react'

/**
 * The street route on the laptop (`place-route`).
 *
 * The router is created once for the page, because it is what keeps this
 * browser to one request a second and remembers routes it was given — a copy
 * per render would pace nothing. Valhalla is told who is asking by
 * `X-Client-Id`, which its preflight allows; OSRM's preflight refuses that
 * header, so it gets nothing custom and is told by the `Referer` the browser
 * sends, which is what its terms ask for. A page cannot set `User-Agent`.
 */
const browserFetch = (
  url: string,
  init?: { signal?: AbortSignal; headers?: Record<string, string> },
) => fetch(url, init)

export const streetRouter = createRouter(browserFetch, {
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

/**
 * The way of travelling chosen last on this browser.
 *
 * A cookie rather than `localStorage`, so the laptop keeps its preferences in
 * one kind of place. Unlike the ground and the language, nothing is drawn from
 * it before a press, so it is read here on the client and not on the server.
 */
export const TRAVEL_MODE_COOKIE = 'pp-travel-mode'

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export function rememberedTravelMode(): TravelMode {
  const found = document.cookie
    .split('; ')
    .find((pair) => pair.startsWith(`${TRAVEL_MODE_COOKIE}=`))
    ?.slice(TRAVEL_MODE_COOKIE.length + 1)
  return isTravelMode(found) ? found : 'walk'
}

export function rememberTravelMode(mode: TravelMode) {
  document.cookie = `${TRAVEL_MODE_COOKIE}=${mode}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`
}
