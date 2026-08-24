import type { Trip } from '@pinpoint/core'
import { SPACE, TYPE } from '@pinpoint/tokens'
import Archive from 'lucide-react-native/icons/archive'
import ArchiveRestore from 'lucide-react-native/icons/archive-restore'
import Check from 'lucide-react-native/icons/check'
import ChevronRight from 'lucide-react-native/icons/chevron-right'
import Plus from 'lucide-react-native/icons/plus'
import { useState } from 'react'
import {
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

import { CreateTripForm } from '@/components/trip-setup'
import { Button, TextField } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The trips, reached by tapping the trip's name.
 *
 * The name was already in the header saying which trip these places belong to;
 * tapping the thing you are about to change is the shortest line between the
 * question and the answer, and it costs no new element on screen. The two
 * alternatives were both worse. A fourth button in the bottom row spends a
 * permanent slot in thumb reach on something rare — and with one trip, mostly
 * on something that does nothing. A row inside the filter sheet was tried in
 * the mock and produced a sheet that ran past the bottom of the screen, putting
 * `New trip`, `People` and `Cities` below the fold of the sheet you open most.
 *
 * The list is the switcher. There is no separate "switch trip" control because
 * tapping a row is one, and a picker that opens a picker is a step nobody asked
 * for.
 *
 * `People` and `Cities` live here rather than with the filter because both
 * belong to a trip rather than to the person. That also leaves the filter sheet
 * holding only what narrows the map, which is what makes its label honest.
 *
 * It owns no persistence. Every write is the workspace's, so this file has no
 * client and nothing to say about what a refusal means.
 */

/** Fraction of the screen the sheet may grow to before it scrolls instead. */
const SHEET_CAP = 0.85

export function TripSheet({
  open,
  onClose,
  trip,
  trips,
  archived,
  onRevealArchived,
  onSelectTrip,
  onRename,
  onCreated,
  onSetArchived,
  onOpenPeople,
  onOpenCities,
  busy,
}: {
  open: boolean
  onClose: () => void
  /** The trip being viewed. Named at the top, and the one the actions act on. */
  trip: Trip
  /** The trips this account is on, archived ones excluded. */
  trips: readonly Trip[]
  /**
   * Archived trips, or null while nobody has asked for them.
   *
   * Null rather than an empty array, because "not loaded" and "there are none"
   * are different answers and only one of them is worth a row saying so.
   */
  archived: readonly Trip[] | null
  onRevealArchived: () => void
  onSelectTrip: (tripId: string) => void
  onRename: (name: string) => void
  onCreated: (tripId: string) => void
  /** Archive, or put back. One call with a flag, like the write underneath it. */
  onSetArchived: (tripId: string, value: boolean) => void
  onOpenPeople: () => void
  onOpenCities: () => void
  busy: boolean
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cap = Math.round(useWindowDimensions().height * SHEET_CAP)

  const [renaming, setRenaming] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState(trip.name)

  /** Only one detour open at a time; two forms in one sheet is a mess. */
  function openDetour(which: 'rename' | 'create' | null) {
    setRenaming(which === 'rename')
    setCreating(which === 'create')
  }

  function close() {
    openDetour(null)
    onClose()
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          // The sheet swallows presses so that touching a row does not dismiss
          // through the backdrop underneath it.
          onStartShouldSetResponder={() => true}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
              // A definite ceiling, so the `ScrollView` inside has something to
              // resolve against rather than asking a parent that sizes to it.
              maxHeight: cap,
              paddingBottom: SPACE.md + insets.bottom,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colour.ink }]}>Trips</Text>
            <Pressable onPress={close} accessibilityRole="button" style={styles.done}>
              <Text style={[styles.doneText, { color: theme.colour.accentInk }]}>
                Done
              </Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {trips.map((each) => (
              <TripRow
                key={each.id}
                trip={each}
                current={each.id === trip.id}
                onPress={() => {
                  close()
                  onSelectTrip(each.id)
                }}
              />
            ))}

            {/*
              Making another one. Here rather than only on the empty state,
              which is where it was at first and is half the requirement: any
              signed-in person may create a trip, not only somebody with none.
            */}
            <Pressable
              onPress={() => openDetour(creating ? null : 'create')}
              accessibilityRole="button"
              accessibilityState={{ expanded: creating }}
              style={styles.row}
            >
              <Plus size={18} color={theme.colour.accentInk} strokeWidth={2.4} />
              <Text style={[styles.rowName, { color: theme.colour.accentInk }]}>
                New trip
              </Text>
            </Pressable>

            {creating ? (
              <View style={styles.editor}>
                <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
                  A trip is one shared map, separate from this one. Nothing here
                  moves across.
                </Text>
                <CreateTripForm
                  onCreated={(tripId) => {
                    close()
                    onCreated(tripId)
                  }}
                />
                <Button label="Cancel" onPress={() => openDetour(null)} />
              </View>
            ) : null}

            <View style={[styles.divide, { backgroundColor: theme.colour.line }]} />

            {/* Everything below is about the trip being viewed, so it says which. */}
            <Text style={[styles.label, { color: theme.colour.inkMuted }]}>
              {trip.name}
            </Text>

            <Pressable
              onPress={() => {
                setName(trip.name)
                openDetour(renaming ? null : 'rename')
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: renaming }}
              style={styles.row}
            >
              <Text style={[styles.rowName, { color: theme.colour.ink }]}>
                Rename
              </Text>
              <ChevronRight size={18} color={theme.colour.inkFaint} strokeWidth={2} />
            </Pressable>

            {renaming ? (
              <View style={styles.editor}>
                <TextField label="Trip name" value={name} onChange={setName} />
                <View style={styles.buttons}>
                  <View style={styles.grow}>
                    <Button
                      label="Save"
                      tone="primary"
                      disabled={
                        busy || name.trim() === '' || name.trim() === trip.name
                      }
                      onPress={() => {
                        onRename(name.trim())
                        openDetour(null)
                      }}
                    />
                  </View>
                  <View style={styles.grow}>
                    <Button label="Cancel" onPress={() => openDetour(null)} />
                  </View>
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={onOpenPeople}
              accessibilityRole="button"
              style={styles.row}
            >
              <Text style={[styles.rowName, { color: theme.colour.ink }]}>People</Text>
              <ChevronRight size={18} color={theme.colour.inkFaint} strokeWidth={2} />
            </Pressable>

            <Pressable
              onPress={onOpenCities}
              accessibilityRole="button"
              style={styles.row}
            >
              <Text style={[styles.rowName, { color: theme.colour.ink }]}>Cities</Text>
              <ChevronRight size={18} color={theme.colour.inkFaint} strokeWidth={2} />
            </Pressable>

            {/*
              Archiving, in the danger colour and last.

              It is the only way to remove a trip — no table in this schema has a
              delete policy — and it is reversible, which is why it takes no
              confirmation step. What it must never be is a one-way door: an
              archive nobody can undo is the unreachable, unremovable trip the
              initial schema was written to prevent, arrived at deliberately.
            */}
            <Pressable
              onPress={() => {
                close()
                onSetArchived(trip.id, true)
              }}
              accessibilityRole="button"
              accessibilityLabel={`Archive ${trip.name}`}
              accessibilityHint="Puts the trip away. Nothing is deleted and it can be restored."
              style={styles.row}
            >
              <Archive size={18} color={theme.colour.danger} strokeWidth={2} />
              <Text style={[styles.rowName, { color: theme.colour.danger }]}>
                Archive trip
              </Text>
            </Pressable>

            <View style={[styles.divide, { backgroundColor: theme.colour.line }]} />

            {/*
              The way back.

              Behind a deliberate act rather than always on screen, because most
              of the time there is nothing archived and a permanent empty section
              is furniture. But it is always *reachable* — including by somebody
              who has archived every trip they have, which is the case that turns
              a tidy list into a lost one.
            */}
            {archived === null ? (
              <Pressable
                onPress={onRevealArchived}
                accessibilityRole="button"
                style={styles.row}
              >
                <ArchiveRestore
                  size={18}
                  color={theme.colour.inkMuted}
                  strokeWidth={2}
                />
                <Text style={[styles.rowName, { color: theme.colour.inkMuted }]}>
                  Show archived trips
                </Text>
              </Pressable>
            ) : archived.length === 0 ? (
              <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
                Nothing archived.
              </Text>
            ) : (
              archived.map((each) => (
                <View key={each.id} style={styles.row}>
                  <Text style={[styles.rowName, { color: theme.colour.inkMuted }]}>
                    {each.name}
                  </Text>
                  <Pressable
                    onPress={() => onSetArchived(each.id, false)}
                    accessibilityRole="button"
                    accessibilityLabel={`Restore ${each.name}`}
                    hitSlop={8}
                    style={styles.restore}
                  >
                    <Text
                      style={[styles.restoreText, { color: theme.colour.accentInk }]}
                    >
                      Restore
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

/**
 * One trip in the list, and tapping it is how you switch.
 *
 * `radio` rather than `button`, because these are one choice among several and
 * that is what a screen reader should be told — the same role the picker this
 * replaces used.
 */
function TripRow({
  trip,
  current,
  onPress,
}: {
  trip: Trip
  current: boolean
  onPress: () => void
}) {
  const theme = useTheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: current }}
      style={styles.row}
    >
      <View style={styles.tick}>
        {current ? (
          <Check size={17} color={theme.colour.accentInk} strokeWidth={2.6} />
        ) : null}
      </View>
      <Text
        style={[
          styles.rowName,
          {
            color: current ? theme.colour.accentInk : theme.colour.ink,
            fontWeight: current ? '700' : '600',
          },
        ]}
        numberOfLines={1}
      >
        {trip.name}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm + 3,
    paddingVertical: 13,
  },
  rowName: { ...role(TYPE.rowName), flex: 1 },
  tick: { width: 20, alignItems: 'center' },
  restore: { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.sm },
  restoreText: { ...role(TYPE.control), fontWeight: '700' },
  divide: { height: 1, marginVertical: SPACE.xs },
  label: { ...role(TYPE.label), paddingTop: SPACE.xs },
  editor: { gap: SPACE.sm, paddingBottom: SPACE.md },
  hint: { ...role(TYPE.note), paddingVertical: SPACE.sm },
  buttons: { flexDirection: 'row', gap: SPACE.sm },
  grow: { flex: 1 },
})
