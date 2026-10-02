import { type Marker, formatWalkingDistance } from '@pinpoint/core'
import {
  driftTolerance,
  hasDrifted,
  type LngLat,
  markerTypeOf,
  NEARBY_FAR_KM,
  NEARBY_ROUGH_METRES,
  orderByDistance,
  distanceKm,
} from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message, type Message } from '@pinpoint/wording'
import RotateCw from 'lucide-react-native/icons/rotate-cw'
import X from 'lucide-react-native/icons/x'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MarkerGlyph } from '@/components/marker-icon'
import { Sheet } from '@/components/sheet'
import { useLanguage, useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'
import type { WhereAmI } from '@/lib/where-am-i'

/**
 * The trip's places, nearest first (`nearby-places`).
 *
 * A modal sheet like the filter's rather than a positioned view like the
 * marker sheet: this is read instead of the map, not beside it, and dimming
 * what is behind says the map is waiting. Its height is a fixed fraction of the
 * window rather than a cap, because the list scrolls and a scroller inside a
 * container sizing to its children is given nowhere to draw (`AGENTS.md`).
 *
 * The order is held, not derived. It is worked out when the sheet opens, when
 * the person asks for it again, and when the point it is measured from changes
 * kind — the map giving way to the person. Between those the distances follow
 * the point and the rows stay where a thumb left them; `Re-sort` appears once
 * the two disagree by more than the position itself is unsure of.
 */

/** How much of the window the sheet stands in. */
const SHEET_FRACTION = 0.62

/** Where the list was left, for coming back to it after a place is closed. */
export interface NearbyReturn {
  order: readonly string[]
  offset: number
}

export function NearbySheet({
  open,
  onClose,
  places,
  narrowed,
  whereAmI,
  mapCentre,
  cityNameOf,
  resume,
  onChoose,
}: {
  open: boolean
  onClose: () => void
  /** The places the map is showing under the current filter. */
  places: readonly Marker[]
  narrowed: boolean
  whereAmI: WhereAmI
  /** The middle of the uncovered map, read when the sheet opens. */
  mapCentre: LngLat | null
  cityNameOf: (marker: Marker) => string | null
  /** Where to pick up, when this opening is a return from a place. */
  resume: NearbyReturn | null
  onChoose: (marker: Marker, left: NearbyReturn) => void
}) {
  const theme = useTheme()
  const say = useSay()
  const language = useLanguage()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()

  const fix = whereAmI.fix
  const fromYou = fix !== null
  const from: LngLat | null = fix ?? mapCentre

  /*
    Opening Nearby is asking where you are, once the answer has been yes
    (`device-location`). Only on opening, and only from rest: a refusal or a
    missed fix is said in the sheet, and opening it again is the way to try.
  */
  useEffect(() => {
    if (!open) return
    // Only when nothing is known yet: once a position has been found, the
    // follow behind the map's dot keeps it current, and asking again would
    // make the person wait for something already on screen.
    if (
      whereAmI.fix === null &&
      whereAmI.permission === 'granted' &&
      whereAmI.status !== 'finding'
    ) {
      void whereAmI.locate()
    }
    // Deliberately on opening and on a permission granted while open — which is
    // what coming back from Settings looks like — and on nothing else.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, whereAmI.permission])

  const distances = useMemo(() => {
    const map = new Map<string, number>()
    if (from) for (const place of places) map.set(place.id, distanceKm(from, place))
    return map
  }, [places, from])

  const [order, setOrder] = useState<readonly string[]>([])
  const freshOrder = () => (from ? orderByDistance(places, from).map((row) => row.id) : places.map((place) => place.id))

  /*
    Fresh on every opening, or exactly as it was left when this opening is a
    return from a place. Fresh again when the point stops being the map and
    becomes the person, and when the set itself changes — a filter changed or a
    place removed is a different list, not the same one drifting.
  */
  const placeKey = places.map((place) => place.id).sort().join(',')
  const opened = useRef(false)
  useEffect(() => {
    if (!open) {
      opened.current = false
      return
    }
    if (!opened.current && resume) setOrder(resume.order)
    else setOrder(freshOrder())
    opened.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fromYou, placeKey, from === null])

  const scroller = useRef<ScrollView>(null)
  const offset = useRef(0)
  useEffect(() => {
    if (open && resume) {
      requestAnimationFrame(() => scroller.current?.scrollTo({ y: resume.offset, animated: false }))
    }
  }, [open, resume])

  const byId = useMemo(() => new Map(places.map((place) => [place.id, place])), [places])
  const rows = order.map((id) => byId.get(id)).filter((place) => place !== undefined)

  const drifted =
    from !== null &&
    hasDrifted(order, distances, fromYou ? driftTolerance(fix?.accuracy ?? null) : undefined)

  const rough =
    fix !== null && fix.accuracy !== null && fix.accuracy > NEARBY_ROUGH_METRES
      ? fix.accuracy / 1000
      : null

  /* The one line above the list: what is known about where the person is. */
  let line: {
    text: Message
    hint?: Message
    action?: { label: Message; onPress: () => void }
  } | null = null
  if (whereAmI.status === 'finding') {
    line = { text: message('nearby.finding') }
  } else if (fix === null && (whereAmI.status === 'refused' || whereAmI.permission === 'refused')) {
    line = {
      text: message('map.locationOff'),
      action: {
        label: message('nearby.openSettings'),
        // iOS will not ask a second time; the way back is the app's own page.
        onPress: () => {
          whereAmI.dismiss()
          void Linking.openSettings()
        },
      },
    }
  } else if (fix === null && whereAmI.status === 'notFound') {
    line = {
      text: message('map.locationNotFound'),
      action: { label: message('common.tryAgain'), onPress: () => void whereAmI.locate() },
    }
  } else if (fix === null && whereAmI.permission === 'unknown') {
    line = {
      text: message('nearby.offer'),
      hint: message('nearby.offerHint'),
      action: { label: message('nearby.useLocation'), onPress: () => void whereAmI.locate() },
    }
  } else if (rough !== null) {
    line = { text: message('nearby.rough', { distance: say(formatWalkingDistance(language, rough)) }) }
  }

  const close = () => onClose()

  return (
    <Sheet open={open} onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={say(message('common.close'))}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
              height: Math.round(windowHeight * SHEET_FRACTION),
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View style={styles.head}>
            <View style={styles.headText}>
              <Text style={[styles.title, { color: theme.colour.ink }]} accessibilityRole="header">
                {say(message(fromYou ? 'nearby.fromYou' : 'nearby.fromMap'))}
              </Text>
              <Text style={[styles.sub, { color: theme.colour.inkMuted }]}>
                {narrowed ? (
                  <Text style={{ color: theme.colour.accentInk, fontWeight: '600' }}>
                    {say(message('nearby.filtered'))}
                    {' · '}
                  </Text>
                ) : null}
                {say(message('city.placeCount', { count: places.length }))}
              </Text>
            </View>

            {drifted ? (
              <Pressable
                onPress={() => setOrder(freshOrder())}
                accessibilityRole="button"
                accessibilityHint={say(message('nearby.resortHint'))}
                hitSlop={6}
                style={[styles.resort, { backgroundColor: theme.colour.accentWash }]}
              >
                <RotateCw size={14} color={theme.colour.accentInk} strokeWidth={2.4} />
                <Text style={[styles.resortText, { color: theme.colour.accentInk }]}>
                  {say(message('nearby.resort'))}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel={say(message('common.close'))}
              hitSlop={8}
              style={[styles.close, { backgroundColor: theme.colour.surfaceMuted }]}
            >
              <X size={16} color={theme.colour.inkMuted} strokeWidth={2.4} />
            </Pressable>
          </View>

          {line ? (
            <View style={[styles.line, { backgroundColor: theme.colour.surfaceMuted }]}>
              {whereAmI.status === 'finding' ? (
                <ActivityIndicator size="small" color={theme.colour.inkMuted} />
              ) : null}
              <View style={styles.lineWords}>
                <Text style={[styles.lineText, { color: theme.colour.ink }]}>{say(line.text)}</Text>
                {line.hint ? (
                  <Text style={[styles.lineHint, { color: theme.colour.inkMuted }]}>{say(line.hint)}</Text>
                ) : null}
              </View>
              {line.action ? (
                <Pressable
                  onPress={line.action.onPress}
                  accessibilityRole="button"
                  hitSlop={6}
                  style={[styles.lineAction, { backgroundColor: theme.colour.accent }]}
                >
                  <Text style={[styles.lineActionText, { color: theme.colour.inkOnAccent }]} numberOfLines={1}>
                    {say(line.action.label)}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <ScrollView
            ref={scroller}
            style={[styles.list, { borderTopColor: theme.colour.line }]}
            onScroll={(event) => {
              offset.current = event.nativeEvent.contentOffset.y
            }}
            scrollEventThrottle={64}
          >
            {places.length === 0 ? (
              <Text style={[styles.empty, { color: theme.colour.inkMuted }]}>
                {say(message('map.noPlacesYet'))}
              </Text>
            ) : null}
            {rows.map((place) => {
              const km = distances.get(place.id)
              const definition = markerTypeOf(place.type)
              const city = cityNameOf(place)
              return (
                <Pressable
                  key={place.id}
                  onPress={() => onChoose(place, { order, offset: offset.current })}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: theme.colour.line },
                    pressed ? { backgroundColor: theme.colour.surfaceMuted } : null,
                  ]}
                >
                  <View style={[styles.glyph, { backgroundColor: theme.markerType[definition.id] }]}>
                    <MarkerGlyph icon={definition.icon} size={14} colour={theme.markerForeground} />
                  </View>
                  <View style={styles.rowText}>
                    <Text
                      style={[styles.name, { color: place.visited ? theme.colour.inkMuted : theme.colour.ink }]}
                      numberOfLines={1}
                    >
                      {place.name}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colour.inkMuted }]} numberOfLines={1}>
                      {city ?? say(message('empty.city'))}
                      {place.visited ? (
                        <Text style={{ color: theme.colour.ink, fontWeight: '600' }}>
                          {' · '}
                          {say(message('visited.on'))}
                        </Text>
                      ) : null}
                    </Text>
                  </View>
                  {km === undefined ? null : (
                    <Text
                      style={[
                        styles.distance,
                        km > NEARBY_FAR_KM
                          ? { color: theme.colour.inkMuted, fontWeight: '500' }
                          : { color: theme.colour.ink },
                      ]}
                    >
                      {say(formatWalkingDistance(language, km))}
                    </Text>
                  )}
                </Pressable>
              )
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: SPACE.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.sm,
  },
  headText: { flex: 1, gap: 2 },
  title: { ...role(TYPE.title) },
  sub: { ...role(TYPE.note) },
  resort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  resortText: { ...role(TYPE.control), fontWeight: '600' },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginHorizontal: SPACE.md,
    marginBottom: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  lineWords: { flex: 1, gap: 1 },
  lineText: { ...role(TYPE.note) },
  lineHint: { ...role(TYPE.note), fontSize: 11.5 },
  lineAction: {
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  lineActionText: { ...role(TYPE.control), fontWeight: '600' },
  list: { flex: 1, borderTopWidth: 1 },
  empty: { ...role(TYPE.body), padding: SPACE.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: 10,
    paddingHorizontal: SPACE.md,
    borderBottomWidth: 1,
  },
  glyph: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 1 },
  name: { ...role(TYPE.rowName) },
  meta: { ...role(TYPE.note) },
  distance: { ...role(TYPE.numeric), minWidth: 52, textAlign: 'right', fontVariant: ['tabular-nums'] },
})
