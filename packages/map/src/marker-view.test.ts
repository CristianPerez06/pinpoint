import { MARKER_ANCHOR, MARKER_FAMILY_COLOURS, MARKER_SIZE } from '@pinpoint/tokens'
import { describe, expect, it } from 'vitest'

import { FALLBACK_MARKER_TYPE, MARKER_ICONS } from './marker-type'
import {
  groupCoincident,
  markerView,
  type MarkerViewInput,
  VISITED_OPACITY,
} from './marker-view'

function at(lng: number, lat: number, overrides: Partial<MarkerViewInput> = {}) {
  return { lng, lat, name: 'A place', type: 'other', ...overrides }
}

describe('markerView', () => {
  it('gives two types of different families different icons and families', () => {
    const temple = markerView(at(135.78, 35.0, { name: 'Kiyomizu-dera', type: 'temple' }))
    const restaurant = markerView(at(135.77, 35.0, { name: 'Pontocho', type: 'restaurant' }))

    expect(temple.icon).not.toBe(restaurant.icon)
    expect(temple.family).toBe('see')
    expect(restaurant.family).toBe('eat')
  })

  it('gives two types of the same family one family and two icons', () => {
    const temple = markerView(at(135.78, 35.0, { type: 'temple' }))
    const castle = markerView(at(135.75, 35.01, { type: 'castle' }))

    expect(temple.family).toBe(castle.family)
    expect(temple.icon).not.toBe(castle.icon)
  })

  it('renders an unrecognised stored type as the fallback rather than omitting it', () => {
    const view = markerView(at(135.78, 35.0, { type: 'onsen' }))

    expect(view.typeId).toBe(FALLBACK_MARKER_TYPE)
    expect(MARKER_ICONS).toContain(view.icon)
    expect(view.family).toBe('see')
  })

  it('names an icon rather than carrying one, and names a family rather than a colour', () => {
    // The whole point of the indirection: nothing here is ready to draw, so a
    // theme can decide the colour and a platform can decide the glyph.
    const view = markerView(at(135.78, 35.0, { type: 'cafe' }))

    expect(MARKER_ICONS).toContain(view.icon)
    expect(view).not.toHaveProperty('colour')
    expect(view).not.toHaveProperty('foreground')
  })

  it('says which point of the drawn pin sits on the coordinate', () => {
    // Anchored at the point, not the centre. Carried in the description so that
    // neither application writes an offset of its own — which is how the last
    // drift defect survived being fixed on one platform.
    const view = markerView(at(135.78, 35.0))

    expect(view.anchor).toEqual({ x: MARKER_ANCHOR.x, y: MARKER_ANCHOR.y })
    expect(view.anchor.y).toBe(1)
    expect(view.size).toEqual({ width: MARKER_SIZE.width, height: MARKER_SIZE.height })
  })

  it('carries the position and the name through unchanged', () => {
    const view = markerView(at(135.7727, 34.9671, { name: 'Fushimi Inari' }))

    expect(view.lng).toBe(135.7727)
    expect(view.lat).toBe(34.9671)
    expect(view.label).toBe('Fushimi Inari')
  })

  it('gives every declared family a colour on both grounds', () => {
    // The compile-time check in marker-view.ts is the real guard; this catches
    // a colour that exists but is empty.
    for (const colour of Object.values(MARKER_FAMILY_COLOURS)) {
      expect(colour.light).toMatch(/^#[0-9A-F]{6}$/i)
      expect(colour.dark).toMatch(/^#[0-9A-F]{6}$/i)
      expect(colour.light).not.toBe(colour.dark)
    }
  })
})

describe('groupCoincident', () => {
  it('leaves distinct positions as separate points of one', () => {
    const groups = groupCoincident([at(135.78, 35.0), at(135.75, 35.01)])

    expect(groups).toHaveLength(2)
    expect(groups.every((group) => group.count === 1)).toBe(true)
  })

  it('collapses two markers at one position into a single point', () => {
    const groups = groupCoincident([
      at(135.7588, 34.9858, { name: 'Kyoto Station', type: 'station' }),
      at(135.7588, 34.9858, { name: 'Kyoto Tower', type: 'attraction' }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]!.count).toBe(2)
    expect(groups[0]!.markers.map((m) => m.name)).toEqual([
      'Kyoto Station',
      'Kyoto Tower',
    ])
  })

  it('collapses three markers at one position and keeps every one reachable', () => {
    const groups = groupCoincident([
      at(135.7588, 34.9858, { name: 'Kyoto Station' }),
      at(135.7588, 34.9858, { name: 'Kyoto Tower' }),
      at(135.7588, 34.9858, { name: 'Hotel Granvia' }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]!.count).toBe(3)
    // Every marker is present, not just the one that gets drawn.
    expect(groups[0]!.markers).toHaveLength(3)
    expect(groups[0]!.views).toHaveLength(3)
  })

  it('keeps markers that are merely close as separate points', () => {
    // Roughly ten metres apart. They overlap at city zoom and separate as you
    // zoom in, which is what a map should do — only identical coordinates need
    // the grouping, because zoom cannot separate what is not separate.
    const groups = groupCoincident([at(135.7588, 34.9858), at(135.75889, 34.98589)])

    expect(groups).toHaveLength(2)
  })

  it('does not modify a stored position', () => {
    const markers = [
      at(135.7588, 34.9858, { name: 'One' }),
      at(135.7588, 34.9858, { name: 'Two' }),
    ]
    const groups = groupCoincident(markers)

    expect(groups[0]!.lng).toBe(135.7588)
    expect(groups[0]!.lat).toBe(34.9858)
    for (const marker of markers) {
      expect(marker.lng).toBe(135.7588)
      expect(marker.lat).toBe(34.9858)
    }
  })

  it('treats -0 and 0 as the same position', () => {
    expect(groupCoincident([at(-0, 0), at(0, -0)])).toHaveLength(1)
  })

  it('returns nothing for no markers', () => {
    expect(groupCoincident([])).toEqual([])
  })

  it('draws the first marker of a group and describes all of them', () => {
    const groups = groupCoincident([
      at(135.7588, 34.9858, { name: 'Kyoto Station', type: 'station' }),
      at(135.7588, 34.9858, { name: 'Kyoto Tower', type: 'attraction' }),
    ])

    expect(groups[0]!.view.label).toBe('Kyoto Station')
    expect(groups[0]!.views.map((v) => v.label)).toEqual([
      'Kyoto Station',
      'Kyoto Tower',
    ])
  })
})

describe('markerView — visited', () => {
  const place = { lng: 135.7, lat: 35.0, name: 'To-ji', type: 'temple' }

  it('mutes a visited marker without touching its colour', () => {
    const seen = markerView({ ...place, visited: true })
    const unseen = markerView({ ...place, visited: false })

    // The whole point of the rule: colour names the family and only the family,
    // so a visited place and an unvisited one of the same type are the same
    // colour and differ only in how solidly they are drawn.
    expect(seen.family).toBe(unseen.family)
    expect(seen.icon).toBe(unseen.icon)
    expect(seen.opacity).toBe(VISITED_OPACITY)
    expect(unseen.opacity).toBe(1)
    expect(seen.visited).toBe(true)
    expect(unseen.visited).toBe(false)
  })

  it('treats an unanswered marker as not visited', () => {
    // A draft has never been anywhere and is not asked.
    expect(markerView(place).visited).toBe(false)
    expect(markerView(place).opacity).toBe(1)
  })
})
