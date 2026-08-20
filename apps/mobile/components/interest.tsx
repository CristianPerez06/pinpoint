import {
  type InterestState,
  interestStateOf,
  type MarkerInterest,
  type TripMember,
} from '@pinpoint/core'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Who wants to go, and whether the trip has been yet — on a phone.
 *
 * The same rules as web and none of the same markup. Which states exist, what
 * they are called, and whose row can be touched all come from `@pinpoint/core`;
 * this file decides only that a row is a `View` and a choice is a `Pressable`.
 * Sharing the components instead is precisely what the `styling` spec forbids.
 *
 * Only the reader's own row is interactive, which mirrors the stored policies
 * rather than restating them in a sentence somebody has to read: the database
 * refuses a write attributed to anyone else, so offering the control would be
 * offering a button that cannot work.
 */

const STATE_LABEL: Record<InterestState, string> = {
  interested: 'Wants to go',
  'not-interested': 'Not for them',
  undecided: 'Undecided',
}

const OWN_STATE_LABEL: Record<InterestState, string> = {
  interested: 'You want to go',
  'not-interested': 'Not for you',
  undecided: 'You have not said',
}

const styles = StyleSheet.create({
  rows: { gap: 2 },
  row: { paddingVertical: 6, gap: 6 },
  who: { ...role(TYPE.rowName) },
  state: { ...role(TYPE.note) },
  choices: { flexDirection: 'row', gap: SPACE.xs },
  choice: {
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  choiceText: { ...role(TYPE.control) },
  visited: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  visitedText: { ...role(TYPE.control) },
})

export function InterestRows({
  members,
  interest,
  ownMemberId,
  onRecord,
  onWithdraw,
}: {
  members: readonly TripMember[]
  /** This marker's records only, already narrowed by the caller. */
  interest: readonly MarkerInterest[]
  /** Null when the reader's account matches no member — they can look, not answer. */
  ownMemberId: string | null
  onRecord: (interested: boolean) => void
  onWithdraw: () => void
}) {
  const theme = useTheme()

  /**
   * Undecided is its own colour rather than a faded "not interested".
   *
   * The specification makes that distinction load-bearing — the whole "nobody
   * has answered" pile depends on a person being able to see it — so drawing it
   * as an unfilled version of declining would bury exactly what it exists to
   * surface.
   */
  const stateColour: Record<InterestState, string> = {
    interested: theme.colour.accentInk,
    'not-interested': theme.colour.inkMuted,
    undecided: theme.colour.inkFaint,
  }

  return (
    <View style={styles.rows}>
      {members.map((member) => {
        const state = interestStateOf(
          interest.find((record) => record.memberId === member.id),
        )
        const isOwn = member.id === ownMemberId

        return (
          <View key={member.id} style={styles.row}>
            <Text style={[styles.who, { color: theme.colour.ink }]}>
              {isOwn ? 'You' : member.displayName}
            </Text>

            {isOwn ? (
              <View style={styles.choices}>
                <Choice
                  label="Want to go"
                  active={state === 'interested'}
                  // Pressing the active choice takes it back rather than doing
                  // nothing. Withdrawing has to be reachable, and a third button
                  // for "actually, no opinion" would be a control nobody presses.
                  onPress={() =>
                    state === 'interested' ? onWithdraw() : onRecord(true)
                  }
                />
                <Choice
                  label="Not for me"
                  active={state === 'not-interested'}
                  onPress={() =>
                    state === 'not-interested' ? onWithdraw() : onRecord(false)
                  }
                />
              </View>
            ) : (
              <Text style={[styles.state, { color: stateColour[state] }]}>
                {STATE_LABEL[state]}
              </Text>
            )}

            {isOwn ? (
              <Text style={[styles.state, { color: stateColour[state] }]}>
                {OWN_STATE_LABEL[state]}
              </Text>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

function Choice({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  const theme = useTheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.choice,
        {
          borderColor: active ? theme.colour.accent : theme.colour.lineStrong,
          backgroundColor: active ? theme.colour.accentWash : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.choiceText,
          { color: active ? theme.colour.accentInk : theme.colour.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

/**
 * Whether the trip has been here.
 *
 * One control for everybody, because the model says visiting is shared — nothing
 * records who pressed it, and nobody on the trip needs that answered.
 *
 * This is the control that most belongs on a phone. Visited is decided standing
 * outside a place, and until now it could only be recorded on the machine nobody
 * has with them.
 */
export function VisitedToggle({
  visited,
  onChange,
}: {
  visited: boolean
  onChange: (visited: boolean) => void
}) {
  const theme = useTheme()

  return (
    <Pressable
      onPress={() => onChange(!visited)}
      accessibilityRole="button"
      accessibilityState={{ selected: visited }}
      style={[
        styles.visited,
        {
          borderColor: visited ? theme.colour.accent : theme.colour.lineStrong,
          backgroundColor: visited ? theme.colour.accentWash : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.visitedText,
          { color: visited ? theme.colour.accentInk : theme.colour.ink },
        ]}
      >
        {visited ? '✓ Visited' : 'Mark visited'}
      </Text>
    </Pressable>
  )
}
