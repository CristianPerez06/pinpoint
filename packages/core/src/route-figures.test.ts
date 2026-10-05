import { say, type Language, type Message } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import { routeFigures, type StreetState } from './route-figures'

const idle: StreetState = { kind: 'idle' }

/** The card as read: time, distance line, note, and what can be pressed. */
function read(
  options: Partial<Parameters<typeof routeFigures>[1]>,
  language: Language = 'en',
) {
  const figures = routeFigures(language, {
    km: 3.29,
    mode: 'walk',
    street: idle,
    online: true,
    switched: false,
    ...options,
  })
  const s = (m: Message | null) => (m === null ? null : say(language, m))
  const amount = say(language, figures.distance)
  return {
    form: figures.form,
    mode: figures.mode,
    time: s(figures.time),
    distance: s(
      figures.measured === 'streets'
        ? { key: 'route.alongStreets', values: { distance: amount } }
        : { key: 'route.straightLine', values: { distance: amount } },
    ),
    note: figures.note && s(figures.note.message),
    available: figures.available,
  }
}

describe('routeFigures', () => {
  it('estimates on foot with the straight line', () => {
    expect(read({ km: 1.34 })).toMatchObject({
      form: 'straight',
      time: 'About 25 min walk',
      distance: '1.3 km in a straight line',
      note: null,
    })
  })

  it('drops the walking time past a day trip', () => {
    expect(read({ km: 120 }).time).toBeNull()
  })

  it('says the street route is being found', () => {
    expect(read({ street: { kind: 'finding' } })).toMatchObject({
      form: 'straight',
      time: 'About 55 min walk',
      distance: '3.3 km in a straight line',
      note: 'Finding the way along the streets…',
    })
  })

  it('shows a street route as real figures', () => {
    expect(read({ street: { kind: 'ready', km: 4.42, minutes: 53 } })).toMatchObject({
      form: 'street',
      time: '53 min walk',
      distance: '4.4 km along the streets',
      note: null,
    })
  })

  it('shows a long drive at any distance', () => {
    expect(read({ mode: 'car', km: 100, street: { kind: 'ready', km: 120, minutes: 95 } })).toMatchObject({
      time: '1 h 35 min drive',
      distance: '120 km along the streets',
    })
  })

  it('gives a bike on the straight line a distance and no time', () => {
    expect(read({ mode: 'bike', street: { kind: 'finding' } })).toMatchObject({
      time: null,
      distance: '3.3 km in a straight line',
    })
  })

  it('says when no street route was found, for that way of travelling', () => {
    expect(read({ mode: 'car', street: { kind: 'none' } })).toMatchObject({
      form: 'straight',
      time: null,
      note: 'No driving route along the streets was found.',
    })
  })

  it('offers walking alone with no connection', () => {
    expect(read({ online: false })).toMatchObject({
      form: 'straight',
      mode: 'walk',
      time: 'About 55 min walk',
      note: 'Bike and car need a connection.',
      available: { walk: true, bike: false, car: false },
    })
  })

  it('gives way to the straight line when the connection drops under a street route', () => {
    expect(read({ online: false, street: { kind: 'ready', km: 4.42, minutes: 53 } }).form).toBe('straight')
  })

  it('says it switched to walking', () => {
    expect(read({ mode: 'car', online: false, switched: true })).toMatchObject({
      mode: 'walk',
      time: 'About 55 min walk',
      note: 'No connection, so this is walking. Bike and car need a connection.',
    })
  })

  it('is written in Spanish', () => {
    expect(read({ street: { kind: 'ready', km: 4.42, minutes: 53 } }, 'es')).toMatchObject({
      time: '53 min a pie',
      distance: '4,4 km por las calles',
    })
    expect(read({ online: false }, 'es').note).toBe('La bici y el auto requieren conexión.')
  })
})
