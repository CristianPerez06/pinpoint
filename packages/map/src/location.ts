import { COLOUR, LOCATION_DOT_SIZE, type ThemeMode } from '@pinpoint/tokens'

import { accuracyRadiusPx } from './camera'
import type { LngLat } from './types'

/** The surface-coloured ring around the person's dot, inside `LOCATION_DOT_SIZE`. */
const DOT_RING = 3.5

/** How far the soft halo reaches past the dot's ring. */
const HALO = 6

/** The ids the person's position is drawn under, so each renderer can find them again. */
export const LOCATION_SOURCE = 'you'

/** One circle layer of the person's mark, in style-specification terms. */
export interface LocationLayer {
  id: string
  type: 'circle'
  paint: Record<string, unknown>
}

/**
 * The person's position as style layers, bottom first (`device-location`).
 *
 * Layers rather than a marker element on both platforms, for three properties
 * that matter here: the renderer draws layers beneath every marker, so a pin at
 * the person's position stays on top and pressable; a layer takes no presses;
 * and the uncertainty circle scales with a pinch or a wheel frame by frame.
 *
 * Here rather than written twice because both renderers take the style
 * specification's own paint properties — so the two apps cannot draw a
 * different dot, or disagree about how big the uncertainty is, without one of
 * them not calling this.
 *
 * Ink rather than any marker type's colour, so the dot cannot be read as a
 * place: blue is a place to stay. The ring and halo come from the same theme
 * pair, so both grounds are covered by values that already exist.
 *
 * The uncertainty circle is included only when the device reported one. Below
 * the dot's own radius it is hidden beneath the dot, which is what "no circle
 * for a precise position" looks like without a second rule to keep in step
 * with the zoom.
 */
export function locationLayers(
  position: LngLat & { accuracy: number | null },
  mode: ThemeMode,
): LocationLayer[] {
  const ink = COLOUR.ink[mode]
  const surface = COLOUR.surface[mode]
  const dotRadius = LOCATION_DOT_SIZE / 2

  const layers: LocationLayer[] = []
  if (position.accuracy !== null && position.accuracy > 0) {
    layers.push({
      id: `${LOCATION_SOURCE}-accuracy`,
      type: 'circle',
      paint: {
        // The shared conversion at the two ends of the range, doubled per step
        // by the renderer in between: exactly `accuracyRadiusPx` at every zoom.
        'circle-radius': [
          'interpolate',
          ['exponential', 2],
          ['zoom'],
          0,
          accuracyRadiusPx(position.accuracy, position.lat, 0),
          24,
          accuracyRadiusPx(position.accuracy, position.lat, 24),
        ],
        'circle-color': ink,
        'circle-opacity': 0.1,
        'circle-stroke-color': ink,
        'circle-stroke-opacity': 0.35,
        'circle-stroke-width': 1,
      },
    })
  }
  layers.push(
    {
      id: `${LOCATION_SOURCE}-halo`,
      type: 'circle',
      paint: { 'circle-radius': dotRadius + HALO, 'circle-color': ink, 'circle-opacity': 0.22 },
    },
    {
      id: `${LOCATION_SOURCE}-dot`,
      type: 'circle',
      paint: {
        'circle-radius': dotRadius - DOT_RING,
        'circle-color': ink,
        'circle-stroke-color': surface,
        'circle-stroke-width': DOT_RING,
      },
    },
  )
  return layers
}

/** A GeoJSON point feature, stated here so this package needs no GeoJSON typings. */
export interface PointFeature {
  type: 'Feature'
  properties: Record<string, never>
  geometry: { type: 'Point'; coordinates: [number, number] }
}

/** The position as the GeoJSON both renderers' sources take. */
export function locationFeature(position: LngLat): PointFeature {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [position.lng, position.lat] },
  }
}
