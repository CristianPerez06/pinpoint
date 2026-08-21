import {
  searchPlaces,
  type PlaceCandidate,
  type SearchBias,
  type SearchResult,
} from '@pinpoint/geocode'
import { markerTypeOf } from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { type ReactNode, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MarkerGlyph } from '@/components/marker-icon'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Finding a place by name, on a phone.
 *
 * A screen rather than a field in the bar of controls, and that is a decision
 * about the bar rather than about search. The bar is the floor — flush to the
 * bottom edge, with MapLibre's ornaments and our licence credit rising off it —
 * and a text field focused down there is a text field fighting the keyboard for
 * the same pixels. A screen has the whole display and hands the keyboard the
 * bottom half of it, which is what a keyboard is for.
 *
 * The behaviour is the laptop's, because it comes from the same function in
 * `@pinpoint/geocode`. What differs is everything about presentation, which is
 * where the two are supposed to differ.
 *
 * The three states are the point, exactly as they are on web. Searching,
 * matching nothing, and being unable to search all render as an empty list and
 * mean completely different things — only one of them means the person should
 * try other words, and a screen that blurs them sends somebody rephrasing a
 * query at a service that is down.
 */

/**
 * How long typing must pause before a request goes out.
 *
 * The same 300ms web settled on. Photon's public instance throttles heavy use
 * and gives no availability guarantee, and this is now the second client pointed
 * at it — so asking for as little as possible matters more than it did, not
 * less.
 */
const QUIET_PERIOD_MS = 300

/**
 * Beyond this, a candidate is marked as far away.
 *
 * Web's constant, and web's reasoning: of thirty-five real Osaka places run
 * through the geocoder, every correct match landed within 17 km and the nearest
 * wrong one was 270 km away. Anything in that gap separates them.
 *
 * The mark means "not near where you are working", not "wrong", and it only ever
 * changes emphasis — nothing is filtered and nothing is reordered — so being
 * wrong about the number costs a misplaced highlight and never a missing result.
 */
const FAR_AWAY_KM = 100

/**
 * A distance, at a precision that suits its size.
 *
 * Under 10 km a tenth matters, because that is the difference between the right
 * temple and the one across the river. At four figures it is noise.
 */
function formatDistance(km: number): string {
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString('en')} km`
}

/**
 * `fetch` wrapped rather than handed over directly.
 *
 * Web wraps it because a bare `globalThis.fetch` detached from its receiver
 * throws in a browser. React Native has no such problem, and it is wrapped here
 * anyway — the package takes a function, the wrapper costs nothing, and the two
 * applications reading the same at their call sites is worth more than saving a
 * line on one of them.
 */
const nativeFetch = (url: string, init?: { signal?: AbortSignal }) => fetch(url, init)

export function PlaceSearchScreen({
  open,
  onClose,
  onChoose,
  biasRef,
}: {
  open: boolean
  onClose: () => void
  onChoose: (candidate: PlaceCandidate) => void
  /**
   * Where to look first, read at query time rather than passed as a value.
   *
   * On this platform it is the middle of the map, written down on every settle.
   * Web can also derive it from the selected city's markers; the phone offers no
   * city selection, so it always takes the branch `place-search`'s bias
   * requirement describes as the fallback — which is compliance with that
   * requirement rather than an exception to it.
   */
  biasRef: { current: () => SearchBias | undefined }
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const [query, setQuery] = useState('')
  /**
   * The last answer, stamped with the query it answered.
   *
   * Stamped rather than stored bare, because that is what lets "still searching"
   * be derived — it is simply the state of having no answer for what is
   * currently typed. Tracking it as its own flag means two pieces of state that
   * can disagree, and the render where they do is a screen claiming to have found
   * nothing before it has looked.
   */
  const [answer, setAnswer] = useState<{ query: string; result: SearchResult } | null>(
    null,
  )

  const trimmed = query.trim()
  const result = answer?.query === trimmed ? answer.result : null
  const searching = trimmed !== '' && result === null

  useEffect(() => {
    if (!open) return
    if (trimmed === '') return

    const controller = new AbortController()

    const timer = setTimeout(() => {
      void searchPlaces(nativeFetch, trimmed, {
        bias: biasRef.current(),
        signal: controller.signal,
      }).then((outcome) => {
        // A superseded query is dropped rather than displayed. The query that
        // superseded it is already showing as in progress, and reporting this
        // one would flash a stale answer on the way past.
        if (outcome.status === 'aborted') return
        setAnswer({ query: trimmed, result: outcome })
      })
    }, QUIET_PERIOD_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, biasRef, open])

  // Closing forgets what was typed. Search is a way into capture rather than a
  // place, so returning to a stale query and a stale list would be offering
  // somebody yesterday's answer to today's question.
  function close() {
    setQuery('')
    setAnswer(null)
    onClose()
  }

  const candidates =
    result?.status === 'ready' ? result.candidates : ([] as readonly PlaceCandidate[])

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={close}
      presentationStyle="fullScreen"
    >
      <View
        style={[
          styles.screen,
          { backgroundColor: theme.colour.ground, paddingTop: insets.top },
        ]}
      >
        <View style={[styles.searchRow, { borderColor: theme.colour.line }]}>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close search"
            hitSlop={10}
            style={styles.back}
          >
            <Text style={[styles.backGlyph, { color: theme.colour.ink }]}>‹</Text>
          </Pressable>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a place…"
            placeholderTextColor={theme.colour.inkFaint}
            accessibilityLabel="Search for a place"
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            style={[
              styles.input,
              {
                color: theme.colour.ink,
                backgroundColor: theme.colour.surfaceMuted,
                borderColor: theme.colour.line,
              },
            ]}
          />
        </View>

        <View style={styles.body}>
          {trimmed === '' ? (
            <Note>
              Search for somewhere by name. If it cannot be found — and small,
              new, or locally-named places often cannot — close this and drop a
              pin instead.
            </Note>
          ) : searching ? (
            <View style={styles.searching}>
              <ActivityIndicator color={theme.colour.inkMuted} />
              <Note>Searching…</Note>
            </View>
          ) : result?.status === 'failed' ? (
            /* Never phrased as "no matches". Rephrasing a query at a service
               that is down is a way to spend five minutes learning nothing. */
            <Note tone="danger">
              {result.message} You can still add a place by dropping a pin.
            </Note>
          ) : result?.status === 'empty' ? (
            <Note>No matches. Try fewer words, or drop a pin.</Note>
          ) : (
            <View>
              {candidates.map((candidate) => (
                <Candidate
                  key={candidate.id}
                  candidate={candidate}
                  onPress={() => {
                    onChoose(candidate)
                    close()
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

function Candidate({
  candidate,
  onPress,
}: {
  candidate: PlaceCandidate
  onPress: () => void
}) {
  const theme = useTheme()
  const definition = markerTypeOf(candidate.typeGuess)
  const far = candidate.distanceKm !== null && candidate.distanceKm > FAR_AWAY_KM

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.candidate, { borderColor: theme.colour.line }]}
    >
      {/*
        The guessed type, drawn as the pin it would become.

        Worth showing before anything is saved: it is what the form will default
        to, and correcting it later costs more than noticing it now.
      */}
      <View
        style={[
          styles.glyph,
          { backgroundColor: theme.markerFamily[definition.family] },
        ]}
      >
        <MarkerGlyph icon={definition.icon} size={15} colour={theme.markerForeground} />
      </View>

      <View style={styles.candidateText}>
        <Text
          style={[styles.name, { color: theme.colour.ink }]}
          numberOfLines={1}
        >
          {candidate.name}
        </Text>
        {candidate.context ? (
          <Text
            style={[styles.context, { color: theme.colour.inkMuted }]}
            numberOfLines={1}
          >
            {candidate.context}
          </Text>
        ) : null}
      </View>

      {/*
        The distance, which is the whole point of this row having a third column.

        A query carrying a note — "Parque Suigetsu", "Barrio Shinsekai" — matches
        a real place of a similar name on another continent and arrives looking
        exactly like a correct result. The name cannot tell them apart; this can.

        Shown, never used to filter. A place a few hundred kilometres away is an
        ordinary thing to save on a trip that includes day trips.
      */}
      {candidate.distanceKm === null ? null : (
        <Text
          style={[
            styles.distance,
            {
              color: far ? theme.colour.danger : theme.colour.inkMuted,
              fontWeight: far ? '700' : '400',
            },
          ]}
        >
          {formatDistance(candidate.distanceKm)}
        </Text>
      )}
    </Pressable>
  )
}

function Note({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: 'muted' | 'danger'
}) {
  const theme = useTheme()

  return (
    <Text
      accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
      style={[
        styles.note,
        { color: tone === 'danger' ? theme.colour.danger : theme.colour.inkMuted },
      ]}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
  },
  back: { paddingHorizontal: SPACE.xs },
  backGlyph: { fontSize: 30, lineHeight: 34 },
  input: {
    ...role(TYPE.body),
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.md,
    paddingVertical: 10,
  },
  body: { padding: SPACE.md, gap: SPACE.sm },
  searching: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  note: { ...role(TYPE.note) },
  candidate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  glyph: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The only element that yields, so a long name truncates rather than pushing
  // the distance off the row — the one column that cannot afford to go missing.
  candidateText: { flex: 1, gap: 1 },
  name: { ...role(TYPE.rowName) },
  context: { ...role(TYPE.note) },
  distance: { ...role(TYPE.numeric) },
})
