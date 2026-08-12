export {
  buildSearchUrl,
  DEFAULT_BIAS_SCALE,
  DEFAULT_LIMIT,
  DEFAULT_ZOOM,
  PHOTON_ENDPOINT,
} from './request'
export type { SearchOptions } from './request'

export { toCandidates } from './parse'

export { guessMarkerType } from './type-guess'

export { searchPlaces, SEARCH_FAILED_MESSAGE } from './search'

export type {
  Fetcher,
  FetchResponse,
  PlaceCandidate,
  SearchBias,
  SearchResult,
} from './types'
