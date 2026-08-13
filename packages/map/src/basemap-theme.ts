import { BASEMAP_COLOUR, type ThemeMode } from '@pinpoint/tokens'

/**
 * Repainting the upstream basemap in our own colours.
 *
 * WHY THE MAP IS PATCHED AT ALL
 *
 * Two reasons, and the second is the one that forces it. The interface's
 * neutrals are warm, and positron's are cool — left alone, the map reads as a
 * stranger's map with our panels floating over it rather than as one object.
 * And OpenFreeMap publishes no dark style at all, so a dark interface would
 * otherwise sit around a white slab, which reads as a bug rather than a theme.
 *
 * WHY THIS TAKES A DOCUMENT INSTEAD OF FETCHING ONE
 *
 * `@pinpoint/map` declares no third-party runtime dependencies and must stay
 * that way, so it cannot fetch. The application fetches; this transforms. That
 * also makes the whole thing a pure function, testable against a fixture
 * without a network.
 *
 * WHY LAYERS ARE CLASSIFIED RATHER THAN LISTED BY NAME
 *
 * The obvious implementation is a list of layer ids to recolour. It is simpler,
 * and it breaks the first time upstream renames `water_line` to `waterway` —
 * quietly, leaving one category in its original colour while everything around
 * it changes. A half-themed map reads as a styling mistake and never is.
 *
 * Classifying by what a layer *is* — its source layer, its type, whether it
 * paints text — survives a rename, because the rename usually does not change
 * any of those. And when a restructure does defeat it, the category matches
 * nothing at all, which is loud: `themeStyle` throws naming the category rather
 * than returning a document that is 90% right.
 */

/** What a layer is, as far as repainting it is concerned. */
export type BasemapCategory =
  | 'land'
  | 'water'
  | 'park'
  | 'block'
  | 'road'
  | 'roadCasing'
  | 'label'
  | 'boundary'
  | 'shield'

/**
 * Categories that must each match at least one layer.
 *
 * A category matching nothing means the document no longer has the shape this
 * transformation was written against — not that the map happens to have no
 * parks today. Every one of these is present in positron, and their absence is
 * a restructure worth failing on rather than absorbing.
 */
const REQUIRED: readonly BasemapCategory[] = [
  'land',
  'water',
  'park',
  'block',
  'road',
  'roadCasing',
  'label',
  'boundary',
]

interface StyleLayer {
  id: string
  type: string
  'source-layer'?: string
  paint?: Record<string, unknown>
  [key: string]: unknown
}

export interface StyleDocument {
  layers: StyleLayer[]
  [key: string]: unknown
}

/** Thrown rather than returning a map that is mostly right. */
export class BasemapThemeError extends Error {
  readonly missing: readonly BasemapCategory[]

  constructor(missing: readonly BasemapCategory[]) {
    super(
      `The map style no longer has the shape this transformation expects: ` +
        `nothing matched ${missing.join(', ')}. The upstream document has been ` +
        `restructured, and repainting it would produce a half-themed map.`,
    )
    this.name = 'BasemapThemeError'
    this.missing = missing
  }
}

function classify(layer: StyleLayer): BasemapCategory | null {
  const source = layer['source-layer']
  const id = layer.id

  // The ground everything else sits on.
  if (layer.type === 'background') return 'land'

  if (layer.type === 'symbol') {
    if (layer.paint && 'text-color' in layer.paint) return 'label'
    /*
     * A route shield: a sprite chip with no text colour to rewrite.
     *
     * These were left alone at first, on the reasoning that a route badge's
     * colours mean something and repainting them would be lying about the road
     * classification. That is still true, and it was still the wrong call — the
     * sprite is drawn for a light basemap, so on a dark one every shield is a
     * white chip brighter than our own `see` pins. The map's furniture ends up
     * louder than the places somebody saved, which inverts the whole point.
     *
     * So the colours are left intact and the whole chip is dimmed instead.
     */
    return 'shield'
  }

  if (source === 'building') return 'block'

  // Woodland is drawn from `landcover` rather than `park`, and reads as park.
  if (source === 'park') return 'park'
  if (source === 'landcover' && /wood|forest|grass|park/i.test(id)) return 'park'

  if (source === 'water' || source === 'waterway' || source === 'water_name') {
    return 'water'
  }

  if (source === 'landcover' || source === 'landuse') return 'land'
  if (source === 'boundary') return 'boundary'

  if (source === 'transportation' || source === 'aeroway') {
    // A casing is the line drawn under a road to separate it from the land, so
    // it takes the edge colour rather than the surface colour.
    return /casing/i.test(id) ? 'roadCasing' : 'road'
  }

  return null
}

/**
 * How far a route shield is dimmed, per ground.
 *
 * Not a colour token: the sprite keeps its own colours, and this only says how
 * much of it comes through. Full strength on light, where the sprite was drawn
 * to sit; well back on dark, where it would otherwise outshine the markers.
 */
const SHIELD_OPACITY: Record<string, number> = { light: 1, dark: 0.45 }

/**
 * Repaint one layer, leaving everything that is not a colour alone.
 *
 * Widths and opacities are zoom expressions in this document and carry the
 * cartography's legibility; only the flat colour strings are replaced.
 */
function repaint(
  layer: StyleLayer,
  category: BasemapCategory,
  palette: Record<string, string>,
  mode: ThemeMode,
): StyleLayer {
  const paint = { ...(layer.paint ?? {}) }

  if (category === 'shield') {
    paint['icon-opacity'] = SHIELD_OPACITY[mode]
    return { ...layer, paint }
  }

  const colour = {
    land: palette.land,
    water: palette.water,
    park: palette.park,
    block: palette.block,
    road: palette.road,
    roadCasing: palette.roadCasing,
    label: palette.label,
    boundary: palette.boundary,
    // Handled above; never reaches the colour lookup.
    shield: palette.label,
  }[category]!

  if (layer.type === 'background') paint['background-color'] = colour
  if (layer.type === 'fill') {
    paint['fill-color'] = colour
    // Buildings carry an outline. Left at the upstream value it draws a cool
    // grey box around every warm one.
    if ('fill-outline-color' in paint) paint['fill-outline-color'] = palette.roadCasing
  }
  if (layer.type === 'line') paint['line-color'] = colour
  if (layer.type === 'symbol') {
    paint['text-color'] = colour
    // The halo is what keeps a label readable over whatever is beneath it, so
    // it has to be the ground rather than a leftover white.
    if ('text-halo-color' in paint) paint['text-halo-color'] = palette.land
  }

  return { ...layer, paint }
}

/**
 * Return the document repainted for one ground.
 *
 * Pure: the input is not modified, and nothing here performs I/O. Given the
 * same document and mode it produces the same result.
 *
 * @throws {BasemapThemeError} when a category matches no layer at all.
 */
export function themeStyle(document: StyleDocument, mode: ThemeMode): StyleDocument {
  const palette = Object.fromEntries(
    Object.entries(BASEMAP_COLOUR).map(([key, token]) => [key, token[mode]]),
  ) as Record<string, string>

  const matched = new Set<BasemapCategory>()

  const layers = document.layers.map((layer) => {
    const category = classify(layer)
    if (category === null) return layer
    matched.add(category)
    return repaint(layer, category, palette, mode)
  })

  const missing = REQUIRED.filter((category) => !matched.has(category))
  if (missing.length > 0) throw new BasemapThemeError(missing)

  return { ...document, layers }
}
