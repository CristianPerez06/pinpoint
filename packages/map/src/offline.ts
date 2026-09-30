import { boundsOf, fitBounds, normalizeLongitude, withinBounds } from './camera'
import { distanceKm } from './distance'
import type { Bounds, LngLat, Viewport } from './types'

/**
 * The map around a trip's places, cut into pieces a phone can download ahead of
 * time (`offline-use`).
 *
 * Pure arithmetic over coordinates, like the camera beside it. The phone hands
 * the result to its renderer's offline downloads; nothing here knows there is
 * one.
 */

/** The highest zoom OpenFreeMap serves. The renderer enlarges it to street level. */
export const OFFLINE_MAX_ZOOM = 14

/**
 * How close a place must be to one already in a group to join it.
 *
 * Single-link, so a group follows a city's shape — a line of places along a
 * river stays one area — while two cities with countryside between them never
 * share a box.
 *
 * Places join only places filed under the same city. Within a city the reach
 * is wide, because a city's outlying places — a theme park, a shrine on an
 * island across the bay — are still that city to the person, and splitting them
 * off lists the city three times. With no city to go by, the reach is short, so
 * a scatter of unfiled places is not boxed together across a region.
 */
const JOIN_KM_IN_CITY = 25
const JOIN_KM_NO_CITY = 5

/** Streets beyond the outermost place, so the walk to it is on the map too. */
const MARGIN_KM = 1

/** The screen an area should fill at its lowest downloaded zoom. */
const PHONE: Viewport = { width: 390, height: 844 }

const KM_PER_DEGREE = 111.32

export interface OfflinePlace extends LngLat {
  cityId: string | null
}

export interface OfflineArea {
  /** Stable for the same places; what a download is tagged with. */
  key: string
  bounds: Bounds
  /** The city its places are filed under, or null when they have none. */
  cityId: string | null
  placeCount: number
  /** The zoom at which the whole area fits a phone screen, less one. */
  minZoom: number
}

/**
 * Group places near each other into areas, largest first.
 *
 * An area is never a box drawn around places far apart: that box would be
 * mostly the land between them, and at street level the land between two cities
 * is most of a download.
 */
export function offlineAreas(places: readonly OfflinePlace[]): OfflineArea[] {
  const parent = places.map((_, i) => i)
  const root = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!
      i = parent[i]!
    }
    return i
  }

  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const a = places[i]!
      const b = places[j]!
      if (a.cityId !== b.cityId) continue
      const reach = a.cityId === null ? JOIN_KM_NO_CITY : JOIN_KM_IN_CITY
      if (distanceKm(a, b) <= reach) {
        parent[root(i)] = root(j)
      }
    }
  }

  const groups = new Map<number, OfflinePlace[]>()
  places.forEach((place, i) => {
    const r = root(i)
    const group = groups.get(r)
    if (group) group.push(place)
    else groups.set(r, [place])
  })

  return [...groups.values()]
    .map((group) => {
      const bounds = withMargin(boundsOf(group)!, MARGIN_KM)
      return {
        key: keyOf(bounds),
        bounds,
        cityId: group[0]!.cityId,
        placeCount: group.length,
        minZoom: minZoomFor(bounds),
      }
    })
    .sort((a, b) => b.placeCount - a.placeCount || a.key.localeCompare(b.key))
}

/**
 * The areas a trip still needs, given what is already downloaded.
 *
 * Worked out from places rather than by comparing keys. A place added inside a
 * downloaded city moves that city's bounds by a few metres and so its key, and
 * comparing keys would then call the whole city new and download it again.
 */
export function newOfflineAreas(
  places: readonly OfflinePlace[],
  downloaded: readonly Bounds[],
): OfflineArea[] {
  return offlineAreas(
    places.filter((place) => !downloaded.some((bounds) => withinBounds(bounds, place))),
  )
}

/**
 * How many tiles cover an area from its lowest zoom up to the highest served.
 *
 * Counted per zoom on the standard grid, which is the one the tile addresses use
 * whatever size the tiles are drawn at.
 */
export function tileCount(
  bounds: Bounds,
  minZoom: number,
  maxZoom: number = OFFLINE_MAX_ZOOM,
): number {
  let count = 0
  for (let z = Math.max(0, Math.floor(minZoom)); z <= maxZoom; z++) {
    const n = 2 ** z
    const x0 = tileX(bounds.west, n)
    const x1 = tileX(bounds.east, n)
    const columns = x1 >= x0 ? x1 - x0 + 1 : n - x0 + x1 + 1
    const rows = tileY(bounds.south, n) - tileY(bounds.north, n) + 1
    count += columns * rows
  }
  return count
}

/**
 * Average compressed bytes per tile, across every zoom of a download.
 *
 * Measured, not derived — see the change's design for the cities and numbers.
 * The screen says *about* because a city's density moves this by a factor of
 * several either way.
 */
export const AVERAGE_TILE_BYTES = 200_000

/**
 * The fonts and icons the style names, downloaded once for every area.
 *
 * Measured with the first real download (2026-09-30): every pack held the same
 * 395 resources, 18 MB, because the renderer stores the whole range of every
 * font the style uses. They are on the phone once, however many areas share
 * them, so a total counts them once and an area's own size leaves them out.
 */
export const STYLE_ASSETS_BYTES = 18_000_000

/** Roughly how much an area's own streets weigh once downloaded. */
export function estimateBytes(area: Pick<OfflineArea, 'bounds' | 'minZoom'>): number {
  return tileCount(area.bounds, area.minZoom) * AVERAGE_TILE_BYTES
}

/**
 * The whole trip at low zoom: the land, coasts and larger names under every pin.
 *
 * What the map opens on is every place at once, and the areas start at city
 * zoom, so without this the first thing a phone with no signal shows is pins on
 * an empty ground. From zoom 0 to one above the zoom where every place fits a
 * phone screen — for a trip across Japan, zoom 0–6, a few dozen tiles — so the
 * view the map opens on, and a step in, both draw.
 *
 * Not an area: nothing lists it, and what is new is never decided against it,
 * because it covers every place.
 */
export interface OfflineOverview {
  key: string
  bounds: Bounds
  maxZoom: number
}

/** Margin round the whole trip, wide enough that a coast near a pin is on it. */
const OVERVIEW_MARGIN_KM = 10

export function offlineOverview(places: readonly LngLat[]): OfflineOverview | null {
  const inner = boundsOf(places)
  if (inner === null) return null
  const bounds = withMargin(inner, OVERVIEW_MARGIN_KM)
  const fit = minZoomFor(bounds) + 1
  return {
    key: `overview:${keyOf(bounds)}`,
    bounds,
    maxZoom: Math.min(OFFLINE_MAX_ZOOM, fit + 1),
  }
}

/**
 * Average compressed bytes per tile at the zooms an overview spans.
 *
 * Measured over Japan at zoom 0–6 on the 0927 edition — see the change's design.
 */
export const AVERAGE_OVERVIEW_TILE_BYTES = 150_000

export function estimateOverviewBytes(overview: OfflineOverview): number {
  return tileCount(overview.bounds, 0, overview.maxZoom) * AVERAGE_OVERVIEW_TILE_BYTES
}

function tileX(lng: number, n: number): number {
  const x = Math.floor(((normalizeLongitude(lng) + 180) / 360) * n)
  return Math.min(n - 1, Math.max(0, x))
}

function tileY(lat: number, n: number): number {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat))
  const rad = (clamped * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n)
  return Math.min(n - 1, Math.max(0, y))
}

function withMargin(bounds: Bounds, km: number): Bounds {
  const dLat = km / KM_PER_DEGREE
  const south = Math.max(-85, bounds.south - dLat)
  const north = Math.min(85, bounds.north + dLat)
  // A degree of longitude shrinks towards the poles, so the margin is measured
  // at the edge where it is shortest and is at least a kilometre everywhere.
  const widestLat = Math.max(Math.abs(south), Math.abs(north))
  const dLng = km / (KM_PER_DEGREE * Math.cos((widestLat * Math.PI) / 180))
  return {
    west: normalizeLongitude(bounds.west - dLng),
    south,
    east: normalizeLongitude(bounds.east + dLng),
    north,
  }
}

function minZoomFor(bounds: Bounds): number {
  const { zoom } = fitBounds(
    [
      { lng: bounds.west, lat: bounds.south },
      { lng: bounds.east, lat: bounds.north },
    ],
    { viewport: PHONE, padding: 0 },
  )
  return Math.max(0, Math.min(OFFLINE_MAX_ZOOM, Math.floor(zoom) - 1))
}

function keyOf(bounds: Bounds): string {
  return [bounds.west, bounds.south, bounds.east, bounds.north]
    .map((edge) => edge.toFixed(3))
    .join(',')
}

