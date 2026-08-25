/**
 * Map style references.
 *
 * OpenFreeMap serves complete MapLibre style JSON documents over HTTPS with no
 * API key, no signup, and no usage billing — which is why it is the tile source
 * (see openspec/config.yaml for the cost constraint). Both platforms consume
 * the same URL: maplibre-gl takes it as `style`, maplibre-react-native as
 * `mapStyle`.
 *
 * These are URLs rather than inlined style documents on purpose. Inlining would
 * pin the style at build time and lose upstream fixes; a change that needs
 * local overrides should fetch the document and patch it, keeping the patch
 * here so both platforms get it.
 */

export const OPENFREEMAP_STYLES = {
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  bright: 'https://tiles.openfreemap.org/styles/bright',
  positron: 'https://tiles.openfreemap.org/styles/positron',
} as const

export type StyleName = keyof typeof OPENFREEMAP_STYLES

/**
 * Positron, because the pins are the subject.
 *
 * A near-greyscale basemap is what lets five saturated marker colours be the
 * only strong colour on screen — finding the one restaurant among fourteen
 * temples is the question the palette exists to answer, and liberty's own
 * greens, blues and POI labels compete with it directly.
 */
export const DEFAULT_STYLE: StyleName = 'positron'

export function styleUrl(name: StyleName = DEFAULT_STYLE): string {
  return OPENFREEMAP_STYLES[name]
}

/**
 * The transformation both applications apply, named so that neither invents its
 * own. Applications fetch `styleUrl()`, pass the document through `themeStyle`,
 * and hand the result to their renderer — see the requirement in
 * `map-rendering`.
 */
export const BASEMAP_TRANSFORM = 'pinpoint-warm-positron'

/**
 * Attribution that must remain visible wherever these tiles are rendered.
 *
 * This is the price of the $0 tile story, not a nicety: OpenStreetMap data is
 * ODbL-licensed and requires credit. MapLibre shows an attribution control by
 * default and it can be removed without any warning — do not remove it.
 */
export const ATTRIBUTION = '© OpenMapTiles © OpenStreetMap contributors'

/**
 * Everything the map is built out of, and where each one can be read about.
 *
 * `ATTRIBUTION` is the line that must be on screen unprompted; this is what the
 * line expands into when somebody presses it. Both are here rather than in an
 * application, for the reason `BASEMAP_TRANSFORM` is: neither platform gets to
 * invent its own account of where the map came from.
 *
 * Wider than the licence strictly demands. OpenStreetMap is the only entry that
 * is a condition — the data is ODbL — but a person reading this is asking who
 * made the map, and answering with one of four names would be a worse answer
 * than the question deserves.
 */
export const MAP_CREDITS = [
  {
    name: 'OpenStreetMap',
    role: 'The map data, contributed by its community.',
    url: 'https://www.openstreetmap.org/copyright',
  },
  {
    name: 'OpenMapTiles',
    role: 'The schema the data is packed into.',
    url: 'https://openmaptiles.org/',
  },
  {
    name: 'OpenFreeMap',
    role: 'Serves the tiles, at no cost and without an account.',
    url: 'https://openfreemap.org/',
  },
  {
    name: 'MapLibre',
    role: 'Draws the map on the screen.',
    url: 'https://maplibre.org/',
  },
] as const satisfies readonly MapCredit[]

/** One thing the map is built out of. */
export interface MapCredit {
  name: string
  /** What it does, in one line a person who is not a cartographer can read. */
  role: string
  url: string
}
