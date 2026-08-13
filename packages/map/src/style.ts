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
