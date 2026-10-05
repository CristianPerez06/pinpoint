import { COLOUR, type ThemeMode } from '@pinpoint/tokens'

import { NEARBY_FAR_KM } from './nearby'
import type { LngLat } from './types'

/**
 * A straight line from the person to a place, and how long it is on foot
 * (`place-route`).
 *
 * Data and pure functions, like the person's dot beside it in `location.ts`:
 * each application binds these to its own renderer, so the two cannot draw a
 * different line or quote a different time for the same two points.
 */

/**
 * How much longer a walk is than the straight line under it.
 *
 * Measured, not assumed: real walking routes in Kyoto, from three routing
 * services, came out 1.33 to 1.40 times the straight line (#244). The low end,
 * rounded, because the time is said as "about" and a figure that is a little
 * short is read more kindly than one that is a little long.
 */
export const ROUTE_DETOUR = 1.3

/** An ordinary walking pace, in kilometres an hour. */
export const WALKING_KMH = 4.5

/** Walking times are rounded to this many minutes, and never said as less. */
const WALK_STEP_MINUTES = 5

/**
 * Minutes on foot for a straight-line distance, or null when the place is not
 * somewhere anyone would walk to.
 *
 * Null beyond `NEARBY_FAR_KM` rather than a second constant: Nearby already
 * says that distance is a day trip, and a ten-hour walking time is true and
 * useless.
 */
export function walkingMinutes(km: number): number | null {
  if (km > NEARBY_FAR_KM) return null
  const minutes = ((km * ROUTE_DETOUR) / WALKING_KMH) * 60
  return Math.max(WALK_STEP_MINUTES, Math.round(minutes / WALK_STEP_MINUTES) * WALK_STEP_MINUTES)
}

/**
 * How the person is getting there (`place-route`).
 *
 * Three, because those are what every free routing server offers; none offers
 * public transport. Ordered as the details offer them.
 */
export const TRAVEL_MODES = ['walk', 'bike', 'car'] as const

export type TravelMode = (typeof TRAVEL_MODES)[number]

/** Whether a stored or typed value names a way of travelling. */
export function isTravelMode(value: unknown): value is TravelMode {
  return typeof value === 'string' && (TRAVEL_MODES as readonly string[]).includes(value)
}

/** The id the line is drawn under, so each renderer can find it again. */
export const ROUTE_SOURCE = 'route'

/** One line layer of the route, in style-specification terms. */
export interface RouteLayer {
  id: string
  type: 'line'
  layout: Record<string, unknown>
  paint: Record<string, unknown>
}

/** A GeoJSON line feature, stated here so this package needs no GeoJSON typings. */
export interface LineFeature {
  type: 'Feature'
  properties: Record<string, never>
  geometry: { type: 'LineString'; coordinates: [number, number][] }
}

/**
 * The route as the GeoJSON both renderers' sources take.
 *
 * Two points for the straight line, or every point of a street route as the
 * routing service returned it. The street route is drawn as returned: it starts
 * at the street nearest the person rather than at their dot, and joining the
 * two would draw a walk through whatever stands between them.
 */
export function routeFeature(from: LngLat, to: LngLat): LineFeature
export function routeFeature(line: readonly LngLat[]): LineFeature
export function routeFeature(first: LngLat | readonly LngLat[], to?: LngLat): LineFeature {
  const points = isLine(first) ? first : [first, to as LngLat]
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((point) => [point.lng, point.lat]),
    },
  }
}

function isLine(value: LngLat | readonly LngLat[]): value is readonly LngLat[] {
  return Array.isArray(value)
}

/**
 * Which of the two lines is drawn.
 *
 * `straight` is the estimate, a distance between two points; `street` is a way
 * somebody can follow. They are told apart by pattern, never by colour
 * (`place-route`), so the difference survives a greyscale screen.
 */
export type RouteForm = 'straight' | 'street'

/**
 * The route as style layers, bottom first.
 *
 * Ink on a surface casing: the same pair the person's dot is drawn in, so it
 * reads on both grounds by construction and cannot be taken for a place's
 * colour. The straight line is dotted because it is not a path anyone can
 * follow — a solid line would claim to be the way. The street route is solid,
 * and a little heavier, because it is.
 *
 * The two forms share their layer ids, so a renderer swapping one for the other
 * replaces the layers rather than stacking a second pair under the first.
 */
export function routeLayers(mode: ThemeMode, form: RouteForm = 'straight'): RouteLayer[] {
  const street = form === 'street'
  return [
    {
      id: `${ROUTE_SOURCE}-casing`,
      type: 'line',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': COLOUR.surface[mode],
        'line-width': street ? 9 : 7,
        'line-opacity': 0.9,
      },
    },
    {
      id: `${ROUTE_SOURCE}-line`,
      type: 'line',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: street
        ? { 'line-color': COLOUR.ink[mode], 'line-width': 4.5 }
        : { 'line-color': COLOUR.ink[mode], 'line-width': 3, 'line-dasharray': [0.1, 2] },
    },
  ]
}
