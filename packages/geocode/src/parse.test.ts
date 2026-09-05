import { describe, expect, it } from 'vitest'

import { toCandidates } from './parse'

function feature(
  properties: Record<string, unknown>,
  coordinates: unknown = [135.7681, 35.0116],
) {
  return { type: 'Feature', properties, geometry: { type: 'Point', coordinates } }
}

function collection(...features: unknown[]) {
  return { type: 'FeatureCollection', features }
}

describe('toCandidates', () => {
  it('reads a named place', () => {
    const [candidate] = toCandidates(
      collection(
        feature({
          name: 'Kiyomizu-dera',
          osm_key: 'amenity',
          osm_value: 'place_of_worship',
          osm_type: 'W',
          osm_id: 12345,
          city: 'Kyoto',
          country: 'Japan',
        }),
      ),
    )

    expect(candidate).toMatchObject({
      name: 'Kiyomizu-dera',
      lng: 135.7681,
      lat: 35.0116,
      typeGuess: 'culture',
    })
    expect(candidate?.context).toContain('Kyoto')
  })

  it('synthesises a name for an address that has none', () => {
    // A house number on a street comes back with no `name` at all, and a marker
    // cannot exist without one — so the name is assembled rather than the
    // result dropped.
    const [candidate] = toCandidates(
      collection(feature({ housenumber: '17', street: 'Shijo-dori' })),
    )
    expect(candidate?.name).toBe('17 Shijo-dori')
  })

  it('falls back through street, then city, for a name', () => {
    expect(toCandidates(collection(feature({ street: 'Shijo-dori' })))[0]?.name)
      .toBe('Shijo-dori')
    expect(toCandidates(collection(feature({ city: 'Kyoto' })))[0]?.name)
      .toBe('Kyoto')
  })

  it('drops a feature with no usable position and keeps the rest', () => {
    const candidates = toCandidates(
      collection(
        feature({ name: 'No geometry' }, null),
        feature({ name: 'Not a pair' }, [135.7681]),
        feature({ name: 'Off the globe' }, [999, 35]),
        feature({ name: 'Fine' }),
      ),
    )
    expect(candidates.map((c) => c.name)).toEqual(['Fine'])
  })

  it('drops a feature with no derivable name and keeps the rest', () => {
    const candidates = toCandidates(
      collection(feature({ osm_key: 'amenity' }), feature({ name: 'Fine' })),
    )
    expect(candidates.map((c) => c.name)).toEqual(['Fine'])
  })

  it('ignores properties it does not recognise', () => {
    // The service reserves the right to change without notice. An added field
    // must cost nothing.
    const [candidate] = toCandidates(
      collection(
        feature({ name: 'Nishiki Market', something_new: { nested: true } }),
      ),
    )
    expect(candidate?.name).toBe('Nishiki Market')
  })

  it('returns nothing rather than throwing on a body it cannot read', () => {
    for (const payload of [null, undefined, 'a string', 42, {}, { features: 'no' }, []]) {
      expect(() => toCandidates(payload)).not.toThrow()
      expect(toCandidates(payload)).toEqual([])
    }
  })

  it('gives every candidate a distinct key even when the service repeats one', () => {
    const repeated = feature({ name: 'Same', osm_type: 'W', osm_id: 1 })
    const ids = toCandidates(collection(repeated, repeated)).map((c) => c.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('omits context rather than repeating the name back', () => {
    const [candidate] = toCandidates(
      collection(feature({ name: 'Kyoto', city: 'Kyoto' })),
    )
    expect(candidate?.context).not.toBe('Kyoto')
  })

  it('stamps how far a candidate is from the bias point', () => {
    const osaka = { lng: 135.5023, lat: 34.6937 }
    const [near] = toCandidates(
      collection(feature({ name: 'Osaka Castle' }, [135.5262, 34.6873])),
      osaka,
    )
    expect(near?.distanceKm).toBeGreaterThan(0)
    expect(near?.distanceKm).toBeLessThan(10)
  })

  it('stamps a large distance on the failure this exists for', () => {
    // A query for an Osaka place resolving to somewhere in Spain, offered
    // looking exactly like a correct match.
    const osaka = { lng: 135.5023, lat: 34.6937 }
    const [far] = toCandidates(
      collection(feature({ name: 'Parque Fluvial' }, [-6.5, 40.9])),
      osaka,
    )
    expect(far?.distanceKm).toBeGreaterThan(10_000)
  })

  it('carries no distance when there was no bias to measure from', () => {
    // Rather than a zero, which would render as "0 km away" — the most
    // confident possible claim, made with no information at all.
    const [candidate] = toCandidates(collection(feature({ name: 'Somewhere' })))
    expect(candidate?.distanceKm).toBeNull()
  })
})

describe('toCandidates — the city a place is in', () => {
  it('carries the service’s city as a field of its own', () => {
    const [candidate] = toCandidates(
      collection(feature({ name: 'Kiyomizu-dera', city: 'Kyoto', country: 'Japan' })),
    )

    expect(candidate?.city).toBe('Kyoto')
  })

  it('carries nothing when the service named no city', () => {
    // Nothing wider is substituted. "Create Kyoto Prefecture" is a group nobody
    // meant to make, named after something that is not a city.
    const [candidate] = toCandidates(
      collection(
        feature({ name: 'Ama-no-Hashidate', county: 'Yosa', state: 'Kyoto Prefecture', country: 'Japan' }),
      ),
    )

    expect(candidate?.city).toBeNull()
    // The context still uses the wider parts — reading and filing want different
    // answers, which is why this is not read back out of that string.
    expect(candidate?.context).toContain('Yosa')
  })

  it('carries a city that is also the place’s own name', () => {
    // `context` drops a part equal to the name, to avoid saying "Kyoto, Kyoto".
    // This field must not: it is what the trip's cities are compared against.
    const [candidate] = toCandidates(
      collection(feature({ name: 'Kyoto', city: 'Kyoto', country: 'Japan' })),
    )

    expect(candidate?.city).toBe('Kyoto')
    expect(candidate?.context).not.toContain('Kyoto,')
  })

  it('does not withhold, reorder, or drop a candidate on account of its city', () => {
    const candidates = toCandidates(
      collection(
        feature({ name: 'First', city: 'Kyoto' }),
        feature({ name: 'Second' }),
        feature({ name: 'Third', city: 'Nara' }),
      ),
    )

    expect(candidates.map((candidate) => candidate.name)).toEqual([
      'First',
      'Second',
      'Third',
    ])
  })
})
