import type { City, Marker } from '@pinpoint/core'
import { SPACE, TYPE } from '@pinpoint/tokens'
import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, FormNote, TextField } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { usePending } from '@/lib/use-pending'
import { role } from '@/lib/type'

/**
 * Correcting the groups a trip's places are filed under, from a phone.
 *
 * Here rather than in the bar of controls, because of the split the last change
 * settled: what is touched constantly goes within a thumb's reach at the bottom,
 * and what is touched rarely goes at the top where it cannot be hit by accident.
 * Renaming a city is firmly the second kind. `menu-sheet.tsx` was left
 * deliberately near-empty on the expectation that trip-scoped rare things would
 * land in it, and this is the first of them.
 *
 * What this is *not* is web's city bar. That control also selects which city is
 * being worked on, which frames the map, biases search and sets the next save's
 * default. None of that comes over: it would need a fifth control in a bar that
 * is already at four, and each of the three jobs has an answer here that does not
 * need one — the map frames on open, search biases on the visible map, and the
 * form defaults to the city last used.
 *
 * A city created while saving a place is created with whatever was known at that
 * moment, which is frequently just a name. Without this screen a city typed in a
 * hurry would be permanent on this platform, and a currency not chosen at
 * creation could never be chosen at all.
 */

/** Fraction of the screen the sheet may grow to before it scrolls instead. */
const SHEET_CAP = 0.8

export function CitySheet({
  open,
  onClose,
  cities,
  markers,
  onSave,
  onDelete,
  problem,
  onDismissProblem,
}: {
  open: boolean
  onClose: () => void
  cities: readonly City[]
  /** Only to count what a removal would unassign, which the person has to be told. */
  markers: readonly Marker[]
  /**
   * One write for both fields, awaited.
   *
   * This used to be two callbacks fired from one press, which could store the
   * name and have the currency refused — a half-applied edit with no way to
   * report itself. `updateCity` takes a partial patch, so one call carries both
   * and there is one outcome to report.
   */
  onSave: (
    cityId: string,
    patch: { name: string; currency: string | null },
  ) => Promise<unknown>
  onDelete: (cityId: string) => Promise<unknown>
  /** A refusal from one of the writes reached from here, or null. */
  problem: string | null
  onDismissProblem: () => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cap = Math.round(useWindowDimensions().height * SHEET_CAP)

  const [editing, setEditing] = useState<string | null>(null)

  function close() {
    setEditing(null)
    onClose()
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

            {cities.length === 0 ? (
              <Text style={[styles.empty, { color: theme.colour.inkMuted }]}>
                No cities yet. One is created the first time you file a place under
                a new name while saving it.
              </Text>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {cities.map((city) => (
                  <CityRow
                    key={city.id}
                    city={city}
                    count={markers.filter((marker) => marker.cityId === city.id).length}
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
                ))}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

function CityRow({
  city,
  count,
  editing,
  onToggle,
  onSave,
  onDelete,
  onDone,
}: {
  city: City
  count: number
  editing: boolean
  onToggle: () => void
  onSave: (patch: { name: string; currency: string | null }) => Promise<unknown>
  onDelete: () => Promise<unknown>
  /** Closes this row's editor, once whichever write it started has settled. */
  onDone: () => void
}) {
  const theme = useTheme()
  const [name, setName] = useState(city.name)
  const [currency, setCurrency] = useState(city.currency ?? '')

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
  function confirmDelete() {
    Alert.alert(
      `Remove ${city.name}?`,
      count === 0
        ? 'Nothing is filed under it.'
        : `${count} ${count === 1 ? 'place stays' : 'places stay'} on the trip and ${
            count === 1 ? 'becomes' : 'become'
          } unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            startRemove(async () => {
              await onDelete()
              onDone()
            }),
        },
      ],
    )
  }

  return (
    <View style={[styles.row, { borderColor: theme.colour.line }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: editing }}
        accessibilityLabel={`Edit ${city.name}`}
        style={styles.rowHead}
      >
        <View style={styles.rowText}>
          <Text style={[styles.cityName, { color: theme.colour.ink }]}>
            {city.name}
          </Text>
          <Text style={[styles.meta, { color: theme.colour.inkMuted }]}>
            {count === 1 ? '1 place' : `${count} places`}
            {city.currency ? ` · ${city.currency}` : ' · no currency'}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: theme.colour.inkMuted }]}>
          {editing ? '⌃' : '⌄'}
        </Text>
      </Pressable>

      {editing ? (
        <View style={styles.editor}>
          <TextField label="Name" value={name} onChange={setName} />
          <TextField
            label="Currency (optional)"
            value={currency}
            onChange={setCurrency}
            placeholder="JPY"
            autoCapitalize="characters"
          />
          {/* Says what a currency does and, more usefully, what it does not.
              Changing it never converts a stored amount — the number was
              transcribed off a menu, and converting it would invent a price
              nobody was ever quoted. */}
          <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
            Changes how prices here are read. No stored amount is changed.
          </Text>

          <View style={styles.actions}>
            <View style={styles.grow}>
              <Button
                label={saving ? 'Saving…' : 'Save'}
                tone="primary"
                disabled={busy || name.trim() === ''}
                onPress={() => {
                  const next = currency.trim().toUpperCase()
                  const value = next === '' ? null : next
                  // Nothing to write is not a write. Closing without sending is
                  // the correct answer to a Save that changed nothing.
                  if (name.trim() === city.name && value === (city.currency ?? null)) {
                    onDone()
                    return
                  }
                  startSave(async () => {
                    await onSave({ name: name.trim(), currency: value })
                    onDone()
                  })
                }}
              />
            </View>
            <View style={styles.grow}>
              <Button
                label={removing ? 'Removing…' : 'Remove'}
                tone="danger"
                disabled={busy}
                onPress={confirmDelete}
              />
            </View>
          </View>
        </View>
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
    paddingVertical: 13,
  },
  rowText: { flex: 1, gap: 1 },
  cityName: { ...role(TYPE.rowName) },
  meta: { ...role(TYPE.note) },
  chevron: { fontSize: 15 },
  editor: { gap: SPACE.sm, paddingBottom: SPACE.md },
  hint: { ...role(TYPE.note) },
  actions: { flexDirection: 'row', gap: SPACE.sm },
  grow: { flex: 1 },
})
