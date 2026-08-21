import { describe, expect, it } from 'vitest'

import {
  boundsOf,
  boundsWidth,
  fitBounds,
  normalizeLongitude,
  offsetCenter,
} from './camera'
import { DEFAULT_CAMERA, MAX_ZOOM, SINGLE_MARKER_ZOOM } from './constants'

describe('normalizeLongitude', () => {
  it('leaves in-range values alone', () => {
    expect(normalizeLongitude(0)).toBe(0)
    expect(normalizeLongitude(-179)).toBe(-179)
    expect(normalizeLongitude(179)).toBe(179)
  })

  it('wraps values past the antimeridian', () => {
    expect(normalizeLongitude(181)).toBe(-179)
    expect(normalizeLongitude(-181)).toBe(179)
    expect(normalizeLongitude(540)).toBe(-180)
  })
})

describe('boundsOf', () => {
  it('returns null for no points', () => {
    expect(boundsOf([])).toBeNull()
  })

  it('returns a degenerate box for one point', () => {
    expect(boundsOf([{ lng: 10, lat: 20 }])).toEqual({
      west: 10,
      south: 20,
      east: 10,
      north: 20,
    })
  })

  it('spans the shortest arc, not the widest', () => {
    const bounds = boundsOf([
      { lng: -10, lat: 0 },
      { lng: 10, lat: 5 },
    ])
    expect(bounds).toEqual({ west: -10, south: 0, east: 10, north: 5 })
    expect(boundsWidth(bounds!)).toBe(20)
  })

  it('crosses the antimeridian rather than wrapping the long way', () => {
    const bounds = boundsOf([
      { lng: 179, lat: -10 },
      { lng: -179, lat: 10 },
    ])
    // west > east is the convention for a box crossing 180.
    expect(bounds).toEqual({ west: 179, south: -10, east: -179, north: 10 })
    expect(boundsWidth(bounds!)).toBe(2)
  })

  it('keeps a genuinely wide spread wide', () => {
    const bounds = boundsOf([
      { lng: -120, lat: 0 },
      { lng: 0, lat: 0 },
      { lng: 120, lat: 0 },
    ])
    expect(boundsWidth(bounds!)).toBe(240)
  })
})

describe('fitBounds', () => {
  it('falls back to the default camera with no markers', () => {
    expect(fitBounds([])).toEqual(DEFAULT_CAMERA)
  })

  it('centres on a single marker at a usable zoom', () => {
    const camera = fitBounds([{ lng: 139.7, lat: 35.7 }])
    expect(camera.center).toEqual({ lng: 139.7, lat: 35.7 })
    expect(camera.zoom).toBe(SINGLE_MARKER_ZOOM)
  })

  it('treats several markers on the same spot as a single marker', () => {
    const camera = fitBounds([
      { lng: 5, lat: 5 },
      { lng: 5, lat: 5 },
    ])
    expect(camera.zoom).toBe(SINGLE_MARKER_ZOOM)
  })

  it('centres between two markers', () => {
    const camera = fitBounds([
      { lng: -10, lat: -10 },
      { lng: 10, lat: 10 },
    ])
    expect(camera.center.lng).toBeCloseTo(0, 10)
    expect(camera.center.lat).toBeCloseTo(0, 10)
  })

  it('centres across the antimeridian instead of on the far side', () => {
    const camera = fitBounds([
      { lng: 179, lat: 0 },
      { lng: -179, lat: 0 },
    ])
    // The midpoint is 180 / -180, not 0.
    expect(Math.abs(camera.center.lng)).toBeCloseTo(180, 10)
  })

  it('zooms out further for a wider spread', () => {
    const tight = fitBounds([
      { lng: -1, lat: -1 },
      { lng: 1, lat: 1 },
    ])
    const wide = fitBounds([
      { lng: -60, lat: -40 },
      { lng: 60, lat: 40 },
    ])
    expect(wide.zoom).toBeLessThan(tight.zoom)
  })

  it('respects the zoom ceiling', () => {
    const camera = fitBounds(
      [
        { lng: 0, lat: 0 },
        { lng: 0.00001, lat: 0.00001 },
      ],
      { maxZoom: 12 },
    )
    expect(camera.zoom).toBe(12)
  })

  it('never exceeds the global maximum', () => {
    const camera = fitBounds([
      { lng: 0, lat: 0 },
      { lng: 0.000001, lat: 0.000001 },
    ])
    expect(camera.zoom).toBeLessThanOrEqual(MAX_ZOOM)
  })

  it('zooms out when the viewport is smaller', () => {
    const markers = [
      { lng: -20, lat: -20 },
      { lng: 20, lat: 20 },
    ]
    const large = fitBounds(markers, { viewport: { width: 2048, height: 1536 } })
    const small = fitBounds(markers, { viewport: { width: 320, height: 480 } })
    expect(small.zoom).toBeLessThan(large.zoom)
  })

  it('zooms out as padding grows', () => {
    const markers = [
      { lng: -20, lat: -20 },
      { lng: 20, lat: 20 },
    ]
    const none = fitBounds(markers, { padding: 0 })
    const lots = fitBounds(markers, { padding: 0.4 })
    expect(lots.zoom).toBeLessThan(none.zoom)
  })

  it('survives poles without producing a non-finite zoom', () => {
    const camera = fitBounds([
      { lng: -170, lat: -89 },
      { lng: 170, lat: 89 },
    ])
    expect(Number.isFinite(camera.zoom)).toBe(true)
  })
})

describe('offsetCenter', () => {
  const kyoto = { lng: 135.7681, lat: 35.0116 }

  it('returns the same point for no offset', () => {
    const same = offsetCenter(kyoto, 14, 0, 0)
    expect(same.lng).toBeCloseTo(kyoto.lng, 10)
    expect(same.lat).toBeCloseTo(kyoto.lat, 10)
  })

  it('moves the centre south when the offset is down the screen', () => {
    // The sign is the whole point of this function: a positive `dy` pushes the
    // centre down the screen, which is what lifts the drawn point clear of a
    // sheet covering the bottom. Getting it backwards hides the pin *further*,
    // and looks exactly as plausible.
    const shifted = offsetCenter(kyoto, 14, 0, 200)
    expect(shifted.lat).toBeLessThan(kyoto.lat)
    expect(shifted.lng).toBeCloseTo(kyoto.lng, 10)
  })

  it('moves the centre east when the offset is right', () => {
    const shifted = offsetCenter(kyoto, 14, 200, 0)
    expect(shifted.lng).toBeGreaterThan(kyoto.lng)
    expect(shifted.lat).toBeCloseTo(kyoto.lat, 10)
  })

  it('is reversible', () => {
    const there = offsetCenter(kyoto, 14, 120, 260)
    const back = offsetCenter(there, 14, -120, -260)
    expect(back.lng).toBeCloseTo(kyoto.lng, 9)
    expect(back.lat).toBeCloseTo(kyoto.lat, 9)
  })

  it('moves less ground per pixel as the zoom increases', () => {
    const far = offsetCenter(kyoto, 10, 0, 256)
    const near = offsetCenter(kyoto, 16, 0, 256)
    expect(kyoto.lat - far.lat).toBeGreaterThan(kyoto.lat - near.lat)
  })

  it('halves the ground covered for each zoom level gained', () => {
    // One tile is TILE_SIZE pixels at every zoom, so the same pixel offset must
    // cover exactly half the distance one level in.
    const coarse = kyoto.lat - offsetCenter(kyoto, 10, 0, 256).lat
    const fine = kyoto.lat - offsetCenter(kyoto, 11, 0, 256).lat
    expect(coarse / fine).toBeCloseTo(2, 2)
  })

  it('stays a real latitude when pushed past the projection edge', () => {
    // A small viewport at zoom 0 can ask for an offset that runs off the top of
    // the world. That has to land at the pole rather than returning NaN.
    const overshot = offsetCenter(kyoto, 0, 0, -100_000)
    expect(Number.isFinite(overshot.lat)).toBe(true)
    expect(overshot.lat).toBeGreaterThan(80)
    expect(overshot.lat).toBeLessThanOrEqual(90)
  })

  it('wraps longitude rather than running off the end of the world', () => {
    const nearEdge = { lng: 179.9, lat: 0 }
    const past = offsetCenter(nearEdge, 8, 5_000, 0)
    expect(past.lng).toBeGreaterThanOrEqual(-180)
    expect(past.lng).toBeLessThan(180)
  })
})
