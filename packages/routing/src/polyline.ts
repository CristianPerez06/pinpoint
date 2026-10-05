import type { LngLat } from '@pinpoint/map'

/**
 * Decodes an encoded polyline into points.
 *
 * Valhalla returns its line in Google's encoded-polyline format at six decimal
 * places rather than the usual five. Each coordinate is a zig-zag-encoded
 * difference from the one before, split into five-bit chunks offset by 63 so
 * they are printable. Pure arithmetic, so it lives here rather than in a
 * library.
 */
export function decodePolyline(encoded: string, precision = 6): LngLat[] {
  const factor = 10 ** precision
  const points: LngLat[] = []
  let index = 0
  let lat = 0
  let lng = 0

  function next(): number | null {
    let result = 0
    let shift = 0
    let byte: number
    do {
      if (index >= encoded.length) return null
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    return result & 1 ? ~(result >> 1) : result >> 1
  }

  while (index < encoded.length) {
    const dLat = next()
    const dLng = next()
    if (dLat === null || dLng === null) break
    lat += dLat
    lng += dLng
    points.push({ lng: lng / factor, lat: lat / factor })
  }
  return points
}
