import { describe, expect, it } from 'vitest'

import {
  boundsOf,
  boundsWidth,
  coveredBandHeight,
  fitBounds,
  liftOffset,
  normalizeLongitude,
  offsetCenter,
  zoomStep,
} from './camera'
import {
  DEFAULT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  SINGLE_MARKER_ZOOM,
  ZOOM_STEP,
} from './constants'

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

describe('zoomStep', () => {
  it('moves one whole level in the direction asked for', () => {
    expect(zoomStep(12, 1)).toBe(12 + ZOOM_STEP)
    expect(zoomStep(12, -1)).toBe(12 - ZOOM_STEP)
  })

  it('keeps a fractional zoom fractional', () => {
    // A wheel, a pinch and `fitBounds` all leave the camera between levels, and
    // a button pressed from there should move by a step rather than snap to one.
    expect(zoomStep(11.4, 1)).toBeCloseTo(12.4, 10)
  })

  it('stops at the top of our range rather than the renderer’s', () => {
    // `maplibre-gl` would go to 22. Ours ends at 20, and `fitBounds` never
    // returns more than that, so a button must not either.
    expect(zoomStep(MAX_ZOOM, 1)).toBe(MAX_ZOOM)
    expect(zoomStep(MAX_ZOOM - 0.5, 1)).toBe(MAX_ZOOM)
  })

  it('stops at the bottom of our range', () => {
    expect(zoomStep(MIN_ZOOM, -1)).toBe(MIN_ZOOM)
    expect(zoomStep(MIN_ZOOM + 0.5, -1)).toBe(MIN_ZOOM)
  })

  it('returns the zoom it was given once the range is spent', () => {
    // What the applications read to know a control can do nothing: a step that
    // arrives where it started is a control with nothing left to do.
    expect(zoomStep(MAX_ZOOM, 1)).toBe(MAX_ZOOM)
    expect(zoomStep(MIN_ZOOM, -1)).toBe(MIN_ZOOM)
  })

  it('brings a zoom from outside the range back inside it, either way', () => {
    // Nothing in the product should produce one, but a persisted camera or a
    // renderer default could. Stepping must not carry it further out.
    expect(zoomStep(22, 1)).toBe(MAX_ZOOM)
    expect(zoomStep(22, -1)).toBe(MAX_ZOOM)
    expect(zoomStep(-3, -1)).toBe(MIN_ZOOM)
    expect(zoomStep(-3, 1)).toBe(MIN_ZOOM)
  })
})

/*
 * The degenerate viewport, which is reachable rather than theoretical.
 *
 * A web browser at a phone width puts a sheet over the bottom of the map and
 * frames against the strip that is left. On a short landscape viewport that
 * strip can be driven to nothing, and the arithmetic here divides by it — so
 * this is the boundary where a camera stops being a camera. It fails silently
 * if it fails at all: `NaN` handed to either renderer neither throws nor logs,
 * and it reads as the map failing to load.
 */
describe('fitBounds with a viewport that has been squeezed', () => {
  const spread = [
    { lng: 135.7, lat: 35.0 },
    { lng: 135.8, lat: 35.1 },
  ]

  it('returns a usable zoom when the viewport has no height left', () => {
    const camera = fitBounds(spread, { viewport: { width: 390, height: 0 } })

    expect(Number.isFinite(camera.zoom)).toBe(true)
    expect(camera.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
    expect(camera.zoom).toBeLessThanOrEqual(MAX_ZOOM)
  })

  it('returns a usable zoom when the viewport has no width left', () => {
    const camera = fitBounds(spread, { viewport: { width: 0, height: 740 } })

    expect(Number.isFinite(camera.zoom)).toBe(true)
    expect(camera.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
  })

  it('keeps the centre finite whatever the viewport', () => {
    const camera = fitBounds(spread, { viewport: { width: 0, height: 0 } })

    expect(Number.isFinite(camera.center.lng)).toBe(true)
    expect(Number.isFinite(camera.center.lat)).toBe(true)
  })

  it('zooms out rather than in as the visible strip shrinks', () => {
    const whole = fitBounds(spread, { viewport: { width: 390, height: 740 } })
    const strip = fitBounds(spread, { viewport: { width: 390, height: 260 } })

    expect(strip.zoom).toBeLessThanOrEqual(whole.zoom)
  })
})

/*
 * The readings these are written from, taken out of the running web application
 * before it was fixed. A 1470px window: the map 614px tall, a toolbar in the bar
 * above it reporting an overlap of 664 and a save form in the bottom-left corner
 * reporting 446. `floor` was 664 on a 614px map, and a pin dropped in the middle
 * of it landed 25px above the top edge.
 *
 * Each case below is one of those, expressed as a rectangle.
 */
const LAPTOP = { width: 1470, height: 614 }
const PHONE = { width: 390, height: 572 }

/** The save form on a laptop: a card in the bottom-left, inset from both edges. */
const CARD = { top: 168, left: 16, right: 344, bottom: 598 }
/** The toolbar on a phone: flush to both edges, standing on the floor. */
const BAR = { top: 505, left: 0, right: 390, bottom: 572 }

describe('coveredBandHeight', () => {
  it('is zero when nothing covers the map', () => {
    expect(coveredBandHeight(null, LAPTOP)).toBe(0)
  })

  it('is zero for a card that does not reach across the map', () => {
    expect(coveredBandHeight(CARD, LAPTOP)).toBe(0)
  })

  it('is the strip below its top edge for a bar that does reach across', () => {
    expect(coveredBandHeight(BAR, PHONE)).toBe(67)
  })

  it('never exceeds the map it is measured against', () => {
    const taller = { top: -200, left: 0, right: 390, bottom: 572 }

    expect(coveredBandHeight(taller, PHONE)).toBe(PHONE.height)
  })

  it('tolerates sub-pixel layout at the edges', () => {
    const flush = { top: 505, left: 0.4, right: 389.6, bottom: 572 }

    expect(coveredBandHeight(flush, PHONE)).toBe(67)
  })
})

describe('liftOffset', () => {
  it('does not move the camera when nothing covers the map', () => {
    expect(liftOffset({ x: 700, y: 300 }, null, LAPTOP, 32)).toBeNull()
  })

  it('does not move the camera for a place beside the card', () => {
    // The defect: a pin dropped on the right-hand side of a laptop map was
    // lifted to clear a 328px card it was never behind.
    expect(liftOffset({ x: 900, y: 500 }, CARD, LAPTOP, 32)).toBeNull()
  })

  it('does not move the camera for a place already clear of what covers it', () => {
    expect(liftOffset({ x: 100, y: 100 }, CARD, LAPTOP, 32)).toBeNull()
    expect(liftOffset({ x: 100, y: 400 }, BAR, PHONE, 32)).toBeNull()
  })

  it('lifts a place behind the card by the least that clears it', () => {
    const dy = liftOffset({ x: 100, y: 500 }, CARD, LAPTOP, 32)

    // The place lands at `height / 2 - dy`, which is the card's top edge less
    // the margin — just clear of it, rather than in the middle of the map.
    expect(dy).not.toBeNull()
    expect(LAPTOP.height / 2 - dy!).toBe(CARD.top - 32)
  })

  it('centres a place in the strip a full-width bar leaves', () => {
    const dy = liftOffset({ x: 100, y: 540 }, BAR, PHONE, 32)

    expect(PHONE.height / 2 - dy!).toBe(BAR.top / 2)
  })

  it('matches what the phone shape did before, for a bar', () => {
    // The offset the old code applied was half the covered height, and this is
    // the case it was right for. Holding it here is what says the phone shape's
    // behaviour did not change.
    const dy = liftOffset({ x: 100, y: 540 }, BAR, PHONE, 32)

    expect(dy).toBe(coveredBandHeight(BAR, PHONE) / 2)
  })

  it('never carries a place off the map', () => {
    const surfaces = [LAPTOP, PHONE]
    const rects = [
      CARD,
      BAR,
      // Chrome taller than the map, which is what the defect produced.
      { top: -50, left: 0, right: 390, bottom: 572 },
      // A card reaching within the margin of the top edge, leaving no strip.
      { top: 8, left: 16, right: 344, bottom: 598 },
    ]

    for (const surface of surfaces) {
      for (const covered of rects) {
        for (let y = 0; y <= surface.height; y += 19) {
          for (const x of [0, covered.left + 1, surface.width - 1]) {
            const dy = liftOffset({ x, y }, covered, surface, 32)
            if (dy === null) continue

            const landsAt = surface.height / 2 - dy
            expect(landsAt).toBeGreaterThanOrEqual(0)
            expect(landsAt).toBeLessThanOrEqual(surface.height)
          }
        }
      }
    }
  })
})
