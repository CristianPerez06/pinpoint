import type { City, Marker } from '@pinpoint/core'
import { localPricesUnder, UNASSIGNED_CITY } from '@pinpoint/core'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
// One subpath each, like every other icon on this platform: Metro does not
// tree-shake in development, so the package root would pull all 1767 glyphs in.
import Check from 'lucide-react-native/icons/check'
import Pencil from 'lucide-react-native/icons/pencil'
import Plus from 'lucide-react-native/icons/plus'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CurrencyField } from '@/components/currency-field'
import { Button, FormNote, Question, TextField } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { usePending } from '@/lib/use-pending'
import { role } from '@/lib/type'

/**
 * Choosing which group of places is being worked on, and correcting a group
 * after the fact.
 *
 * This used to be the second of those and not the first. It said so, at length:
 * that web's city bar also selects which city is being worked on — framing the
 * map, biasing search, setting the next save's default — and that none of it
 * came over, because each job had another answer here.
 *
 * The third of those jobs no longer exists on either platform. Where a place is
 * filed is decided by where the place actually is, because a selection says what
 * is being *looked at* and filing says where something *is*.
 *
 * Each job did. What that argument missed is that it left a control called
 * `Cities` which looks like the laptop's and does a third of what it does, and
 * a control that looks broken is not experienced as a deliberate omission. So
 * selection came over after all, and this is where it lives.
 *
 * Opened from the header rather than from the trip sheet, because a city is
 * what is being worked in rather than an errand filed under the trip. It is
 * still out of a thumb's reach: the bar at the bottom holds the controls that
 * act on the map, and this acts on what is being worked on.
 *
 * **The row picks and the pencil edits**, and the two are independent — which
 * is the same shape the laptop now has, and for a reason found on the laptop:
 * an editor reached only through the current selection cannot correct anything
 * else without first taking the view somewhere else.
 *
 * A city created while saving a place is created with whatever was known at that
 * moment. Without this screen a city name typed in a hurry would be permanent on
 * this platform.
 */

/** Fraction of the screen the sheet may grow to before it scrolls instead. */
const SHEET_CAP = 0.8

export function CitySheet({
  open,
  onClose,
  cities,
  markers,
  selectedCityId,
  onSelect,
  onSave,
  onDelete,
  onCreateCity,
  problem,
  onDismissProblem,
}: {
  open: boolean
  onClose: () => void
  cities: readonly City[]
  /**
   * Every marker on the trip, to count what is filed under each city.
   *
   * Two jobs, and the second is why it is every marker rather than the visible
   * ones: it states what a removal would unassign, which the person has to be
   * told, and a count that moved with the filter would understate it.
   */
  markers: readonly Marker[]
  /** Which city is being worked on, or null for the whole trip. */
  selectedCityId: string | null
  /** Choosing one. Null is `All places`, which is a choice rather than a clear. */
  onSelect: (cityId: string | null) => void
  /** Renaming a city, awaited so the editor can say it is saving. */
  onSave: (cityId: string, patch: { name: string; currency: string | null }) => Promise<unknown>
  onDelete: (cityId: string) => Promise<unknown>
  /**
   * Making one, through the same path the place form uses. Null where the
   * write was refused.
   *
   * Creating does not select what it makes: a city with no places has nothing
   * for the map to frame on, so selecting it would name a city over a map
   * showing none of it. The laptop's control carries the longer account.
   */
  onCreateCity: (name: string, currency: string | null) => Promise<City | null>
  /** A refusal from one of the writes reached from here, or null. */
  problem: string | null
  onDismissProblem: () => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cap = Math.round(useWindowDimensions().height * SHEET_CAP)

  const [editing, setEditing] = useState<string | null>(null)
  /** Whether the creator is open. Never open beside an editor. */
  const [creating, setCreating] = useState(false)

  function close() {
    setEditing(null)
    setCreating(false)
    onClose()
  }

  /**
   * Picking closes the sheet; editing does not.
   *
   * A pick is answered by the map behind this sheet — it re-frames — so staying
   * open would cover the answer. An edit is answered in the row itself, which
   * has to remain visible to say `Saving…` and to report a refusal.
   */
  function pick(cityId: string | null) {
    onSelect(cityId)
    close()
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close">
        {/*
          A positioner, and nothing else. The surface is the `View` inside it.

          `KeyboardAvoidingView` with `behavior="padding"` renders
          `StyleSheet.compose(style, { paddingBottom: bottomHeight })`, and
          `bottomHeight` is 0 whenever the keyboard is down — so a `paddingBottom`
          handed to it is overwritten on every render where the keyboard is
          closed. The sheets that kept theirs are the ones whose surface is a
          plain `View`; this is now one of them. `TripSheet` carries the longer
          account of how it was found.
        */}
        {/*
          Padding on both platforms. Android used to get `undefined` here, on
          the premise that `adjustResize` shrinks the window and a second
          correction in JavaScript would double it. Measured on an emulator it
          does not: Expo enforces edge-to-edge from SDK 54, the window keeps its
          full height, and the sheet did not move at all — the keyboard covered
          the fields and the save button. `padding` is what reserves the space.
        */}
        <KeyboardAvoidingView behavior="padding">
          <View
            // The sheet swallows presses so that touching a row does not dismiss
            // through the backdrop underneath it.
            onStartShouldSetResponder={() => true}
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colour.surface,
                borderColor: theme.colour.line,
                // A definite height, so the `ScrollView` inside has something to
                // resolve `flex: 1` against. A sheet that sizes to its children
                // reports almost nothing to a scroller and clips everything past
                // the first row — see `AGENTS.md`.
                maxHeight: cap,
                paddingBottom: SPACE.md + insets.bottom,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: theme.colour.ink }]}>Cities</Text>
              <Pressable onPress={close} accessibilityRole="button" style={styles.done}>
                <Text style={[styles.doneText, { color: theme.colour.accentInk }]}>
                  Done
                </Text>
              </Pressable>
            </View>

            {/*
              Shown here for the reason the trips sheet says: the workspace
              draws refusals over the map, and this sheet is a `Modal` covering
              it. Above the list rather than inside it, so it cannot be scrolled
              away while it is the most important thing on screen.
            */}
            {problem !== null ? (
              <Pressable
                onPress={onDismissProblem}
                accessibilityRole="button"
                accessibilityHint="Dismisses this message"
                style={styles.problem}
              >
                <FormNote tone="danger">{problem}</FormNote>
              </Pressable>
            ) : null}

            <ScrollView keyboardShouldPersistTaps="handled">
              {/*
                Always offered, including on a trip with no cities at all.

                It is the state the trip opens in rather than a way out of a
                selection, so it is a row like the others and not a `Clear`. On
                an empty trip it is the only thing that can be true, and showing
                it ticked says so more plainly than an empty list would.
              */}
              <PickRow
                name="All places"
                meta={`${countLabel(markers.length)} · the whole trip`}
                current={selectedCityId === null}
                onPress={() => pick(null)}
              />

              {cities.length === 0 ? (
                /*
                  This used to say a city "is created the first time you file a
                  place under a new name while saving it", which was the only
                  way one could be made and is no longer true. It still says
                  what a city is for: a trip with none is exactly when nobody
                  knows.
                */
                <Text style={[styles.empty, { color: theme.colour.inkMuted }]}>
                  No cities yet. Name the places you&rsquo;re going, or file one
                  while you save a place.
                </Text>
              ) : (
                cities.map((city) => (
                  <CityRow
                    key={city.id}
                    city={city}
                    count={markers.filter((marker) => marker.cityId === city.id).length}
                    localCount={localPricesUnder(city.id, markers)}
                    current={city.id === selectedCityId}
                    onPick={() => pick(city.id)}
                    editing={editing === city.id}
                    onToggle={() =>
                      setEditing((current) => (current === city.id ? null : city.id))
                    }
                    // Each row closes itself when its own write settles, rather
                    // than being closed here as the write is sent. It is the
                    // only thing on screen that can say it is still happening.
                    onSave={(patch) => onSave(city.id, patch)}
                    onDelete={() => onDelete(city.id)}
                    onDone={() => setEditing(null)}
                  />
                ))
              )}

              {/*
                Below the cities rather than beside `All places`, because it is a
                narrowing like a city and not a widening like that one.

                Drawn whether or not it holds anything, for the reason
                `marker-filtering` gives about the filter control: a row that
                appears on demand moves everything beside it, and makes the way
                to a place discoverable only once you already have one. There is
                no pencil, because a group defined by the absence of a city has
                no name to correct.
              */}
              <PickRow
                name="Unassigned"
                meta={countLabel(
                  markers.filter((marker) => marker.cityId === null).length,
                )}
                current={selectedCityId === UNASSIGNED_CITY}
                onPress={() => pick(UNASSIGNED_CITY)}
              />
            </ScrollView>

            {/*
              Making a city, under the list rather than in it.

              Outside the `ScrollView` on purpose, so it stays put while the
              list scrolls — `workspace-chrome` requires it be reachable on a
              trip holding more cities than fit. The sheet above has a definite
              `maxHeight`, so this and the scroller divide that height between
              them rather than this being pushed off the bottom.
            */}
            <View style={[styles.foot, { borderTopColor: theme.colour.line }]}>
              {creating ? (
                <CityCreator
                  existing={cities}
                  onCreate={onCreateCity}
                  onClose={() => setCreating(false)}
                />
              ) : (
                <Pressable
                  onPress={() => {
                    setEditing(null)
                    setCreating(true)
                  }}
                  accessibilityRole="button"
                  accessibilityHint="Adds a city to this trip"
                  style={styles.createRow}
                >
                  <Plus size={16} color={theme.colour.accentInk} strokeWidth={2.5} />
                  <Text style={[styles.createText, { color: theme.colour.accentInk }]}>
                    New city…
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

/**
 * Making a city from the list, rather than while saving a place.
 *
 * Asks for the same two things `CityRow`'s editor lets a person change
 * afterwards, and the same two the place form collects when it creates one
 * mid-save. A third shape for one record is how the routes start to disagree.
 */
function CityCreator({
  existing,
  onCreate,
  onClose,
}: {
  existing: readonly City[]
  onCreate: (name: string, currency: string | null) => Promise<City | null>
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, startCreate] = usePending()

  const trimmed = name.trim()

  /**
   * Refused here rather than by the database, which has no opinion about it:
   * two cities of one name are legal rows and a nonsense trip. Compared on the
   * same normalised text `marker-capture` uses to match a geocoded city name,
   * so both sides agree on what "already holds" means. The laptop's creator
   * does this identically.
   */
  function nameIsTaken(): boolean {
    const normalise = (value: string) =>
      value.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
    return existing.some((city) => normalise(city.name) === normalise(trimmed))
  }

  return (
    <View style={styles.editor}>
      <TextField
        label="Name"
        value={name}
        onChange={(next) => {
          setName(next)
          setError(null)
        }}
        error={error ?? undefined}
      />
      <CurrencyField
        value={currency}
        onChange={setCurrency}
        hint={`Places in ${trimmed || 'this city'} get a ${currency ?? ''} price box beside the dollars.`}
      />

      <View style={styles.actions}>
        <View style={styles.grow}>
          <Button
            label={creating ? 'Creating…' : 'Create city'}
            tone="primary"
            disabled={creating}
            onPress={() => {
              if (trimmed === '') {
                setError('Give the city a name.')
                return
              }
              if (nameIsTaken()) {
                setError(`This trip already has a city called ${trimmed}.`)
                return
              }
              setError(null)
              startCreate(async () => {
                const created = await onCreate(trimmed, currency)
                // Nothing is cleared on a refusal. What was typed is the only
                // copy of it, and the sheet says why above the list.
                if (!created) return
                onClose()
              })
            }}
          />
        </View>
        <Button label="Cancel" tone="quiet" disabled={creating} onPress={onClose} />
      </View>
    </View>
  )
}

/** `1 place` or `N places`, said the same way here as on the laptop. */
function countLabel(count: number): string {
  return count === 1 ? '1 place' : `${count} places`
}

/**
 * A row that only picks.
 *
 * `All places` is the one of these, and it is separate from `CityRow` rather
 * than a mode of it because there is nothing to edit: no name and no removal. Giving it an inert pencil to keep the shapes identical would draw
 * a control that does nothing, which is worse than a row that is plainly a
 * different kind of thing.
 */
function PickRow({
  name,
  meta,
  current,
  onPress,
}: {
  name: string
  meta: string
  current: boolean
  onPress: () => void
}) {
  const theme = useTheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: current }}
      style={[styles.row, styles.pickRow, { borderColor: theme.colour.line }]}
    >
      <Tick shown={current} />
      <View style={styles.rowText}>
        <Text
          style={[
            styles.cityName,
            { color: current ? theme.colour.accentInk : theme.colour.ink },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={[styles.meta, { color: theme.colour.inkMuted }]}>{meta}</Text>
      </View>
    </Pressable>
  )
}

/**
 * The mark on the city being worked in.
 *
 * A tick rather than a fill, which is where this platform and the laptop
 * deliberately disagree. Each follows what its own neighbours already do — the
 * trips sheet here ticks, the trip menu there fills — and making the two agree
 * with each other would make each disagree with the screen it lives on.
 *
 * Drawn as a fixed-width slot whether or not it is shown, so the names form one
 * column instead of shifting sideways as the selection moves.
 */
function Tick({ shown }: { shown: boolean }) {
  const theme = useTheme()

  return (
    <View style={styles.tick}>
      {shown ? (
        <Check size={17} color={theme.colour.accentInk} strokeWidth={2.6} />
      ) : null}
    </View>
  )
}

function CityRow({
  city,
  count,
  current,
  onPick,
  editing,
  onToggle,
  onSave,
  onDelete,
  onDone,
  localCount,
}: {
  city: City
  count: number
  /** How many of this city's places have a local price, which a change of currency clears. */
  localCount: number
  /** Whether this is the city being worked on. */
  current: boolean
  onPick: () => void
  editing: boolean
  onToggle: () => void
  onSave: (patch: { name: string; currency: string | null }) => Promise<unknown>
  onDelete: () => Promise<unknown>
  /** Closes this row's editor, once whichever write it started has settled. */
  onDone: () => void
}) {
  const theme = useTheme()
  const [name, setName] = useState(city.name)
  const [currency, setCurrency] = useState(city.currency)

  /**
   * Two writes, two flags. Saving is optimistic — the list shows the new name
   * at once — and removing is not, because unassigning a city's places cannot
   * be undone. Both keep this row's editor open until the database answers,
   * which is what gives each control somewhere to say what it is doing.
   */
  const [saving, startSave] = usePending()
  const [removing, startRemove] = usePending()
  const busy = saving || removing

  /**
   * Removal, confirmed and counted.
   *
   * The count is the point rather than decoration: the consequence falls on rows
   * the person is not looking at, and "remove Kyoto" reads very differently once
   * it says it will unassign sixteen places. Those places stay on the trip — the
   * database unassigns rather than deletes — and the wording has to say so, or
   * somebody will reasonably assume they are about to lose them.
   */
  /**
   * Which question is standing, or none. Only one can: the editor shows the
   * question instead of its fields, so there is nowhere for a second.
   */
  const [asking, setAsking] = useState<'currency' | 'remove' | null>(null)

  function removalConsequence(): string {
    if (count === 0) return 'Nothing is filed under it.'
    return `${count} ${count === 1 ? 'place stays' : 'places stay'} on the trip and ${
      count === 1 ? 'becomes' : 'become'
    } unassigned.${
      // Unassigned is a city with no currency, so local prices go too.
      localCount === 0 || city.currency === null
        ? ''
        : ` ${count === 1 ? 'It' : `${localCount} of them`} ${
            localCount === 1 ? 'loses its' : 'lose their'
          } ${city.currency} price; ${
            localCount === 1 ? 'its USD price stays' : 'their USD prices stay'
          }.`
    }`
  }

  /**
   * Whether changing the currency would lose anything. Changing or removing a
   * currency no place has used yet is just a save — the rule is what is lost.
   */
  const currencyLoses =
    currency !== city.currency && city.currency !== null && localCount > 0

  function currencyQuestion(): string {
    return currency === null
      ? `Remove ${city.currency} from ${city.name}?`
      : `Change ${city.name} to ${currency}?`
  }

  function currencyConsequence(): string {
    const places = localCount === 1 ? '1 place' : `${localCount} places`
    return `${places} in ${city.name} ${localCount === 1 ? 'has' : 'have'} a ${
      city.currency
    } price. ${localCount === 1 ? 'It' : 'They'} will lose it${
      currency === null ? '' : ', not have it converted'
    }. ${localCount === 1 ? 'Its USD price stays' : 'Their USD prices stay'}.`
  }

  function save() {
    startSave(async () => {
      await onSave({ name: name.trim(), currency })
      onDone()
    })
  }

  return (
    <View style={[styles.row, { borderColor: theme.colour.line }]}>
      {/*
        Two targets on one line: the row picks, the pencil edits.

        The pencil is drawn as a chip rather than a bare glyph so that it reads
        as its own control and not as a chevron belonging to the row — which is
        what was here before, when the whole row opened the editor and nothing
        picked anything.
      */}
      <View style={styles.rowHead}>
        <Pressable
          onPress={onPick}
          accessibilityRole="button"
          accessibilityState={{ selected: current }}
          accessibilityLabel={`${city.name}. Work on this city`}
          style={styles.pickArea}
        >
          <Tick shown={current} />
          <View style={styles.rowText}>
            <Text
              style={[
                styles.cityName,
                { color: current ? theme.colour.accentInk : theme.colour.ink },
              ]}
              numberOfLines={1}
            >
              {city.name}
            </Text>
            <Text style={[styles.meta, { color: theme.colour.inkMuted }]}>
              {countLabel(count)}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: editing }}
          accessibilityLabel={`Edit ${city.name}`}
          hitSlop={6}
          style={[
            styles.pen,
            {
              backgroundColor: editing
                ? theme.colour.accentWash
                : theme.colour.surfaceMuted,
              borderColor: editing ? theme.colour.accentRing : theme.colour.line,
            },
          ]}
        >
          <Pencil
            size={16}
            color={editing ? theme.colour.accentInk : theme.colour.inkMuted}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      {editing ? (
        asking !== null ? (
          /*
            The question replaces the editor's body rather than swapping a
            footer, which is what the place sheet does. The fields above offer
            `Save`, a different write, and leaving them live invites somebody to
            type into a record they are being asked to destroy — and the removal
            consequence is the longest sentence in the product, so it wants the
            body's width rather than a band beneath it.
          */
          <View style={styles.editor}>
            <Question
              question={
                asking === 'remove' ? `Remove ${city.name}?` : currencyQuestion()
              }
              consequence={
                asking === 'remove' ? removalConsequence() : currencyConsequence()
              }
              confirm={asking === 'remove' ? 'Remove' : 'Change'}
              waiting={busy}
              onConfirm={() => {
                if (asking !== 'remove') {
                  save()
                  return
                }
                startRemove(async () => {
                  await onDelete()
                  onDone()
                })
              }}
              onDecline={() => setAsking(null)}
            />
          </View>
        ) : (
        <View style={styles.editor}>
          <TextField label="Name" value={name} onChange={setName} />
          <CurrencyField
            value={currency}
            onChange={setCurrency}
            hint={`Places in ${name.trim() || city.name} get a ${currency ?? ''} price box beside the dollars.`}
          />

          <View style={styles.actions}>
            <View style={styles.grow}>
              <Button
                label={saving ? 'Saving…' : 'Save'}
                tone="primary"
                disabled={busy || name.trim() === ''}
                onPress={() => {
                  // Nothing to write is not a write. Closing without sending is
                  // the correct answer to a Save that changed nothing.
                  if (name.trim() === city.name && currency === city.currency) {
                    onDone()
                    return
                  }
                  if (currencyLoses) {
                    setAsking('currency')
                    return
                  }
                  save()
                }}
              />
            </View>
            <View style={styles.grow}>
              <Button
                label="Remove"
                tone="danger"
                disabled={busy}
                onPress={() => setAsking('remove')}
              />
            </View>
          </View>
        </View>
        )
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  problem: { marginBottom: SPACE.sm },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACE.xs,
  },
  title: { ...role(TYPE.title), flex: 1 },
  done: { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.sm },
  doneText: { ...role(TYPE.control), fontWeight: '700' },
  empty: { ...role(TYPE.note), paddingVertical: SPACE.sm },
  row: { borderBottomWidth: 1 },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  /*
   * A row that only picks, and therefore carries its own padding.
   *
   * `rowHead` gave its vertical padding to `pickArea` when the pencil arrived
   * beside it, because a target whose padding lives on its parent leaves a dead
   * strip that looks pressable and is not. This row has no pencil and no
   * `pickArea`, so without this it collapses to the height of its own text.
   */
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: 13,
  },
  /*
   * The picking half takes the whole row apart from the pencil.
   *
   * Its own padding rather than the row's, so the target covers the full height
   * of the line — a row whose padding lives on the parent leaves a dead strip
   * above and below the text that looks pressable and is not.
   */
  pickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    flex: 1,
    minWidth: 0,
    paddingVertical: 13,
  },
  tick: { width: 20, alignItems: 'center' },
  pen: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0, gap: 1 },
  cityName: { ...role(TYPE.rowName) },
  meta: { ...role(TYPE.note) },
  editor: { gap: SPACE.sm, paddingBottom: SPACE.md },
  actions: { flexDirection: 'row', gap: SPACE.sm },
  grow: { flex: 1 },
  // The foot sits outside the scroller, so it keeps its place while the list
  // moves. `borderTopColor` is themed at the call site.
  foot: { borderTopWidth: 1, paddingTop: SPACE.sm },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  createText: { ...role(TYPE.control) },
})
