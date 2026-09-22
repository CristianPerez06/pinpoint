import {
  type City,
  type CityNotice,
  type FieldErrors,
  type IsoDay,
  type MarkerFormValues,
  joinHours,
  localPriceClearedBy,
  pricesFromDraft,
  splitHours,
  UNFILED_CITY_WORDING,
} from '@pinpoint/core'
import { MARKER_TYPES } from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message, type Message } from '@pinpoint/wording'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CurrencyField } from '@/components/currency-field'
import { HoursField } from '@/components/hours-field'
import { MarkerGlyph, markerTypeMessage } from '@/components/marker-icon'
import {
  Button,
  DayField,
  FieldLabel,
  FormNote,
  PriceField,
  Question,
  TextField,
} from '@/components/ui'
import { useLanguage, useSay } from '@/lib/language'
import { usePending } from '@/lib/use-pending'
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

/** Blank is absent, never empty text. The two look identical in a form and are very different in a query. */
function absentIfBlank(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function MarkerFormSheet({
  title,
  initial,
  cities,
  cityNotice,
  fieldErrors,
  // Renamed here only: `message` is what names a sentence in this file.
  message: failure,
  notice,
  onSubmit,
  onCancel,
  onAdjustPosition,
  onCreateCity,
  onDelete,
  removing = false,
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
  /**
   * What the trip's cities had to say about where this place is, when it is
   * worth saying.
   *
   * Null in the ordinary case — a place near the city being worked in — and that
   * is a requirement rather than an absence. A form that remarks on every save
   * is noise, and noise is how the three saves a trip that matter get ignored.
   *
   * Decided by the parent, from the rule in `@pinpoint/core`: working it out
   * needs the trip's markers, and this sheet has never seen one.
   */
  cityNotice: CityNotice | null
  fieldErrors: FieldErrors
  message: string | null
  /**
   * Something outside the form changed, rather than something in it being wrong.
   * Separate from `message` because the two ask for different things: one says
   * correct what you typed, the other says look at what somebody else did and
   * then decide.
   */
  notice: string | null
  /**
   * Awaited rather than fired, so this sheet knows when the write settled and
   * can say so on the control that started it. What it resolves to is the
   * workspace's business — this only needs to know that it is over.
   */
  onSubmit: (values: MarkerFormValues) => Promise<unknown>
  onCancel: () => void
  /**
   * Hands the current values back so nothing is lost on the way to the sight.
   *
   * Absent where there is no map to go to. The calendar opens this same form to
   * edit a place and has no sight to frame and nothing to drag, so it offers no
   * route to one — the laptop's calendar leaves the same control out, for the
   * same reason.
   */
  onAdjustPosition?: (values: MarkerFormValues) => void
  /**
   * Creating a city without leaving the place being saved.
   *
   * Absent on a screen that cannot show where a city is. The calendar lists the
   * trip's cities so a place can be filed, but making one is the map's business
   * there, so the offer is simply not drawn — again as the laptop's calendar
   * already does.
   */
  onCreateCity?: (name: string, currency: string | null) => Promise<City | null>
  /** Absent when creating: there is nothing yet to remove. */
  onDelete?: () => void
  /**
   * Whether the removal this sheet asked for is in flight.
   *
   * Handed down rather than held here: the write starts when the confirmation
   * is answered, and the confirmation belongs to the workspace so that both
   * routes to removing a place ask in the same words.
   */
  removing?: boolean
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
  /**
   * How tall the sheet is standing, for whoever has a camera to offset.
   *
   * Absent on a screen with no map under the sheet: there is nothing to frame
   * and nothing that could be hidden behind it.
   */
  onHeight?: (height: number) => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const language = useLanguage()
  const say = useSay()

  /**
   * A field's refusal, in words, and nothing when there is no refusal.
   *
   * `FieldErrors` names a message rather than holding a sentence, and this form
   * draws eight of them into controls that take a string. This only carries the
   * `undefined`, which is the part that would otherwise be written out eight
   * times with nothing to gain.
   *
   * Not `refusal`: `@pinpoint/core` already has one, and it goes the other way —
   * it puts a name *into* a schema's message slot, where this takes one out.
   */
  const refusalWords = (error: Message | undefined): string | undefined =>
    error === undefined ? undefined : say(error)

  const [name, setName] = useState(initial.name)
  const [note, setNote] = useState(initial.note ?? '')
  const [cityId, setCityId] = useState<string | null>(initial.cityId)
  const [plannedOn, setPlannedOn] = useState<IsoDay | null>(initial.plannedOn)
  const [plannedUntil, setPlannedUntil] = useState<IsoDay | null>(initial.plannedUntil)
  /**
   * Whether the second date field is showing. See the laptop's form: seeded
   * from the place so an edit opens with both fields, and put away by clearing
   * the last day rather than by a control of its own.
   */
  const [extended, setExtended] = useState(initial.plannedUntil !== null)
  // Opened as the days and their one range, and turned back into a
  // week on saving — both by the same pair of functions the laptop uses.
  const [hours, setHours] = useState(() => splitHours(initial.hours))
  const [type, setType] = useState(initial.type)
  const [link, setLink] = useState(initial.link ?? '')
  // A free place is a price of 0, and opens as Free with an empty box rather
  // than as an amount of nothing.
  const [free, setFree] = useState(initial.price === 0)
  const [price, setPrice] = useState(
    initial.price === null || initial.price === 0 ? '' : String(initial.price),
  )
  // The second box, kept per currency rather than as one string. Refiling the
  // place to a city with another currency shows that currency's box, empty, and
  // choosing the first city again brings back what was in its box — nothing is
  // lost until the place is saved.
  const [localByCurrency, setLocalByCurrency] = useState<Record<string, string>>(() =>
    initial.localPrice !== null && initial.localCurrency !== null
      ? { [initial.localCurrency]: String(initial.localPrice) }
      : {},
  )

  // Creating a city happens inside this form so the place being saved is never
  // lost to a detour. `null` means the detour is closed.
  const [newCity, setNewCity] = useState<{ name: string; currency: string | null } | null>(
    null,
  )
  // A name rather than a sentence, so a change of language redraws it.
  const [cityError, setCityError] = useState<Message | null>(null)

  /**
   * Two writes, two flags, because this sheet offers both at once.
   *
   * One flag would disable the city detour while a place is being saved and the
   * save while a city is being created, which is the shared-`busy` mistake in
   * miniature: the state has to be per write or it is eventually read by a
   * control that has nothing to do with what is happening.
   */
  const [saving, startSave] = usePending()
  /** Whether the removal question is standing in place of its control. */
  const [asking, setAsking] = useState(false)
  const [creatingCity, startCreateCity] = usePending()

  const chosenCity = cities.find((city) => city.id === cityId) ?? null
  const currency = chosenCity?.currency ?? null
  const local = currency === null ? '' : (localByCurrency[currency] ?? '')
  const cleared = localPriceClearedBy(language, initial, currency)

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
    onHeight?.(openingHeight(windowHeight))
  }, [onHeight, windowHeight])

  const settle = useCallback(
    (index: number) => {
      setDetent(index)
      onHeight?.(heights[index]!)
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
      plannedOn,
      // A run with no beginning is not a run: clearing the day clears the last
      // day with it, whatever is still held in the second field.
      plannedUntil: plannedOn === null ? null : plannedUntil,
      // No day on is no hours, whatever was typed before the days went off.
      hours: joinHours(hours),
      type,
      link: absentIfBlank(link),
      // Free is a price of 0, and so is a typed 0 in either box. A blank price
      // is absent — not entered yet — and must not collapse into free.
      ...pricesFromDraft({ free, usd: price, local, currency }),
    }
  }

  function createCity() {
    if (!newCity) return
    setCityError(null)

    startCreateCity(async () => {
      const created = await onCreateCity?.(newCity.name.trim(), newCity.currency)

      if (!created) {
        setCityError(message('placeForm.createCityFailed'))
        return
      }

      setCityId(created.id)
      setNewCity(null)
    })
  }

  return (
    <KeyboardAvoidingView
      // Height on Android, padding on iOS: the two platforms report the keyboard
      // differently and the wrong one leaves the save action under it.
      // Padding on both platforms. `height` used to be the Android value here;
      // `padding` is what the rest of the app now uses, measured rather than
      // assumed — see the sheets.
      behavior="padding"
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
          accessibilityLabel={say(message('placeForm.sheetHeight'))}
          accessibilityValue={{
            text: say(
              detent === 0 ? message('placeForm.sheetHalf') : message('placeForm.sheetFull'),
            ),
          }}
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
            accessibilityLabel={say(message('common.discard'))}
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
          {failure ? <FormNote tone="danger">{failure}</FormNote> : null}
          {notice ? <FormNote tone="notice">{notice}</FormNote> : null}

          <TextField
            label={say(message('placeField.name'))}
            value={name}
            onChange={setName}
            error={refusalWords(fieldErrors.name)}
            placeholder={say(message('placeForm.namePlaceholder'))}
          />

          {/*
            A grid of pins rather than a picker. A type's icon is a drawn
            component, and the better reason is that this answers the question a
            picker could not: what this place will look like once it is on the
            map.
          */}
          <View>
            <FieldLabel>{say(message('placeField.type'))}</FieldLabel>
            <View
              style={styles.types}
              accessibilityRole="radiogroup"
              accessibilityLabel={say(message('placeField.type'))}
            >
              {MARKER_TYPES.map((definition) => {
                const chosen = definition.id === type

                return (
                  <Pressable
                    key={definition.id}
                    onPress={() => setType(definition.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: chosen }}
                    accessibilityLabel={say(markerTypeMessage(definition.id))}
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
                            ? theme.markerType[definition.id]
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
                      {say(markerTypeMessage(definition.id))}
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
                {say(fieldErrors.type)}
              </Text>
            ) : null}
          </View>

          <View>
            <FieldLabel>{say(message('placeField.city'))}</FieldLabel>
            <View style={styles.cityRow}>
              <CityChip
                label={say(UNFILED_CITY_WORDING)}
                chosen={cityId === null}
                onPress={() => setCityId(null)}
              />
              {cities.map((city) => (
                <CityChip
                  key={city.id}
                  label={city.name}
                  chosen={cityId === city.id}
                  onPress={() => setCityId(city.id)}
                />
              ))}
              {/* Only where a city can actually be made. On the calendar there
                  is nowhere to show where one is, so the offer is absent rather
                  than present and inert. */}
              {onCreateCity ? (
                <CityChip
                  label={say(message('placeForm.newCityChip'))}
                  chosen={false}
                  onPress={() => setNewCity({ name: '', currency: null })}
                />
              ) : null}
            </View>
            {cityNotice ? (
              <View
                style={[
                  styles.cityNotice,
                  {
                    borderColor: theme.colour.line,
                    backgroundColor: theme.colour.surfaceSunk,
                  },
                ]}
              >
                <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
                  {say(cityNotice.message)}
                </Text>
                {cityNotice.offer && !newCity ? (
                  <View style={styles.row}>
                    <Button
                      label={say(message('placeForm.createOffered', { name: cityNotice.offer }))}
                      onPress={() => setNewCity({ name: cityNotice.offer ?? '', currency: null })}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
            {fieldErrors.cityId ? (
              <Text
                accessibilityRole="alert"
                style={[styles.error, { color: theme.colour.danger }]}
              >
                {say(fieldErrors.cityId)}
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
                label={say(message('placeForm.newCityName'))}
                value={newCity.name}
                onChange={(value) => setNewCity({ ...newCity, name: value })}
                placeholder={say(message('placeForm.newCityPlaceholder'))}
                autoFocus
              />
              <CurrencyField
                value={newCity.currency}
                onChange={(code) => setNewCity({ ...newCity, currency: code })}
                hint={say(
                  newCity.name.trim() === ''
                    ? message('placeForm.newCityCurrencyHintUnnamed', {
                        currency: newCity.currency ?? '',
                      })
                    : message('placeForm.newCityCurrencyHint', {
                        city: newCity.name.trim(),
                        currency: newCity.currency ?? '',
                      }),
                )}
              />
              {cityError ? <FormNote tone="danger">{say(cityError)}</FormNote> : null}
              <View style={styles.row}>
                <View style={styles.grow}>
                  <Button
                    label={say(
                      creatingCity ? message('common.creating') : message('city.create'),
                    )}
                    tone="primary"
                    disabled={creatingCity || newCity.name.trim() === ''}
                    onPress={createCity}
                  />
                </View>
                <View style={styles.grow}>
                  <Button label={say(message('common.cancel'))} onPress={() => setNewCity(null)} />
                </View>
              </View>
            </View>
          ) : null}

          {/*
            The day, beside the city and not underneath it.

            Two groupings of one set of places, neither inside the other — so it
            sits next to the city in the form for the same reason it sits next to
            it in the database. Left blank is the ordinary state of most places
            on most trips, which is what `No day yet` says.
          */}
          <DayField
            label={say(message('placeField.day'))}
            value={plannedOn}
            onChange={(day) => {
              setPlannedOn(day)
              // Clearing the day clears the run and puts the field away — a
              // last day with nothing to start from is not storable, and
              // leaving it on screen would go on offering it.
              if (day === null) {
                setPlannedUntil(null)
                setExtended(false)
              }
            }}
            error={refusalWords(fieldErrors.plannedOn)}
          />

          {/*
            The offer, then the field — the laptop's arrangement in this
            application's idiom. Nothing to extend before a day is chosen, so
            neither appears until one is. Named for the days and not for a kind
            of place: a rail pass or a festival has a run as readily as a hotel.
          */}
          {plannedOn !== null && !extended ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setExtended(true)}
              style={styles.extendDay}
            >
              <Text style={[styles.extendDayText, { color: theme.colour.accentInk }]}>
                {say(message('placeForm.moreThanOneDay'))}
              </Text>
            </Pressable>
          ) : null}

          {plannedOn !== null && extended ? (
            <DayField
              label={say(message('placeField.until'))}
              value={plannedUntil}
              onChange={(day) => {
                setPlannedUntil(day)
                if (day === null) setExtended(false)
              }}
              error={refusalWords(fieldErrors.plannedUntil)}
            />
          ) : null}

          <HoursField
            draft={hours}
            onChange={setHours}
            error={refusalWords(fieldErrors.hours)}
          />

          <TextField
            label={say(message('placeField.note'))}
            value={note}
            onChange={setNote}
            error={refusalWords(fieldErrors.note)}
            placeholder={say(message('placeForm.notePlaceholder'))}
            multiline
          />

          <TextField
            label={say(message('placeField.link'))}
            value={link}
            onChange={setLink}
            error={refusalWords(fieldErrors.link)}
            placeholder={say(message('placeForm.linkPlaceholder'))}
            keyboardType="url"
            autoCapitalize="none"
          />

          <PriceField
            value={price}
            onChange={setPrice}
            free={free}
            onFreeChange={setFree}
            error={refusalWords(fieldErrors.price)}
            local={
              currency === null || chosenCity === null
                ? undefined
                : {
                    currency,
                    value: local,
                    onChange: (value) =>
                      setLocalByCurrency((current) => ({ ...current, [currency]: value })),
                    hint: say(
                      message('placeForm.localPriceHint', { currency, city: chosenCity.name }),
                    ),
                    error: refusalWords(fieldErrors.localPrice),
                  }
            }
            warning={
              cleared === null
                ? null
                : chosenCity === null
                  ? say(message('placeForm.localPriceClearedUnfiled', { amount: cleared }))
                  : say(
                      message('placeForm.localPriceClearedMoved', {
                        city: chosenCity.name,
                        amount: cleared,
                      }),
                    )
            }
          />

          {/*
            The way back to the map, and the only one from here.

            The laptop never needs this — its form sits beside a pin that can be
            dragged at any moment. Here the map is behind a full screen, so a
            position arrived at by search can only be corrected through this.

            Absent where the form was not opened over a map at all. The calendar
            edits a place from a list, with no camera behind the sheet and
            nowhere for this to lead.
          */}
          {onAdjustPosition ? (
            <Pressable
              onPress={() => onAdjustPosition(values())}
              accessibilityRole="button"
              style={[styles.adjust, { borderColor: theme.colour.lineStrong }]}
            >
              <Text style={[styles.adjustText, { color: theme.colour.accentInk }]}>
                {say(message('placeForm.adjustPosition'))}
              </Text>
            </Pressable>
          ) : null}

          {/*
            The question stands where the control was, inside the scroller,
            because the form's own footer holds `Save place` — a different
            write, which must not sit live beside a question about destroying
            the record it would save.
          */}
          {onDelete ? (
            asking ? (
              <Question
                question={say(message('placeForm.removeQuestion'))}
                consequence={say(message('placeCard.cannotBeUndone'))}
                confirm={say(message('common.remove'))}
                waiting={removing}
                onConfirm={onDelete}
                onDecline={() => setAsking(false)}
              />
            ) : (
              <Button
                label={say(message('placeForm.remove'))}
                tone="danger"
                onPress={() => setAsking(true)}
              />
            )
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
              label={say(saving ? message('common.saving') : message('placeForm.save'))}
              tone="primary"
              disabled={saving}
              onPress={() => startSave(() => onSubmit(values()))}
            />
          </View>
          <View style={styles.grow}>
            <Button label={say(message('common.cancel'))} onPress={onCancel} />
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
  /*
   * Where the city came from, when it did not come from where you were working.
   *
   * Deliberately quieter than `FormNote`, which washes the accent across the
   * whole strip because somebody else changed the thing under you. This is a
   * fact about the save being made right now: it belongs under the chips, has to
   * be readable there, and must not read as a warning.
   */
  cityNotice: {
    marginTop: SPACE.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACE.sm + 2,
    gap: SPACE.sm,
  },
  error: { ...role(TYPE.note), paddingTop: SPACE.xs },
  row: { flexDirection: 'row', gap: SPACE.sm },
  /*
   * The offer to extend a place to a run of days.
   *
   * Aligned to the start and padded only vertically, so it reads as a line of
   * text inside the day's group rather than as another field. No fill: the
   * accent pair converges on the dark ground, so anything filled with `accent`
   * has to letter itself in `inkOnAccent` — this fills with nothing and takes
   * `accentInk` on the sheet's own surface.
   */
  extendDay: { alignSelf: 'flex-start', paddingVertical: SPACE.xs },
  extendDayText: { ...role(TYPE.note), fontWeight: '700' },
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
