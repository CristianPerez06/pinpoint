'use client'

import { type InterestState, interestStateOf, type MarkerInterest, type TripMember } from '@pinpoint/core'

import styles from './interest.module.css'

/**
 * Who wants to go, and whether anyone has been yet.
 *
 * Shown as a row per member rather than a count, because the question the trip
 * is actually asking is *who* — a total of one cannot answer "is that me or is
 * that you", which is the entire reason interest is stored per member.
 *
 * Only the reader's own row is interactive. That mirrors the policy rather than
 * restating it in a sentence somebody has to read: the database refuses a write
 * attributed to anyone else, so offering the control would be offering a button
 * that cannot work.
 */

const STATE_LABEL: Record<InterestState, string> = {
  interested: 'Wants to go',
  'not-interested': 'Not for them',
  undecided: 'Undecided',
}

/** The reader's own row says "you", because "Cristian: not for them" reads oddly to Cristian. */
const OWN_STATE_LABEL: Record<InterestState, string> = {
  interested: 'You want to go',
  'not-interested': 'Not for you',
  undecided: 'You have not said',
}

/**
 * Written out rather than indexed by the state name.
 *
 * `styles[state]` looks equivalent and is not: the states are kebab-case and the
 * class names are not, so `not-interested` resolves to `undefined` and lands in
 * the DOM as the literal string. An explicit record cannot drift, because a new
 * state fails to typecheck until it is given a class.
 */
const STATE_CLASS: Record<InterestState, string> = {
  interested: styles.interested!,
  'not-interested': styles.notInterested!,
  undecided: styles.undecided!,
}

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
  return (
    <ul className={styles.rows}>
      {members.map((member) => {
        const state = interestStateOf(
          interest.find((record) => record.memberId === member.id),
        )
        const isOwn = member.id === ownMemberId

        return (
          <li key={member.id} className={styles.row}>
            <span className={styles.who}>{isOwn ? 'You' : member.displayName}</span>

            {isOwn ? (
              <span className={styles.choices}>
                <Choice
                  label="Want to go"
                  active={state === 'interested'}
                  // Pressing the active choice takes it back rather than doing
                  // nothing. Withdrawing has to be reachable, and a third button
                  // for "actually, no opinion" would be a control nobody presses.
                  onClick={() =>
                    state === 'interested' ? onWithdraw() : onRecord(true)
                  }
                />
                <Choice
                  label="Not for me"
                  active={state === 'not-interested'}
                  onClick={() =>
                    state === 'not-interested' ? onWithdraw() : onRecord(false)
                  }
                />
              </span>
            ) : (
              <span className={`${styles.state} ${STATE_CLASS[state]}`}>
                {STATE_LABEL[state]}
              </span>
            )}

            {isOwn ? (
              <span className={`${styles.ownState} ${STATE_CLASS[state]}`}>
                {OWN_STATE_LABEL[state]}
              </span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function Choice({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${styles.choice} ${active ? styles.choiceActive : ''}`}
    >
      {label}
    </button>
  )
}

/**
 * Whether the trip has been here.
 *
 * One control for everybody, because the model says visiting is shared — nothing
 * records who pressed it, and nobody on the trip needs that answered.
 */
export function VisitedToggle({
  visited,
  onChange,
}: {
  visited: boolean
  onChange: (visited: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!visited)}
      aria-pressed={visited}
      className={`${styles.visited} ${visited ? styles.visitedOn : ''}`}
    >
      {visited ? '✓ Visited' : 'Mark visited'}
    </button>
  )
}
