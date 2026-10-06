import { describe, expect, it } from 'vitest'

import { handoffUrl } from './handoff'

const KINKAKUJI = { lng: 135.7292, lat: 35.0394 }

describe('handoffUrl', () => {
  it('opens Google Maps directions for each way of travelling', () => {
    expect(handoffUrl('google', KINKAKUJI, 'walk')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=35.0394,135.7292&travelmode=walking',
    )
    expect(handoffUrl('google', KINKAKUJI, 'bike')).toMatch(/&travelmode=bicycling$/)
    expect(handoffUrl('google', KINKAKUJI, 'car')).toMatch(/&travelmode=driving$/)
  })

  it('opens Apple Maps on foot and by car, and with the destination alone by bike', () => {
    expect(handoffUrl('apple', KINKAKUJI, 'walk')).toBe(
      'https://maps.apple.com/?daddr=35.0394,135.7292&dirflg=w',
    )
    expect(handoffUrl('apple', KINKAKUJI, 'car')).toMatch(/&dirflg=d$/)
    expect(handoffUrl('apple', KINKAKUJI, 'bike')).toBe(
      'https://maps.apple.com/?daddr=35.0394,135.7292',
    )
  })

  it('hands Android the place with its name, encoded', () => {
    expect(handoffUrl('geo', KINKAKUJI, 'walk', 'Kinkaku-ji (金閣寺)')).toBe(
      'geo:35.0394,135.7292?q=35.0394,135.7292(Kinkaku-ji%20%28%E9%87%91%E9%96%A3%E5%AF%BA%29)',
    )
    expect(handoffUrl('geo', KINKAKUJI, 'car')).toBe('geo:35.0394,135.7292?q=35.0394,135.7292')
  })

  it('never carries an origin', () => {
    for (const app of ['google', 'apple', 'geo'] as const) {
      expect(handoffUrl(app, KINKAKUJI, 'walk')).not.toMatch(/origin|saddr/)
    }
  })
})
