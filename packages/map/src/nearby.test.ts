import { describe, expect, it } from 'vitest'

import {
  driftTolerance,
  hasDrifted,
  NEARBY_DRIFT_FLOOR_KM,
  orderByDistance,
} from './nearby'

const KM_PER_DEGREE_LATITUDE = (6371 * Math.PI) / 180

const HERE = { lng: 135.7808, lat: 34.9949 }

/** A place `km` due north of `HERE`. */
function north(id: string, km: number, name = id) {
  return { id, name, lng: HERE.lng, lat: HERE.lat + km / KM_PER_DEGREE_LATITUDE }
}

describe('orderByDistance', () => {
  it('puts the nearest first', () => {
    const order = orderByDistance([north('far', 3), north('near', 0.3), north('mid', 1)], HERE)
    expect(order.map((row) => row.id)).toEqual(['near', 'mid', 'far'])
    expect(order[0]!.km).toBeCloseTo(0.3, 3)
  })

  it('breaks a tie by name, the same way every time', () => {
    const a = north('2', 1, 'Yasaka Shrine')
    const b = north('1', 1, 'Kodai-ji')
    expect(orderByDistance([a, b], HERE).map((row) => row.id)).toEqual(['1', '2'])
    expect(orderByDistance([b, a], HERE).map((row) => row.id)).toEqual(['1', '2'])
  })

  it('returns nothing for an empty trip', () => {
    expect(orderByDistance([], HERE)).toEqual([])
  })
})

describe('hasDrifted', () => {
  const distances = (entries: [string, number][]) => new Map(entries)

  it('holds while the order still agrees', () => {
    expect(hasDrifted(['a', 'b', 'c'], distances([['a', 0.1], ['b', 0.5], ['c', 0.9]]))).toBe(false)
  })

  it('drifts once a lower row is nearer by more than the tolerance', () => {
    expect(hasDrifted(['a', 'b'], distances([['a', 0.3], ['b', 0.2]]), 0.05)).toBe(true)
  })

  it('ignores a swap smaller than the tolerance', () => {
    expect(hasDrifted(['a', 'b'], distances([['a', 0.21], ['b', 0.2]]), 0.05)).toBe(false)
  })

  it('finds a drift between rows that are not neighbours', () => {
    // Each neighbour pair is within the tolerance; the first and last are not.
    const d = distances([['a', 0.3], ['b', 0.26], ['c', 0.22]])
    expect(hasDrifted(['a', 'b', 'c'], d, 0.05)).toBe(true)
  })

  it('skips a place that has gone', () => {
    expect(hasDrifted(['a', 'gone', 'b'], distances([['a', 0.1], ['b', 0.2]]))).toBe(false)
  })
})

describe('driftTolerance', () => {
  it('is the uncertainty, never below the floor', () => {
    expect(driftTolerance(5)).toBe(NEARBY_DRIFT_FLOOR_KM)
    expect(driftTolerance(65)).toBeCloseTo(0.065, 9)
    expect(driftTolerance(null)).toBe(NEARBY_DRIFT_FLOOR_KM)
  })
})
