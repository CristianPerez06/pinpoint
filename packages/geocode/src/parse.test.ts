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
      typeGuess: 'temple',
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
})
