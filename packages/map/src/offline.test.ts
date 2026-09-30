import { describe, expect, it } from 'vitest'

import { withinBounds } from './camera'
import {
  estimateBytes,
  newOfflineAreas,
  OFFLINE_MAX_ZOOM,
  offlineAreas,
  offlineOverview,
  tileCount,
  type OfflinePlace,
} from './offline'

const place = (lng: number, lat: number, cityId: string | null = null): OfflinePlace => ({
  lng,
  lat,
  cityId,
})

// A few places around central Tokyo, each within a couple of km of the next.
const TOKYO = [
  place(139.7671, 35.6812, 'tokyo'), // Tokyo Station
  place(139.7745, 35.6717, 'tokyo'), // Ginza
  place(139.7966, 35.7148, 'tokyo'), // Senso-ji
  place(139.7774, 35.7138, 'tokyo'), // Ueno
]
const KYOTO = [
  place(135.7681, 35.0116, 'kyoto'),
  place(135.7727, 34.9949, 'kyoto'),
]

describe('offlineAreas', () => {
  it('keeps two cities far apart as two areas that do not overlap', () => {
    const areas = offlineAreas([...TOKYO, ...KYOTO])
    expect(areas).toHaveLength(2)
    const [tokyo, kyoto] = areas
    expect(tokyo!.bounds.west).toBeGreaterThan(kyoto!.bounds.east)
    // The land between them is in neither.
    const between = { lng: 137.5, lat: 35.3 }
    expect(areas.some((area) => withinBounds(area.bounds, between))).toBe(false)
  })

  it('joins nearby places into one area', () => {
    expect(offlineAreas(TOKYO)).toHaveLength(1)
  })

  it('joins a chain whose ends are further apart than the joining distance', () => {
    // Three places 4 km apart in a line: the ends are 8 km apart.
    const chain = [place(0, 0), place(0.036, 0), place(0.072, 0)]
    expect(offlineAreas(chain)).toHaveLength(1)
  })

  it('leaves a margin around every place', () => {
    const [area] = offlineAreas(TOKYO)
    for (const p of TOKYO) {
      expect(withinBounds(area!.bounds, { lng: p.lng + 0.008, lat: p.lat })).toBe(true)
      expect(withinBounds(area!.bounds, { lng: p.lng, lat: p.lat - 0.008 })).toBe(true)
    }
  })

  it('gives a single place an area of its own', () => {
    const [area] = offlineAreas([place(139.7, 35.6)])
    expect(area!.placeCount).toBe(1)
    expect(area!.bounds.north).toBeGreaterThan(area!.bounds.south)
    expect(area!.minZoom).toBeLessThanOrEqual(OFFLINE_MAX_ZOOM)
  })

  it('names an area by its city', () => {
    const [area] = offlineAreas(TOKYO)
    expect(area!.cityId).toBe('tokyo')
  })

  it('keeps a city whole across its outlying places', () => {
    // Universal Studios is about 10 km from central Osaka, and still Osaka.
    const osaka = [place(135.5023, 34.6937, 'osaka'), place(135.4323, 34.6654, 'osaka')]
    expect(offlineAreas(osaka)).toHaveLength(1)
  })

  it('never joins places filed under different cities', () => {
    const near = [place(139.7, 35.6, 'a'), place(139.71, 35.6, 'b')]
    expect(offlineAreas(near)).toHaveLength(2)
  })

  it('joins places with no city only when they are close', () => {
    // About 10 km apart: one city's reach, but not an unfiled one's.
    const scattered = [place(135.5023, 34.6937), place(135.4323, 34.6654)]
    expect(offlineAreas(scattered)).toHaveLength(2)
  })

  it('leaves the city empty when no place has one', () => {
    const [area] = offlineAreas([place(139.7, 35.6), place(139.71, 35.6)])
    expect(area!.cityId).toBeNull()
    expect(area!.placeCount).toBe(2)
  })

  it('lists the largest area first', () => {
    const areas = offlineAreas([...KYOTO, ...TOKYO])
    expect(areas.map((area) => area.cityId)).toEqual(['tokyo', 'kyoto'])
  })

  it('gives the same places the same keys', () => {
    const once = offlineAreas([...TOKYO, ...KYOTO]).map((area) => area.key)
    const again = offlineAreas([...KYOTO, ...TOKYO].reverse()).map((area) => area.key)
    expect(again).toEqual(once)
  })

  it('handles no places', () => {
    expect(offlineAreas([])).toEqual([])
  })
})

describe('newOfflineAreas', () => {
  const downloaded = offlineAreas(TOKYO).map((area) => area.bounds)

  it('calls every area new when nothing is downloaded', () => {
    expect(newOfflineAreas([...TOKYO, ...KYOTO], [])).toHaveLength(2)
  })

  it('does not count a place inside a downloaded area', () => {
    const inside = place(139.775, 35.69, 'tokyo')
    expect(newOfflineAreas([...TOKYO, inside], downloaded)).toEqual([])
  })

  it('makes one new area for a place far away', () => {
    const areas = newOfflineAreas([...TOKYO, ...KYOTO], downloaded)
    expect(areas).toHaveLength(1)
    expect(areas[0]!.cityId).toBe('kyoto')
  })
})

describe('tileCount', () => {
  it('counts one tile per zoom for a box inside a single zoom-14 tile', () => {
    // Zoom-14 tile 14552/6451 spans roughly 139.746–139.768 E, 35.675–35.693 N.
    // Worked by hand: a box well inside it is one tile at every zoom 0–14.
    const bounds = { west: 139.75, south: 35.68, east: 139.76, north: 35.69 }
    expect(tileCount(bounds, 0)).toBe(15)
    expect(tileCount(bounds, 10)).toBe(5)
  })

  it('counts columns across the antimeridian', () => {
    const bounds = { west: 179.99, south: 0.01, east: -179.99, north: 0.02 }
    // Two columns at every zoom from 1 up; one at zoom 0, where one tile is the world.
    expect(tileCount(bounds, 0)).toBe(1 + 2 * OFFLINE_MAX_ZOOM)
  })
})

describe('estimateBytes', () => {
  it('grows with the area', () => {
    const [small] = offlineAreas(KYOTO)
    const [large] = offlineAreas(TOKYO)
    expect(estimateBytes(large!)).toBeGreaterThan(estimateBytes(small!))
  })
})

describe('offlineOverview', () => {
  const overview = offlineOverview([...TOKYO, ...KYOTO])!

  it('covers every place', () => {
    for (const p of [...TOKYO, ...KYOTO]) expect(withinBounds(overview.bounds, p)).toBe(true)
  })

  it('stops well short of street level', () => {
    // Tokyo to Kyoto fits a phone at about zoom 6.
    expect(overview.maxZoom).toBeGreaterThanOrEqual(6)
    expect(overview.maxZoom).toBeLessThanOrEqual(8)
  })

  it('is a few dozen tiles, not thousands', () => {
    expect(tileCount(overview.bounds, 0, overview.maxZoom)).toBeLessThan(80)
  })

  it('is never mistaken for an area', () => {
    expect(overview.key.startsWith('overview:')).toBe(true)
  })

  it('handles no places', () => {
    expect(offlineOverview([])).toBeNull()
  })
})
