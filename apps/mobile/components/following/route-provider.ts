import type { TravelMode } from '@pinpoint/map'
import {
  isValhallaNoRoute,
  ROUTE_TIMEOUT_MS,
  STADIA_ENDPOINT,
  VALHALLA_ENDPOINT,
} from '@pinpoint/routing'
import type { Language } from '@pinpoint/wording'
import type { RouteProvider } from '@stadiamaps/ferrostar-core-react-native'
import {
  RouteAdapter,
  RouteRequest,
  WellKnownRouteProvider,
  type Route,
  type UserLocation,
  type Waypoint,
} from '@stadiamaps/ferrostar-uniffi-react-native'

import { askInTurn, type Attempt } from '@/components/following/in-turn'
import { config } from '@/lib/config'
import { USER_AGENT } from '@/lib/user-agent'

/** Valhalla's name for each way of travelling, as `@pinpoint/routing` asks it. */
const COSTING: Readonly<Record<TravelMode, string>> = {
  walk: 'pedestrian',
  bike: 'bicycle',
  car: 'auto',
}

/** Valhalla's narrative languages for the two the product speaks. */
const NARRATIVE: Readonly<Record<Language, string>> = { en: 'en-US', es: 'es-ES' }

/** One Valhalla server: where it is, and what it asks to be sent. */
interface Server {
  endpointUrl: string
  headers: Record<string, string>
}

/**
 * Stadia Maps first, then FOSSGIS's Valhalla, as `street-route.ts` asks them
 * (`route-following`). FOSSGIS's OSRM is left out: Ferrostar reads Valhalla and
 * GraphHopper, and that server does not return the turns it needs.
 */
function servers(): Server[] {
  return [
    {
      endpointUrl: `${STADIA_ENDPOINT}?api_key=${encodeURIComponent(config.stadia.apiKey)}`,
      headers: { 'User-Agent': USER_AGENT },
    },
    {
      endpointUrl: VALHALLA_ENDPOINT,
      headers: { 'User-Agent': USER_AGENT, 'X-Client-Id': 'pinpoint' },
    },
  ]
}

/**
 * Routes with their turns, for Ferrostar, from whichever service answers.
 *
 * A custom provider rather than Ferrostar's own adapter, which asks one server
 * with no headers, no deadline and nothing to fall back on. The request and
 * the parsing are still Ferrostar's: its adapter builds the body and reads the
 * answer, so the steps it needs are exactly the ones it asked for.
 */
export function routeProvider(mode: TravelMode, language: Language): RouteProvider {
  return {
    kind: 'custom',
    async getRoutes(location: UserLocation, waypoints: Waypoint[]): Promise<Route[]> {
      const attempts = servers().map(
        (server): Attempt<Route[]> =>
          (signal) => ask(server, mode, language, location, waypoints, signal),
      )
      const outcome = await askInTurn(attempts, ROUTE_TIMEOUT_MS)
      // Ferrostar reads an empty list as "nothing came back", which is what both
      // "no way" and "nobody answered" mean to the person following.
      return outcome.kind === 'ready' ? outcome.value : []
    },
  }
}

async function ask(
  server: Server,
  mode: TravelMode,
  language: Language,
  location: UserLocation,
  waypoints: Waypoint[],
  signal: AbortSignal,
) {
  const adapter = RouteAdapter.fromWellKnownRouteProvider(
    WellKnownRouteProvider.Valhalla.new({
      endpointUrl: server.endpointUrl,
      profile: COSTING[mode],
      optionsJson: JSON.stringify({ language: NARRATIVE[language] }),
    }),
  )
  const request = adapter.generateRequest(location, waypoints)
  if (!RouteRequest.HttpPost.instanceOf(request)) return { kind: 'failed' } as const

  const headers: Record<string, string> = { ...server.headers }
  request.inner.headers.forEach((value, key) => {
    headers[key] = value
  })
  const response = await fetch(request.inner.url, {
    method: 'POST',
    headers,
    body: new Uint8Array(request.inner.body),
    signal,
  })

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    return isValhallaNoRoute(response.status, body)
      ? ({ kind: 'none' } as const)
      : ({ kind: 'failed' } as const)
  }

  const routes = adapter.parseResponse(await response.arrayBuffer())
  return routes.length > 0
    ? ({ kind: 'ready', value: routes } as const)
    : ({ kind: 'none' } as const)
}
