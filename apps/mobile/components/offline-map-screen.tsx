import { type City, formatDayCompact, formatSize, type Marker, type Trip } from '@pinpoint/core'
import {
  estimateBytes,
  estimateOverviewBytes,
  newOfflineAreas,
  offlineAreas,
  offlineOverview,
  STYLE_ASSETS_BYTES,
  withinBounds,
  type OfflineArea,
} from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
import { NetworkStateType, useNetworkState } from 'expo-network'
import { useRouter } from 'expo-router'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import Check from 'lucide-react-native/icons/check'
import Info from 'lucide-react-native/icons/info'
import RefreshCw from 'lucide-react-native/icons/refresh-cw'
import { type ReactNode, useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { NeedsConnection } from '@/components/needs-connection'
import { Button } from '@/components/ui'
import { useOnline } from '@/lib/connectivity'
import { useLanguage, useSay } from '@/lib/language'
import {
  areaBounds,
  cancelDownload,
  type DownloadedArea,
  onPhone,
  removeDownload,
  retryDownload,
  type Run,
  startDownload,
  useTripOffline,
} from '@/lib/offline-map'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The map around a trip's places, downloaded for use with no signal
 * (`offline-use`).
 *
 * Five faces, decided by what the phone holds for this trip: nothing yet, a
 * download under way (or stopped on a failure), downloaded, and downloaded with
 * places added somewhere new since. With no signal the download controls are
 * greyed with their reason, and Remove still works.
 */
export function OfflineMapScreen({
  trip,
  markers,
  cities,
}: {
  trip: Trip
  markers: readonly Marker[]
  cities: readonly City[]
}) {
  const theme = useTheme()
  const say = useSay()
  const language = useLanguage()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const online = useOnline()
  const network = useNetworkState()
  const onMobileData = network.type === NetworkStateType.CELLULAR

  const { areas: downloaded, run, loaded } = useTripOffline(trip.id)

  const planned = useMemo(() => offlineAreas(markers), [markers])
  const overview = useMemo(() => offlineOverview(markers), [markers])
  const fresh = useMemo(
    () => newOfflineAreas(markers, areaBounds(downloaded)),
    [markers, downloaded],
  )
  /*
   * The overview an Update also needs, when the new places reach past the one
   * on the phone — otherwise opening offline would show them on an empty ground.
   */
  const outgrown = useMemo(() => {
    const held = downloaded.filter((area) => area.overview)
    const reaches = (area: OfflineArea) =>
      held.some(
        (each) =>
          withinBounds(each.bounds, { lng: area.bounds.west, lat: area.bounds.south }) &&
          withinBounds(each.bounds, { lng: area.bounds.east, lat: area.bounds.north }),
      )
    return fresh.length > 0 && !fresh.every(reaches) ? overview : null
  }, [downloaded, fresh, overview])
  const listed = downloaded.filter((area) => !area.overview)

  const cityName = (cityId: string | null, count: number): string =>
    cities.find((city) => city.id === cityId)?.name ?? say(message('offlineMap.noCity', { count }))

  const size = (bytes: number, approximate = false) =>
    say(formatSize(language, bytes, approximate))

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={() => {
          if (router.canGoBack()) router.back()
          else router.replace('/')
        }}
        accessibilityRole="button"
        accessibilityLabel={say(message('offlineMap.back'))}
        hitSlop={8}
        style={styles.back}
      >
        <ArrowLeft size={20} color={theme.colour.ink} strokeWidth={2} />
      </Pressable>
      <Text style={[styles.title, { color: theme.colour.ink }]}>
        {say(message('offlineMap.title'))}
      </Text>
    </View>
  )

  let body: ReactNode
  let footer: ReactNode = null

  if (!loaded) {
    body = null
  } else if (run !== null) {
    body = <Downloading run={run} cityName={cityName} size={size} />
    const stopped = run.areas.some((entry) => entry.status === 'failed')
    footer = (
      <View style={styles.footer}>
        {stopped ? (
          <Button
            label={say(message('offlineMap.tryAgain'))}
            tone="primary"
            disabled={!online}
            onPress={() => retryDownload(trip.id)}
          />
        ) : null}
        <Button label={say(message('offlineMap.cancel'))} onPress={() => void cancelDownload(trip.id)} />
        {stopped && !online ? (
          <NeedsConnection>{say(message('offlineMap.needsConnection'))}</NeedsConnection>
        ) : null}
      </View>
    )
  } else if (downloaded.length === 0) {
    // The fonts and icons come down once, with the first area; the overview
    // is not listed but is part of what is downloaded.
    const total =
      planned.reduce((sum, area) => sum + estimateBytes(area), 0) +
      (overview === null ? 0 : estimateOverviewBytes(overview)) +
      STYLE_ASSETS_BYTES
    body =
      planned.length === 0 ? (
        <Text style={[styles.intro, { color: theme.colour.inkMuted }]}>
          {say(message('offlineMap.noPlaces'))}
        </Text>
      ) : (
        <>
          <Text style={[styles.intro, { color: theme.colour.inkMuted }]}>
            {say(message('offlineMap.intro', { trip: trip.name, count: markers.length }))}
          </Text>
          <AreaList
            rows={planned.map((area) => ({
              key: area.key,
              name: cityName(area.cityId, area.placeCount),
              value: size(estimateBytes(area), true),
            }))}
            total={size(total, true)}
          />
          {onMobileData ? <MobileData /> : null}
        </>
      )
    footer =
      planned.length === 0 ? null : (
        <DownloadControl
          label={say(message('offlineMap.download', { size: size(total, true) }))}
          online={online}
          onPress={() => startDownload(trip.id, planned, overview)}
        />
      )
  } else {
    const extra =
      fresh.reduce((sum, area) => sum + estimateBytes(area), 0) +
      (outgrown === null ? 0 : estimateOverviewBytes(outgrown))
    body = (
      <>
        {fresh.length === 0 ? (
          <Ready bytes={size(onPhone(downloaded))} downloaded={downloaded} language={language} />
        ) : (
          <NewSince fresh={fresh} cityName={cityName} />
        )}
        <AreaList
          rows={[
            ...fresh.map((area) => ({
              key: area.key,
              name: cityName(area.cityId, area.placeCount),
              value: size(estimateBytes(area), true),
              isNew: true,
            })),
            ...listed.map((area) => ({
              key: area.packId,
              name: cityName(area.cityId, area.placeCount),
              value: size(area.bytes),
            })),
          ]}
        />
        {fresh.length > 0 && onMobileData ? <MobileData /> : null}
      </>
    )
    footer = (
      <View style={styles.footer}>
        {fresh.length > 0 ? (
          <Button
            label={say(message('offlineMap.update', { size: size(extra, true) }))}
            tone="primary"
            disabled={!online}
            onPress={() => startDownload(trip.id, fresh, outgrown)}
          />
        ) : null}
        <Button
          label={say(message('offlineMap.remove'))}
          tone="danger"
          onPress={() => void removeDownload(trip.id)}
        />
        {fresh.length > 0 && !online ? (
          <NeedsConnection>{say(message('offlineMap.needsConnection'))}</NeedsConnection>
        ) : null}
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colour.ground, paddingTop: insets.top }]}>
      {header}
      {/*
        The scroll sits in a `flex: 1` screen, which has a definite height, so it
        does not meet the collapse of a `ScrollView` in a container sized to its
        children (`AGENTS.md`).
      */}
      <ScrollView contentContainerStyle={styles.content}>{body}</ScrollView>
      {footer === null ? null : (
        <View style={[styles.bottom, { paddingBottom: SPACE.md + insets.bottom }]}>{footer}</View>
      )}
    </View>
  )
}

function DownloadControl({
  label,
  online,
  onPress,
}: {
  label: string
  online: boolean
  onPress: () => void
}) {
  const say = useSay()
  return (
    <View style={styles.footer}>
      <Button label={label} tone="primary" disabled={!online} onPress={onPress} />
      {online ? null : (
        <NeedsConnection>{say(message('offlineMap.needsConnection'))}</NeedsConnection>
      )}
    </View>
  )
}

interface Row {
  key: string
  name: string
  value: string
  /** Drawn quieter: an area still waiting its turn. */
  muted?: boolean
  /** Drawn in the accent, with a tick before it, or as a failure. */
  mark?: 'done' | 'active' | 'failed'
  isNew?: boolean
}

function AreaList({ rows, total }: { rows: readonly Row[]; total?: string }) {
  const theme = useTheme()
  const say = useSay()

  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: theme.colour.inkMuted }]}>
        {say(message('offlineMap.areas'))}
      </Text>
      <View style={[styles.card, { backgroundColor: theme.colour.surface, borderColor: theme.colour.line }]}>
        {rows.map((row, index) => (
          <View
            key={row.key}
            style={[
              styles.areaRow,
              index > 0 && { borderTopWidth: 1, borderTopColor: theme.colour.line },
            ]}
          >
            <View style={styles.areaName}>
              <Text
                style={[
                  styles.rowName,
                  { color: row.muted ? theme.colour.inkMuted : theme.colour.ink },
                  (row.mark === 'active' || row.isNew) && styles.strong,
                ]}
              >
                {row.name}
              </Text>
              {row.isNew ? (
                <View style={[styles.badge, { backgroundColor: theme.colour.accent }]}>
                  <Text style={[styles.badgeText, { color: theme.colour.inkOnAccent }]}>
                    {say(message('offlineMap.newBadge'))}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.areaValue}>
              {row.mark === 'done' ? (
                <Check size={16} color={theme.colour.inkMuted} strokeWidth={2.5} />
              ) : null}
              <Text
                style={[
                  styles.rowNote,
                  {
                    color:
                      row.mark === 'active'
                        ? theme.colour.accentInk
                        : row.mark === 'failed'
                          ? theme.colour.danger
                          : theme.colour.inkMuted,
                  },
                  row.mark === 'active' && styles.strong,
                ]}
              >
                {row.value}
              </Text>
            </View>
          </View>
        ))}
        {total === undefined ? null : (
          <View
            style={[
              styles.areaRow,
              {
                borderTopWidth: 1,
                borderTopColor: theme.colour.lineStrong,
                backgroundColor: theme.colour.surfaceMuted,
              },
            ]}
          >
            <Text style={[styles.rowName, styles.strong, { color: theme.colour.ink }]}>
              {say(message('offlineMap.total'))}
            </Text>
            <Text style={[styles.rowName, styles.strong, { color: theme.colour.ink }]}>{total}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

function Downloading({
  run,
  cityName,
  size,
}: {
  run: Run
  cityName: (cityId: string | null, count: number) => string
  size: (bytes: number, approximate?: boolean) => string
}) {
  const theme = useTheme()
  const say = useSay()

  const stopped = run.areas.some((entry) => entry.status === 'failed')
  const total =
    run.areas.reduce((sum, entry) => sum + entry.estimate, 0) +
    (run.first ? STYLE_ASSETS_BYTES : 0)
  const done = onPhone(run.areas)
  // Measured against the estimate, so capped: a city denser than the average
  // would otherwise run the bar past its end.
  const fraction = total === 0 ? 0 : Math.min(0.99, done / total)

  return (
    <>
      <View style={[styles.card, styles.panel, { backgroundColor: theme.colour.surface, borderColor: stopped ? theme.colour.danger : theme.colour.line }]}>
        <View style={styles.progressHead}>
          <Text style={[styles.panelTitle, { color: theme.colour.ink }]}>
            {say(message(stopped ? 'offlineMap.stopped' : 'offlineMap.downloading'))}
          </Text>
          <Text style={[styles.rowNote, { color: theme.colour.inkMuted }]}>
            {say(message('offlineMap.progress', { done: size(done), total: size(total, true) }))}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.colour.line }]}>
          <View
            style={[
              styles.fill,
              { width: `${Math.round(fraction * 100)}%`, backgroundColor: theme.colour.accent },
            ]}
          />
        </View>
        <Text style={[styles.rowNote, { color: theme.colour.inkMuted }]}>
          {say(message(stopped ? 'offlineMap.stoppedDetail' : 'offlineMap.keepOnScreen'))}
        </Text>
      </View>
      <AreaList
        rows={run.areas.filter((entry) => !entry.overview).map((entry) => ({
          key: entry.area.key,
          name: cityName(entry.area.cityId, entry.area.placeCount),
          value:
            entry.status === 'done'
              ? size(entry.bytes)
              : entry.status === 'downloading'
                ? say(message('offlineMap.percent', { percent: Math.round(entry.fraction * 100) }))
                : entry.status === 'failed'
                  ? say(message('offlineMap.failedArea'))
                  : say(message('offlineMap.waiting')),
          muted: entry.status === 'waiting',
          mark:
            entry.status === 'done'
              ? 'done'
              : entry.status === 'downloading'
                ? 'active'
                : entry.status === 'failed'
                  ? 'failed'
                  : undefined,
        }))}
      />
    </>
  )
}

function Ready({
  bytes,
  downloaded,
  language,
}: {
  bytes: string
  downloaded: readonly DownloadedArea[]
  language: ReturnType<typeof useLanguage>
}) {
  const theme = useTheme()
  const say = useSay()
  // The day of the latest download, so an Update moves it.
  const day = downloaded.reduce((latest, area) => (area.downloadedOn > latest ? area.downloadedOn : latest), '')

  return (
    <Panel
      icon={<Check size={20} color={theme.colour.accentInk} strokeWidth={2.5} />}
      title={say(message('offlineMap.ready'))}
      detail={say(message('offlineMap.readyDetail', { size: bytes, day: formatDayCompact(language, day) }))}
    />
  )
}

function NewSince({
  fresh,
  cityName,
}: {
  fresh: readonly OfflineArea[]
  cityName: (cityId: string | null, count: number) => string
}) {
  const theme = useTheme()
  const say = useSay()
  // Only cities are named: "added in 3 places with no city" says nothing.
  const where = [
    ...new Set(
      fresh
        .filter((area) => area.cityId !== null)
        .map((area) => cityName(area.cityId, area.placeCount)),
    ),
  ].join(', ')

  return (
    <Panel
      icon={<RefreshCw size={20} color={theme.colour.accentInk} strokeWidth={2} />}
      title={say(message('offlineMap.newSince', { count: fresh.length }))}
      detail={say(
        where === '' ? message('offlineMap.newAway') : message('offlineMap.newIn', { places: where }),
      )}
      accent
    />
  )
}

function Panel({
  icon,
  title,
  detail,
  accent,
}: {
  icon: ReactNode
  title: string
  detail: string
  accent?: boolean
}) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.card,
        styles.panelRow,
        {
          backgroundColor: theme.colour.surface,
          borderColor: accent ? theme.colour.accent : theme.colour.line,
        },
      ]}
    >
      <View style={[styles.panelIcon, { backgroundColor: theme.colour.accentWash }]}>{icon}</View>
      <View style={styles.panelText}>
        <Text style={[styles.panelTitle, { color: theme.colour.ink }]}>{title}</Text>
        <Text style={[styles.rowNote, { color: theme.colour.inkMuted }]}>{detail}</Text>
      </View>
    </View>
  )
}

function MobileData() {
  const theme = useTheme()
  const say = useSay()
  return (
    <View style={styles.warning}>
      <Info size={16} color={theme.colour.inkMuted} strokeWidth={2} />
      <Text style={[styles.rowNote, styles.warningText, { color: theme.colour.inkMuted }]}>
        {say(message('offlineMap.mobileData'))}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  title: { ...role(TYPE.title) },
  content: { paddingHorizontal: SPACE.md, paddingBottom: SPACE.lg, gap: SPACE.md },
  intro: { ...role(TYPE.body) },
  section: { gap: SPACE.sm, paddingTop: SPACE.xs },
  label: { ...role(TYPE.label) },
  card: { borderWidth: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    paddingVertical: 12,
    paddingHorizontal: SPACE.md,
  },
  areaName: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, flexShrink: 1 },
  areaValue: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  rowName: { ...role(TYPE.rowName), flexShrink: 1 },
  rowNote: { ...role(TYPE.note) },
  strong: { fontWeight: '700' },
  badge: { paddingHorizontal: SPACE.sm, paddingVertical: 2, borderRadius: 999 },
  badgeText: { ...role(TYPE.note), fontSize: 12, fontWeight: '700' },
  panel: { padding: SPACE.md, gap: 10 },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm + 4, padding: SPACE.md },
  panelIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelText: { flex: 1, gap: 2 },
  panelTitle: { ...role(TYPE.rowName), fontWeight: '700' },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: SPACE.sm },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6 },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm },
  warningText: { flex: 1 },
  bottom: { paddingHorizontal: SPACE.md, paddingTop: SPACE.sm },
  footer: { gap: SPACE.sm },
})
