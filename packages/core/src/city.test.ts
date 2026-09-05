import { describe, expect, it } from 'vitest'

import { markersSelectedBy, UNASSIGNED_CITY } from './city'

const KYOTO = 'city-kyoto'
const TOKYO = 'city-tokyo'

const markers = [
  { cityId: KYOTO, name: 'Kiyomizu-dera' },
  { cityId: TOKYO, name: 'Shinjuku Gyoen' },
  { cityId: null, name: 'Somewhere unfiled' },
  { cityId: null, name: 'Somewhere else unfiled' },
]

describe('markersSelectedBy', () => {
  it('means the whole trip when nothing is selected', () => {
    // Null is the widening, not a narrowing — which is why unassigned needed a
    // value of its own rather than reusing it.
    expect(markersSelectedBy(null, markers)).toHaveLength(4)
  })

  it('means one city’s places when a city is selected', () => {
    expect(markersSelectedBy(KYOTO, markers)).toEqual([markers[0]])
  })

  it('means the places no city holds when unassigned is selected', () => {
    expect(markersSelectedBy(UNASSIGNED_CITY, markers)).toEqual([
      markers[2],
      markers[3],
    ])
  })

  it('accounts for the whole trip once the rows are added up', () => {
    // What the city list promises: the cities plus unassigned equal the total,
    // with nothing counted twice and nothing left out.
    const counted =
      markersSelectedBy(KYOTO, markers).length +
      markersSelectedBy(TOKYO, markers).length +
      markersSelectedBy(UNASSIGNED_CITY, markers).length

    expect(counted).toBe(markers.length)
  })

  it('selects nothing for a city that no longer exists', () => {
    expect(markersSelectedBy('city-deleted', markers)).toEqual([])
  })
})
