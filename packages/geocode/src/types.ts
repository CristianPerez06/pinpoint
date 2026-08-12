/**
 * A place the geocoder offered, reduced to what it takes to become a marker.
 *
 * Everything the service returned that a marker has no use for is dropped here
 * rather than carried around — the application never sees an OSM tag, only a
 * name, a position, and a suggested type.
 */
export interface PlaceCandidate {
  /**
   * Distinct within one result set, so a list can be keyed by it. Not stable
   * across queries and not stored anywhere: a saved marker's identity is the
   * row's, and tying it to an OSM id would make it break when OSM renumbers.
   */
  id: string
  name: string
  lng: number
  lat: number
  /**
   * A marker type identifier, guessed from the service's classification. Always
   * a real type — the fallback when nothing matched — and always a
   * pre-selection the person can change.
   */
  typeGuess: string
  /**
   * Roughly where it is, for telling four identically-named coffee shops apart
   * in a list. Null when the service said nothing useful.
   */
  context: string | null
  /**
   * How far this is from the point the search was biased toward, in kilometres.
   * Null when there was no bias, because there is then nothing to measure from
   * and a fabricated number would appear in the same place a real one does.
   *
   * The geocoder matches on whatever words somebody wrote down, and a saved
   * place usually carries a note — which routinely resolves to a real place of a
   * similar name on another continent, rendered identically to a correct match.
   * This is the one fact that tells them apart.
   */
  distanceKm: number | null
}

/** The point results are ranked around. Never a filter — see `buildSearchUrl`. */
export interface SearchBias {
  lng: number
  lat: number
}

/**
 * What a search produced.
 *
 * Four cases rather than three. `aborted` exists because superseding a query is
 * an ordinary thing that happens on almost every keystroke, and folding it into
 * `failed` would flash "search unavailable" at somebody who is simply still
 * typing. A caller is expected to ignore an aborted result entirely.
 *
 * This mirrors the shape of `@pinpoint/data`'s query states without importing
 * them — that package depends on Supabase, and this one must not.
 */
export type SearchResult =
  | { status: 'ready'; candidates: readonly PlaceCandidate[] }
  | { status: 'empty' }
  | { status: 'aborted' }
  | { status: 'failed'; message: string }

/**
 * The part of `fetch` this package uses, described structurally.
 *
 * The global would work on both platforms, and it is still a parameter: the
 * same reasoning as `@pinpoint/auth` and `@pinpoint/data` taking a constructed
 * client. A test passes a function returning a fixture rather than reaching
 * around the module to replace a global, and the package declares no opinion
 * about which runtime it is in.
 */
export interface FetchResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export interface Fetcher {
  (url: string, init?: { signal?: AbortSignal }): Promise<FetchResponse>
}
