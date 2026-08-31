import {
  DEFAULT_CAMERA,
  DEFAULT_PADDING,
  DEFAULT_VIEWPORT,
  MAX_ZOOM,
  MIN_ZOOM,
  SINGLE_MARKER_ZOOM,
  TILE_SIZE,
  ZOOM_STEP,
} from './constants'
import type { Bounds, Camera, LngLat, Rect, Viewport } from './types'

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

/** Inverse of `mercatorY`: a normalized northing back to a latitude. */
function latitudeAt(y: number): number {
  // mercatorY is 0.5 - artanh(sin φ) / 2π, so this undoes it in one step.
  return (Math.asin(Math.tanh((0.5 - y) * 2 * Math.PI)) * 180) / Math.PI
}

/**
 * The centre that puts a point somewhere other than the middle of the view.
 *
 * Needed because a map is not always looked at whole. When a sheet covers the
 * lower half of the screen, the middle of the *view* is behind it, so centring on
 * a point is exactly how to hide the point — which is the shape of a defect the
 * phone shipped: choosing a search result centred the camera on it and the form
 * that opened next drew over it.
 *
 * Pure, and shared for the same reason `fitBounds` is: the arithmetic is Web
 * Mercator rather than anything about a renderer, and the second application is
 * going to need it the moment a browser window is narrow enough to want the same
 * sheet. Two implementations of this would be two chances to get a sign wrong.
 *
 * `dx` and `dy` are pixel offsets applied to the centre in screen terms — `dy`
 * positive moves the centre down the screen, which moves the drawn point up.
 */
export function offsetCenter(
  center: LngLat,
  zoom: number,
  dx: number,
  dy: number,
): LngLat {
  const worldSize = TILE_SIZE * Math.pow(2, zoom)

  const x = ((normalizeLongitude(center.lng) + 180) / 360) * worldSize + dx
  const y = mercatorY(center.lat) * worldSize + dy

  return {
    lng: normalizeLongitude((x / worldSize) * 360 - 180),
    // Clamped by `latitudeAt` through `tanh`, so an offset that would run off
    // the top of the projection lands at the pole rather than producing NaN.
    lat: latitudeAt(y / worldSize),
  }
}

/**
 * Whether a covered rectangle takes a band right across the map.
 *
 * The distinction the two consumers below both turn on. A sheet flush to both
 * edges halves the map: everything below its top edge is gone, at every
 * horizontal position, and framing has to fit the places into what is left. A
 * card in one corner takes nothing of the sort — the map beside it is entirely
 * usable, and describing it as a band throws that away.
 *
 * The tolerance is for sub-pixel layout, not a proportion. A fixed element
 * flush to both edges and a surface it is measured against can differ in the
 * last fraction of a pixel; a 328px card in a 1440px map cannot come near this.
 * It is deliberately not a fraction of the width: no arrangement in either
 * application sits anywhere near a boundary, so a threshold would be a number
 * nothing justifies and a second thing to get wrong.
 */
function spansWidth(covered: Rect, surface: Viewport): boolean {
  return covered.left <= 1 && covered.right >= surface.width - 1
}

/**
 * How much of the map's height framing must treat as gone.
 *
 * Zero for a rectangle that does not span the width, and that is the decision
 * rather than an oversight. Framing fits points into a rectangle, so it cannot
 * express the shape left by a card in a corner and has to approximate. Of the
 * two approximations available, one risks a single marker landing behind a
 * panel that can be dismissed; the other reduces the surface by 70% because a
 * quarter of one column is occupied, and opens the map on empty space with
 * every marker pressed against the top edge. Those are not comparable failures.
 *
 * Zero, too, for a rectangle that does not exist — chrome standing beside the
 * map rather than over it produces no overlap at all, which is the whole of the
 * defect this pair of functions was written for.
 *
 * The band is measured from the rectangle's top edge to the bottom of the map,
 * not from its own height. Chrome standing on the floor leaves a strip beneath
 * it when it is inset by a token, and that strip is no more usable than the
 * chrome is.
 */
export function coveredBandHeight(
  covered: Rect | null,
  surface: Viewport,
): number {
  if (!covered) return 0
  if (!spansWidth(covered, surface)) return 0

  return Math.max(0, Math.min(surface.height, surface.height - covered.top))
}

/**
 * The vertical offset that lifts a place clear of what is describing it, or
 * `null` when the camera should not move at all.
 *
 * `null` rather than zero, and the difference is not a nicety. The offset
 * returned is applied to the *place*, not to the current centre — the caller
 * hands it to `offsetCenter` with the place as the origin, which is what makes
 * this idempotent under a re-run while its own animation is still in flight. So
 * zero would mean "centre the camera on the place", which is a move, and the
 * loudest possible one. Nothing to do has to be its own answer.
 *
 * Two behaviours, and they differ because the situations do:
 *
 * - **A band across the map.** What is left is a strip, and the place belongs
 *   in the middle of it. This is what the phone shape has always done and it is
 *   correct there; the arithmetic is unchanged.
 * - **A rectangle in a corner.** The map is essentially whole. A place beside
 *   the rectangle does not move — it was never hidden, and moving it takes the
 *   view away from somebody who chose where to look. A place behind it rises by
 *   the least that clears its top edge.
 *
 * `margin` keeps a place from coming to rest exactly on the boundary, in both
 * the test for whether to move and the distance moved.
 *
 * Total: the place is on the map afterwards, at every input. A correction that
 * carries it off the edge has not kept it clear of anything — it has hidden it
 * more completely than the chrome would have, while reporting success.
 */
export function liftOffset(
  place: { x: number; y: number },
  covered: Rect | null,
  surface: Viewport,
  margin: number,
): number | null {
  if (!covered) return null

  // Beside the rectangle rather than behind it. Only asked of a corner, but
  // true of a band as well, where it can never fire.
  if (place.x < covered.left || place.x > covered.right) return null

  const clearOf = covered.top - margin
  if (place.y <= clearOf) return null

  const strip = spansWidth(covered, surface) ? covered.top / 2 : clearOf
  // A rectangle reaching within a margin of the top edge leaves nowhere to lift
  // to. Resting the place on the edge is a poor answer and an off-screen place
  // is not an answer at all.
  const target = Math.max(0, Math.min(surface.height, strip))

  return surface.height / 2 - target
}

/**
 * The zoom one press of a zoom control arrives at, clamped to our range.
 *
 * One line of arithmetic, and still shared. The range is ours rather than the
 * renderer's — `maplibre-gl` defaults to 0–22 and would happily let a wheel
 * leave the camera somewhere `fitBounds` can never return to — so the clamp has
 * to be the same one for every instrument on both platforms. A button written
 * as `zoom + 1` in an application is a second opinion about where the range
 * ends, which is the shape the marker-anchor drift defect had.
 *
 * Total: a `current` already outside the range comes back inside it, in either
 * direction, rather than being stepped further out.
 */
export function zoomStep(current: number, direction: 1 | -1): number {
  const stepped = current + direction * ZOOM_STEP
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, stepped))
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
