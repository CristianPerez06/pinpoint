import { describe, expect, it } from 'vitest'

import {
  buildNominatimUrl,
  NOMINATIM_ENDPOINT,
  toNominatimCandidates,
} from './nominatim'

function paramsOf(url: string): Record<string, string> {
  const [, search = ''] = url.split('?')
  const entries = search
    .split('&')
    .filter(Boolean)
    .map((pair) => {
      const [key = '', value = ''] = pair.split('=')
      return [key, decodeURIComponent(value)] as const
    })
  return Object.fromEntries(entries)
}

/** The real answer to "Torre Eiffel", trimmed to the fields read or nearby. */
const eiffel = {
  osm_type: 'way',
  osm_id: 5013364,
  lat: '48.8582599',
  lon: '2.2945006',
  category: 'man_made',
  type: 'tower',
  name: 'Eiffel Tower',
  address: {
    man_made: 'Eiffel Tower',
    house_number: '5',
    road: 'Avenue Anatole France',
    suburb: '7th Arrondissement',
    city_district: 'Paris',
    city: 'Paris',
    state: 'Ile-de-France',
    country: 'France',
  },
}

/** The real answer to "Coliseo". */
const colosseum = {
  osm_type: 'way',
  osm_id: 215801333,
  lat: '41.8909421',
  lon: '12.4919030',
  category: 'highway',
  type: 'pedestrian',
  name: 'Colosseum',
  address: {
    road: 'Colosseum',
    suburb: 'Municipio Roma I',
    city: 'Rome',
    county: 'Roma Capitale',
    state: 'Lazio',
    country: 'Italy',
  },
}

describe('buildNominatimUrl', () => {
  it('asks for the query, in English, with address details', () => {
    const url = buildNominatimUrl('Torre Eiffel')
    expect(url.startsWith(`${NOMINATIM_ENDPOINT}?`)).toBe(true)
    const params = paramsOf(url)
    expect(params.q).toBe('Torre Eiffel')
    expect(params.format).toBe('jsonv2')
    expect(params.addressdetails).toBe('1')
    // English whatever the application speaks, so a city arrives as "Rome"
    // the way Photon names it rather than as a second "Roma".
    expect(params['accept-language']).toBe('en')
  })

  it('escapes a query that would otherwise break the URL', () => {
    expect(paramsOf(buildNominatimUrl('café & bar 100%')).q).toBe('café & bar 100%')
  })

  it('ranks toward the bias without excluding anything', () => {
    const params = paramsOf(
      buildNominatimUrl('ramen', { bias: { lng: 135.75, lat: 35 } }),
    )
    expect(params.viewbox).toBe('135.5,35.25,136,34.75')
    // The whole point: `bounded=1` would drop the day trip.
    expect(params.bounded).toBe('0')
  })

  it('sends no box when there is no bias', () => {
    const params = paramsOf(buildNominatimUrl('ramen'))
    expect(params.viewbox).toBeUndefined()
    expect(params.bounded).toBeUndefined()
  })

  it('keeps the box on the globe near its edges', () => {
    const params = paramsOf(
      buildNominatimUrl('x', { bias: { lng: 179.9, lat: 89.9 } }),
    )
    expect(params.viewbox).toBe('179.65,90,180,89.65')
  })
})

describe('toNominatimCandidates', () => {
  it('reads the Eiffel Tower found by its Spanish name', () => {
    const [candidate] = toNominatimCandidates([eiffel])
    expect(candidate).toMatchObject({
      id: '0:way5013364',
      name: 'Eiffel Tower',
      lng: 2.2945006,
      lat: 48.8582599,
      city: 'Paris',
      context: 'Paris, Ile-de-France, France',
      distanceKm: null,
    })
  })

  it('lands on the position Photon gives the same place', () => {
    // Photon returns the Colosseum at [12.491903, 41.8909421]. Equal to the
    // last digit, which is what lets a place already saved be recognised
    // whichever search found it.
    const [candidate] = toNominatimCandidates([colosseum])
    expect(candidate?.lng).toBe(12.491903)
    expect(candidate?.lat).toBe(41.8909421)
    expect(candidate?.city).toBe('Rome')
  })

  it('guesses a type from the same tag pair Photon sends', () => {
    const [candidate] = toNominatimCandidates([
      { ...colosseum, category: 'historic', type: 'castle' },
    ])
    expect(candidate?.typeGuess).toBe('culture')
  })

  it('takes a town or a village as the city', () => {
    const [town, village] = toNominatimCandidates([
      { ...colosseum, address: { town: 'Nara', country: 'Japan' } },
      { ...colosseum, address: { village: 'Shirakawa', country: 'Japan' } },
    ])
    expect(town?.city).toBe('Nara')
    expect(village?.city).toBe('Shirakawa')
  })

  it('carries no city when only a county is known', () => {
    const [candidate] = toNominatimCandidates([
      { ...colosseum, address: { county: 'Roma Capitale', country: 'Italy' } },
    ])
    expect(candidate?.city).toBeNull()
    // Still said in the context, where it only helps somebody read the row.
    expect(candidate?.context).toBe('Roma Capitale, Italy')
  })

  it('names a pure address from its road and number', () => {
    const [candidate] = toNominatimCandidates([
      {
        ...eiffel,
        name: '',
        address: { house_number: '5', road: 'Avenue Anatole France', city: 'Paris' },
      },
    ])
    expect(candidate?.name).toBe('5 Avenue Anatole France')
  })

  it('measures the distance from the bias', () => {
    const [candidate] = toNominatimCandidates([eiffel], { lng: 2.35, lat: 48.85 })
    expect(candidate?.distanceKm).toBeGreaterThan(3)
    expect(candidate?.distanceKm).toBeLessThan(6)
  })

  it('drops a malformed row and keeps the rest', () => {
    const candidates = toNominatimCandidates([
      null,
      { ...eiffel, lat: 'north' },
      { ...eiffel, lon: '200' },
      colosseum,
    ])
    expect(candidates.map((candidate) => candidate.name)).toEqual(['Colosseum'])
  })

  it('reads nothing from a response that is not a list', () => {
    expect(toNominatimCandidates({ error: 'Unable to geocode' })).toEqual([])
    expect(toNominatimCandidates(null)).toEqual([])
  })
})
