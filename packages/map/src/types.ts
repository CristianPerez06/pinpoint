/**
 * Geometry and camera types shared by every platform.
 *
 * These are deliberately structural and minimal. `@pinpoint/core` defines the
 * richer domain `Marker`; anything carrying `lng` and `lat` satisfies `LngLat`,
 * so this package never needs to depend on it.
 */

export interface LngLat {
  lng: number
  lat: number
}

/** A bounding box in degrees. `west` may be greater than `east` when the box crosses the antimeridian. */
export interface Bounds {
  west: number
  south: number
  east: number
  north: number
}

/** Pixel dimensions of the surface the map is drawn into. */
export interface Viewport {
  width: number
  height: number
}

/** A camera position. Both platforms accept this shape after trivial mapping. */
export interface Camera {
  center: LngLat
  zoom: number
}
