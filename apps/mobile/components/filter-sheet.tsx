import {
  type InterestFilter,
  isFiltered,
  type MarkerFilter,
  NO_FILTER,
  type TripMember,
} from '@pinpoint/core'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Narrowing a trip, from a phone.
 *
 * The same questions the laptop asks, because the answers come from the same
 * predicate in `@pinpoint/core`: tick the people, get the places they all want.
 * What differs is where it lives — a sheet raised from a header control rather
 * than a bar across the top — and that difference is the whole reason the header
 * has to say when a filter is on. A choice made in a sheet is invisible the
 * moment the sheet is dismissed, and a trip looking emptier than it is with
 * nothing on screen explaining why is the defect this control could most easily
 * ship with.
 *
 * Clearing lives here now, and the reasoning above is why that is safe rather
 * than why it was avoided. This comment used to end "which is why clearing is
 * not offered here" — a way out behind a control you have to already suspect is
 * on is not a way out. That was correct while nothing else said the trip was
 * narrowed.
 *
 * The toolbar's filter button now says it, permanently and by two signals, so
 * the half that had to stay visible is visible. What is left is the undo, and
 * an undo one deliberate tap inside the thing that declares the state is
 * reachable rather than hidden. The spec was amended to permit exactly this
 * separation and no wider a one: the control that declares must be the control
 * that reveals.
 *
 * A modal rather than a positioned view, unlike the marker sheet. That sheet
 * must not cover the map — it describes a pin the person is looking at — while
 * this one is a decision made and dismissed, and dimming behind it is what says
 * the map is waiting.
 */

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
  label: { ...role(TYPE.label), paddingTop: SPACE.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: 11,
  },
  optionText: { ...role(TYPE.body), flex: 1 },
  box: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { fontSize: 13, fontWeight: '800' },
  divide: { height: 1, marginVertical: SPACE.xs },
  clear: {
    marginTop: SPACE.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  clearText: { ...role(TYPE.control), fontWeight: '700' },
  clearTextInert: { ...role(TYPE.control), fontWeight: '400' },
})

export function FilterSheet({
  open,
  filter,
  onChange,
  onClose,
  members,
  ownMemberId,
}: {
  open: boolean
  filter: MarkerFilter
  onChange: (filter: MarkerFilter) => void
  onClose: () => void
  members: readonly TripMember[]
  /** So the reader is named the way the marker sheet names them. */
  ownMemberId: string | null
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const chosen = filter.interest.kind === 'wanted-by' ? filter.interest.members : []

  const setInterest = (interest: InterestFilter) => onChange({ ...filter, interest })

  // What the way out below is live for, and what the toolbar's filter button
  // is drawing its dot for. One predicate, read in both places.
  const narrowed = isFiltered(filter)

  function toggleMember(memberId: string) {
    const next = chosen.includes(memberId)
      ? chosen.filter((id) => id !== memberId)
      : [...chosen, memberId]

    // Unticking the last person is a request to stop filtering, not a question
    // about nobody — which would correctly select nothing and read as broken.
    setInterest(
      next.length === 0 ? { kind: 'anyone' } : { kind: 'wanted-by', members: next },
    )
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      // Android's back gesture reaches `onRequestClose`; on iOS the backdrop and
      // the Done button are the ways out.
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        {/* The sheet swallows presses so that touching a row does not dismiss
            through the backdrop underneath it. */}
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
              paddingBottom: SPACE.md + insets.bottom,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colour.ink }]}>Wanted by</Text>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.done}>
              <Text style={[styles.doneText, { color: theme.colour.accentInk }]}>
                Done
              </Text>
            </Pressable>
          </View>

          {members.map((member) => (
            <Option
              key={member.id}
              label={member.id === ownMemberId ? 'You' : member.displayName}
              checked={chosen.includes(member.id)}
              onPress={() => toggleMember(member.id)}
            />
          ))}

          <View style={[styles.divide, { backgroundColor: theme.colour.line }]} />

          {/* Not a person, so not one of the people. Picking it clears the ticks
              rather than adding to them — "wanted by Ana, and also nobody has
              answered" has no meaning. */}
          <Option
            label="Nobody has answered yet"
            checked={filter.interest.kind === 'unanswered'}
            onPress={() =>
              setInterest(
                filter.interest.kind === 'unanswered'
                  ? { kind: 'anyone' }
                  : { kind: 'unanswered' },
              )
            }
          />

          <View style={[styles.divide, { backgroundColor: theme.colour.line }]} />

          <Option
            label="Hide visited"
            checked={filter.visited === 'unvisited'}
            onPress={() =>
              onChange({
                ...filter,
                visited: filter.visited === 'unvisited' ? 'any' : 'unvisited',
              })
            }
          />

          {/*
            Permanent and inert rather than absent, which is the requirement and
            not a preference: a control that arrives on selection moves whatever
            is beside it, so applying a filter would rearrange the sheet that
            applied it.

            Inert through `accessibilityState` and a handler that returns, never
            by being unreachable — a disabled control leaves the tab order and
            goes silent, which is the colour-only failure arriving by a back
            door. And the two states differ by fill and by weight as well as by
            colour, for the same reason.
          */}
          <Pressable
            onPress={() => {
              if (narrowed) onChange(NO_FILTER)
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear the filter"
            accessibilityState={{ disabled: !narrowed }}
            style={[
              styles.clear,
              narrowed
                ? {
                    borderColor: theme.colour.accent,
                    backgroundColor: theme.colour.accentWash,
                  }
                : {
                    borderColor: 'transparent',
                    backgroundColor: theme.colour.surfaceMuted,
                  },
            ]}
          >
            <Text
              style={[
                narrowed ? styles.clearText : styles.clearTextInert,
                { color: narrowed ? theme.colour.accentInk : theme.colour.inkMuted },
              ]}
            >
              Clear
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Option({
  label,
  checked,
  onPress,
}: {
  label: string
  checked: boolean
  onPress: () => void
}) {
  const theme = useTheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.option}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.colour.accent : theme.colour.lineStrong,
            backgroundColor: checked ? theme.colour.accent : 'transparent',
          },
        ]}
      >
        {checked ? (
          <Text style={[styles.tick, { color: theme.colour.ground }]}>✓</Text>
        ) : null}
      </View>
      <Text style={[styles.optionText, { color: theme.colour.ink }]}>{label}</Text>
    </Pressable>
  )
}

