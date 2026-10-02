export type {
  Bounds,
  Camera,
  LngLat,
  LocationPermission,
  Rect,
  Viewport,
  WhereAmIStatus,
} from './types'

export {
  DEFAULT_CAMERA,
  DEFAULT_PADDING,
  DEFAULT_VIEWPORT,
  MAX_COVERED_FRACTION,
  MAX_ZOOM,
  MIN_ZOOM,
  SINGLE_MARKER_ZOOM,
  TILE_SIZE,
  ZOOM_STEP,
} from './constants'

export { distanceKm } from './distance'

export {
  driftTolerance,
  hasDrifted,
  NEARBY_DRIFT_FLOOR_KM,
  NEARBY_FAR_KM,
  NEARBY_ROUGH_METRES,
  orderByDistance,
} from './nearby'
export type { NearbyPlace, NearbyRow } from './nearby'

export {
  boundsOf,
  boundsWidth,
  coveredBandHeight,
  fitBounds,
  frameAround,
  liftOffset,
  accuracyRadiusPx,
  isCentredOn,
  normalizeLongitude,
  offsetCenter,
  withinBounds,
  zoomStep,
} from './camera'
export type { FitBoundsOptions } from './camera'

export {
  ATTRIBUTION,
  BASEMAP_TRANSFORM,
  DEFAULT_STYLE,
  MAP_CREDITS,
  OPENFREEMAP_STYLES,
  styleUrl,
} from './style'
export type { MapCredit, StyleName } from './style'

export {
  AVERAGE_OVERVIEW_TILE_BYTES,
  AVERAGE_TILE_BYTES,
  estimateBytes,
  estimateOverviewBytes,
  newOfflineAreas,
  OFFLINE_MAX_ZOOM,
  offlineAreas,
  offlineOverview,
  STYLE_ASSETS_BYTES,
  tileCount,
} from './offline'
export type { OfflineArea, OfflineOverview, OfflinePlace } from './offline'

export {
  editionName,
  editionOf,
  isStreetEdition,
  pinnedStyle,
  STREETS_SOURCE,
  streetsIndexUrl,
} from './edition'
export type { StreetEdition } from './edition'

export { BasemapThemeError, themeStyle } from './basemap-theme'
export type { BasemapCategory, StyleDocument } from './basemap-theme'

export {
  FALLBACK_MARKER_TYPE,
  isKnownMarkerType,
  isMarkerType,
  MARKER_ICONS,
  MARKER_TYPE_IDS,
  MARKER_TYPE_IDS_TUPLE,
  MARKER_TYPES,
  markerTypeOf,
} from './marker-type'
export type {
  MarkerIconName,
  MarkerType,
  MarkerTypeDefinition,
} from './marker-type'

export { RETIRED_TYPES } from './marker-migrate'

export {
  groupCoincident,
  markersAt,
  markerView,
} from './marker-view'
export type {
  MarkerAnchor,
  MarkerForm,
  MarkerGroup,
  MarkerView,
  MarkerViewInput,
} from './marker-view'

export { locate, LOCATE_TIMEOUT_MS, LocationRefused } from './locate'
export type { Fix, LocateOutcome } from './locate'

export { LOCATION_SOURCE, locationFeature, locationLayers } from './location'
export type { LocationLayer, PointFeature } from './location'
