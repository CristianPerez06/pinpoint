import { OfflineManager, type OfflinePack, type OfflinePackStatus } from '@maplibre/maplibre-react-native'
import { formatSize } from '@pinpoint/core'
import {
  editionName,
  editionOf,
  estimateBytes,
  estimateOverviewBytes,
  isStreetEdition,
  newOfflineAreas,
  OFFLINE_MAX_ZOOM,
  streetsIndexUrl,
  styleUrl,
  type Bounds,
  type OfflineArea,
  type OfflineOverview,
  type OfflinePlace,
  type StreetEdition,
} from '@pinpoint/map'
import { message, type Message } from '@pinpoint/wording'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { addNetworkStateListener } from 'expo-network'

import { styleDocument } from '@/lib/basemap'
import { useLanguage } from '@/lib/language'

/**
 * The map around a trip's places, downloaded ahead of time (`offline-use`).
 *
 * The renderer's own offline packs hold the streets, one pack per area; this
 * module is the only thing that talks to them. What a trip has downloaded is
 * read back from the packs rather than kept in a second record beside them, so
 * the two cannot disagree.
 *
 * A download outlives the screen that started it — the spec asks for it to
 * continue on any screen — so the state lives here, at module level, and screens
 * subscribe to it.
 */

/** One downloaded area, as its pack describes it. */
export interface DownloadedArea {
  packId: string
  key: string
  bounds: Bounds
  cityId: string | null
  placeCount: number
  /** `YYYY-MM-DD`, the day the download started. */
  downloadedOn: string
  edition: StreetEdition
  /**
   * The whole trip at low zoom rather than an area. Counted in sizes, never
   * listed, and never used to decide what is new: it covers every place.
   */
  overview: boolean
  maxZoom: number
  /** The area's own streets on the phone. */
  bytes: number
  /** The fonts and icons it shares with every other area. */
  sharedBytes: number
  complete: boolean
}

export type AreaStatus = 'waiting' | 'downloading' | 'done' | 'failed'

/** One area of a download in progress. */
export interface RunArea {
  area: OfflineArea
  maxZoom: number
  /** See `DownloadedArea.overview`. */
  overview: boolean
  estimate: number
  status: AreaStatus
  /** 0–1, for the area being downloaded. */
  fraction: number
  /** Its own streets so far. */
  bytes: number
  /** The fonts and icons it shares with every other area, so far. */
  sharedBytes: number
  packId: string | null
}

export interface Run {
  areas: RunArea[]
  /**
   * Whether this is the trip's first download, which also brings the fonts and
   * icons every area shares. An Update finds them already on the phone.
   */
  first: boolean
  /** Packs to delete once this run has finished: a whole trip being replaced. */
  replaces: readonly string[]
  /** The edition every area of this trip is downloaded in. */
  edition: StreetEdition | null
}

interface TripOffline {
  areas: DownloadedArea[]
  run: Run | null
}

interface State {
  loaded: boolean
  trips: Readonly<Record<string, TripOffline>>
}

const EMPTY: TripOffline = { areas: [], run: null }

let state: State = { loaded: false, trips: {} }
const listeners = new Set<() => void>()

function emit(next: State) {
  state = next
  for (const listener of listeners) listener()
}

function updateTrip(tripId: string, change: (trip: TripOffline) => TripOffline) {
  emit({ ...state, trips: { ...state.trips, [tripId]: change(state.trips[tripId] ?? EMPTY) } })
}

function updateRunArea(tripId: string, key: string, change: Partial<RunArea>) {
  updateTrip(tripId, (trip) =>
    trip.run === null
      ? trip
      : {
          ...trip,
          run: {
            ...trip.run,
            areas: trip.run.areas.map((entry) =>
              entry.area.key === key ? { ...entry, ...change } : entry,
            ),
          },
        },
  )
}

// ── Reading what is on the phone ────────────────────────────────────────────

interface PackMetadata {
  kind: 'area' | 'overview'
  maxZoom: number
  tripId: string
  areaKey: string
  cityId: string | null
  placeCount: number
  downloadedOn: string
  edition: StreetEdition
}

function metadataOf(pack: OfflinePack): PackMetadata | null {
  const m = pack.metadata
  if (
    typeof m.tripId !== 'string' ||
    typeof m.areaKey !== 'string' ||
    typeof m.placeCount !== 'number' ||
    typeof m.downloadedOn !== 'string' ||
    !isStreetEdition(m.edition)
  ) {
    return null
  }
  return {
    kind: m.kind === 'overview' ? 'overview' : 'area',
    maxZoom: typeof m.maxZoom === 'number' ? m.maxZoom : OFFLINE_MAX_ZOOM,
    tripId: m.tripId,
    areaKey: m.areaKey,
    cityId: typeof m.cityId === 'string' ? m.cityId : null,
    placeCount: m.placeCount,
    downloadedOn: m.downloadedOn,
    edition: m.edition,
  }
}

function boundsOfPack(pack: OfflinePack): Bounds {
  const [west, south, east, north] = pack.bounds
  return { west, south, east, north }
}

/**
 * Read every pack and rebuild the per-trip lists from them.
 *
 * Downloads in progress are carried across untouched: their areas are shown
 * from the run, which knows about areas not yet started.
 */
async function reload(): Promise<void> {
  const packs = await OfflineManager.getPacks()
  const byTrip: Record<string, DownloadedArea[]> = {}

  for (const pack of packs) {
    const metadata = metadataOf(pack)
    if (metadata === null) continue
    let status: OfflinePackStatus | null = null
    try {
      status = await pack.status()
    } catch {
      // A pack whose status cannot be read is still on the phone.
    }
    ;(byTrip[metadata.tripId] ??= []).push({
      packId: pack.id,
      key: metadata.areaKey,
      bounds: boundsOfPack(pack),
      cityId: metadata.cityId,
      placeCount: metadata.placeCount,
      downloadedOn: metadata.downloadedOn,
      edition: metadata.edition,
      overview: metadata.kind === 'overview',
      maxZoom: metadata.maxZoom,
      bytes: status?.completedTileSize ?? 0,
      sharedBytes: Math.max(0, (status?.completedResourceSize ?? 0) - (status?.completedTileSize ?? 0)),
      complete: status?.state === 'complete',
    })
  }

  const trips: Record<string, TripOffline> = {}
  for (const tripId of new Set([...Object.keys(byTrip), ...Object.keys(state.trips)])) {
    trips[tripId] = { areas: byTrip[tripId] ?? [], run: state.trips[tripId]?.run ?? null }
  }
  emit({ loaded: true, trips })
}

let loading: Promise<void> | null = null

/**
 * Read the packs once, and pick up any download a closed app left half done.
 *
 * An area left incomplete was being downloaded when the app last stopped. The
 * person pressed Download for it, so it continues; the areas that run never
 * reached show as new, and Update fetches them.
 */
function ensureLoaded(): Promise<void> {
  loading ??= reload()
    .then(() => {
      for (const [tripId, trip] of Object.entries(state.trips)) {
        const unfinished = trip.areas.filter((area) => !area.complete)
        if (unfinished.length === 0 || trip.run !== null) continue
        updateTrip(tripId, (current) => ({
          ...current,
          run: {
            first: trip.areas.every((area) => !area.complete),
            replaces: [],
            edition: unfinished[0]!.edition,
            areas: unfinished.map((area) => ({
              area: {
                key: area.key,
                bounds: area.bounds,
                cityId: area.cityId,
                placeCount: area.placeCount,
                minZoom: 0,
              },
              maxZoom: area.maxZoom,
              overview: area.overview,
              estimate: area.bytes,
              status: 'waiting',
              fraction: 0,
              bytes: area.bytes,
              sharedBytes: area.sharedBytes,
              packId: area.packId,
            })),
          },
        }))
        void advance(tripId)
      }
    })
    .catch(() => {
      loading = null
      emit({ ...state, loaded: true })
    })
  return loading
}

// ── Downloading ─────────────────────────────────────────────────────────────

/** The edition the style's tile index points at today. */
export async function currentEdition(): Promise<StreetEdition> {
  const url = streetsIndexUrl(await styleDocument())
  if (url === null) throw new Error('the map style names no tile index')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`the tile index answered ${response.status}`)
  const edition = editionOf(await response.json())
  if (edition === null) throw new Error('the tile index describes no edition')
  return edition
}

function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** The pack being downloaded, per trip, so leaving the app can pause it. */
const active = new Map<string, OfflinePack>()

/**
 * Download the next waiting area of a trip, then the one after.
 *
 * One at a time, so one area fills while the rest say *Waiting*, and so pausing
 * on leaving the app has exactly one thing to pause.
 */
async function advance(tripId: string): Promise<void> {
  const run = state.trips[tripId]?.run
  if (!run || active.has(tripId)) return
  if (AppState.currentState !== 'active' || !connected) return

  const next = run.areas.find((entry) => entry.status === 'waiting')
  if (next === undefined) {
    const failed = run.areas.some((entry) => entry.status === 'failed')
    if (!failed) {
      updateTrip(tripId, (trip) => ({ ...trip, run: null }))
      // What this run replaces goes only now that the replacement is on the
      // phone, so the trip draws offline throughout.
      await deletePacks(run.replaces)
    }
    await reload()
    return
  }

  const key = next.area.key
  updateRunArea(tripId, key, { status: 'downloading' })

  const onProgress = (pack: OfflinePack, status: OfflinePackStatus) => {
    updateRunArea(tripId, key, {
      fraction: status.percentage / 100,
      bytes: status.completedTileSize,
      sharedBytes: Math.max(0, status.completedResourceSize - status.completedTileSize),
      packId: pack.id,
    })
    if (status.state === 'complete') {
      active.delete(tripId)
      updateRunArea(tripId, key, { status: 'done', fraction: 1 })
      void reload().then(() => advance(tripId))
    }
  }
  const onError = (pack: OfflinePack) => {
    active.delete(tripId)
    void pack.pause().catch(() => {})
    updateRunArea(tripId, key, { status: 'failed', packId: pack.id })
  }

  try {
    let pack: OfflinePack
    if (next.packId !== null) {
      pack = await OfflineManager.getPack(next.packId)
      await OfflineManager.addListener(pack.id, onProgress, onError)
      await pack.resume()
    } else {
      // The pack follows the tile index, so it downloads whatever week the
      // index answers now. That has to be the week this run is in, or the area
      // would be keyed to a week the map does not draw.
      const edition = await currentEdition()
      if (run.edition === null) {
        updateTrip(tripId, (trip) => (trip.run ? { ...trip, run: { ...trip.run, edition } } : trip))
      } else if (editionName(edition) !== editionName(run.edition)) {
        // The week turned over since the run started. Stopping lets the
        // screen offer what the new week needs instead: the whole trip again.
        await cancelDownload(tripId)
        return
      }
      const { west, south, east, north } = next.area.bounds
      pack = await OfflineManager.createPack(
        {
          mapStyle: styleUrl(),
          bounds: [west, south, east, north],
          minZoom: next.area.minZoom,
          maxZoom: next.maxZoom,
          metadata: {
            kind: next.overview ? 'overview' : 'area',
            maxZoom: next.maxZoom,
            tripId,
            areaKey: key,
            cityId: next.area.cityId,
            placeCount: next.area.placeCount,
            downloadedOn: today(),
            edition,
          } satisfies PackMetadata,
        },
        onProgress,
        onError,
      )
      updateRunArea(tripId, key, { packId: pack.id })
    }
    // The download may have been cancelled while the pack was being created.
    if (state.trips[tripId]?.run === null) {
      await OfflineManager.deletePack(pack.id).catch(() => {})
      return
    }
    active.set(tripId, pack)
    // Left the app, or lost the connection, while the pack was being created.
    if (AppState.currentState !== 'active' || !connected) await pack.pause()
  } catch {
    updateRunArea(tripId, key, { status: 'failed' })
  }
}

/**
 * Start downloading a trip's areas: every area on a first download, the new
 * ones on an Update in the same week, and every area again on an Update after
 * the week has turned over — then `replaces` names the packs to delete once the
 * new ones are all on the phone.
 */
export function startDownload(
  tripId: string,
  areas: readonly OfflineArea[],
  overview: OfflineOverview | null,
  replaces: readonly string[] = [],
): void {
  const trip = state.trips[tripId] ?? EMPTY
  if (trip.run !== null || areas.length === 0) return
  // The overview first: it is small, and it is what the map opens on.
  const entries: Omit<RunArea, 'status' | 'fraction' | 'bytes' | 'sharedBytes' | 'packId'>[] = [
    ...(overview === null
      ? []
      : [
          {
            area: {
              key: overview.key,
              bounds: overview.bounds,
              cityId: null,
              placeCount: 0,
              minZoom: 0,
            },
            maxZoom: overview.maxZoom,
            overview: true,
            estimate: estimateOverviewBytes(overview),
          },
        ]),
    ...areas.map((area) => ({
      area,
      maxZoom: OFFLINE_MAX_ZOOM,
      overview: false,
      estimate: estimateBytes(area),
    })),
  ]
  updateTrip(tripId, (current) => ({
    ...current,
    run: {
      first: trip.areas.length === 0,
      // A same-week Update must stay in the trip's week; anything else takes
      // the week the index answers when the first pack is made.
      edition: replaces.length > 0 ? null : tripEdition(tripId),
      replaces,
      areas: entries.map((entry) => ({
        ...entry,
        status: 'waiting',
        fraction: 0,
        bytes: 0,
        sharedBytes: 0,
        packId: null,
      })),
    },
  }))
  void advance(tripId)
}

/** Try the failed area again, and carry on with the rest. */
export function retryDownload(tripId: string): void {
  const run = state.trips[tripId]?.run
  if (!run) return
  updateTrip(tripId, (trip) => ({
    ...trip,
    run: trip.run && {
      ...trip.run,
      areas: trip.run.areas.map((entry) =>
        entry.status === 'failed' ? { ...entry, status: 'waiting' } : entry,
      ),
    },
  }))
  void advance(tripId)
}

/**
 * Actually give the space back.
 *
 * Deleting a pack does not delete its streets: the renderer moves them into its
 * general cache of recently seen map, where they stay until something else
 * crowds them out — 99 MB of them, after removing the Japan trip. Clearing that
 * cache is what frees the space the screen promises. The cost is that places
 * merely looked at recently no longer draw offline until they are looked at
 * again; a trip's downloaded areas are packs, and are untouched.
 */
async function freeSpace(): Promise<void> {
  await OfflineManager.clearAmbientCache().catch(() => {})
}

async function deletePacks(packIds: readonly string[]): Promise<void> {
  for (const packId of packIds) await OfflineManager.deletePack(packId).catch(() => {})
}

/** Stop a download and remove what it had downloaded so far. */
export async function cancelDownload(tripId: string): Promise<void> {
  const run = state.trips[tripId]?.run
  if (!run) return
  active.delete(tripId)
  updateTrip(tripId, (trip) => ({ ...trip, run: null }))
  await deletePacks(run.areas.flatMap((entry) => (entry.packId === null ? [] : [entry.packId])))
  await freeSpace()
  await reload()
}

/** Remove every area of a trip from the phone. */
export async function removeDownload(tripId: string): Promise<void> {
  await cancelDownload(tripId)
  await deletePacks((state.trips[tripId]?.areas ?? []).map((area) => area.packId))
  await freeSpace()
  await reload()
}

// ── Leaving and coming back ─────────────────────────────────────────────────

let previous: AppStateStatus = AppState.currentState

AppState.addEventListener('change', (next) => {
  const left = next === 'background'
  const returned = previous === 'background' && next === 'active'
  previous = next

  if (left) {
    for (const pack of active.values()) void pack.pause().catch(() => {})
  }
  if (returned && connected) {
    for (const pack of active.values()) void pack.resume().catch(() => {})
    // A trip whose next area was due while the app was away starts it now.
    for (const tripId of Object.keys(state.trips)) void advance(tripId)
  }
})

// ── Losing the connection and getting it back ───────────────────────────────

/**
 * Whether the phone can reach anything, as the downloads see it.
 *
 * The renderer does not report a lost connection as a failure: a pack simply
 * stops receiving and waits, so the screen went on saying *Downloading…* over
 * a download that was going nowhere. Watching the connection here pauses the
 * active pack and says so, and carries on when it returns — the same as leaving
 * the app and coming back. Unknown counts as connected, as in
 * `ConnectivityProvider`.
 */
let connected = true

addNetworkStateListener(({ isConnected, isInternetReachable }) => {
  const now = isConnected !== false && isInternetReachable !== false
  if (now === connected) return
  connected = now
  if (!now) {
    for (const pack of active.values()) void pack.pause().catch(() => {})
  } else {
    for (const pack of active.values()) void pack.resume().catch(() => {})
    for (const tripId of Object.keys(state.trips)) void advance(tripId)
  }
})

// ── Reading it from a screen ────────────────────────────────────────────────

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** What a trip has downloaded, and any download in progress. */
export function useTripOffline(tripId: string | null): TripOffline & { loaded: boolean } {
  useEffect(() => {
    void ensureLoaded()
  }, [])
  const snapshot = useSyncExternalStore(subscribe, () => state)
  const trip = (tripId !== null && snapshot.trips[tripId]) || EMPTY
  return { ...trip, loaded: snapshot.loaded }
}

/**
 * One object per edition, so an edition read back from a pack and the same one
 * held by a download in progress are the same value to a dependency list, and
 * the map is not repainted for nothing.
 */
const editions = new Map<string, StreetEdition>()

/** The edition a trip's map is pinned to, or null when it has no download. */
export function tripEdition(tripId: string): StreetEdition | null {
  const trip = state.trips[tripId]
  // While a whole trip is being replaced, the map stays on the week being
  // replaced: the new areas are not all there yet.
  const replacing = trip?.run?.replaces ?? []
  const held =
    replacing.length > 0
      ? trip?.areas.find((area) => replacing.includes(area.packId))
      : trip?.areas[0]
  const edition = held?.edition ?? trip?.run?.edition ?? null
  if (edition === null) return null
  const name = editionName(edition)
  if (!editions.has(name)) editions.set(name, edition)
  return editions.get(name)!
}

/**
 * The same, for a screen: re-renders when a download adds or removes one.
 *
 * `undefined` until the packs have been read. The map waits for that rather
 * than drawing unpinned first: an unpinned style asks for the tile index, and
 * offline that would draw a week whose streets were never downloaded before the
 * right one arrived.
 */
export function useTripEdition(tripId: string | null): StreetEdition | null | undefined {
  useEffect(() => {
    void ensureLoaded()
  }, [])
  const snapshot = useSyncExternalStore(subscribe, () => state)
  if (!snapshot.loaded) return undefined
  return tripId === null ? null : tripEdition(tripId)
}

/**
 * What the trip sheet's *Offline map* line says: not downloaded, the size on the
 * phone, how many new areas there are, or that a download is under way.
 */
export function useOfflineMapNote(
  tripId: string,
  places: readonly OfflinePlace[],
): Message {
  const language = useLanguage()
  const { areas, run } = useTripOffline(tripId)
  const fresh = useMemo(
    () => newOfflineAreas(places, areaBounds(areas)),
    [places, areas],
  )

  if (run !== null) return message('offlineMap.downloading')
  if (areas.length === 0) return message('offlineMap.notDownloaded')
  if (fresh.length > 0) return message('offlineMap.newAreas', { count: fresh.length })
  return formatSize(language, onPhone(areas))
}

/**
 * The bounds that decide what is new: the areas', never the overview's, which
 * covers every place and would make each new one look downloaded.
 */
export function areaBounds(areas: readonly DownloadedArea[]): Bounds[] {
  return areas.filter((area) => !area.overview).map((area) => area.bounds)
}

/**
 * What a trip's download takes on the phone: every area's own streets, and the
 * fonts and icons they share, once.
 */
export function onPhone(
  areas: readonly Pick<DownloadedArea, 'bytes' | 'sharedBytes'>[],
): number {
  return (
    areas.reduce((sum, area) => sum + area.bytes, 0) +
    areas.reduce((most, area) => Math.max(most, area.sharedBytes), 0)
  )
}

/**
 * The week the tile index answers now, read once per screen while online, or
 * null while it is not known — offline, or not answered yet.
 *
 * What decides whether an Update can add just the new areas or has to download
 * the whole trip again.
 */
export function useCurrentEdition(online: boolean): StreetEdition | null {
  const [edition, setEdition] = useState<StreetEdition | null>(null)
  useEffect(() => {
    if (!online) return
    let live = true
    currentEdition().then(
      (answer) => {
        if (live) setEdition(answer)
      },
      () => {},
    )
    return () => {
      live = false
    }
  }, [online])
  return edition
}
