import { describe, expect, it } from 'vitest'

import walk from './fixtures/valhalla-walk.json'
import { buildStadiaUrl, STADIA_ENDPOINT } from './stadia'
import { buildValhallaUrl, isValhallaNoRoute, parseValhalla } from './valhalla'

const KIYOMIZU = { lng: 135.785, lat: 34.9948 }
const INARI = { lng: 135.7727, lat: 34.9671 }

describe('buildStadiaUrl', () => {
  it('asks Stadia exactly what Valhalla is asked', () => {
    const stadia = buildStadiaUrl(KIYOMIZU, INARI, 'walk')
    const valhalla = buildValhallaUrl(KIYOMIZU, INARI, 'walk')
    expect(stadia.startsWith(`${STADIA_ENDPOINT}?json=`)).toBe(true)
    expect(stadia.split('?json=')[1]).toBe(valhalla.split('?json=')[1])
  })

  it('carries the key only when one is given', () => {
    expect(buildStadiaUrl(KIYOMIZU, INARI, 'car')).not.toContain('api_key')
    expect(buildStadiaUrl(KIYOMIZU, INARI, 'car', 'k/1')).toMatch(/&api_key=k%2F1$/)
  })
})

describe("Stadia's answers", () => {
  it('read as Valhalla’s', () => {
    // Stadia answered this same walk with the same figures on 2026-10-05.
    expect(Math.round(parseValhalla(walk)?.minutes ?? 0)).toBe(53)
  })

  it('reads its "too far" refusal as no way, and its bad key as not', () => {
    // As answered on 2026-10-05 for Kyoto to Honolulu by car, and with a bad key.
    expect(
      isValhallaNoRoute(400, {
        error_code: 154,
        error: 'Path distance exceeds the max distance limit: 5000000 meters',
        status_code: 400,
        status: 'Bad Request',
      }),
    ).toBe(true)
    expect(isValhallaNoRoute(401, { error: 'No valid authentication provided.' })).toBe(false)
  })
})
