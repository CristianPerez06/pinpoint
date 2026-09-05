import { describe, expect, it } from 'vitest'

import {
  CITY_CLAIM_KM,
  cityClaiming,
  cityNoticeFor,
  type FiledPlace,
} from './city-claim'

/*
 * Positions are built by walking north from a city's own centre, because the
 * one thing every test here cares about is a distance and a latitude offset is
 * the only direction that converts to kilometres without depending on where on
 * the planet it is measured.
 */
const KM_PER_DEGREE_LATITUDE = (6371 * Math.PI) / 180

const north = (from: { lng: number; lat: number }, km: number) => ({
  lng: from.lng,
  lat: from.lat + km / KM_PER_DEGREE_LATITUDE,
})

const KYOTO = { id: 'city-kyoto', name: 'Kyoto' }
const NARA = { id: 'city-nara', name: 'Nara' }
const TOKYO = { id: 'city-tokyo', name: 'Tokyo' }

const KYOTO_CENTRE = { lng: 135.7681, lat: 35.0116 }
const NARA_CENTRE = { lng: 135.8048, lat: 34.6851 }
const TOKYO_CENTRE = { lng: 139.7671, lat: 35.6812 }

const filed = (
  cityId: string | null,
  position: { lng: number; lat: number },
): FiledPlace => ({ cityId, ...position })

/** A trip with two cities 360 km apart — the shape of the trip this was measured on. */
const TRIP_MARKERS: readonly FiledPlace[] = [
  filed(KYOTO.id, KYOTO_CENTRE),
  filed(KYOTO.id, north(KYOTO_CENTRE, 2)),
  filed(TOKYO.id, TOKYO_CENTRE),
  filed(TOKYO.id, north(TOKYO_CENTRE, 3)),
]

describe('cityClaiming — position decides', () => {
  it('claims a place among a city’s own markers, and only that city', () => {
    // The ordinary case, and the one that must never move: a place saved in the
    // middle of the city it is in.
    const claim = cityClaiming(north(KYOTO_CENTRE, 1), [KYOTO, TOKYO], TRIP_MARKERS)

    expect(claim).toEqual({ kind: 'one', city: KYOTO })
  })

  it('claims a place for a city other than the one it was saved from', () => {
    const claim = cityClaiming(north(TOKYO_CENTRE, 1), [KYOTO, TOKYO], TRIP_MARKERS)

    expect(claim).toEqual({ kind: 'one', city: TOKYO })
  })

  it('claims a place inside the distance and lets go just outside it', () => {
    // One marker, so the distance under test is the only one in play.
    const lone = [filed(KYOTO.id, KYOTO_CENTRE)]

    expect(
      cityClaiming(north(KYOTO_CENTRE, CITY_CLAIM_KM - 0.1), [KYOTO], lone),
    ).toEqual({ kind: 'one', city: KYOTO })

    expect(
      cityClaiming(north(KYOTO_CENTRE, CITY_CLAIM_KM + 0.1), [KYOTO], lone),
    ).toEqual({ kind: 'none', offer: null })
  })

  it('measures to a city’s nearest marker, not to the middle of them', () => {
    // Kyoto strung out over 40 km. The centre is 20 km from either end, so a
    // place beside the far marker is outside a centre-based radius and plainly
    // inside this one.
    const strungOut = [
      filed(KYOTO.id, KYOTO_CENTRE),
      filed(KYOTO.id, north(KYOTO_CENTRE, 40)),
    ]

    const claim = cityClaiming(north(KYOTO_CENTRE, 39), [KYOTO], strungOut)

    expect(claim).toEqual({ kind: 'one', city: KYOTO })
  })

  it('ignores markers filed under no city', () => {
    const unassignedOnly = [filed(null, KYOTO_CENTRE)]

    expect(cityClaiming(KYOTO_CENTRE, [KYOTO], unassignedOnly)).toEqual({
      kind: 'none',
      offer: null,
    })
  })
})

describe('cityClaiming — when it cannot tell', () => {
  it('claims nothing for a place near nothing, and offers the name it was given', () => {
    const claim = cityClaiming(
      { lng: 2.3522, lat: 48.8566, city: 'Paris' },
      [KYOTO, TOKYO],
      TRIP_MARKERS,
    )

    expect(claim).toEqual({ kind: 'none', offer: 'Paris' })
  })

  it('offers nothing when nothing named the city', () => {
    // A position indicated on the map. There is no name to offer, and inventing
    // one is the thing this rule exists to stop.
    const claim = cityClaiming({ lng: 2.3522, lat: 48.8566 }, [KYOTO], TRIP_MARKERS)

    expect(claim).toEqual({ kind: 'none', offer: null })
  })

  it('claims nothing on a trip that has no cities yet', () => {
    expect(cityClaiming({ ...KYOTO_CENTRE, city: 'Kyoto' }, [], [])).toEqual({
      kind: 'none',
      offer: 'Kyoto',
    })
  })

  it('names both claimants rather than picking the nearer one', () => {
    // Two cities 10 km apart, the place 5 km from each. Nearest would answer;
    // the point is that it must not.
    const west = { id: 'city-west', name: 'West' }
    const east = { id: 'city-east', name: 'East' }
    const base = { lng: 135, lat: 35 }
    const markers = [
      filed(west.id, base),
      filed(east.id, north(base, 10)),
    ]

    const claim = cityClaiming(north(base, 5), [west, east], markers)

    expect(claim).toEqual({ kind: 'several', cities: [west, east] })
  })

  it('does not resolve two claimants by the order the cities came in', () => {
    const west = { id: 'city-west', name: 'West' }
    const east = { id: 'city-east', name: 'East' }
    const base = { lng: 135, lat: 35 }
    const markers = [filed(west.id, base), filed(east.id, north(base, 10))]

    // Not equidistant this time — east is nearer — and it still refuses.
    const claim = cityClaiming(north(base, 7), [east, west], markers)

    expect(claim.kind).toBe('several')
  })
})

describe('cityClaiming — the name the service gave', () => {
  it('takes a city of that name however far away its places are', () => {
    // A Nara temple saved while Nara's own markers are 33 km off. Position alone
    // would leave it unfiled; the service answered the question directly.
    const claim = cityClaiming(
      { ...NARA_CENTRE, city: 'Nara' },
      [KYOTO, NARA, TOKYO],
      TRIP_MARKERS,
    )

    expect(claim).toEqual({ kind: 'one', city: NARA })
  })

  it('overrules a city that would have claimed it by position', () => {
    const claim = cityClaiming(
      { ...north(KYOTO_CENTRE, 1), city: 'Nara' },
      [KYOTO, NARA],
      TRIP_MARKERS,
    )

    expect(claim).toEqual({ kind: 'one', city: NARA })
  })

  it('matches past case, surrounding whitespace and accents', () => {
    const malaga = { id: 'city-malaga', name: 'Málaga' }

    for (const reported of ['  KYOTO ', 'kyoto']) {
      expect(cityClaiming({ lng: 0, lat: 0, city: reported }, [KYOTO], [])).toEqual({
        kind: 'one',
        city: KYOTO,
      })
    }

    expect(cityClaiming({ lng: 0, lat: 0, city: 'Malaga' }, [malaga], [])).toEqual({
      kind: 'one',
      city: malaga,
    })
  })

  it('is not fuzzy, and falls through to position when it misses', () => {
    // "Kyoto days" is what somebody called the group, not a city. It must miss —
    // and the place is still claimed, by being where Kyoto's places are.
    const kyotoDays = { id: 'city-days', name: 'Kyoto days' }
    const markers = [filed(kyotoDays.id, KYOTO_CENTRE)]

    const claim = cityClaiming(
      { ...north(KYOTO_CENTRE, 1), city: 'Kyoto' },
      [kyotoDays],
      markers,
    )

    expect(claim).toEqual({ kind: 'one', city: kyotoDays })
  })

  it('refuses to choose between two cities the trip holds under one name', () => {
    const first = { id: 'city-a', name: 'Nara' }
    const second = { id: 'city-b', name: 'nara' }

    const claim = cityClaiming({ lng: 0, lat: 0, city: 'Nara' }, [first, second], [])

    expect(claim).toEqual({ kind: 'several', cities: [first, second] })
  })
})

describe('cityClaiming — a city nothing is filed under', () => {
  it('claims nothing by position, because there is nothing to measure from', () => {
    const empty = { id: 'city-empty', name: 'Osaka' }

    const claim = cityClaiming(north(KYOTO_CENTRE, 1), [KYOTO, empty], TRIP_MARKERS)

    expect(claim).toEqual({ kind: 'one', city: KYOTO })
  })

  it('is still never offered for creation a second time', () => {
    /*
     * The case that settled the order of the two halves. A city made in the list
     * before anything is filed under it holds no markers, so it claims nothing by
     * position — and without the name half, a place plainly inside it would reach
     * `none` and be offered "create Nara" on a trip that already has Nara.
     */
    const empty = { id: 'city-empty', name: 'Nara' }

    const claim = cityClaiming(
      { ...NARA_CENTRE, city: 'Nara' },
      [KYOTO, empty, TOKYO],
      TRIP_MARKERS,
    )

    expect(claim).toEqual({ kind: 'one', city: empty })
  })

  it('never offers a name any city on the trip already holds', () => {
    // The invariant stated as itself: whatever the positions, a reported name the
    // trip holds cannot come back as something to create.
    for (const cities of [[KYOTO], [KYOTO, TOKYO], [TOKYO, KYOTO]]) {
      const claim = cityClaiming(
        { lng: 2.3522, lat: 48.8566, city: 'Kyoto' },
        cities,
        TRIP_MARKERS,
      )

      expect(claim.kind).not.toBe('none')
    }
  })
})

describe('cityNoticeFor', () => {
  const KYOTO_CLAIM = { kind: 'one', city: KYOTO } as const

  it('says nothing about the city being worked in', () => {
    // The requirement most easily lost while building the other two.
    expect(cityNoticeFor(KYOTO_CLAIM, KYOTO.id)).toBeNull()
  })

  it('names a city other than the one being worked in', () => {
    const notice = cityNoticeFor(KYOTO_CLAIM, TOKYO.id)

    expect(notice?.message).toContain('Kyoto')
    expect(notice?.offer).toBeNull()
  })

  it('speaks up when the whole trip is in view', () => {
    // Nothing is selected, so nothing is "the city being worked in" — and this
    // is the view where saving a place used to leave it unfiled.
    expect(cityNoticeFor(KYOTO_CLAIM, null)).not.toBeNull()
  })

  it('names every claimant when more than one could hold the place', () => {
    const notice = cityNoticeFor(
      { kind: 'several', cities: [KYOTO, NARA, TOKYO] },
      KYOTO.id,
    )

    expect(notice?.message).toContain('Kyoto, Nara and Tokyo')
    expect(notice?.offer).toBeNull()
  })

  it('offers the city a place is actually in when no city claims it', () => {
    const notice = cityNoticeFor({ kind: 'none', offer: 'Nara' }, KYOTO.id)

    expect(notice?.offer).toBe('Nara')
    expect(notice?.message).toContain('Nara')
  })

  it('offers nothing to create when nothing named the city', () => {
    // A pointed position, or a rural result the service gave only a county for.
    const notice = cityNoticeFor({ kind: 'none', offer: null }, KYOTO.id)

    expect(notice?.offer).toBeNull()
    expect(notice?.message).toContain('unassigned')
  })
})
