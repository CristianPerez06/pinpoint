import type { Camera, Viewport } from './types'

/**
 * Tile size assumed when deriving zoom. MapLibre serves 512px tiles on both
 * web and native, so this is shared rather than per-platform.
 */
export const TILE_SIZE = 512

export const MIN_ZOOM = 0
export const MAX_ZOOM = 20

/**
 * Where the map opens with nothing to show. Deliberately a world view and not
 * tied to any one trip — the product is not region-specific.
 */
export const DEFAULT_CAMERA: Camera = {
  center: { lng: 0, lat: 20 },
  zoom: 1,
}

/** Zoom used when framing a single point, where a bounding box has no extent. */
export const SINGLE_MARKER_ZOOM = 14

/**
 * Fallback viewport for callers that have not measured one yet. Real callers
 * should pass their actual surface size; this keeps the function total.
 */
export const DEFAULT_VIEWPORT: Viewport = { width: 1024, height: 768 }

/** Fraction of the viewport kept clear around the framed markers, per edge. */
export const DEFAULT_PADDING = 0.1

/**
 * How far one press of a zoom control moves the camera.
 *
 * A whole level, which is the doubling both renderers' own controls use. Named
 * here rather than written at the two call sites for the reason the range is:
 * a step is part of what zooming *means* in this product, and two applications
 * each choosing their own is exactly where the marker-anchor drift defect
 * lived.
 */
export const ZOOM_STEP = 1
