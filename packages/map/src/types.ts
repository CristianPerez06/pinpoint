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

/**
 * A rectangle in the map surface's own coordinates: `0, 0` is its top-left
 * corner, not the window's.
 *
 * Map-local rather than window-relative on purpose. The application measures
 * chrome against the page, where the map's own offset is a fact it already has
 * and nothing downstream should have to be told. Handing the camera a rectangle
 * still expressed against the window is how a subtraction ends up reaching past
 * the map's own top edge, which is exactly the defect this type was added to
 * make unrepresentable.
 *
 * Numbers, not a `DOMRect`. The application does the measuring; this package
 * carries no DOM API.
 */
export interface Rect {
  top: number
  left: number
  right: number
  bottom: number
}

/** A camera position. Both platforms accept this shape after trivial mapping. */
export interface Camera {
  center: LngLat
  zoom: number
}
