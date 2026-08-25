import type { City, FieldErrors } from '@pinpoint/core'
import { MARKER_TYPES } from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MarkerGlyph } from '@/components/marker-icon'
import { Button, FieldLabel, FormNote, TextField } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The one form places are saved and edited through, on a phone.
 *
 * A sheet at one of two heights, and it started as a full screen. The argument
 * for the screen was partly wrong: it leaned on the `AGENTS.md` gotcha about a
 * `ScrollView` inside a container that sizes to its children, and that does not
 * apply here — every height this sheet takes is a fraction of the window, so it
 * is definite and `flex: 1` resolves against it. What was right about the screen
 * was only that the content is large.
 *
 * What the screen got wrong was worse. It took the map away at the one moment the
 * map is load-bearing: confirming that the place being saved is the place that
 * was meant. A geocoded result is a name and a claim about where it is, and the
 * only way to check the claim is to look at where it landed.
 *
 * So it opens at half height with the draft pin visible above it, and rises to
 * full when dragged — the map matters while the position is being confirmed, and
 * stops mattering once the typing starts.
 *
 * It owns no persistence. Every write is the workspace's, so this file has no
 * client, no schema, and nothing to say about what a rejection means.
 */

/**
 * The two heights, as fractions of the window.
 *
 * Half is enough map to recognise a street corner and enough sheet to show the
 * name field and the type grid — the two things that get checked against what is
 * on screen behind them. Full stops short of the top so the sheet still reads as
 * covering the map rather than having replaced it.
 */
const DETENTS = [0.52, 0.92] as const

/**
 * How tall the sheet will be when it opens, for whoever has to get out of its way
 * before it exists.
 *
 * Exported because the camera has to know where the sheet will be *before* the
 * sheet is mounted: choosing a search result moves the map and opens the form in
 * the same breath, and a camera that centres on the map's own middle puts the
 * place behind the sheet that is about to cover it.
 */
export function openingHeight(windowHeight: number): number {
  return Math.round(windowHeight * DETENTS[0])
}

/** How far a drag must travel before it counts as reaching for the other height. */
const SNAP_THRESHOLD = 60

export interface MarkerFormValues {
  name: string
  note: string | null
  cityId: string | null
  type: string
  link: string | null
  price: number | null
}

/** Blank is absent, never empty text. The two look identical in a form and are very different in a query. */
function absentIfBlank(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function MarkerFormSheet({
  title,
  initial,
  cities,
  busy,
  fieldErrors,
  message,
  notice,
  onSubmit,
  onCancel,
  onAdjustPosition,
  onCreateCity,
  onDelete,
  onHeight,
}: {
  title: string
  /**
   * What the form starts from.
   *
   * Also what it comes *back* to after a trip out to the sight: the workspace
   * holds these values while the position is being corrected and hands them back
   * unchanged, so correcting a position never costs what was typed.
   */
  initial: MarkerFormValues
  cities: readonly City[]
  busy: boolean
  fieldErrors: FieldErrors
  message: string | null
  /**
   * Something outside the form changed, rather than something in it being wrong.
   * Separate from `message` because the two ask for different things: one says
   * correct what you typed, the other says look at what somebody else did and
   * then decide.
   */
  notice: string | null
  onSubmit: (values: MarkerFormValues) => void
  onCancel: () => void
  /** Hands the current values back so nothing is lost on the way to the sight. */
  onAdjustPosition: (values: MarkerFormValues) => void
  onCreateCity: (name: string, currency: string | null) => Promise<City | null>
  /** Absent when creating: there is nothing yet to remove. */
  onDelete?: () => void
  /**
   * How tall the sheet has settled at, so the map can lift its licence credit
   * clear of it.
   *
   * Reported when it settles rather than continuously. MapLibre's own ornaments
   * take a number and cannot be animated, so following the drag frame by frame
   * would mean a re-render per frame for something that can only be correct at
   * rest anyway. Dragging up briefly covers the credit and dragging down reveals
   * it; at every resting position it is clear.
   */
  onHeight: (height: number) => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const [name, setName] = useState(initial.name)
  const [note, setNote] = useState(initial.note ?? '')
  const [cityId, setCityId] = useState<string | null>(initial.cityId)
  const [type, setType] = useState(initial.type)
  const [link, setLink] = useState(initial.link ?? '')
  const [price, setPrice] = useState(
    initial.price === null ? '' : String(initial.price),
  )

  // Creating a city happens inside this form so the place being saved is never
  // lost to a detour. `null` means the detour is closed.
  const [newCity, setNewCity] = useState<{ name: string; currency: string } | null>(
    null,
  )
  const [cityError, setCityError] = useState<string | null>(null)

  const windowHeight = useWindowDimensions().height
  const heights = useMemo(
    () => DETENTS.map((fraction) => Math.round(windowHeight * fraction)),
    [windowHeight],
  )

  /**
   * Which of the two heights the sheet is resting at.
   *
   * Opens at the lower one. Confirming the position is the first thing that
   * happens here and the only thing that needs the map behind it; everything
   * after that is typing, which does not.
   */
  /**
   * Which of the two heights the sheet is resting at.
   *
   * Opens at the lower one. Confirming the position is the first thing that
   * happens here and the only thing that needs the map behind it; everything
   * after that is typing, which does not.
   */
  const [detent, setDetent] = useState(0)

  /*
   * The animated height, created once through a state initialiser rather than
   * held in a ref. Reading `ref.current` while rendering is the pattern the React
   * linter rejects, and it rejected two earlier attempts at this component — the
   * same rule that caught the search bias earlier in this change.
   */
  const [height] = useState(() => new Animated.Value(openingHeight(windowHeight)))

  /*
    The opening height, said once.

    Without this the credit stays cleared for whatever was on the bottom edge
    before — the bar — and the sheet covers it until the first drag. An effect
    rather than a call during render, because it tells another component to
    change state.
  */
  useEffect(() => {
    onHeight(openingHeight(windowHeight))
  }, [onHeight, windowHeight])

  const settle = useCallback(
    (index: number) => {
      setDetent(index)
      onHeight(heights[index]!)
      Animated.spring(height, {
        toValue: heights[index]!,
        // Height is a layout property, so this cannot run on the UI thread.
        // Animating a transform instead would slide the content out of the
        // sheet's own bounds rather than resizing it.
        useNativeDriver: false,
        bounciness: 2,
        speed: 14,
      }).start()
    },
    [heights, height, onHeight],
  )

  /**
   * The grabber, and only the grabber.
   *
   * The responder is deliberately not on the whole sheet: the fields below
   * scroll, and a responder over them would take every scroll gesture and turn it
   * into a resize. A handle is also what says the sheet can be moved at all —
   * something draggable with no affordance is a feature nobody finds.
   *
   * Rebuilt whenever the resting height changes, which is only ever between
   * gestures, so it closes over plain values and needs no refs to read the
   * current ones.
   */
  const pan = useMemo(() => {
    const from = heights[detent]!

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderMove: (_event, gesture) => {
        // Clamped to the two ends, so dragging past either stops rather than
        // stretching the sheet to a height it can never rest at.
        height.setValue(
          Math.min(heights[1]!, Math.max(heights[0]!, from - gesture.dy)),
        )
      },
      onPanResponderRelease: (_event, gesture) => {
        // Up is negative. A drag that did not travel far enough returns to where
        // it started rather than committing to a height nobody asked for.
        if (gesture.dy < -SNAP_THRESHOLD) settle(1)
        else if (gesture.dy > SNAP_THRESHOLD) settle(0)
        else settle(detent)
      },
    })
  }, [heights, height, detent, settle])

  function values(): MarkerFormValues {
    return {
      name: name.trim(),
      note: absentIfBlank(note),
      cityId,
      type,
      link: absentIfBlank(link),
      // A blank price is absent. A typed zero is a real answer — free entry is
      // worth recording — so it must not collapse into the same thing.
      price: price.trim() === '' ? null : Number(price),
    }
  }

  async function createCity() {
    if (!newCity) return
    setCityError(null)

    const created = await onCreateCity(
      newCity.name.trim(),
      absentIfBlank(newCity.currency)?.toUpperCase() ?? null,
    )

    if (!created) {
      setCityError('Could not create that city.')
      return
    }

    setCityId(created.id)
    setNewCity(null)
  }

  return (
    <KeyboardAvoidingView
      // Height on Android, padding on iOS: the two platforms report the keyboard
      // differently and the wrong one leaves the save action under it.
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      /*
        Fills the map and passes touches through everywhere it is not the sheet.

        Both halves matter. It has to fill something, because a view that sizes to
        its children measures an absolutely positioned child as nothing and
        collapses — taking the sheet's bottom edge with it. And it has to be
        `box-none`, or an invisible full-bleed view would swallow every touch
        meant for the map showing above the sheet, which is the map this whole
        change exists to keep visible.
      */
      pointerEvents="box-none"
      style={styles.keyboardHost}
    >
      <Animated.View
        style={[
          styles.sheet,
          {
            height,
            backgroundColor: theme.colour.ground,
            borderColor: theme.colour.line,
            shadowColor: theme.elevation.lg.colour,
          },
        ]}
      >
        {/*
          The affordance, and the thing that carries the drag.

          Its own row rather than a mark inside the header, so the touch target is
          the full width of the sheet — a grabber a thumb has to find precisely is
          a grabber that gets missed.
        */}
        <View
          {...pan.panHandlers}
          style={styles.grabRow}
          accessibilityRole="adjustable"
          accessibilityLabel="Sheet height"
          accessibilityValue={{ text: detent === 0 ? 'Half screen' : 'Almost full screen' }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => {
            // The drag is a gesture a screen reader cannot perform, so the two
            // heights are reachable as actions as well.
            if (event.nativeEvent.actionName === 'increment') settle(1)
            if (event.nativeEvent.actionName === 'decrement') settle(0)
          }}
        >
          <View style={[styles.grabber, { backgroundColor: theme.colour.lineStrong }]} />
        </View>

        <View style={[styles.header, { borderColor: theme.colour.line }]}>
          <Text style={[styles.title, { color: theme.colour.ink }]} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Discard"
            hitSlop={10}
            style={styles.dismiss}
          >
            <Text style={[styles.dismissGlyph, { color: theme.colour.inkMuted }]}>
              ✕
            </Text>
          </Pressable>
        </View>

        {/*
          A `ScrollView` whose parent has a definite height, which is what makes
          this safe.

          Every height the sheet takes is a fraction of the window, so `flex: 1`
          here resolves to the space left between the header and the actions and
          the scroller knows how tall it is. The `AGENTS.md` gotcha is about a
          container that sizes to its *children* — this one never does, which is
          why the fields can scroll here where `marker-details.tsx` had to measure
          itself first to earn the same thing.
        */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.fields}
          keyboardShouldPersistTaps="handled"
        >
          {message ? <FormNote tone="danger">{message}</FormNote> : null}
          {notice ? <FormNote tone="notice">{notice}</FormNote> : null}

          <TextField
            label="Name"
            value={name}
            onChange={setName}
            error={fieldErrors.name}
            placeholder="What is this place called?"
          />

          {/*
            A grid of pins rather than a picker. A type's icon is a drawn
            component, and the better reason is that this answers the question a
            picker could not: what this place will look like once it is on the
            map.
          */}
          <View>
            <FieldLabel>Type</FieldLabel>
            <View
              style={styles.types}
              accessibilityRole="radiogroup"
              accessibilityLabel="Type"
            >
              {MARKER_TYPES.map((definition) => {
                const chosen = definition.id === type

                return (
                  <Pressable
                    key={definition.id}
                    onPress={() => setType(definition.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: chosen }}
                    accessibilityLabel={definition.label}
                    style={[
                      styles.type,
                      {
                        borderColor: chosen
                          ? theme.colour.accent
                          : theme.colour.line,
                        backgroundColor: chosen
                          ? theme.colour.accentWash
                          : 'transparent',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: chosen
                            ? theme.markerFamily[definition.family]
                            : theme.colour.surfaceMuted,
                        },
                      ]}
                    >
                      <MarkerGlyph
                        icon={definition.icon}
                        size={15}
                        colour={
                          chosen ? theme.markerForeground : theme.colour.inkMuted
                        }
                      />
                    </View>
                    <Text
                      style={[styles.typeLabel, { color: theme.colour.ink }]}
                      numberOfLines={1}
                    >
                      {definition.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {fieldErrors.type ? (
              <Text
                accessibilityRole="alert"
                style={[styles.error, { color: theme.colour.danger }]}
              >
                {fieldErrors.type}
              </Text>
            ) : null}
          </View>

          <View>
            <FieldLabel>City</FieldLabel>
            <View style={styles.cityRow}>
              <CityChip
                label="Unassigned"
                chosen={cityId === null}
                onPress={() => setCityId(null)}
              />
              {cities.map((city) => (
                <CityChip
                  key={city.id}
                  label={city.currency ? `${city.name} (${city.currency})` : city.name}
                  chosen={cityId === city.id}
                  onPress={() => setCityId(city.id)}
                />
              ))}
              <CityChip
                label="+ New city"
                chosen={false}
                onPress={() => setNewCity({ name: '', currency: '' })}
              />
            </View>
            {fieldErrors.cityId ? (
              <Text
                accessibilityRole="alert"
                style={[styles.error, { color: theme.colour.danger }]}
              >
                {fieldErrors.cityId}
              </Text>
            ) : null}
          </View>

          {newCity ? (
            <View
              style={[
                styles.newCity,
                {
                  borderColor: theme.colour.line,
                  backgroundColor: theme.colour.surface,
                },
              ]}
            >
              <TextField
                label="New city name"
                value={newCity.name}
                onChange={(value) => setNewCity({ ...newCity, name: value })}
                placeholder="Kyoto"
                autoFocus
              />
              <TextField
                label="Currency (optional)"
                value={newCity.currency}
                onChange={(value) => setNewCity({ ...newCity, currency: value })}
                placeholder="JPY"
                autoCapitalize="characters"
              />
              <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
                Prices filed under this city are read in its currency. Leave it
                blank and they show as plain numbers — nothing is assumed.
              </Text>
              {cityError ? <FormNote tone="danger">{cityError}</FormNote> : null}
              <View style={styles.row}>
                <View style={styles.grow}>
                  <Button
                    label="Create city"
                    tone="primary"
                    disabled={newCity.name.trim() === ''}
                    onPress={() => void createCity()}
                  />
                </View>
                <View style={styles.grow}>
                  <Button label="Cancel" onPress={() => setNewCity(null)} />
                </View>
              </View>
            </View>
          ) : null}

          <TextField
            label="Note"
            value={note}
            onChange={setNote}
            error={fieldErrors.note}
            placeholder="Why is this worth going to?"
            multiline
          />

          <TextField
            label="Link"
            value={link}
            onChange={setLink}
            error={fieldErrors.link}
            placeholder="https://…"
            keyboardType="url"
            autoCapitalize="none"
          />

          <TextField
            label="Price"
            value={price}
            onChange={setPrice}
            error={fieldErrors.price}
            placeholder="Leave blank if unknown"
            keyboardType="decimal-pad"
          />

          {/*
            The way back to the map, and the only one from here.

            The laptop never needs this — its form sits beside a pin that can be
            dragged at any moment. Here the map is behind a full screen, so a
            position arrived at by search can only be corrected through this.
          */}
          <Pressable
            onPress={() => onAdjustPosition(values())}
            accessibilityRole="button"
            style={[styles.adjust, { borderColor: theme.colour.lineStrong }]}
          >
            <Text style={[styles.adjustText, { color: theme.colour.accentInk }]}>
              Adjust position on the map
            </Text>
          </Pressable>

          {onDelete ? (
            <Button label="Remove this place" tone="danger" onPress={onDelete} />
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.actions,
            {
              borderColor: theme.colour.line,
              backgroundColor: theme.colour.surface,
              // `SPACE.md`, which is what every sheet in this application puts
              // between its last thing and the bottom edge. This bar had
              // `SPACE.sm`, and on a device with no inset to make up the
              // difference — an older phone, one with hardware buttons — `Save
              // place` was half as far off the edge here as anything else is.
              // The asymmetry against `paddingTop` is intended: the top of this
              // bar is a rule against scrolling content, the bottom is the end
              // of the screen.
              paddingBottom: SPACE.md + insets.bottom,
            },
          ]}
        >
          <View style={styles.grow}>
            <Button
              label={busy ? 'Saving…' : 'Save place'}
              tone="primary"
              disabled={busy}
              onPress={() => onSubmit(values())}
            />
          </View>
          <View style={styles.grow}>
            <Button label="Cancel" onPress={onCancel} />
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

function CityChip({
  label,
  chosen,
  onPress,
}: {
  label: string
  chosen: boolean
  onPress: () => void
}) {
  const theme = useTheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: chosen }}
      style={[
        styles.cityChip,
        {
          borderColor: chosen ? theme.colour.accent : theme.colour.lineStrong,
          backgroundColor: chosen ? theme.colour.accentWash : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.cityChipText,
          {
            color: chosen ? theme.colour.accentInk : theme.colour.ink,
            fontWeight: chosen ? '700' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  /*
   * Pinned to the bottom edge, like every other sheet on this platform.
   *
   * `height` is supplied by the animation rather than by a style, because it is
   * the thing being dragged. Rounded only at the top: the bottom is the screen
   * edge and a radius there would show the map through the corners.
   */
  keyboardHost: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -3 },
    elevation: 16,
  },
  grabRow: { alignItems: 'center', paddingTop: SPACE.sm, paddingBottom: SPACE.xs },
  grabber: { width: 38, height: 4, borderRadius: RADIUS.pill },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.sm,
    borderBottomWidth: 1,
  },
  title: { ...role(TYPE.title), flex: 1 },
  dismiss: { padding: SPACE.xs },
  dismissGlyph: { fontSize: 17 },
  scroll: { flex: 1 },
  fields: { padding: SPACE.md, gap: SPACE.md },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs },
  type: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs + 2,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 7,
    paddingHorizontal: SPACE.sm,
  },
  typeChip: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: { ...role(TYPE.control) },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs },
  cityChip: {
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  cityChipText: { ...role(TYPE.control) },
  newCity: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACE.sm + 2,
    gap: SPACE.sm,
  },
  hint: { ...role(TYPE.note) },
  error: { ...role(TYPE.note), paddingTop: SPACE.xs },
  row: { flexDirection: 'row', gap: SPACE.sm },
  grow: { flex: 1 },
  adjust: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adjustText: { ...role(TYPE.control), fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
  },
})
