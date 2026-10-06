import type { LngLat, TravelMode } from '@pinpoint/map'

/**
 * The maps apps a route can be continued in (`place-route`).
 *
 * `geo` is not an app but Android's way of handing a place to whichever maps
 * app the device prefers, or of asking which.
 */
export type HandoffApp = 'google' | 'apple' | 'geo'

/** Google Maps' name for each way of travelling. */
const GOOGLE_MODE: Readonly<Record<TravelMode, string>> = {
  walk: 'walking',
  bike: 'bicycling',
  car: 'driving',
}

/**
 * Apple Maps' name for each way of travelling, where it has one. It takes no
 * cycling flag, so a bike route goes across as the destination alone.
 */
const APPLE_MODE: Readonly<Record<TravelMode, string | null>> = {
  walk: 'w',
  bike: null,
  car: 'd',
}

/**
 * The address that opens a route to `to` in another maps app.
 *
 * Only the destination and the way of travelling are carried: never the
 * person's position (`device-location`). The other app finds where they are
 * and plans its own way there.
 *
 * Google's is its `https` directions address rather than a scheme of its own,
 * because that address is a universal link: the app opens it when installed,
 * and a browser opens it when not, so choosing Google Maps always opens
 * something without asking the device what is installed. This opens a link; it
 * uses no service of Google's on Pinpoint's behalf.
 *
 * `name` labels the place in a `geo:` address, which is the only one of the
 * three that shows a label it is given.
 */
export function handoffUrl(app: HandoffApp, to: LngLat, mode: TravelMode, name?: string): string {
  const at = `${to.lat},${to.lng}`
  switch (app) {
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${at}&travelmode=${GOOGLE_MODE[mode]}`
    case 'apple': {
      const flag = APPLE_MODE[mode]
      return `https://maps.apple.com/?daddr=${at}${flag ? `&dirflg=${flag}` : ''}`
    }
    case 'geo':
      return `geo:${at}?q=${at}${name ? `(${label(name)})` : ''}`
  }
}

/**
 * A name made safe for a `geo:` label, which is closed by the first `)` it
 * meets. `encodeURIComponent` leaves brackets alone, so they are encoded here.
 */
function label(name: string): string {
  return encodeURIComponent(name).replace(/\(/g, '%28').replace(/\)/g, '%29')
}
