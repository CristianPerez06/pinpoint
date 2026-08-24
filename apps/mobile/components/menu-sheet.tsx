import type { Trip } from '@pinpoint/core'
import { SPACE, TYPE } from '@pinpoint/tokens'
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
 * Where the account and the trip live, rather than the trip's controls.
 *
 * What the expectation was for. It was left near-empty on the grounds that
 * trip-scoped rare things would land here, and they now have: choosing between
 * trips, renaming one, the people on it, and its cities — every one of them
 * arriving without Sign out having to move a second time.
 *
 * What makes something belong here rather than in the bar at the bottom is how
 * often it is touched, not what it is about. A city is named once and corrected
 * almost never; a trip is renamed less often than that; the filter is touched
 * constantly.
 *
 * A modal in the shape `filter-sheet.tsx` uses, for the same reason that one is:
 * a decision made and dismissed, with the map dimmed behind it to say it is
 * waiting. The marker sheet is the odd one out, and correctly so — it describes
 * a pin somebody is looking at, so it must not cover the map.
 */

/** Fraction of the screen the sheet may grow to before it scrolls instead. */
const SHEET_CAP = 0.85

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
  item: { paddingVertical: 13 },
  itemText: { ...role(TYPE.body) },
  divide: { height: 1, marginVertical: SPACE.xs },
  label: { ...role(TYPE.label), paddingTop: SPACE.xs },
  editor: { gap: SPACE.sm, paddingBottom: SPACE.md },
  hint: { ...role(TYPE.note) },
  row: { flexDirection: 'row', gap: SPACE.sm },
  grow: { flex: 1 },
})

export function MenuSheet({
  open,
  onClose,
  onSignOut,
  onOpenCities,
  onOpenPeople,
  trip,
  trips,
  onSelectTrip,
  onRename,
  onCreated,
  busy,
}: {
  open: boolean
  onClose: () => void
  onSignOut: () => void
  /** Opens the sheet where a trip's cities are corrected. */
  onOpenCities: () => void
  /** Opens the sheet listing who is on the trip, and adding somebody. */
  onOpenPeople: () => void
  /**
   * Named here as well as in the header, because a sheet that covers the header
   * should still say which trip it belongs to.
   */
  trip: Trip
  /** Every trip this account belongs to. One is the ordinary case. */
  trips: readonly Trip[]
  onSelectTrip: (tripId: string) => void
  onRename: (name: string) => void
  /** Opens the trip that was just made. */
  onCreated: (tripId: string) => void
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
            <Text
              style={[styles.title, { color: theme.colour.ink }]}
              numberOfLines={1}
            >
              {trip.name}
            </Text>
            <Pressable onPress={close} accessibilityRole="button" style={styles.done}>
              <Text style={[styles.doneText, { color: theme.colour.accentInk }]}>
                Done
              </Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {/*
              A list of trips only when there is something to choose between.

              Most of the time this product has one trip, and a picker of length
              one is a control that looks like a choice and is not. The name is
              still shown above it, because it answers which trip these places
              belong to — which becomes a real question the moment a second one
              can exist.
            */}
            {trips.length > 1 ? (
              <>
                <Text style={[styles.label, { color: theme.colour.inkMuted }]}>
                  Trips
                </Text>
                {trips.map((each) => {
                  const current = each.id === trip.id

                  return (
                    <Pressable
                      key={each.id}
                      onPress={() => {
                        close()
                        onSelectTrip(each.id)
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: current }}
                      style={styles.item}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          {
                            color: current
                              ? theme.colour.accentInk
                              : theme.colour.ink,
                            fontWeight: current ? '700' : '400',
                          },
                        ]}
                      >
                        {each.name}
                      </Text>
                    </Pressable>
                  )
                })}
                <View
                  style={[styles.divide, { backgroundColor: theme.colour.line }]}
                />
              </>
            ) : null}

            <Pressable
              onPress={() => {
                setName(trip.name)
                openDetour(renaming ? null : 'rename')
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: renaming }}
              style={styles.item}
            >
              <Text style={[styles.itemText, { color: theme.colour.ink }]}>
                Rename this trip
              </Text>
            </Pressable>

            {renaming ? (
              <View style={styles.editor}>
                <TextField label="Trip name" value={name} onChange={setName} />
                <View style={styles.row}>
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

            {/*
              Making another one.

              Here rather than only on the empty state, which is where it was at
              first and is only half the requirement: any signed-in person may
              create a trip, not only somebody who has none.
            */}
            <Pressable
              onPress={() => openDetour(creating ? null : 'create')}
              accessibilityRole="button"
              accessibilityState={{ expanded: creating }}
              style={styles.item}
            >
              <Text style={[styles.itemText, { color: theme.colour.ink }]}>
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

            <Pressable
              onPress={onOpenPeople}
              accessibilityRole="button"
              style={styles.item}
            >
              <Text style={[styles.itemText, { color: theme.colour.ink }]}>
                People
              </Text>
            </Pressable>

            <Pressable
              onPress={onOpenCities}
              accessibilityRole="button"
              style={styles.item}
            >
              <Text style={[styles.itemText, { color: theme.colour.ink }]}>
                Cities
              </Text>
            </Pressable>

            <View style={[styles.divide, { backgroundColor: theme.colour.line }]} />

            <Pressable
              onPress={onSignOut}
              accessibilityRole="button"
              style={styles.item}
            >
              <Text style={[styles.itemText, { color: theme.colour.ink }]}>
                Sign out
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}
