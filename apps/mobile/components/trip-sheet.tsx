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
import { Button, FormNote, TextField } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { usePending } from '@/lib/use-pending'
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
 * `New trip` and `People` below the fold of the sheet you open most.
 *
 * The list is the switcher. There is no separate "switch trip" control because
 * tapping a row is one, and a picker that opens a picker is a step nobody asked
 * for.
 *
 * `People` lives here rather than with the filter because it belongs to a trip
 * rather than to the person. That also leaves the filter sheet holding only what
 * narrows the map, which is what makes its label honest.
 *
 * `Cities` used to sit beside it and no longer does. A city stopped being an
 * errand filed under the trip the moment the header could name the one being
 * worked in, so the list opens from there instead — where picking one and fixing
 * one are the same list, which is what the laptop always did.
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
  problem,
  onDismissProblem,
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
  /**
   * Awaited, so the row that starts the fetch can answer the press that started
   * it. Until it did, pressing again simply fired a second one.
   */
  onRevealArchived: () => Promise<unknown>
  onSelectTrip: (tripId: string) => void
  /**
   * Awaited so the detour can stay open and say `Saving…` until it settles.
   * The rename itself is optimistic; this is about the control that asked for
   * it still being on screen when the answer arrives.
   */
  onRename: (name: string) => Promise<unknown>
  onCreated: (tripId: string) => void
  /** Archive, or put back. One call with a flag, like the write underneath it. */
  onSetArchived: (tripId: string, value: boolean) => void
  onOpenPeople: () => void
  /** A refusal from one of the writes reached from here, or null. */
  problem: string | null
  onDismissProblem: () => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cap = Math.round(useWindowDimensions().height * SHEET_CAP)

  const [renaming, setRenaming] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState(trip.name)

  /**
   * Two waits, held apart, because they are two different presses.
   *
   * A single flag here would be the workspace's old `busy` rebuilt one level
   * down: revealing the archived trips would disable a rename that has nothing
   * to do with it.
   */
  const [saving, startSave] = usePending()
  const [revealing, startReveal] = usePending()

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
        {/*
          A positioner, and nothing else. The surface is the `View` inside it.

          `KeyboardAvoidingView` with `behavior="padding"` renders
          `StyleSheet.compose(style, { paddingBottom: bottomHeight })`, and
          `bottomHeight` is 0 whenever the keyboard is down — so any
          `paddingBottom` handed to it is overwritten on every render where the
          keyboard is closed, which is almost all of them. The sheet's own
          padding was written here and silently thrown away: the last row sat on
          the bottom of the screen while the style said otherwise.

          Nothing about that is visible from the styles, which is what made it
          look like a value set differently on this sheet. It was identical to
          every other sheet's. The ones that kept their padding are the ones
          whose surface is a plain `View` — this is now one of them.
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

            {/*
              A refusal, shown inside the sheet that started the write.

              The workspace draws refusals over the map, and this sheet is a
              `Modal` on top of it — so a rename refused from here reported into
              a surface nobody could see, and the name simply sprang back with
              no explanation. A refusal belongs where the person is looking, and
              while a sheet is open that is the sheet. `PeopleSheet` already did
              this for its own invite; this is the same answer for the writes
              reached from here.

              Outside the `ScrollView` rather than in it, so it cannot be
              scrolled out of sight while it is the most important thing here.
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
                        label={saving ? 'Saving…' : 'Save'}
                        tone="primary"
                        disabled={
                          saving || name.trim() === '' || name.trim() === trip.name
                        }
                        onPress={() =>
                          // The detour closes when the write settles, not when
                          // it is sent. Closing first left nothing on screen
                          // that could report either state.
                          startSave(async () => {
                            await onRename(name.trim())
                            openDetour(null)
                          })
                        }
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
                  onPress={() => startReveal(onRevealArchived)}
                  accessibilityRole="button"
                  // Inert through `accessibilityState` rather than by being
                  // unreachable, so a screen reader still finds it and is told
                  // which state it is in.
                  accessibilityState={{ disabled: revealing }}
                  style={[styles.row, { opacity: revealing ? 0.5 : 1 }]}
                >
                  <ArchiveRestore
                    size={18}
                    color={theme.colour.inkMuted}
                    strokeWidth={2}
                  />
                  <Text style={[styles.rowName, { color: theme.colour.inkMuted }]}>
                    {revealing ? 'Showing…' : 'Show archived trips'}
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
          </View>
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
