import {
  DEFAULT_CAMERA,
  DEFAULT_PADDING,
  DEFAULT_VIEWPORT,
  MAX_ZOOM,
  MIN_ZOOM,
  SINGLE_MARKER_ZOOM,
  TILE_SIZE,
} from './constants'
import type { Bounds, Camera, LngLat, Viewport } from './types'

export interface FitBoundsOptions {
  viewport?: Viewport
  /** Fraction of the viewport left clear on each edge. Clamped to [0, 0.45). */
  padding?: number
  minZoom?: number
  maxZoom?: number
}

/**
 * Wrap a longitude into [-180, 180).
 *
 * In-range values are returned untouched. Running them through the modulo
 * anyway costs precision — 139.7 comes back as 139.70000000000005 — and that
 * error propagates into the centre of every camera we derive.
 */
export function normalizeLongitude(lng: number): number {
  if (lng >= -180 && lng < 180) return lng
  const wrapped = (((lng + 180) % 360) + 360) % 360
  return wrapped - 180
}

/** Web Mercator northing, normalized to [0, 1] with 0 at the north pole. */
function mercatorY(lat: number): number {
  const clamped = Math.max(-85.051129, Math.min(85.051129, lat))
  const s = Math.sin((clamped * Math.PI) / 180)
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)
}

/**
 * Smallest bounding box containing every point.
 *
 * Longitude is handled on the circle rather than the line: we find the widest
 * empty arc between consecutive longitudes and take its complement. Points at
 * 179 and -179 therefore produce a 2-degree box across the antimeridian, not a
 * 358-degree box the wrong way round. The returned `west` is greater than
 * `east` in that case, which is the standard convention.
 */
export function boundsOf(points: readonly LngLat[]): Bounds | null {
  if (points.length === 0) return null

  let south = Infinity
  let north = -Infinity
  for (const p of points) {
    if (p.lat < south) south = p.lat
    if (p.lat > north) north = p.lat
  }

  const lngs = points.map((p) => normalizeLongitude(p.lng)).sort((a, b) => a - b)

  let widestGap = -Infinity
  let gapStartIndex = 0
  for (let i = 0; i < lngs.length; i++) {
    const current = lngs[i]!
    const next = i === lngs.length - 1 ? lngs[0]! + 360 : lngs[i + 1]!
    const gap = next - current
    if (gap > widestGap) {
      widestGap = gap
      gapStartIndex = i
    }
  }

  // The widest gap is the empty arc, so the box runs from just after it round
  // to the point that opened it.
  const west = lngs[(gapStartIndex + 1) % lngs.length]!
  const east = lngs[gapStartIndex]!

  return { west, south, east, north }
}

/** Angular width of a bounding box in degrees, accounting for antimeridian crossing. */
export function boundsWidth(bounds: Bounds): number {
  const raw = bounds.east - bounds.west
  return raw < 0 ? raw + 360 : raw
}

/**
 * Camera that frames every marker.
 *
 * Pure: no renderer, no DOM, no platform API. Web hands the result to
 * `map.jumpTo`, native hands it to a `Camera` component — neither needs a
 * different derivation.
 */
export function fitBounds(
  markers: readonly LngLat[],
  options: FitBoundsOptions = {},
): Camera {
  const {
    viewport = DEFAULT_VIEWPORT,
    padding = DEFAULT_PADDING,
    minZoom = MIN_ZOOM,
    maxZoom = MAX_ZOOM,
  } = options

  const bounds = boundsOf(markers)
  if (!bounds) return DEFAULT_CAMERA

  const width = boundsWidth(bounds)
  const centerLng = normalizeLongitude(bounds.west + width / 2)
  const centerLat = (bounds.south + bounds.north) / 2
  const center: LngLat = { lng: centerLng, lat: centerLat }

  const clampZoom = (z: number) =>
    Math.max(minZoom, Math.min(maxZoom, z))

  // A single point, or several stacked on the same spot, has no extent to fit.
  if (width === 0 && bounds.north === bounds.south) {
    return { center, zoom: clampZoom(SINGLE_MARKER_ZOOM) }
  }

  const safePadding = Math.max(0, Math.min(0.45, padding))
  const usableWidth = viewport.width * (1 - 2 * safePadding)
  const usableHeight = viewport.height * (1 - 2 * safePadding)

  const lngFraction = width / 360
  const latFraction = Math.abs(mercatorY(bounds.south) - mercatorY(bounds.north))

  const zoomFor = (usablePx: number, fraction: number) =>
    fraction > 0 ? Math.log2(usablePx / (TILE_SIZE * fraction)) : Infinity

  const zoom = Math.min(
    zoomFor(usableWidth, lngFraction),
    zoomFor(usableHeight, latFraction),
  )

  return { center, zoom: clampZoom(zoom) }
}
