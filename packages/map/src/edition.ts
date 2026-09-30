import type { StyleDocument } from './basemap-theme'

/**
 * One week's streets, named by where its tiles are.
 *
 * OpenFreeMap republishes the planet every week under a new dated address, and
 * the style reaches it only through a tile index that is overwritten in place
 * when the week changes. A download made one week is therefore unreachable the
 * next, as soon as the phone has been online: the tiles are still on it, and the
 * index now points somewhere else. So a trip with a download names its edition
 * outright and never asks the index again (`offline-use`).
 */
export interface StreetEdition {
  tiles: string[]
  minzoom: number
  maxzoom: number
  attribution: string | null
}

/** The style's vector source, the one whose address changes weekly. */
export const STREETS_SOURCE = 'openmaptiles'

interface SourceSpec {
  url?: unknown
  [key: string]: unknown
}

function streetsSource(document: StyleDocument): SourceSpec | null {
  const sources = document.sources
  if (typeof sources !== 'object' || sources === null) return null
  const source = (sources as Record<string, unknown>)[STREETS_SOURCE]
  return typeof source === 'object' && source !== null ? (source as SourceSpec) : null
}

/** Where the style's tile index is, or null when the source is not indexed. */
export function streetsIndexUrl(document: StyleDocument): string | null {
  const url = streetsSource(document)?.url
  return typeof url === 'string' ? url : null
}

/** The edition a tile index describes, or null when it does not describe one. */
export function editionOf(index: unknown): StreetEdition | null {
  if (typeof index !== 'object' || index === null) return null
  const { tiles, minzoom, maxzoom, attribution } = index as Record<string, unknown>
  if (
    !Array.isArray(tiles) ||
    tiles.length === 0 ||
    !tiles.every((tile) => typeof tile === 'string')
  ) {
    return null
  }
  if (typeof minzoom !== 'number' || typeof maxzoom !== 'number') return null
  return {
    tiles: tiles as string[],
    minzoom,
    maxzoom,
    attribution: typeof attribution === 'string' ? attribution : null,
  }
}

/** Whether a value read back from storage is an edition. */
export function isStreetEdition(value: unknown): value is StreetEdition {
  return editionOf(value) !== null
}

/**
 * The style with its streets fixed to one edition.
 *
 * The source's `url` is replaced by the edition's tiles and zoom range. The zoom
 * range is not decoration: without `maxzoom`, the renderer would ask for zoom 15
 * tiles that were never published, and street level would be blank.
 */
export function pinnedStyle(document: StyleDocument, edition: StreetEdition): StyleDocument {
  const source = streetsSource(document)
  if (source === null) return document

  const { url: _dropped, ...rest } = source
  const pinned: Record<string, unknown> = {
    ...rest,
    tiles: edition.tiles,
    minzoom: edition.minzoom,
    maxzoom: edition.maxzoom,
  }
  if (edition.attribution !== null) pinned.attribution = edition.attribution

  return {
    ...document,
    sources: {
      ...(document.sources as Record<string, unknown>),
      [STREETS_SOURCE]: pinned,
    },
  }
}

/** A short name for an edition that is safe in a file name. */
export function editionName(edition: StreetEdition): string {
  return edition.tiles[0]!
    .replace(/^https?:\/\//, '')
    .replace(/\{[a-z]\}/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
